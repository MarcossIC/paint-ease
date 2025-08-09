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
} from './utils/constants';
import { $, $FROM, addEventListener } from './utils/utils';
import ToolsHandler from './lib/toolsHandler';
import { InfiniteCanvas } from './lib/infiniteCanvas';
import { store } from './lib/appState';
import Emitter from './domain/emitter';
import { KEYS, isActionKey, KEYS_TO_TOOLS } from './utils/keyUtilities';
import { openColorDropper } from './lib/colorDropper';

(() => {
  // --------------- VARIABLES ---------------------
  const canvasHtml = $('#canvas');
  const btnUndo = $('#btn-undo');
  const btnRedo = $('#btn-redo');
  const toolsContainer = $('#tool-controls');
  // Status bar elements
  const statusPos = $('#status-pos');
  const statusTool = $('#status-tool');
  const statusElements = $('#status-elements');
  const statusZoom = $('#status-zoom');
  const infiniteCanvas = new InfiniteCanvas(canvasHtml);
  const toolHandler = new ToolsHandler(null, infiniteCanvas, TOOL_CLICK_ID);
  const onRemoveEventListeners = new Emitter();
  const onRemoveHistoryListener = new Emitter();

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
  const onSetTool = (toolUpdated, target) => {
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

    // Check for orthogonal line mode (Ctrl/Cmd + Alt + Shift) or straight line mode (Ctrl/Cmd + Alt)
    if (event[KEYS.CTRL_OR_CMD] && event[KEYS.ALT]) {
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
    const { target } = e;
    if (target.tagName === 'INPUT' && target.type === 'radio') {
      const toolTarget = target.closest('label');
      const selectedToolId = toolHandler.currentTool;
      const isCurrentSelected = selectedToolId === toolTarget.id;

      // Reset any ongoing drawing/panning states
      store.setState({ 
        isDrawing: false, 
        isPanning: false,
        isTemporaryPanning: false // Also reset temporary panning
      });
      
      // Clear preview line when changing tools
      infiniteCanvas.clearPreviewLine();
      
      // Reset tool state when changing tools
      toolHandler.resetToolState();

      if (!toolTarget) return;

      // If clicking the same tool, just reset state
      if (isCurrentSelected) {
        return;
      }

      // Set the new tool
      onSetTool(toolTarget.id);
      // Update status tool label
      if (statusTool) {
        const map = {
          'btn-click': 'neutral',
          'btn-brush': 'brush',
          'btn-eraser': 'eraser',
          'btn-rectangle': 'rectangle',
          'btn-triangle': 'triangle',
          'btn-circle': 'circle',
        };
        statusTool.textContent = `Herramienta: ${map[toolTarget.id] || 'neutral'}`;
      }

      // Si se clickeo la herramienta de limpiado
      if (toolTarget.id === TOOL_TRASH_ID) onCleanScreen(target);
    }
  };

  const onPointerDown = e => {
    // Only handle canvas clicks, not toolbar clicks
    if (!e.target.closest('#canvas')) {
      return;
    }
    
    e.preventDefault();
    if (e.isPrimary) {
      const state = store.getState();
      
      // Check for temporary panning with Space key
      if (state.isTemporaryPanning) {
        store.setState({ isPanning: true, cursor: CURSOR_TYPE.GRABBING });
        // Use infinite canvas panning directly
        infiniteCanvas.startPan(e.pageX, e.pageY);
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
        infiniteCanvas.updatePan(e.pageX, e.pageY);
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
        // Normal drawing
        toolHandler.finishDrawing();
        // All drawing (strokes and shapes) is now handled automatically in infiniteCanvas
        store.setState({ isDrawing: false, hasHistory: Symbol(true) });
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

  // --------------- STORE SUBSCRIPTIONS ---------------------

  store.subscribe('cursor', newValue => {
    canvasHtml.style.setProperty('--current-cursor', newValue);
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

  // Visual feedback for straight line mode
  // store.subscribe('isStraightLineMode', (isStraightLineMode) => {
  //   const state = store.getState();
  //   if (isStraightLineMode && toolHandler.currentTool === TOOL_BRUSH_ID && !state.isOrthogonalMode) {
  //     // Add visual indicator or change cursor to show straight line mode is active
  //     document.body.style.setProperty('--current-cursor', 'crosshair');
  //   } else if (!state.isOrthogonalMode) {
  //     // Reset to normal cursor - directly set CSS to avoid recursive state updates
  //     const cursorType = TOOL_CURSOR_MAP[toolHandler.currentTool] || TOOL_CURSOR_MAP.default;
  //     document.body.style.setProperty('--current-cursor', cursorType);
  //   }
  // });

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

  // --------------- EVENT MANAGER / STARTERS ---------------------

  const removeEventListeners = () => {
    onRemoveEventListeners.trigger();
  };

  const addEventListeners = () => {
    removeEventListeners();

    onRemoveEventListeners.once(
      addEventListener(document, EVENTS.KEYDOWN, onKeydown),
      addEventListener(document, EVENTS.KEYUP, onKeyUp),
      addEventListener(document, EVENTS.CONTEXT_MENU, onContextMenu),
      addEventListener(canvasHtml, EVENTS.DRAG_START, () => false),
      addEventListener(canvasHtml, 'wheel', onWheel, { passive: false }),
      addEventListener(window, EVENTS.LOAD, () => {
        infiniteCanvas.init();
      }),
      addEventListener(window, EVENTS.RESIZE, () => {
        infiniteCanvas.resize();
      }),
      addEventListener(toolsContainer, EVENTS.CLICK, onChangeTool),
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

  const initHistoryTools = () => {
    onRemoveHistoryListener.trigger();
    const redoId = btnRedo.id;
    const undoId = btnUndo.id;
    btnRedo.insertAdjacentHTML('beforeend', TOOL_ICON[redoId]);
    btnUndo.insertAdjacentHTML('beforeend', TOOL_ICON[undoId]);

    // Negacion en los "disabled", porque cuando es "true" NO tiene que desabilitarse
    onRemoveHistoryListener.once(
      addEventListener(btnRedo, EVENTS.CLICK, onRedo),
      addEventListener(btnUndo, EVENTS.CLICK, onUndo)
    );
  };

  const init = () => {
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
    
    // Initialize status bar with default values
    if (statusZoom) statusZoom.textContent = 'Zoom: 100%';
    if (statusElements) statusElements.textContent = '0 elementos';
    if (statusTool) statusTool.textContent = 'Herramienta: neutral';
  };

  init();
})();
