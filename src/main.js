/* eslint-disable no-param-reassign */
import './styles/normalize.css';
import './styles/style.css';
import {
  TOOL_ICON,
  TOOL_CLICK_ID,
  TOOL_TRASH_ID,
  TOOL_CURSOR_MAP,
  EVENTS,
  TOOL_ERASER_ID,
  TOOL_BRUSH_ID,
  CURSOR_TYPE,
  TOOL_COLOR_ID,
  ZOOM_IN_ID,
  ZOOM_OUT_ID,
  TOOL_LASER_ID,
  TOOL_SHAPES_ID,
} from './utils/constants';
import { $, $FROM, addEventListener } from './utils/utils';
import ToolsHandler from './lib/toolsHandler';
import { InfiniteCanvas } from './lib/infiniteCanvas';
import { LaserPointer } from './lib/laserPointer';
import { store } from './lib/appState';
import Emitter from './domain/emitter';
import ColorManager from './domain/colorManager';
import ShapesManager from './domain/shapesManager';
// import { ColorPickerModal } from './components/colorPicker';
import { OKLCHColorPicker } from './components/OKLCHColorPicker';
import { KEYS, isActionKey, KEYS_TO_TOOLS } from './utils/keyUtilities';
import { openColorDropper } from './lib/colorDropper';
import { initSupport } from './utils/supports';

(() => {
  // --------------- VARIABLES ---------------------
  const canvasHtml = $('#canvas');
  const btnUndo = $('#btn-undo');
  const btnRedo = $('#btn-redo');
  const btnZoomIn = $('#zoom-in');
  const btnZoomOut = $('#zoom-out');
  const toolsContainer = $('#tool-controls');
  // Visual color button and popover
  const colorChip = $('#color-chip');
  const colorButton = $('#btn-color');
  const colorPopover = $('#color-popover');
  const colorGrid = $('#color-grid');
  const colorCount = $('#color-count');
  const btnEditColors = $('#btn-edit-colors');
  // Modal elements
  const colorModal = $('#color-editor-modal');
  const colorModalOverlay = $('#modal-overlay');
  const colorModalClose = $('#color-modal-close');
  const modalDefaultGrid = $('#modal-default-grid');
  const modalActiveGrid = $('#modal-active-grid');
  const modalInput = $('#color-modal-input');
  const modalAddBtn = $('#color-modal-add');
  const modalResetBtn = $('#color-modal-reset');
  // Shapes tool elements
  const shapesButton = $('#btn-shapes');
  const shapesPopover = $('#shapes-popover');
  const shapesGrid = $('#shapes-grid');
  const strokeWidthRange = $('#stroke-width-range');
  const strokeWidthValue = $('#stroke-width-value');
  const fillGrid = $('#fill-grid');
  const cornerRadiusRange = $('#corner-radius-range');
  const cornerRadiusValue = $('#corner-radius-value');
  const lineStyleGrid = $('.line-style-grid');
  const shapeOpacityRange = $('#shape-opacity-range');
  const shapeOpacityValue = $('#shape-opacity-value');
  // Status bar elements
  const statusPos = $('#status-pos');
  const statusTool = $('#status-tool');
  const statusElements = $('#status-elements');
  const statusZoom = $('#status-zoom');
  const infiniteCanvas = new InfiniteCanvas(canvasHtml);
  const laserPointer = new LaserPointer(infiniteCanvas);
  const toolHandler = new ToolsHandler(null, infiniteCanvas, TOOL_CLICK_ID);
  // Initialize canvas immediately to ensure sizing and transforms are ready
  infiniteCanvas.init();
  const colorManager = new ColorManager();
  const shapesManager = new ShapesManager();
  // Create and append Web Component instances (defensive for some browsers)
  let customColorPicker;
  let oklchColorPicker;
  try {
    customColorPicker = document.createElement('color-picker-modal');
  } catch (e) {
    customColorPicker = document.createElementNS(document.documentElement.namespaceURI || 'http://www.w3.org/1999/xhtml', 'color-picker-modal');
  }
  try {
    oklchColorPicker = document.createElement('oklch-color-picker');
  } catch (e) {
    oklchColorPicker = document.createElementNS(document.documentElement.namespaceURI || 'http://www.w3.org/1999/xhtml', 'oklch-color-picker');
  }
  document.body.appendChild(customColorPicker);
  document.body.appendChild(oklchColorPicker);
  
  const onRemoveEventListeners = new Emitter();
  const onRemoveHistoryListener = new Emitter();
  const onRemoveSupportListeners = new Emitter();
  const onRemoveColorPickerListeners = new Emitter();

  // --------------- ACTIONS ---------------------
  const onRedo = () => {
    const success = infiniteCanvas.redo();
    
    btnRedo.disabled = !infiniteCanvas.canRedo();
    btnUndo.disabled = !infiniteCanvas.canUndo();
  };

  const onUndo = () => {
    const success = infiniteCanvas.undo();
    
    btnUndo.disabled = !infiniteCanvas.canUndo();
    btnRedo.disabled = !infiniteCanvas.canRedo();
  };

  const onZoomIn = () => {
    // Get canvas center for zoom focal point
    const rect = canvasHtml.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Zoom in by factor of 1.2
    infiniteCanvas.zoom(centerX, centerY, 1.2);
  };

  const onZoomOut = () => {
    // Get canvas center for zoom focal point
    const rect = canvasHtml.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    // Zoom out by factor of 0.8333 (1/1.2)
    infiniteCanvas.zoom(centerX, centerY, 0.8333);
  };

  // ---------- COLOR UI HELPERS ----------
  const renderPopoverFromPalette = () => {
    colorManager.renderPopoverGrid(colorGrid, colorCount);
  };

  const updateAllColorPalettes = () => {
    // Update main color popover
    renderPopoverFromPalette();
    // Update shapes fill palette if it exists
    if (fillGrid) {
      shapesManager.renderFillGrid(fillGrid);
    }
  };

  const openColorEditor = () => {
    colorManager.clearSlotSelection();
    // Render grids using ColorManager
    colorManager.renderDefaultColorsGrid(modalDefaultGrid);
    colorManager.renderCustomColorsGrid(modalActiveGrid);
    
    // Set input to current active color
    const { currentColor } = store.getState();
    const activeColor = currentColor || '#000000';
    if (modalInput) modalInput.value = activeColor;
    if (modalAddBtn) modalAddBtn.disabled = !colorManager.isValidHex(activeColor);
    
    // Show
    colorModal?.classList.remove('hidden');
    colorModalOverlay?.classList.remove('hidden');
    
    // Update visual selection for current color
    updateColorSelection(activeColor);
  };

  const onSetTool = (toolUpdated, target) => {
    // Special case: open color palette, do not change cursor/tool
    if (toolUpdated === TOOL_COLOR_ID) {
      // const colorRadio = colorButton?.querySelector('input[type="radio"]');
      const isCurrentlyHidden = colorPopover?.classList.contains('hidden');
      // Toggle popover visibility
      colorPopover?.classList.toggle('hidden');
      // While popover is open, mark button as active (checked). When closing, uncheck
      const shouldBeChecked = Boolean(isCurrentlyHidden);
      if (target) target.checked = shouldBeChecked;
      // if (colorRadio) colorRadio.checked = shouldBeChecked;
      return;
    }

    // Special case: open shapes palette, switch to selected shape tool  
    if (toolUpdated === TOOL_SHAPES_ID) {
      const isCurrentlyHidden = shapesPopover?.classList.contains('hidden');
      // Toggle popover visibility
      shapesPopover?.classList.toggle('hidden');
      // While popover is open, mark button as active (checked). When closing, uncheck
      const shouldBeChecked = Boolean(isCurrentlyHidden);
      if (target) target.checked = shouldBeChecked;
      
      // If opening popover, switch to the currently selected shape tool
      if (isCurrentlyHidden) {
        const selectedShapeToolId = shapesManager.getSelectedShapeToolId();
        toolHandler.currentTool = selectedShapeToolId;
        
        // Sync all shapes settings with ToolsHandler
        const config = shapesManager.getShapesConfig();
        toolHandler.setStrokeWidth(config.strokeWidth);
        toolHandler.setFillShape(config.fillShape);
        toolHandler.setFillColor(config.fillColor);
        toolHandler.setCornerRadius(config.cornerRadius);
        toolHandler.setLineStyle(config.lineStyle);
        // Ensure fill palette reflects latest global palette (supports up to 21)
        // Use a small delay to ensure the DOM is ready and state is updated
        setTimeout(() => {
          shapesManager.renderFillGrid(fillGrid);
        }, 0);
        
        // Update cursor based on selected shape
        const cursorType = TOOL_CURSOR_MAP[selectedShapeToolId] || TOOL_CURSOR_MAP.default;
        store.setState({ cursor: cursorType });
      }
      return;
    }

    let cursorType;
    if (toolUpdated !== TOOL_TRASH_ID) {
      if (target) target.click();
      toolHandler.currentTool = toolUpdated;
      cursorType = TOOL_CURSOR_MAP[toolUpdated] || TOOL_CURSOR_MAP.default;
      // Note: InfiniteCanvas handles eraser tool internally, no globalCompositeOperation needed
    }
    if (cursorType) {
      store.setState({ cursor: cursorType });
    }
  };
  const onCleanScreen = target => {
    if (target) target.checked = false;
    infiniteCanvas.clearAll();
    // InfiniteCanvas handles its own history automatically
    if (infiniteCanvas.hasHistory()) {
      store.setState({ hasHistory: Symbol(true) });
    }
  };

  // --------------- EVENTS ---------------------

  // OKLCH Color Picker event handlers  
  const onOKLCHColorConfirm = (e, idx) => {
    const newColor = e.detail.color;
    const oklchData = e.detail.oklch;
    const colorSpace = e.detail.colorSpace;
    const formats = e.detail.formats;
    const gamutInfo = e.detail.gamut;
    
    // Use the best color format that includes alpha
    let colorForDrawing = newColor;
    let colorForDisplay = newColor;
    
    // If there's alpha, use RGBA format for drawing and display
    if (oklchData.a < 1) {
      // Try to get RGBA format from ColorManager
      try {
        const rgbaColor = formats?.rgb;
        if (rgbaColor && rgbaColor.r !== undefined) {
          colorForDrawing = `rgba(${Math.round(rgbaColor.r * 255)}, ${Math.round(rgbaColor.g * 255)}, ${Math.round(rgbaColor.b * 255)}, ${oklchData.a})`;
          colorForDisplay = colorForDrawing;
        } else if (formats?.serialized?.rgb) {
          colorForDrawing = formats.serialized.rgb;
          colorForDisplay = colorForDrawing;
        } else {
          // Fallback: use hex with alpha
          colorForDrawing = newColor;
          colorForDisplay = newColor;
        }
      } catch (error) {
        console.warn('Failed to get RGBA format, using hex:', error);
        colorForDrawing = newColor;
        colorForDisplay = newColor;
      }
    }
    
    // Update the color in the custom palette (store the full hex with alpha)
    const { custom: currentCustom } = colorManager.getColorPalette();
    const updatedCustom = [...currentCustom];
    updatedCustom[idx] = newColor; // Store the hex (with alpha if present)
    
    // Update store
    store.setState({ colorPalette: { custom: updatedCustom } });
    
    // Set as active color for drawing (use format with alpha)
    toolHandler.setColor(colorForDrawing);
    
    // Update color chip with proper alpha support
    if (colorChip) {
      // Set up checkerboard background and color overlay for alpha
      if (oklchData.a < 1) {
        colorChip.style.background = `
          repeating-conic-gradient(#c0c0c0 0% 25%, transparent 0% 50%) 50% / 4px 4px,
          ${colorForDisplay}
        `;
      } else {
        colorChip.style.background = colorForDisplay;
      }
    }
    
    // Store current color with alpha information
    store.setState({ 
      currentColor: newColor,
      currentColorAlpha: oklchData.a,
      currentColorFormats: formats
    });
    
    // Update input with new color
    if (modalInput) modalInput.value = newColor;
    
    // Re-render UI
    updateAllColorPalettes();
    openColorEditor();
    
    // Update visual selection
    updateColorSelection(newColor);
  };

  const onModalActiveGridRemove = (idx) => {
    if (colorManager.removeCustomColor(idx)) {
      updateAllColorPalettes();
      openColorEditor();
    }
  };

  const onModalActiveGridEdit = (idx) => {
    // Open custom color picker for editing
    const { custom } = colorManager.getColorPalette();
    const hex = custom[idx] || '#000000';
    
    // Create event handlers for this specific edit session
    const handleColorConfirm = (e) => {
      onOKLCHColorConfirm(e, idx);
      onRemoveColorPickerListeners.trigger();
    };

    // Add to removal queue - this replaces handleColorCancel
    onRemoveColorPickerListeners.once(
      addEventListener(oklchColorPicker, 'colorconfirm', handleColorConfirm),
      addEventListener(oklchColorPicker, 'colorcancel', ()=>onRemoveColorPickerListeners.trigger()),
    );
    
    // Wait for component to be defined and then open
    customElements.whenDefined('oklch-color-picker').then(() => {
      // Ensure upgrade for elements created before definition
      if (customElements.upgrade) {
        try { customElements.upgrade(oklchColorPicker); } catch (_) {}
      }
      if (typeof oklchColorPicker.open === 'function') {
        oklchColorPicker.open(hex);
      } else {
        // Fallback to attributes
        if (hex && colorManager.isValidHex(hex)) {
          oklchColorPicker.setAttribute('initial-color', hex);
        }
        oklchColorPicker.setAttribute('open', '');
      }
    }).catch(err => {
      console.error('Error waiting for OKLCH component:', err);
    });
    
    // Also mark as selected slot for visual feedback
    colorManager.setSelectedSlot(idx);
    if (modalInput) modalInput.value = hex;
  };

  const onModalActiveGridColorSelect = (idx, hex) => {
    // Set as active color for drawing
    toolHandler.setColor(hex);
    if (colorChip) colorChip.style.background = hex;
    store.setState({ currentColor: hex });
    
    // Update input with selected color
    if (modalInput) modalInput.value = hex;
    
    // Update visual selection in both grids
    updateColorSelection(hex);
    
    colorManager.setSelectedSlot(idx);
  };

  const onModalActiveGridClick = (e) => {
    const actionBtn = e.target.closest('.swatch-action');
    const swatch = e.target.closest('.color-swatch');
    if (!swatch) return;
    
    const idx = Number(swatch.getAttribute('data-index'));
    if (Number.isNaN(idx)) return;
    
    // If pressed a specific action
    if (actionBtn) {
      const action = actionBtn.getAttribute('data-action');
      
      if (action === 'remove') {
        onModalActiveGridRemove(idx);
        return;
      }
      
      if (action === 'edit') {
        onModalActiveGridEdit(idx);
        return;
      }
    } else {
      // Regular click on color swatch - set as active color AND select slot
      const hex = swatch.getAttribute('data-color');
      if (hex) {
        onModalActiveGridColorSelect(idx, hex);
      }
    }
    
    // Toggle selected slot class for visual feedback (different from color selection)
    Array.from(modalActiveGrid.querySelectorAll('.color-swatch')).forEach((el) => el.classList.remove('is-selected'));
    swatch.classList.add('is-selected');
  };

  const onModalDefaultGridClick = (e) => {
    const swatch = e.target.closest('.color-swatch');
    if (!swatch) return;
    const hex = swatch.getAttribute('data-color');
    if (!hex) return;
    
    // Handle color with potential alpha
    let colorForDrawing = hex;
    let alphaValue = 1;
    
    // Check if hex has alpha (9 characters: #RRGGBBAA)
    if (hex.length === 9 && hex.startsWith('#')) {
      const alphaHex = hex.slice(7, 9);
      alphaValue = parseInt(alphaHex, 16) / 255;
      
      // Convert to RGBA format for drawing if it has transparency
      if (alphaValue < 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        colorForDrawing = `rgba(${r}, ${g}, ${b}, ${alphaValue})`;
      }
    }
    
    // Set as active color for drawing
    toolHandler.setColor(colorForDrawing);
    
    // Update color chip with alpha support
    if (colorChip) {
      if (alphaValue < 1) {
        colorChip.style.background = `
          repeating-conic-gradient(#c0c0c0 0% 25%, transparent 0% 50%) 50% / 4px 4px,
          ${hex}
        `;
      } else {
        colorChip.style.background = hex;
      }
    }
    
    store.setState({ 
      currentColor: hex,
      currentColorAlpha: alphaValue
    });
    
    // Update input with selected color
    if (modalInput) modalInput.value = hex;
    
    // Update visual selection in both grids
    updateColorSelection(hex);
  };

  const onModalAddBtnClick = () => {
    const hex = modalInput?.value || '';
    if (!colorManager.isValidHex(hex)) return;
    
    const normalizedHex = colorManager.normalizeHex(hex);
    const selectedSlot = colorManager.getSelectedSlot();
    const success = colorManager.addCustomColor(hex, selectedSlot);
    
    if (success) {
      // Set the newly added color as active color for drawing
      toolHandler.setColor(normalizedHex);
      if (colorChip) colorChip.style.background = normalizedHex;
      store.setState({ currentColor: normalizedHex });
      
      // Update input value to normalized hex
      if (modalInput) modalInput.value = normalizedHex;
      
      updateAllColorPalettes();
      openColorEditor();
      
      // Update visual selection after re-rendering
      updateColorSelection(normalizedHex);
    }
  };

  // ---------- SHAPES EVENT HANDLERS ----------

  const onShapeSelect = (e) => {
    const shapeOption = e.target.closest('.shape-option');
    if (!shapeOption) return;
    
    const selectedShape = shapeOption.dataset.shape;
    if (!selectedShape) return;
    
    // Update shapes manager
    shapesManager.setSelectedShape(selectedShape);
    
    // Update UI
    shapesManager.updateShapesGrid(shapesGrid);
    
    // Update current tool to match selected shape
    const selectedShapeToolId = shapesManager.getSelectedShapeToolId();
    toolHandler.currentTool = selectedShapeToolId;
    
    // Sync all shapes settings with ToolsHandler
    const config = shapesManager.getShapesConfig();
    toolHandler.setStrokeWidth(config.strokeWidth);
    toolHandler.setFillShape(config.fillShape);
    toolHandler.setFillColor(config.fillColor);
    toolHandler.setCornerRadius(config.cornerRadius);
    toolHandler.setLineStyle(config.lineStyle);
    
    // Update cursor
    const cursorType = TOOL_CURSOR_MAP[selectedShapeToolId] || TOOL_CURSOR_MAP.default;
    store.setState({ cursor: cursorType });
    
    // Update status tool label
    if (statusTool) {
      const toolLabels = {
        'btn-rectangle': 'rectángulo',
        'btn-circle': 'círculo', 
        'btn-triangle-isosceles': 'triángulo isósceles',
        'btn-triangle-scalene': 'triángulo escaleno',
        'btn-triangle-equilateral': 'triángulo equilátero'
      };
      statusTool.textContent = `Herramienta: ${toolLabels[selectedShapeToolId] || 'forma'}`;
    }
  };

  const onStrokeWidthChange = (e) => {
    const newValue = Number(e.target.value);
    shapesManager.setStrokeWidth(newValue);
    // Update tools handler immediately
    toolHandler.setStrokeWidth(newValue);
    if (strokeWidthValue) strokeWidthValue.textContent = `${newValue}px`;
  };

  const onFillPaletteClick = (e) => {
    const swatch = e.target.closest('.color-swatch');
    if (!swatch || !fillGrid?.contains(swatch)) return;
    const value = swatch.getAttribute('data-color');
    if (value === 'transparent') {
      shapesManager.setFillShape(false);
      toolHandler.setFillShape(false);
    } else if (value) {
      shapesManager.setFillShape(true);
      shapesManager.setFillColor(value);
      toolHandler.setFillShape(true);
      toolHandler.setFillColor(value);
    }
    shapesManager.updateFillGridSelection(fillGrid);
  };

  const onCornerRadiusChange = (e) => {
    const newValue = Number(e.target.value);
    shapesManager.setCornerRadius(newValue);
    toolHandler.setCornerRadius(newValue);
    if (cornerRadiusValue) cornerRadiusValue.textContent = `${newValue}px`;
  };

  const onOpacityChange = (e) => {
    const newValue = Number(e.target.value);
    shapesManager.setOpacity(newValue);
    toolHandler.setOpacity(newValue);
    if (shapeOpacityValue) shapeOpacityValue.textContent = `${newValue}%`;
  };

  const onLineStyleSelect = (e) => {
    const styleOption = e.target.closest('.line-style-option');
    if (!styleOption) return;
    
    const selectedStyle = styleOption.dataset.style;
    if (!selectedStyle) return;
    
    // Update shapes manager
    shapesManager.setLineStyle(selectedStyle);
    
    // Update UI
    shapesManager.updateLineStyleGrid(lineStyleGrid);
    // Apply to tool settings
    toolHandler.setLineStyle(selectedStyle);
  };

  const onKeydown = event => {
    // Normalizar las teclas cuando se presiona CapsLock / Mayus
    if (
      'Proxy' in window &&
      ((!event[KEYS.SHIFT] && /^[A-Z]$/.test(event.key)) ||
        (event[KEYS.SHIFT] && /^[a-z]$/.test(event.key)))
    ) {
      // Si el objeto Proxy es soportado y se esta presionando el capslock y otra tecla
      // Redefinimos el evento
      event = new Proxy(event, {
        get(ev, prop) {
          const value = ev[prop];
          if (typeof value === 'function') {
            return value.bind(ev);
          }
          if (prop === 'key') {
            return event[KEYS.SHIFT] ? ev.key.toUpperCase() : ev.key.toLowerCase();
          }

          return value;
        },
      });
    }

    if(event[KEYS.CTRL_OR_CMD] && (event.key === KEYS.V || event.key === KEYS.C || event.key === KEYS.X)){
      return;
    }

    // Check for orthogonal line mode (Ctrl/Cmd + Alt + Shift) or straight line mode (Ctrl/Cmd + Alt)
    if (event[KEYS.CTRL_OR_CMD] && event[KEYS.ALT]) {
      event.preventDefault();
      const state = store.getState();
      
      if (event[KEYS.SHIFT]) {
        // Orthogonal mode (90° angles + chaining)
        if (!state.isOrthogonalMode) {
          store.setState({ 
            isOrthogonalMode: true,
            isStraightLineMode: false // Disable regular straight line mode
          });
        }
      } else {
        // Regular straight line mode (360°)
        if (!state.isStraightLineMode && !state.isOrthogonalMode) {
          store.setState({ 
            isStraightLineMode: true,
            isOrthogonalMode: false,
            cursor: CURSOR_TYPE.CROSSHAIR
          });
        }
      }
    }

    if (event.key === KEYS.SPACE) {
      const state = store.getState();
      // Don't activate temporary panning if already drawing or panning
      if (!state.isDrawing && !state.isPanning) {
        store.setState({ 
          isTemporaryPanning: true,
          cursor: CURSOR_TYPE.GRAB 
        });
      }
      event.preventDefault();
    }


    if (event[KEYS.CTRL_OR_CMD]) {
      event.preventDefault();
      // Allow normal browser shortcuts in input fields
      const activeElement = document.activeElement;

      // Only preventDefault for keys we actually handle
      if (event.key === KEYS.Z) {
        onUndo();
      } else if (event.key === KEYS.Y) {
        onRedo();
      } else if (event.key === 'Escape') {
        // Cancel any temporary states
        const state = store.getState();
        if (state.isTemporaryPanning) {
          store.setState({ 
            isTemporaryPanning: false,
            isPanning: false,
            cursor: TOOL_CURSOR_MAP[toolHandler.currentTool] || TOOL_CURSOR_MAP.default
          });
        }
      } else if (isActionKey(event.key)) {
        const toolId = KEYS_TO_TOOLS[event.key];

        const btn = $FROM(toolsContainer, `#${toolId}`);
        if (toolId === TOOL_TRASH_ID) {
          onCleanScreen();
          return;
        }
        onSetTool(toolId, btn);
      }
      // Let other Ctrl/Cmd combinations pass through (like Ctrl+V, Ctrl+C, etc.)
    }

    // Cuenta gotas
    const lowerCased = event.key.toLocaleLowerCase();
    const isPickingStroke = lowerCased === KEYS.S && event[KEYS.SHIFT];

    if (isPickingStroke) {
      openColorDropper({
        type: 'stroke',
        canvas: infiniteCanvas,
      });
    }
  };

  const onKeyUp = event => {
    // Handle key releases for line modes
    if (event[KEYS.SHIFT]) {
      // When Shift is released, switch from orthogonal to regular straight line mode
      const state = store.getState();
      if (state.isOrthogonalMode && event[KEYS.CTRL_OR_CMD] && event[KEYS.ALT]) {
        store.setState({ 
          isOrthogonalMode: false,
          isStraightLineMode: true,
          chainStartPoint: null
        });
      }
    } else if (event[KEYS.CTRL_OR_CMD] || event[KEYS.ALT]) {
      // When Ctrl/Cmd or Alt is released, disable both modes
      const state = store.getState();
      if (state.isStraightLineMode || state.isOrthogonalMode) {
        // Clear preview line before disabling modes
        infiniteCanvas.clearPreviewLine();
        const cursorType =
        TOOL_CURSOR_MAP[toolHandler.currentTool] || TOOL_CURSOR_MAP.default;
        store.setState({ 
          isStraightLineMode: false,
          isOrthogonalMode: false,
          chainStartPoint: null,
          cursor: cursorType
        });
      }
    }

    if (event.key === KEYS.SPACE) {
      const state = store.getState();
      if (state.isTemporaryPanning) {
        // Return to original tool cursor
        const cursorType =
          TOOL_CURSOR_MAP[toolHandler.currentTool] || TOOL_CURSOR_MAP.default;
        store.setState({ 
          isTemporaryPanning: false,
          cursor: cursorType 
        });
      }
    }
  };

  const onChangeTool = e => {
    const rawTarget = e.target;
    const toolTarget = rawTarget.closest('label');
    if (!toolTarget || !toolTarget.id) return;
    
    // Prevent double execution for special tools due to event bubbling
    // Only process clicks on the label itself, not on the input inside
    if ((toolTarget.id === TOOL_COLOR_ID || toolTarget.id === TOOL_SHAPES_ID) && rawTarget.tagName === 'INPUT') {
      return; // Don't process input clicks, only label clicks
    }

    // For color tool, prevent the default radio toggle and manage checked manually
    if (toolTarget.id === TOOL_COLOR_ID || toolTarget.id === TOOL_SHAPES_ID) {
      e.preventDefault();
    }

    const selectedToolId = toolHandler.currentTool;
    const isCurrentSelected = selectedToolId === toolTarget.id;

    // Reset any ongoing drawing/panning states
    store.setState({ 
      isDrawing: false, 
      isPanning: false,
      isTemporaryPanning: false
    });
    
    // Clear preview line when changing tools
    infiniteCanvas.clearPreviewLine();
    
    // Reset tool state when changing tools
    toolHandler.resetToolState();

    // If clicking the same tool, just reset state
    if (isCurrentSelected) {
      return;
    }
    // Set the new tool (includes color menu special-case)
    onSetTool(toolTarget.id, toolTarget.querySelector('input'));

    // Update status tool label
    if (statusTool) {
      const map = {
        'btn-click': 'neutral',
        'btn-brush': 'brush',
        'btn-laser': 'laser',
        'btn-eraser': 'eraser',
        'btn-shapes': 'shapes',
      };
      statusTool.textContent = `Herramienta: ${map[toolTarget.id] || 'neutral'}`;
    }

    // Clean board tool
    if (toolTarget.id === TOOL_TRASH_ID) onCleanScreen(toolTarget.querySelector('input'));
  };

  const onPointerDown = e => {
    // Only handle canvas clicks, not toolbar clicks
    if (!e.target.closest('#canvas')) {
      return;
    }
    if (!colorPopover.classList.contains('hidden')) {
      const isInside = e.target.closest('#color-popover') || e.target.closest('#btn-color');
      if (!isInside) {
        const colorRadio = colorButton?.querySelector('input[type="radio"]');
        if (colorRadio) colorRadio.checked = false;
        colorPopover.classList.add('hidden');
      }
    }
    
    if (!shapesPopover.classList.contains('hidden')) {
      const isInside = e.target.closest('#shapes-popover') || e.target.closest('#btn-shapes');
      if (!isInside) {
        const shapesRadio = shapesButton?.querySelector('input[type="radio"]');
        if (shapesRadio) shapesRadio.checked = false;
        shapesPopover.classList.add('hidden');
      }
    }
    
    e.preventDefault();
    if (e.isPrimary) {
      const state = store.getState();
      
      // Check for temporary panning with Space key
      if (state.isTemporaryPanning) {
        store.setState({ isPanning: true, cursor: CURSOR_TYPE.GRABBING });
        // Use infinite canvas panning directly
        infiniteCanvas.startPan(e.clientX, e.clientY);
      } else if (toolHandler.currentTool === TOOL_LASER_ID) {
        // Handle laser pointer - start new drawing session
        store.setState({ isDrawing: true });
        const worldPos = toolHandler.getMousePosition(e);
        laserPointer.startLaserDrawing(worldPos, '#ff0000');
      } else if (toolHandler.currentTool === TOOL_CLICK_ID) {
        store.setState({ isPanning: true, cursor: CURSOR_TYPE.GRABBING });
        toolHandler.preparingTheBrush(e);
      } else {
        store.setState({ isDrawing: true });
        toolHandler.preparingTheBrush(e);
      }
    }
  };

  const onPointerMove = e => {
    const { isDrawing, isPanning, isTemporaryPanning, isOrthogonalMode, chainStartPoint } = store.getState();
    
    if ((isPanning || isDrawing) && e.target.closest('#canvas')) {
      // Handle temporary panning directly with infinite canvas
      if (isTemporaryPanning && isPanning) {
        infiniteCanvas.updatePan(e.clientX, e.clientY);
      } else if (toolHandler.currentTool === TOOL_LASER_ID && isDrawing) {
        // Handle laser pointer drag - add points to current segment
        const worldPos = toolHandler.getMousePosition(e);
        laserPointer.addLaserPoint(worldPos);
      } else {
        toolHandler.useTool(e);
      }
    } else if (isOrthogonalMode && chainStartPoint && toolHandler.currentTool === TOOL_BRUSH_ID && e.target.closest('#canvas')) {
      // Show preview for next orthogonal line
      const worldPos = toolHandler.getMousePosition(e);
      infiniteCanvas.updatePreviewLine(worldPos.x, worldPos.y);
    }

    // Update cursor position relative to canvas
    if (e.target.closest('#canvas')) {
      const rect = canvasHtml.getBoundingClientRect();
      const x = Math.round(e.clientX - rect.left);
      const y = Math.round(e.clientY - rect.top);
      if (statusPos) statusPos.textContent = `X: ${x} Y: ${y}`;
    }
  };

  const onPointerStop = e => {
    const { isDrawing, isPanning, isTemporaryPanning } = store.getState();
    
    if (isPanning || isDrawing) {
      e.preventDefault();
      
      if (isPanning) {
        // Handle temporary panning
        if (isTemporaryPanning) {
          infiniteCanvas.stopPan();
          // Return to grab cursor (still holding Space)
          store.setState({ isPanning: false, cursor: CURSOR_TYPE.GRAB });
        } else {
          // Normal panning with click tool
          toolHandler.finishDrawing();
          const cursorType = TOOL_CURSOR_MAP[toolHandler.currentTool] || TOOL_CURSOR_MAP.default;
          store.setState({ isPanning: false, cursor: cursorType });
        }
      } else if (isDrawing) {
        // Check if it's laser tool
        if (toolHandler.currentTool === TOOL_LASER_ID) {
          // Laser drawing finished - end session
          laserPointer.endLaserDrawing();
          store.setState({ isDrawing: false });
        } else {
          // Normal drawing
          toolHandler.finishDrawing();
          // All drawing (strokes and shapes) is now handled automatically in infiniteCanvas
          store.setState({ isDrawing: false, hasHistory: Symbol(true) });
        }
      }
    }
  };

  const onContextMenu = e => {
    e.preventDefault();
  };
  const onTouchMove = e => {
    // Block pinch-zooming
    if (typeof e.scale === 'number' && e.scale !== 1) {
      e.preventDefault();
    }
  };

    const onWheel = e => {
    // Handle zoom with Ctrl/Cmd + wheel
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      toolHandler.handleZoom(e, e.deltaY);
    }
  };

  const onPalleteColorClick = e => {
    const swatch = e.target.closest('.color-swatch');
    if (!swatch || !colorGrid?.contains(swatch)) return;
    const hex = swatch.getAttribute('data-color');
    if (!hex) return;
    
    // Handle color with potential alpha
    let colorForDrawing = hex;
    let alphaValue = 1;
    
    // Check if hex has alpha (9 characters: #RRGGBBAA)
    if (hex.length === 9 && hex.startsWith('#')) {
      const alphaHex = hex.slice(7, 9);
      alphaValue = parseInt(alphaHex, 16) / 255;
      
      // Convert to RGBA format for drawing if it has transparency
      if (alphaValue < 1) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        colorForDrawing = `rgba(${r}, ${g}, ${b}, ${alphaValue})`;
      }
    }
    
    toolHandler.setColor(colorForDrawing);
    
    // Update color chip with alpha support
    if (colorChip) {
      if (alphaValue < 1) {
        colorChip.style.background = `
          repeating-conic-gradient(#c0c0c0 0% 25%, transparent 0% 50%) 50% / 4px 4px,
          ${hex}
        `;
      } else {
        colorChip.style.background = hex;
      }
    }
    
    // Store alpha information in state
    store.setState({ 
      currentColor: hex,
      currentColorAlpha: alphaValue
    });
    
    // Uncheck the color tool radio to remove active style
    const colorRadio = colorButton?.querySelector('input[type="radio"]');
    if (colorRadio) colorRadio.checked = false;
    colorPopover?.classList.add('hidden');
  }

  const onOpenColorSettings = () => {
    colorPopover?.classList.add('hidden');
    const colorRadio = colorButton?.querySelector('input[type="radio"]');
    if (colorRadio) colorRadio.checked = false;
    openColorEditor();
  }

  const onCloseColorSettings = () => {
    colorManager.clearSlotSelection();
    colorModal?.classList.add('hidden');
    colorModalOverlay?.classList.add('hidden');
    
    // Update all color palettes when closing the color modal
    // This ensures the shapes fill palette reflects any changes made
    updateAllColorPalettes();
  };

  /**
   * Updates visual selection styling for the currently active color
   * @param {string} selectedHex - The HEX color that's currently selected
   */
  const updateColorSelection = (selectedHex) => {
    // Remove existing selection styling from all color swatches
    const allSwatches = [
      ...modalDefaultGrid?.querySelectorAll('.color-swatch') || [],
      ...modalActiveGrid?.querySelectorAll('.color-swatch') || []
    ];
    
    allSwatches.forEach(swatch => {
      swatch.classList.remove('is-color-selected');
      swatch.style.removeProperty('border');
      swatch.style.removeProperty('box-shadow');
    });
    
    // Add selection styling to matching colors
    allSwatches.forEach(swatch => {
      const swatchColor = swatch.getAttribute('data-color');
      if (swatchColor === selectedHex) {
        swatch.classList.add('is-color-selected');
        swatch.style.border = '2px solid #2563eb'; // Blue border
        swatch.style.boxShadow = '0 0 0 1px #ffffff, 0 0 0 3px #2563eb'; // White + blue outline
      }
    });
  };

  // --------------- STORE SUBSCRIPTIONS ---------------------

  store.subscribe('cursor', newValue => {
    canvasHtml.style.setProperty('--current-cursor', newValue);
  });
  // Sync color chip with currentColor in the store
  store.subscribe('currentColor', (hex) => {
    if (colorChip) {
      // Check if we have alpha information in the state
      const { currentColorAlpha } = store.getState();
      if (currentColorAlpha !== undefined && currentColorAlpha < 1) {
        // Color has transparency - use checkerboard background
        colorChip.style.background = `
          repeating-conic-gradient(#c0c0c0 0% 25%, transparent 0% 50%) 50% / 4px 4px,
          ${hex || '#000000'}
        `;
      } else {
        // Opaque color
        colorChip.style.background = hex || '#000000';
      }
    }
  });
  store.subscribe('isDrawing', newValue => {
    document.body.style.setProperty(
      '--paintease-pointers-events',
      newValue ? 'none' : 'all'
    );
  });
  store.subscribe('hasHistory', newValue => {
    let isDisableRedo = true;
    let isDisableUndo = true;
    const isActive = newValue.description === 'true';
    if (isActive) {
      // Only check infinite canvas history
      isDisableRedo = !infiniteCanvas.canRedo();
      isDisableUndo = !infiniteCanvas.canUndo();
    }
    btnRedo.disabled = isDisableRedo;
    btnUndo.disabled = isDisableUndo;
  });

  // Update UI and canvas camera when camera properties change in store
  const syncZoom = (newZoom) => {
    const cam = infiniteCanvas.camera;
    infiniteCanvas.camera = { ...cam, zoom: newZoom };
    if (statusZoom) {
      const pct = Math.round((newZoom || 1) * 100);
      statusZoom.textContent = `Zoom: ${pct}%`;
    }
  };

  store.subscribe('camera.zoom', syncZoom);


  // Sync worldElements from store to infinite canvas
  store.subscribe('worldElements', (newWorldElements) => {
    if (Array.isArray(newWorldElements)) {
      // Only sync if length is different (simple check to avoid most loops)
      const currentElements = infiniteCanvas.worldElements;
      if (currentElements.length !== newWorldElements.length) {
        infiniteCanvas.worldElements = [...newWorldElements];
        infiniteCanvas.markDirty();
      }
      // Update status bar count
      if (statusElements) {
        statusElements.textContent = `${newWorldElements.length} elementos`;
      }
    }
  });

  // Visual feedback for orthogonal line mode
  store.subscribe('isOrthogonalMode', (isOrthogonalMode) => {
    if (isOrthogonalMode && toolHandler.currentTool === TOOL_BRUSH_ID) {
      // Add visual indicator for orthogonal mode (different cursor)
      document.body.style.setProperty('--current-cursor', 'cell');
    } else {
      // Reset to normal cursor - directly set CSS to avoid recursive state updates
      const cursorType = TOOL_CURSOR_MAP[toolHandler.currentTool] || TOOL_CURSOR_MAP.default;
      document.body.style.setProperty('--current-cursor', cursorType);
    }
  });

  // Keep Shapes fill palette in sync with any palette changes (defaults or custom)
  const rerenderFillPaletteFromStore = () => {
    if (fillGrid) {
      shapesManager.renderFillGrid(fillGrid);
    }
  };
  store.subscribe('colorPalette.defaults', rerenderFillPaletteFromStore);
  store.subscribe('colorPalette.custom', rerenderFillPaletteFromStore);

  // --------------- EVENT MANAGER / STARTERS ---------------------

  const removeEventListeners = () => {
    onRemoveEventListeners.trigger();
  };

  const removeSupportListeners = () => {
    onRemoveSupportListeners.trigger();
  };

  const addEventListeners = () => {
    removeEventListeners();

    onRemoveEventListeners.once(
      addEventListener(document, EVENTS.KEYDOWN, onKeydown),
      addEventListener(document, EVENTS.KEYUP, onKeyUp),
      addEventListener(document, EVENTS.CONTEXT_MENU, onContextMenu),
      addEventListener(canvasHtml, EVENTS.DRAG_START, () => false),
      addEventListener(canvasHtml, 'wheel', onWheel, { passive: false }),
      // Canvas is initialized immediately; no need to wait for LOAD
      addEventListener(window, EVENTS.RESIZE, () => {
        infiniteCanvas.resize();
      }),
      addEventListener(toolsContainer, EVENTS.CLICK, onChangeTool),
      // Color grid delegated click (single listener)
      addEventListener(colorGrid, EVENTS.CLICK, onPalleteColorClick),
      // Open color editor
      addEventListener(btnEditColors, EVENTS.CLICK, onOpenColorSettings),
      // Close modal actions
      addEventListener(colorModalClose, EVENTS.CLICK, onCloseColorSettings),
      addEventListener(colorModalOverlay, EVENTS.CLICK, onCloseColorSettings),
      // Defaults grid: clicking sets color as active (NO auto-add to custom palette)
      addEventListener(modalDefaultGrid, EVENTS.CLICK, onModalDefaultGridClick),
      // Active grid selection
      addEventListener(modalActiveGrid, EVENTS.CLICK, onModalActiveGridClick),
      // Add/replace via input
      addEventListener(modalAddBtn, EVENTS.CLICK, onModalAddBtnClick),
      // Validate input enabling
      addEventListener(modalInput, 'input', () => {
        if (!modalAddBtn) return;
        modalAddBtn.disabled = !colorManager.isValidHex(modalInput.value);
      }),
      // Auto-format input on blur
      addEventListener(modalInput, 'blur', () => {
        colorManager.autoFormatHexInput(modalInput);
        // Re-validate after formatting
        if (modalAddBtn) {
          modalAddBtn.disabled = !colorManager.isValidHex(modalInput.value);
        }
      }),
      // Reset to defaults
      addEventListener(modalResetBtn, EVENTS.CLICK, () => {
        colorManager.resetCustomColors();
        updateAllColorPalettes();
        openColorEditor();
      }),
      // Shapes event listeners
      addEventListener(shapesGrid, EVENTS.CLICK, onShapeSelect),
      addEventListener(strokeWidthRange, 'input', onStrokeWidthChange),
      addEventListener(fillGrid, EVENTS.CLICK, onFillPaletteClick),
      addEventListener(cornerRadiusRange, 'input', onCornerRadiusChange),
      addEventListener(shapeOpacityRange, 'input', onOpacityChange),
      addEventListener(lineStyleGrid, EVENTS.CLICK, onLineStyleSelect),
      addEventListener(canvasHtml, EVENTS.POINTER_DOWN, onPointerDown),
      addEventListener(canvasHtml, EVENTS.POINTER_MOVE, onPointerMove),
      addEventListener(canvasHtml, EVENTS.POINTER_UP, onPointerStop),
      addEventListener(canvasHtml, EVENTS.POINTER_LEAVE, onPointerStop),
      addEventListener(canvasHtml, EVENTS.POINTER_CANCEL, onPointerStop),
      addEventListener(canvasHtml, EVENTS.POINTER_OUT, onPointerStop),
      addEventListener(document, EVENTS.TOUCH_MOVE, onTouchMove, {
        passive: false,
      })
    );
  };

  const initSupportDetection = () => {
    removeSupportListeners();
    const { mediaP3, media2020, support } = initSupport();
    store.setState({ support });
    if (mediaP3) {
      onRemoveSupportListeners.once(
        addEventListener(mediaP3, EVENTS.CHANGE, () => {
         store.setState({ support: { ...support, p3: mediaP3.matches, displayP3Media: mediaP3.matches } });
        })
      )
    }
    if(media2020){
      onRemoveSupportListeners.once(
        addEventListener(media2020, EVENTS.CHANGE, () => {
         store.setState({ support: { ...support, rec2020: media2020.matches } });
        })
      )
    }

    return { mediaP3, media2020, support };
  };

  const initHistoryTools = () => {
    onRemoveHistoryListener.trigger();
    
    // Initialize history buttons
    const redoId = btnRedo.id;
    const undoId = btnUndo.id;
    btnRedo.insertAdjacentHTML('beforeend', TOOL_ICON[redoId]);
    btnUndo.insertAdjacentHTML('beforeend', TOOL_ICON[undoId]);

    // Initialize zoom buttons
    const zoomInId = btnZoomIn.id;
    const zoomOutId = btnZoomOut.id;
    btnZoomIn.insertAdjacentHTML('beforeend', TOOL_ICON[zoomInId]);
    btnZoomOut.insertAdjacentHTML('beforeend', TOOL_ICON[zoomOutId]);

    // Add event listeners for both history and zoom controls
    onRemoveHistoryListener.once(
      addEventListener(btnRedo, EVENTS.CLICK, onRedo),
      addEventListener(btnUndo, EVENTS.CLICK, onUndo),
      addEventListener(btnZoomIn, EVENTS.CLICK, onZoomIn),
      addEventListener(btnZoomOut, EVENTS.CLICK, onZoomOut)
    );
  };

  const init = () => {
    // Initialize support detection first
    initSupportDetection();
    
    // Ensure cursor assets use correct base path (works on GitHub Pages)
    const base = import.meta.env.BASE_URL || './';
    const root = document.documentElement;
    root.style.setProperty(
      '--default-cursor',
      `url('${base}cursors/default.png') 3 3, default`
    );
    root.style.setProperty(
      '--pointer-cursor',
      `url('${base}cursors/pointer.webp') 7 5, pointer`
    );
    root.style.setProperty(
      '--unavalaible-cursor',
      `url('${base}cursors/unavailable.webp') 3 3, not-allowed`
    );
    addEventListeners();
    initHistoryTools();
    // Ensure color chip shows current color on init
    const { currentColor } = store.getState();
    if (colorChip) colorChip.style.background = currentColor || '#000000';
    // Build initial color grid from palette (defaults + custom)
    updateAllColorPalettes();
    
    // Initialize shapes manager UI
    shapesManager.updateShapesGrid(shapesGrid);
    shapesManager.updateLineStyleGrid(lineStyleGrid);
    shapesManager.updateRangeInputs({
      strokeWidthRange,
      strokeWidthValue,
      cornerRadiusRange,
      cornerRadiusValue,
      opacityRange: shapeOpacityRange,
      opacityValue: shapeOpacityValue
    });
    shapesManager.renderFillGrid(fillGrid);
    
    // Initialize status bar with default values
    if (statusZoom) statusZoom.textContent = 'Zoom: 100%';
    if (statusElements) statusElements.textContent = '0 elementos';
    if (statusTool) statusTool.textContent = 'Herramienta: neutral';
  };

  // Wait for DOM to be fully loaded before initializing
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM is already loaded
    init();
  }
})();
