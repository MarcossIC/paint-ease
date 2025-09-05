import { store } from '../lib/appState.js';
import { useMode, getMode, converters } from '../utils/modes.js';
import { 
  modeHsl, modeLch, modeLrgb, modeOklch, modeP3, modeRec2020, modeRgb
} from '../utils/utilColors.js';
import { inGamut, converter, parse, prepare } from '../utils/utils.js';

/**
 * ColorManager - Domain class for color handling and palette management
 * Handles validation, normalization, transformations, UI rendering and color extraction
 * 
 * IMPORTANT: This class uses the global store instance directly imported from appState.js
 * Do NOT pass store as a constructor parameter - this creates unnecessary coupling
 * The store is a singleton and should be imported where needed
 */
export class ColorManager {
  selectedSlotIndex = null;
  isP3Gammut = false;
  inRec2020 = false;

  ALPHA_MAX = 100;
  ALPHA_STEP =  1;

  L_MAX_COLOR = 100;
  L_MAX = 1;
  
  MAX_HUE = 360;
  STEP_HUE = 1;

  C_MAX = 145;
  C_MAX_REC2020 = 145;
  C_RANDOM = 145;
  C_STEP = 145;

  constructor() {
    // Register all color modes
    useMode(modeRgb);
    useMode(modeHsl);
    useMode(modeLch);
    useMode(modeP3);
    useMode(modeLrgb);
    useMode(modeRec2020);
    useMode(modeOklch);

    this.selectedSlotIndex = null;
  }

  // ---------- COLOR CONVERSION USING MODE SYSTEM ----------
  
  /**
   * Universal color parser - supports HEX, RGB, HSL, OKLCH, LCH, named colors
   * Uses the built-in parse function from the mode system
   * @param {string} colorString - Color in any supported format
   * @returns {Object|null} Parsed color object or null if invalid
   */
  parseColor(colorString) {
    if (!colorString || typeof colorString !== 'string') return null;
    
    try {
      return parse(colorString.trim()) || null;
    } catch (error) {
      console.warn('Failed to parse color:', colorString, error);
      return null;
    }
  }

  /**
   * Converts any color to specified mode using the mode system
   * @param {string|Object} color - Color in any format
   * @param {string} targetMode - Target mode ('rgb', 'hsl', 'oklch', 'lch', 'p3', 'rec2020')
   * @returns {Object|null} Converted color object or null if conversion failed
   */
  convertTo(color, targetMode) {
    // Normalize mode name
    const normalizedMode = this.normalizeGamutName(targetMode);
    
    if (!normalizedMode || !getMode(normalizedMode)) {
      console.warn('Invalid target mode:', targetMode, 'normalized to:', normalizedMode);
      
      // Fallback for common modes
      if (targetMode === 'p3' || targetMode === 'display-p3') {
        return this.fallbackConvertToP3(color);
      }
      return null;
    }

    try {
      const prepared = prepare(color, normalizedMode);
      if (!prepared) return null;
      
      return converter(normalizedMode)(prepared);
    } catch (error) {
      console.warn(`Failed to convert to ${targetMode}:`, color, error);
      
      // Try fallback conversion
      return this.fallbackConvertTo(color, targetMode);
    }
  }

  /**
   * Converts any color to RGB format
   * @param {string|Object} color - Color in any format
   * @returns {Object|null} RGB color object {r, g, b, alpha?}
   */
  toRgb(color) {
    return this.convertTo(color, 'rgb');
  }

  /**
   * Converts any color to HSL format
   * @param {string|Object} color - Color in any format
   * @returns {Object|null} HSL color object {h, s, l, alpha?}
   */
  toHsl(color) {
    return this.convertTo(color, 'hsl');
  }

  /**
   * Converts any color to OKLCH format
   * @param {string|Object} color - Color in any format
   * @returns {Object|null} OKLCH color object {l, c, h, alpha?}
   */
  toOklch(color) {
    return this.convertTo(color, 'oklch');
  }

  /**
   * Converts any color to LCH format
   * @param {string|Object} color - Color in any format
   * @returns {Object|null} LCH color object {l, c, h, alpha?}
   */
  toLch(color) {
    return this.convertTo(color, 'lch');
  }

  /**
   * Converts any color to Display P3 format
   * @param {string|Object} color - Color in any format
   * @returns {Object|null} P3 color object {r, g, b, alpha?}
   */
  toP3(color) {
    return this.convertTo(color, 'p3');
  }

  /**
   * Converts any color to Rec2020 format
   * @param {string|Object} color - Color in any format
   * @returns {Object|null} Rec2020 color object {r, g, b, alpha?}
   */
  toRec2020(color) {
    return this.convertTo(color, 'rec2020');
  }

  /**
   * Serializes a color object to its string representation
   * Uses the mode's serialize function if available
   * @param {Object} colorObj - Color object with mode property
   * @returns {string|null} Serialized color string or null if failed
   */
  serialize(colorObj) {
    if (!colorObj || !colorObj.mode) return null;
    
    try {
      const mode = getMode(colorObj.mode);
      if (mode && mode.serialize && typeof mode.serialize === 'function') {
        return mode.serialize(colorObj);
      }
      
      // Fallback to manual serialization for common modes
      switch (colorObj.mode) {
        case 'rgb':
          return `rgb(${Math.round(colorObj.r * 255)} ${Math.round(colorObj.g * 255)} ${Math.round(colorObj.b * 255)}${colorObj.alpha !== undefined ? ` / ${colorObj.alpha}` : ''})`;
        case 'hsl':
          return `hsl(${colorObj.h || 0} ${Math.round((colorObj.s || 0) * 100)}% ${Math.round((colorObj.l || 0) * 100)}%${colorObj.alpha !== undefined ? ` / ${colorObj.alpha}` : ''})`;
        case 'oklch':
          return `oklch(${Math.round((colorObj.l || 0) * 100)}% ${colorObj.c || 0} ${colorObj.h || 0}${colorObj.alpha !== undefined ? ` / ${colorObj.alpha}` : ''})`;
        default:
          return null;
      }
    } catch (error) {
      console.warn('Failed to serialize color:', colorObj, error);
      return null;
    }
  }

  /**
   * Converts RGB values to HEX color string
   * @param {number} r - Red value (0-255) or normalized (0-1)
   * @param {number} g - Green value (0-255) or normalized (0-1)
   * @param {number} b - Blue value (0-255) or normalized (0-1)
   * @param {boolean} normalized - Whether values are normalized (0-1)
   * @returns {string} HEX color string (e.g., "#FF0000")
   */
  rgbToHex(r, g, b, normalized = false) {
    if (normalized) {
      r = Math.round(r * 255);
      g = Math.round(g * 255);
      b = Math.round(b * 255);
    }
    
    r = Math.max(0, Math.min(255, Math.round(r)));
    g = Math.max(0, Math.min(255, Math.round(g)));
    b = Math.max(0, Math.min(255, Math.round(b)));
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  }

  /**
   * Converts color object to HEX string
   * @param {Object} colorObj - Color object in any format
   * @returns {string|null} HEX color string
   */
  colorToHex(colorObj) {
    try {
      const rgb = this.toRgb(colorObj);
      if (!rgb) return null;
      
      return this.rgbToHex(rgb.r, rgb.g, rgb.b, true);
    } catch (error) {
      console.warn('Failed to convert color to HEX:', colorObj, error);
      return null;
    }
  }

  /**
   * Extracts color from canvas context at specific coordinates
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {Array} position - [X, Y] coordinates
   * @param {Array} offset - [offsetLeft, offsetTop] canvas offset
   * @returns {string} HEX color at the specified position
   */
  getCurrentColor(ctx, [X, Y], [offsetLeft, offsetTop]) {
    const dpr = Math.ceil(window.devicePixelRatio);
    const pixel = ctx.getImageData(
      (X - offsetLeft) * dpr,
      (Y - offsetTop) * dpr,
      1,
      1
    ).data;

    return this.rgbToHex(pixel[0], pixel[1], pixel[2]);
  }

  /**
   * Extracts color from canvas at mouse coordinates (convenience method)
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {MouseEvent} event - Mouse event with coordinates
   * @param {HTMLCanvasElement} canvas - Canvas element for bounds
   * @returns {string} HEX color at mouse position
   */
  getColorAtMouse(ctx, event, canvas) {
    const rect = canvas.getBoundingClientRect();
    return this.getCurrentColor(
      ctx, 
      [event.clientX, event.clientY], 
      [rect.left, rect.top]
    );
  }

  // ---------- GAMUT AND QUALITY CHECKING ----------

  /**
   * Checks if color is within specific gamut using the mode system
   * @param {string|Object} color - Color to check
   * @param {string} gamut - Gamut to check ('rgb', 'p3', 'rec2020')
   * @returns {boolean} True if color is in gamut
   */
  isInGamut(color, gamut = 'rgb') {
    try {
      const prepared = prepare(color);
      if (!prepared) return false;
      
      // Normalize gamut names for compatibility
      const normalizedGamut = this.normalizeGamutName(gamut);
      
      // For srgb/rgb gamut, we can check directly
      if (normalizedGamut === 'rgb') {
        const rgb = this.toRgb(prepared);
        return rgb && rgb.r >= 0 && rgb.r <= 1 && rgb.g >= 0 && rgb.g <= 1 && rgb.b >= 0 && rgb.b <= 1;
      }
      
      // Check if the gamut checker is available
      const gamutChecker = inGamut(normalizedGamut);
      return gamutChecker(prepared);
    } catch (error) {
      console.warn('Failed to check gamut:', color, gamut, error);
      
      // Fallback: try manual gamut checking
      return this.fallbackGamutCheck(color, gamut);
    }
  }

  /**
   * Gets the widest supported gamut for a color
   * @param {string|Object} color - Color to analyze
   * @returns {string} Widest gamut ('rgb', 'p3', 'rec2020')
   */
  getWidestGamut(color) {
    try {
      // Check gamuts in order from widest to narrowest
      if (this.isInGamut(color, 'rec2020')) return 'rec2020';
      if (this.isInGamut(color, 'p3')) return 'p3';
      return 'rgb';
    } catch (error) {
      console.warn('Failed to determine widest gamut:', error);
      // Conservative fallback
      return 'rgb';
    }
  }

  /**
   * Clamps color to specific gamut using the mode system
   * @param {string|Object} color - Color to clamp
   * @param {string} targetGamut - Target gamut
   * @returns {Object|null} Clamped color object
   */
  clampToGamut(color, targetGamut = 'rgb') {
    try {
      const prepared = prepare(color);
      if (!prepared) return null;
      
      // Normalize gamut name
      const normalizedGamut = this.normalizeGamutName(targetGamut);
      
      // Convert to target gamut - the converters handle clamping automatically
      return this.convertTo(prepared, normalizedGamut);
    } catch (error) {
      console.warn('Failed to clamp to gamut:', color, targetGamut, error);
      
      // Fallback: try manual clamping
      return this.fallbackClampToGamut(color, targetGamut);
    }
  }

  // ---------- COLOR ANALYSIS AND UTILITIES ----------

  /**
   * Gets relative luminance of a color (WCAG standard)
   * @param {string|Object} color - Color to analyze
   * @returns {number} Relative luminance (0-1)
   */
  getRelativeLuminance(color) {
    try {
      const rgb = this.toRgb(color);
      if (!rgb) return 0;
      
      // Convert to linear RGB and calculate luminance
      const toLinear = (c) => {
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      };
      
      const r = toLinear(rgb.r);
      const g = toLinear(rgb.g);
      const b = toLinear(rgb.b);
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    } catch (error) {
      console.warn('Failed to calculate luminance:', color, error);
      return 0;
    }
  }

  /**
   * Calculates contrast ratio between two colors (WCAG standard)
   * @param {string|Object} color1 - First color
   * @param {string|Object} color2 - Second color
   * @returns {number} Contrast ratio (1-21)
   */
  getContrastRatio(color1, color2) {
    try {
      const lum1 = this.getRelativeLuminance(color1);
      const lum2 = this.getRelativeLuminance(color2);
      
      const lighter = Math.max(lum1, lum2);
      const darker = Math.min(lum1, lum2);
      
      return (lighter + 0.05) / (darker + 0.05);
    } catch (error) {
      console.warn('Failed to calculate contrast ratio:', color1, color2, error);
      return 1;
    }
  }

  /**
   * Checks if two colors meet WCAG contrast requirements
   * @param {string|Object} color1 - First color
   * @param {string|Object} color2 - Second color
   * @param {string} level - WCAG level ('AA', 'AAA')
   * @param {string} size - Text size ('normal', 'large')
   * @returns {boolean} True if contrast requirement is met
   */
  meetsContrastRequirement(color1, color2, level = 'AA', size = 'normal') {
    const ratio = this.getContrastRatio(color1, color2);
    
    const requirements = {
      'AA': { normal: 4.5, large: 3 },
      'AAA': { normal: 7, large: 4.5 }
    };
    
    const required = requirements[level]?.[size] || 4.5;
    return ratio >= required;
  }

  /**
   * Gets color temperature estimation (very rough approximation)
   * @param {string|Object} color - Color to analyze
   * @returns {number} Estimated temperature in Kelvin
   */
  getColorTemperature(color) {
    try {
      const rgb = this.toRgb(color);
      if (!rgb) return 6500; // Default daylight
      
      // Very rough approximation based on RGB ratios
      const { r, g, b } = rgb;
      
      if (b > r && b > g) {
        // Bluish - cool temperature
        return 6500 + (b - Math.max(r, g)) * 3000;
      } else if (r > b && r > g) {
        // Reddish - warm temperature
        return 6500 - (r - Math.max(g, b)) * 3000;
      }
      
      return 6500; // Neutral
    } catch (error) {
      console.warn('Failed to estimate color temperature:', color, error);
      return 6500;
    }
  }

  /**
   * Generates a harmonious color palette based on color theory
   * @param {string|Object} baseColor - Base color for palette generation
   * @param {string} harmony - Harmony type ('complementary', 'triadic', 'analogous', 'tetradic', 'monochromatic')
   * @param {number} count - Number of colors to generate
   * @returns {Array} Array of HEX color strings
   */
  generateHarmonyPalette(baseColor, harmony = 'complementary', count = 5) {
    try {
      const hsl = this.toHsl(baseColor);
      if (!hsl) return [];
      
      const { h = 0, s = 0.5, l = 0.5 } = hsl;
      const colors = [];
      
      switch (harmony.toLowerCase()) {
        case 'complementary':
          colors.push(this.colorToHex({ mode: 'hsl', h, s, l }));
          colors.push(this.colorToHex({ mode: 'hsl', h: (h + 180) % 360, s, l }));
          break;
          
        case 'triadic':
          colors.push(this.colorToHex({ mode: 'hsl', h, s, l }));
          colors.push(this.colorToHex({ mode: 'hsl', h: (h + 120) % 360, s, l }));
          colors.push(this.colorToHex({ mode: 'hsl', h: (h + 240) % 360, s, l }));
          break;
          
        case 'analogous':
          for (let i = 0; i < count; i++) {
            const offset = (i - Math.floor(count / 2)) * 30;
            colors.push(this.colorToHex({ mode: 'hsl', h: (h + offset + 360) % 360, s, l }));
          }
          break;
          
        case 'tetradic':
          colors.push(this.colorToHex({ mode: 'hsl', h, s, l }));
          colors.push(this.colorToHex({ mode: 'hsl', h: (h + 90) % 360, s, l }));
          colors.push(this.colorToHex({ mode: 'hsl', h: (h + 180) % 360, s, l }));
          colors.push(this.colorToHex({ mode: 'hsl', h: (h + 270) % 360, s, l }));
          break;
          
        case 'monochromatic':
          for (let i = 0; i < count; i++) {
            const lightness = Math.max(0.1, Math.min(0.9, l + (i - Math.floor(count / 2)) * 0.15));
            colors.push(this.colorToHex({ mode: 'hsl', h, s, l: lightness }));
          }
          break;
      }
      
      return colors.filter(Boolean).slice(0, count);
    } catch (error) {
      console.warn('Failed to generate harmony palette:', baseColor, harmony, error);
      return [];
    }
  }

  // ---------- VALIDATION AND TRANSFORMATION ----------
  
  /**
   * Validates if a string is a valid HEX color (3, 4, 6, or 8 characters)
   * Supports RGB, RGBA, RRGGBB, and RRGGBBAA formats with optional # prefix
   * @param {string} value - Color string to validate
   * @returns {boolean} True if valid HEX color
   */
  isValidHex(value) {
    if (!value) return false;
    return /^#?(?:[0-9A-Fa-f]{3}|[0-9A-Fa-f]{4}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value.trim());
  }

  /**
   * Normalizes HEX color string with proper formatting
   * - Removes multiple # and trims
   * - Expands 3-char hex to 6-char hex (e.g., "F00" -> "FF0000")  
   * - Expands 4-char hex to 8-char hex (e.g., "F00A" -> "FF0000AA")
   * - Returns uppercase format with single #
   * @param {string} value - Color string to normalize
   * @returns {string} Normalized HEX color
   */
  normalizeHex(value) {
    if (!value) return '#000000';
    // Remove multiple # and trim
    let hex = value.trim().replace(/^#+/, '').toUpperCase();
    
    // Expand short formats to full formats
    if (hex.length === 3) {
      // RGB -> RRGGBB (e.g., "F00" -> "FF0000")
      hex = hex.split('').map(c => c + c).join('');
    } else if (hex.length === 4) {
      // RGBA -> RRGGBBAA (e.g., "F00A" -> "FF0000AA")
      hex = hex.split('').map(c => c + c).join('');
    }
    
    return `#${hex}`;
  }

  /**
   * Auto-formats HEX input field with proper # prefix and cleanup
   * @param {HTMLInputElement} input - Input element to format
   */
  autoFormatHexInput(input) {
    if (!input) return;
    let value = input.value.trim();
    
    // Auto-add # if missing
    if (value && !value.startsWith('#')) {
      value = '#' + value;
    }
    
    // Remove duplicate # at the beginning
    value = value.replace(/^#+/, '#');
    
    // Update input value if changed
    if (input.value !== value) {
      input.value = value;
    }
  }

  // ---------- PALETTE MANAGEMENT ----------

  /**
   * Gets current color palette from store
   * @returns {Object} Color palette with defaults and custom arrays
   */
  getColorPalette() {
    const { colorPalette } = store.getState();
    return {
      defaults: colorPalette?.defaults || [],
      custom: colorPalette?.custom || []
    };
  }

  /**
   * Gets combined palette (defaults + custom) for display
   * @param {number} maxColors - Maximum colors to return
   * @returns {Array} Combined color array
   */
  getCombinedPalette(maxColors = 21) {
    const { defaults, custom } = this.getColorPalette();
    return [...defaults, ...custom].slice(0, maxColors);
  }

  /**
   * Adds a color to custom palette
   * @param {string} hexColor - Normalized HEX color to add
   * @param {number|null} slotIndex - Specific slot to replace, or null to append
   * @returns {boolean} True if color was added successfully
   */
  addCustomColor(hexColor, slotIndex = null) {
    if (!this.isValidHex(hexColor)) return false;
    
    const normalizedHex = this.normalizeHex(hexColor);
    const { custom } = this.getColorPalette();
    const current = [...custom];
    
    if (slotIndex !== null && slotIndex >= 0 && slotIndex < 7) {
      // Replace specific slot
      current[slotIndex] = normalizedHex;
    } else if (current.length < 7) {
      // Add to available slot
      current.push(normalizedHex);
    } else {
      // Palette full, cannot add
      return false;
    }
    
    store.setState({ colorPalette: { custom: current } });
    return true;
  }

  /**
   * Removes a color from custom palette by index
   * @param {number} index - Index of color to remove
   * @returns {boolean} True if color was removed successfully
   */
  removeCustomColor(index) {
    const { custom } = this.getColorPalette();
    if (index >= 0 && index < custom.length) {
      const current = [...custom];
      current.splice(index, 1);
      store.setState({ colorPalette: { custom: current } });
      return true;
    }
    return false;
  }

  /**
   * Clears all custom colors, keeping defaults intact
   */
  resetCustomColors() {
    store.setState({ colorPalette: { custom: [] } });
  }

  /**
   * Checks if a color already exists in the palette
   * @param {string} hexColor - HEX color to check
   * @returns {boolean} True if color exists
   */
  colorExists(hexColor) {
    const normalizedHex = this.normalizeHex(hexColor);
    const combined = this.getCombinedPalette();
    return combined.includes(normalizedHex);
  }

  /**
   * Gets available slots count in custom palette
   * @returns {number} Number of available slots (0-7)
   */
  getAvailableSlots() {
    const { custom } = this.getColorPalette();
    return Math.max(0, 7 - custom.length);
  }

  // ---------- UI RENDERING ----------

  /**
   * Creates a color swatch button element
   * @param {string} hex - HEX color for the swatch
   * @param {Object} options - Additional options for the swatch
   * @returns {HTMLButtonElement} Swatch button element
   */
  createColorSwatch(hex, options = {}) {
    const {
      className = 'color-swatch',
      dataIndex = null,
      showActions = false,
      isSlot = false
    } = options;

    // Use a div as the swatch container to avoid nesting buttons inside buttons
    const swatch = document.createElement('div');
    swatch.setAttribute('role', 'button');
    swatch.tabIndex = 0;
    swatch.className = className;
    
    if (dataIndex !== null) {
      swatch.setAttribute('data-index', String(dataIndex));
    }

    if (isSlot) {
      swatch.classList.add('is-slot');
      swatch.textContent = '+';
    } else {
      // Check if color has alpha (8 or 9 characters: #RRGGBBAA)
      const hasAlpha = hex.length === 9 && hex.startsWith('#');
      if (hasAlpha) {
        // Extract alpha value from hex
        const alphaHex = hex.slice(7, 9);
        const alphaValue = parseInt(alphaHex, 16) / 255;
        
        if (alphaValue < 1) {
          // Color has transparency - add checkerboard background
          swatch.style.background = `
            repeating-conic-gradient(#c0c0c0 0% 25%, transparent 0% 50%) 50% / 6px 6px,
            ${hex}
          `;
        } else {
          swatch.style.background = hex;
        }
      } else {
        swatch.style.background = hex;
      }
      
      swatch.setAttribute('aria-label', `Color ${hex}`);
      swatch.setAttribute('data-color', hex);

      if (showActions) {
        const actions = document.createElement('div');
        actions.className = 'swatch-actions';
        actions.innerHTML = `
          <button class="swatch-action edit" type="button" data-action="edit" aria-label="Editar" title="Editar"></button>
          <button class="swatch-action remove" type="button" data-action="remove" aria-label="Eliminar" title="Eliminar"></button>
        `;
        swatch.appendChild(actions);
      }
    }

    return swatch;
  }

  /**
   * Renders the main color popover grid
   * @param {HTMLElement} colorGrid - Grid container element
   * @param {HTMLElement} colorCount - Count display element
   */
  renderPopoverGrid(colorGrid, colorCount) {
    if (!colorGrid) return;
    
    const combined = this.getCombinedPalette(21);
    colorGrid.innerHTML = '';
    
    combined.forEach((hex) => {
      const swatch = this.createColorSwatch(hex);
      colorGrid.appendChild(swatch);
    });
    
    if (colorCount) {
      colorCount.textContent = `${combined.length} colores`;
    }
  }

  /**
   * Renders the default colors grid in modal
   * @param {HTMLElement} modalGrid - Modal grid container
   */
  renderDefaultColorsGrid(modalGrid) {
    if (!modalGrid) return;
    
    const { defaults } = this.getColorPalette();
    modalGrid.innerHTML = '';
    
    defaults.slice(0, 14).forEach((hex) => {
      const swatch = this.createColorSwatch(hex);
      modalGrid.appendChild(swatch);
    });
  }

  /**
   * Renders the custom colors grid with slots in modal
   * @param {HTMLElement} modalGrid - Modal grid container
   */
  renderCustomColorsGrid(modalGrid) {
    if (!modalGrid) return;
    
    const { custom } = this.getColorPalette();
    modalGrid.innerHTML = '';
    
    const totalSlots = 7;
    for (let i = 0; i < totalSlots; i += 1) {
      const hex = custom[i];
      const swatch = this.createColorSwatch(hex || null, {
        className: 'color-swatch custom',
        dataIndex: i,
        showActions: !!hex,
        isSlot: !hex
      });
      modalGrid.appendChild(swatch);
    }
  }

  /**
   * Renders a color scheme based on lightness and chroma values
   * @param {CanvasRenderingContext2D} ctx - Canvas rendering context
   * @param {number} width - Width of the canvas
   * @param {number} height - Height of the canvas
   * @param {number} h - Hue value
   * @param {boolean} showP3 - Whether to show P3 color space
   * @param {boolean} showRec2020 - Whether to show Rec2020 color space
   */
  renderColorScheme(ctx, width, height, h, showP3, showRec2020) {
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const l = (height - y) / height;
        const c = (x / width) * 0.4;
        const oklchObj = { mode: 'oklch', l, c, h, alpha: 1 };
        const rgbObj = this.toRgb(oklchObj);

        if (rgbObj) {
          data[i] = Math.round(rgbObj.r * 255);
          data[i + 1] = Math.round(rgbObj.g * 255);
          data[i + 2] = Math.round(rgbObj.b * 255);
          data[i + 3] = 255;
        } else {
          data[i] = 0;
          data[i + 1] = 0;
          data[i + 2] = 0;
          data[i + 3] = 0;
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  build(l, c, h, alpha = 1) {
    return { alpha, c, h, l, mode: COLOR_FN }
  }

  // ---------- SLOT SELECTION ----------

  /**
   * Sets the selected slot index for editing
   * @param {number|null} index - Slot index or null to clear selection
   */
  setSelectedSlot(index) {
    this.selectedSlotIndex = index;
  }

  /**
   * Gets the current selected slot index
   * @returns {number|null} Selected slot index
   */
  getSelectedSlot() {
    return this.selectedSlotIndex;
  }

  /**
   * Clears slot selection
   */
  clearSlotSelection() {
    this.selectedSlotIndex = null;
  }

  // Implement build function
  build(l, c, h, alpha = 1) {
    return { mode: 'oklch', l, c, h, alpha };
  }

  // Implement formatLch function
  formatLch(color) {
    const { l, c, h, alpha } = color;
    return `oklch(${(l * 100).toFixed(2)}% ${c.toFixed(3)} ${h.toFixed(1)}${alpha !== undefined ? ` / ${alpha}` : ''})`;
  }

  // Implement getSpace function
  getSpace(color) {
    const rgb = this.toRgb(color);
    if (!rgb) return 'out';
    if (this.isInGamut(rgb, 'rec2020')) return 'rec2020';
    if (this.isInGamut(rgb, 'p3')) return 'p3';
    return 'rgb';
  }
  
  /**
   * Normalizes gamut/mode names for consistency
   * @param {string} gamut - Input gamut name
   * @returns {string} Normalized gamut name
   */
  normalizeGamutName(gamut) {
    const mapping = {
      'srgb': 'rgb',
      'display-p3': 'p3',
      'rec2020': 'rec2020',
      'rgb': 'rgb',
      'p3': 'p3',
      'hsl': 'hsl',
      'oklch': 'oklch',
      'lch': 'lch',
      'lrgb': 'lrgb'
    };
    
    return mapping[gamut?.toLowerCase()] || 'rgb'; // Default to 'rgb' for unknown modes
  }
  
  /**
   * Fallback gamut checking when main system fails
   * @param {Object} color - Color to check
   * @param {string} gamut - Target gamut
   * @returns {boolean} Whether color is in gamut
   */
  fallbackGamutCheck(color, gamut) {
    try {
      // Convert to RGB first
      const rgb = this.toRgb(color);
      if (!rgb) return false;
      
      // Simple range checking for different gamuts
      const { r, g, b } = rgb;
      
      // All colors should be in basic RGB range
      if (r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1) {
        return false;
      }
      
      switch (gamut?.toLowerCase()) {
        case 'srgb':
        case 'rgb':
          // Standard sRGB range check
          return true; // If we got here, it's within 0-1 range which is sRGB
          
        case 'p3':
        case 'display-p3':
          // P3 has wider gamut, so most sRGB colors should fit
          // This is a simplified check - in reality P3 gamut is more complex
          return true;
          
        case 'rec2020':
          // Rec2020 has the widest gamut
          return true;
          
        default:
          return true; // Conservative fallback
      }
    } catch (error) {
      console.warn('Fallback gamut check failed:', error);
      return true; // Very conservative fallback
    }
  }
  
  /**
   * Fallback color clamping when main system fails
   * @param {Object} color - Color to clamp
   * @param {string} targetGamut - Target gamut
   * @returns {Object|null} Clamped color
   */
  fallbackClampToGamut(color, targetGamut) {
    try {
      // For fallback, just ensure RGB values are in 0-1 range
      const rgb = this.toRgb(color);
      if (!rgb) return null;
      
      return {
        mode: 'rgb',
        r: Math.max(0, Math.min(1, rgb.r)),
        g: Math.max(0, Math.min(1, rgb.g)),
        b: Math.max(0, Math.min(1, rgb.b)),
        alpha: rgb.alpha || 1
      };
    } catch (error) {
      console.warn('Fallback clamp failed:', error);
      return null;
    }
  }
  
  /**
   * Fallback conversion for P3 when main system fails
   * @param {Object} color - Color to convert
   * @returns {Object|null} Converted color
   */
  fallbackConvertToP3(color) {
    try {
      // For fallback, convert to RGB and assume it's displayable in P3
      const rgb = this.toRgb(color);
      if (!rgb) return null;
      
      return {
        mode: 'rgb', // Return as RGB since P3 conversion failed
        r: rgb.r,
        g: rgb.g,
        b: rgb.b,
        alpha: rgb.alpha || 1
      };
    } catch (error) {
      console.warn('Fallback P3 conversion failed:', error);
      return null;
    }
  }
  
  /**
   * General fallback conversion
   * @param {Object} color - Color to convert
   * @param {string} targetMode - Target mode
   * @returns {Object|null} Converted color
   */
  fallbackConvertTo(color, targetMode) {
    try {
      // Try to convert through RGB as intermediary
      const rgb = this.toRgb(color);
      if (!rgb) return null;
      
      // Return RGB for any unknown target mode
      return {
        mode: 'rgb',
        r: rgb.r,
        g: rgb.g,
        b: rgb.b,
        alpha: rgb.alpha || 1
      };
    } catch (error) {
      console.warn('Fallback conversion failed:', error);
      return null;
    }
  }
}

export default ColorManager;