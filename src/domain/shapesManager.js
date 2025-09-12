import { store } from '../lib/appState.js';
// Tool IDs are now handled internally since shapes are managed through the shapes tool

/**
 * ShapesManager - Domain class for shapes configuration and settings management
 * Handles shape selection, stroke settings, fill options, and line styles
 * 
 * IMPORTANT: This class uses the global store instance directly imported from appState.js
 * Do NOT pass store as a constructor parameter - this creates unnecessary coupling
 * The store is a singleton and should be imported where needed
 */
export class ShapesManager {
  constructor() {
    // Default shapes configuration
    this.defaultConfig = {
      selectedShape: 'rectangle',
      strokeWidth: 2,
      fillShape: false,
      fillColor: '#000000',
      cornerRadius: 0,
      lineStyle: 'solid',
      opacity: 100 // 0-100 percentage
    };

    // Initialize shapes state in store if not exists
    this.initializeShapesState();
  }

  initializeShapesState() {
    const state = store.getState();
    if (!state.shapesConfig) {
      store.setState({
        shapesConfig: { ...this.defaultConfig }
      });
    }
  }

  // ---------- SHAPE SELECTION ----------

  /**
   * Get current selected shape
   * @returns {string} Current selected shape ('rectangle', 'circle', 'triangle')
   */
  getSelectedShape() {
    const state = store.getState();
    return state.shapesConfig?.selectedShape || this.defaultConfig.selectedShape;
  }

  /**
   * Set selected shape
   * @param {string} shape - Shape to select ('rectangle', 'circle', 'triangle')
   */
  setSelectedShape(shape) {
    const validShapes = [
      'rectangle', 
      'circle', 
      'triangle-isosceles', 
      'triangle-scalene', 
      'triangle-equilateral'
    ];
    if (!validShapes.includes(shape)) {
      console.warn('Invalid shape:', shape);
      return;
    }

    const state = store.getState();
    store.setState({
      shapesConfig: {
        ...state.shapesConfig,
        selectedShape: shape
      }
    });
  }

  /**
   * Get corresponding tool ID for selected shape
   * @returns {string} Tool ID constant
   */
  getSelectedShapeToolId() {
    const shape = this.getSelectedShape();
    const mapping = {
      rectangle: 'btn-rectangle',
      circle: 'btn-circle',
      'triangle-isosceles': 'btn-triangle-isosceles',
      'triangle-scalene': 'btn-triangle-scalene',
      'triangle-equilateral': 'btn-triangle-equilateral'
    };
    return mapping[shape] || 'btn-rectangle';
  }

  // ---------- STROKE CONFIGURATION ----------

  /**
   * Get current stroke width
   * @returns {number} Stroke width in pixels
   */
  getStrokeWidth() {
    const state = store.getState();
    return state.shapesConfig?.strokeWidth || this.defaultConfig.strokeWidth;
  }

  /**
   * Set stroke width
   * @param {number} width - Width in pixels (1-20)
   */
  setStrokeWidth(width) {
    const clampedWidth = Math.max(1, Math.min(20, Number(width)));
    const state = store.getState();
    store.setState({
      shapesConfig: {
        ...state.shapesConfig,
        strokeWidth: clampedWidth
      }
    });
  }

  // ---------- FILL CONFIGURATION ----------

  /**
   * Get fill shape setting
   * @returns {boolean} Whether to fill shapes
   */
  getFillShape() {
    const state = store.getState();
    return state.shapesConfig?.fillShape || this.defaultConfig.fillShape;
  }

  /**
   * Set fill shape setting
   * @param {boolean} fill - Whether to fill shapes
   */
  setFillShape(fill) {
    const state = store.getState();
    store.setState({
      shapesConfig: {
        ...state.shapesConfig,
        fillShape: Boolean(fill)
      }
    });
  }

  /**
   * Get fill color
   * @returns {string} Fill color hex value
   */
  getFillColor() {
    const state = store.getState();
    return state.shapesConfig?.fillColor || this.defaultConfig.fillColor;
  }

  /**
   * Set fill color
   * @param {string} color - Hex color value
   */
  setFillColor(color) {
    const state = store.getState();
    store.setState({
      shapesConfig: {
        ...state.shapesConfig,
        fillColor: color
      }
    });
  }

  // ---------- CORNER RADIUS (RECTANGLE ONLY) ----------

  /**
   * Get corner radius for rectangles
   * @returns {number} Corner radius in pixels
   */
  getCornerRadius() {
    const state = store.getState();
    return state.shapesConfig?.cornerRadius || this.defaultConfig.cornerRadius;
  }

  /**
   * Set corner radius for rectangles
   * @param {number} radius - Radius in pixels (0-50)
   */
  setCornerRadius(radius) {
    const clampedRadius = Math.max(0, Math.min(50, Number(radius)));
    const state = store.getState();
    store.setState({
      shapesConfig: {
        ...state.shapesConfig,
        cornerRadius: clampedRadius
      }
    });
  }

  // ---------- LINE STYLE ----------

  /**
   * Get current line style
   * @returns {string} Line style ('solid', 'dashed', 'dotted')
   */
  getLineStyle() {
    const state = store.getState();
    return state.shapesConfig?.lineStyle || this.defaultConfig.lineStyle;
  }

  /**
   * Set line style
   * @param {string} style - Line style ('solid', 'dashed', 'dotted')
   */
  setLineStyle(style) {
    if (!['solid', 'dashed', 'dotted'].includes(style)) {
      console.warn('Invalid line style:', style);
      return;
    }

    const state = store.getState();
    store.setState({
      shapesConfig: {
        ...state.shapesConfig,
        lineStyle: style
      }
    });
  }

  // ---------- OPACITY ----------

  /**
   * Get current opacity
   * @returns {number} Opacity percentage (0-100)
   */
  getOpacity() {
    const state = store.getState();
    return state.shapesConfig?.opacity ?? this.defaultConfig.opacity;
  }

  /**
   * Set opacity
   * @param {number} opacity - Opacity percentage (0-100)
   */
  setOpacity(opacity) {
    const clampedOpacity = Math.max(0, Math.min(100, Number(opacity)));
    const state = store.getState();
    store.setState({
      shapesConfig: {
        ...state.shapesConfig,
        opacity: clampedOpacity
      }
    });
  }

  /**
   * Get canvas context line dash pattern for current line style
   * @returns {number[]} Array for setLineDash() method
   */
  getLineDashPattern() {
    const style = this.getLineStyle();
    const strokeWidth = this.getStrokeWidth();
    
    switch (style) {
      case 'dashed':
        return [strokeWidth * 3, strokeWidth * 2];
      case 'dotted':
        return [strokeWidth, strokeWidth];
      case 'solid':
      default:
        return [];
    }
  }

  // ---------- UI MANAGEMENT ----------

  /**
   * Update shapes grid UI to reflect current selection
   * @param {HTMLElement} container - Shapes grid container
   */
  updateShapesGrid(container) {
    if (!container) return;

    const selectedShape = this.getSelectedShape();
    const shapeOptions = container.querySelectorAll('.shape-option');
    
    shapeOptions.forEach(option => {
      const shapeType = option.dataset.shape;
      option.classList.toggle('active', shapeType === selectedShape);
    });
  }

  /**
   * Update line style grid UI to reflect current selection
   * @param {HTMLElement} container - Line style grid container
   */
  updateLineStyleGrid(container) {
    if (!container) return;

    const selectedStyle = this.getLineStyle();
    const styleOptions = container.querySelectorAll('.line-style-option');
    
    styleOptions.forEach(option => {
      const styleType = option.dataset.style;
      option.classList.toggle('active', styleType === selectedStyle);
    });
  }

  /**
   * Update range inputs and their value displays
   * @param {object} elements - Object containing range and value elements
   */
  updateRangeInputs(elements) {
    const { strokeWidthRange, strokeWidthValue, cornerRadiusRange, cornerRadiusValue, opacityRange, opacityValue } = elements;

    if (strokeWidthRange && strokeWidthValue) {
      const strokeWidth = this.getStrokeWidth();
      strokeWidthRange.value = strokeWidth;
      strokeWidthValue.textContent = `${strokeWidth}px`;
    }

    if (cornerRadiusRange && cornerRadiusValue) {
      const cornerRadius = this.getCornerRadius();
      cornerRadiusRange.value = cornerRadius;
      cornerRadiusValue.textContent = `${cornerRadius}px`;
    }

    if (opacityRange && opacityValue) {
      const opacity = this.getOpacity();
      opacityRange.value = opacity;
      opacityValue.textContent = `${opacity}%`;
    }
  }

  /**
   * Render fill palette with transparent swatch first, then default+custom colors
   * @param {HTMLElement} grid - container element
   * @param {Array<string>} defaults - optional defaults, falls back to app palette
   */
  renderFillGrid(grid, defaults) {
    if (!grid) return;
    // Build colors: transparent + app color palette (defaults + custom from store if available)
    const state = store.getState();
    const paletteDefaults = state.colorPalette?.defaults || [];
    const paletteCustom = state.colorPalette?.custom || [];
    // Combine defaults and custom colors, then take first 21, plus transparent and white at the beginning
    const combinedPalette = [...paletteDefaults, ...paletteCustom];
    const baseDefaults = (defaults || combinedPalette).slice(0, 21);
    const colors = ['transparent', '#FFFFFF', ...baseDefaults];
    grid.innerHTML = '';

    colors.forEach((hex) => {
      const swatch = document.createElement('div');
      swatch.setAttribute('role', 'button');
      swatch.tabIndex = 0;
      swatch.className = 'color-swatch';
      if (hex === 'transparent') {
        swatch.classList.add('transparent');
        swatch.setAttribute('data-color', 'transparent');
        swatch.setAttribute('aria-label', 'Sin relleno');
      } else {
        swatch.style.background = hex;
        swatch.setAttribute('data-color', hex);
        swatch.setAttribute('aria-label', `Relleno ${hex}`);
      }
      grid.appendChild(swatch);
    });

    // Apply selection state
    this.updateFillGridSelection(grid);
  }

  /**
   * Update selection styles in fill grid
   */
  updateFillGridSelection(grid) {
    if (!grid) return;
    const isFill = this.getFillShape();
    const fillColor = this.getFillColor();
    const swatches = grid.querySelectorAll('.color-swatch');
    swatches.forEach((el) => {
      const value = el.getAttribute('data-color');
      const isTransparent = value === 'transparent';
      const active = isTransparent ? !isFill : (isFill && value?.toLowerCase() === fillColor?.toLowerCase());
      el.classList.toggle('is-selected', active);
    });
  }

  /**
   * Update fill checkbox and color input
   * @param {HTMLElement} checkbox - Fill checkbox element
   * @param {HTMLElement} colorInput - Fill color input element
   */
  updateFillControls(checkbox, colorInput) {
    if (checkbox) {
      checkbox.checked = this.getFillShape();
    }
    if (colorInput) {
      colorInput.value = this.getFillColor();
    }
  }

  /**
   * Get complete shapes configuration for drawing
   * @returns {object} Complete configuration object
   */
  getShapesConfig() {
    return {
      selectedShape: this.getSelectedShape(),
      strokeWidth: this.getStrokeWidth(),
      fillShape: this.getFillShape(),
      fillColor: this.getFillColor(),
      cornerRadius: this.getCornerRadius(),
      lineStyle: this.getLineStyle(),
      opacity: this.getOpacity(),
      lineDashPattern: this.getLineDashPattern(),
      toolId: this.getSelectedShapeToolId()
    };
  }

  /**
   * Reset shapes configuration to defaults
   */
  resetToDefaults() {
    store.setState({
      shapesConfig: { ...this.defaultConfig }
    });
  }
}

export default ShapesManager;