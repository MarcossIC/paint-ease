import ColorManager from '../domain/colorManager.js';
import { store } from '../lib/appState.js';
import { isP3Supported, getRecommendedColorSpace, isGamutSupported, getAvailableGamuts } from '../utils/supports.js';
import Emitter from '../domain/emitter.js';
import { addEventListener, $FROM } from '../utils/utils.js';

/**
 * OKLCHColorPicker - Advanced OKLCH Color Picker Modal with 2D Visualizations
 * Features precise OKLCH color space representations with interactive canvas graphics
 * Usage: <oklch-color-picker></oklch-color-picker>
 */
export class OKLCHColorPicker extends HTMLElement {
  constructor() {
    super();

    // Component state
    this.isOpen = false;
    this.currentColor = '#FF0000';
    this.oklch = { l: 0.65, c: 0.2, h: 0, a: 1 }; // OKLCH values
    this.isDragging = false;
    this._initialized = false;

    // Canvas references
    this.canvases = {};
    this.contexts = {};

    // Rendering optimization
    this._renderCache = new Map();
    this._lastRenderParams = {};
    this._renderScheduled = false;
    this._renderRequestId = null;
    this._baseGraphData = {};

    // Event management system
    this.eventEmitters = {
      ui: new Emitter(),
      canvas: new Emitter(),
      keyboard: new Emitter()
    };

    // Use ColorManager for validations and normalizations
    this.colorManager = new ColorManager();

    // Gamut verification system
    this.gamutSettings = {
      autoClamp: true,
      preferredGamut: 'auto', // 'auto', 'srgb', 'p3', 'rec2020'
      showGamutWarnings: true,
      gamutMappingMethod: 'perceptual' // 'perceptual', 'chroma', 'lightness'
    };

    // Track current gamut state
    this.currentGamutState = {
      isInGamut: true,
      actualGamut: 'srgb',
      targetGamut: getRecommendedColorSpace() === 'display-p3' ? 'p3' : 'srgb',
      needsMapping: false
    };

    // Shadow DOM for encapsulation
    this.attachShadow({ mode: 'open' });
  }

  // Define which attributes trigger updates
  static get observedAttributes() {
    return ['open', 'initial-color', 'color-space'];
  }

  connectedCallback() {
    // Initialize once when connected to the DOM
    if (this._initialized) return;
    this._initialized = true;
    this.render();
    this.bindEvents();
    this.initializeCanvases();
    this.initializeGamutSystem();
    this.setColor(this.currentColor);
  }

  disconnectedCallback() {
    // Clean up all event listeners when component is removed from DOM
    this.clearEventListeners();
  }

  /**
   * Initializes the gamut verification system
   */
  initializeGamutSystem() {
    try {
      // Update target gamut based on current device capabilities
      this.currentGamutState.targetGamut = this.determineTargetGamut();

      // Validate that the target gamut is actually supported
      const availableGamuts = getAvailableGamuts();
      if (!availableGamuts.includes(this.currentGamutState.targetGamut)) {
        console.warn(`Target gamut ${this.currentGamutState.targetGamut} not supported, falling back to sRGB`);
        this.currentGamutState.targetGamut = 'srgb';
        this.gamutSettings.preferredGamut = 'srgb';
      }

      // Update UI to reflect initial state
      this.updateGamutUI();

      // Log gamut capabilities for debugging
      console.log('OKLCH Color Picker - Gamut System Initialized:', {
        deviceSupportsP3: isP3Supported(),
        recommendedColorSpace: getRecommendedColorSpace(),
        availableGamuts: availableGamuts,
        targetGamut: this.currentGamutState.targetGamut,
        autoClamp: this.gamutSettings.autoClamp,
        mappingMethod: this.gamutSettings.gamutMappingMethod
      });
    } catch (error) {
      console.error('Failed to initialize gamut system:', error);

      // Safe fallback initialization
      this.currentGamutState.targetGamut = 'srgb';
      this.gamutSettings.preferredGamut = 'srgb';
      this.gamutSettings.autoClamp = false; // Disable auto-clamp if system is unstable
    }
  }

  // Handle attribute changes
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'open':
        if (newValue !== null) {
          this.show();
        } else {
          this.hide();
        }
        break;
      case 'initial-color':
        if (newValue && this.colorManager.isValidHex(newValue)) {
          this.setColor(this.colorManager.normalizeHex(newValue));
        }
        break;
      case 'color-space':
        if (['srgb', 'display-p3'].includes(newValue)) {
          // Update target gamut when color space changes
          this.currentGamutState.targetGamut = newValue === 'display-p3' ? 'p3' : 'srgb';
          this.updateFromOklch(); // Re-evaluate with new color space
        }
        break;
    }
  }

  render() {
    const colorSpace = getRecommendedColorSpace();
    const supportsP3 = isP3Supported();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.6);
          z-index: 10000;
          display: none;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(2px);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        :host([open]) {
          display: flex;
        }

        .modal {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
          width: min(95vw, 800px);
          max-height: 90vh;
          overflow-y: auto;
          animation: modalAppear 0.3s ease-out;
          position: relative;
        }

        @keyframes modalAppear {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .gamut-badge {
          background: linear-gradient(45deg, #10b981, #059669);
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .gamut-badge.srgb {
          background: linear-gradient(45deg, #6b7280, #4b5563);
        }
        
        .gamut-badge.warning {
          background: linear-gradient(45deg, #f59e0b, #d97706);
          animation: pulse 2s infinite;
        }
        
        .gamut-badge.error {
          background: linear-gradient(45deg, #ef4444, #dc2626);
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .gamut-warning {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
          display: none;
        }
        
        .gamut-warning.show {
          display: block;
        }
        
        .gamut-warning-icon {
          color: #f59e0b;
          font-weight: 600;
          margin-right: 8px;
        }
        
        .gamut-warning-text {
          font-size: 13px;
          color: #92400e;
          line-height: 1.4;
        }
        
        .gamut-controls {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        
        .gamut-btn {
          padding: 4px 8px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
          background: white;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        
        .gamut-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }
        
        .gamut-btn.primary {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .gamut-btn.primary:hover {
          background: #2563eb;
          border-color: #2563eb;
        }

        .close-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #6b7280;
          padding: 8px;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: all 0.15s ease;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .color-preview {
          display: flex;
          gap: 20px;
          align-items: center;
          padding: 20px;
          background: #f9fafb;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .color-swatches {
          display: flex;
          position: relative;
        }

        .color-swatch {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          position: relative;
          overflow: hidden;
          background: 
            repeating-conic-gradient(#c0c0c0 0% 25%, transparent 0% 50%) 50% / 8px 8px;
        }

        .color-swatch::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 10px;
          background-color: var(--swatch-color, #ff0000);
        }

        .color-swatch.fallback {
          width: 48px;
          height: 48px;
          opacity: 0.8;
          background: 
            repeating-conic-gradient(#c0c0c0 0% 25%, transparent 0% 50%) 50% / 6px 6px;
        }

        .color-swatch.fallback::before {
          background-color: var(--fallback-swatch-color, #ff0000);
        }

        .gamut-fallback {
          background-color: transparent;
          padding: 8px;
          visibility: hidden;
          opacity: 0;
          height: 0;
          width: 0;
        }
        .gamut-fallback.show {
          display: flex;
          width: auto;
          height: auto;
          visibility: visible;
          opacity: 1;
        }

        .fallback-label {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 72px;
          height: 72px;
          font-size: 10px;
          color: oklch(0.25 0.05 262.58);
          font-weight: bold;
          text-align: center;
          line-height: 16px;
          border-radius: 8px;
          border: 1px dashed rgba(137, 120, 151, .4);
        }

        .color-swatch.fallback {
          width: 72px;
          height: 72px;
          border-radius: 8px;
          border: 2px solid white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          position: relative;
          overflow: hidden;
          position: relative;

          &::before {
            content: 'fallback';
            position: absolute;
            background: rgb(24 22 22 / 85%);
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 10.5px;
            line-height: 13px;
            color: #fff;
            padding: 4px 6px;
            border: none;
            border-radius: 6px;
            font-stretch: 112.5%;
            font-family: monospace;
            width: fit-content;
            margin-top: auto;
            text-align: end;
            height: fit-content;
          }
        }

        .color-swatches:has(.gamut-fallback.show)  .color-swatch:not(.fallback) {
          display: none;
        }

        .color-info {
          flex: 1;
        }

        .color-hex {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .color-oklch {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
          font-size: 14px;
          color: #6b7280;
        }

        .copy-btn {
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          color: #374151;
          transition: all 0.15s ease;
        }

        .copy-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .visualization-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        .visualization-item {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .visualization-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .label-text {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .label-value {
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
          font-size: 12px;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          color: #6b7280;
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
          min-width: 60px;
          text-align: center;
        }

        .label-value:hover {
          background: #e5e7eb;
          border-color: #d1d5db;
        }

        .label-value:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          background: white;
        }

        .canvas-container {
          position: relative;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
          background: #f9fafb;
        }

        .visualization-canvas {
          width: 100%;
          height: 120px;
          cursor: crosshair;
          display: block;
        }

        .slider-container {
          position: relative;
          height: 20px;
          background: #f3f4f6;
          border-radius: 10px;
          overflow: hidden;
        }

        .slider {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
          margin: 0;
        }

        .slider-track {
          position: absolute;
          inset: 0;
          border-radius: 10px;
        }

        .slider-thumb {
          position: absolute;
          top: 50%;
          width: 16px;
          height: 16px;
          background: white;
          border: 2px solid #374151;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          pointer-events: none;
        }

        .control-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
        }

        .control-label {
          font-weight: 600;
          color: #374151;
          font-size: 14px;
        }

        .control-input {
          width: 60px;
          padding: 6px 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
          font-size: 12px;
          text-align: center;
          background: white;
        }

        .control-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .hex-label {
          font-weight: 600;
          color: #374151;
          min-width: 45px;
        }

        .hex-input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
          font-size: 14px;
          text-transform: uppercase;
          background: white;
        }

        .hex-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 14px;
          border: none;
        }

        .btn-cancel {
          background: white;
          color: #374151;
          border: 1px solid #d1d5db;
        }

        .btn-cancel:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .btn-confirm {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }

        .btn-confirm:hover {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .modal {
            animation: none;
          }
          .btn-confirm:hover {
            transform: none;
          }
        }
      </style>

      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="title">
        <button class="close-btn" aria-label="Cerrar selector de color">&times;</button>

        <div class="color-preview">
          <div class="color-swatches">
            <div class="gamut-fallback">
              <span class="fallback fallback-label">No disponible</span>
              <div class="color-swatch fallback"></div>
            </div>
            <div class="color-swatch"></div>
          </div>
          <div class="color-info">
          <div class="color-oklch">L: 0.6500 C: 0.200 H: 0° A: 1.0000</div>
            <div class="color-hex">#FF0000</div>
          </div>
          <button class="copy-btn">Copy</button>
        </div>

        <div class="visualization-grid">
          <div class="visualization-item">
            <div class="visualization-label">
              <span class="label-text">Lightness</span>
              <input type="text" class="label-value" id="lightness-value" value="L: 0.6500" readonly>
            </div>
            <div class="canvas-container">
              <canvas class="visualization-canvas" id="lightness-canvas" width="200" height="120"></canvas>
            </div>
            <div class="slider-container">
              <div class="slider-track"></div>
              <input type="range" class="slider" id="lightness-slider" min="0" max="1" step="0.01" value="0.65">
              <div class="slider-thumb"></div>
            </div>
          </div>

          <div class="visualization-item">
            <div class="visualization-label">
              <span class="label-text">Chroma</span>
              <input type="text" class="label-value" id="chroma-value" value="C: 0.200" readonly>
            </div>
            <div class="canvas-container">
              <canvas class="visualization-canvas" id="chroma-canvas" width="300" height="120"></canvas>
            </div>
            <div class="slider-container">
              <div class="slider-track"></div>
              <input type="range" class="slider" id="chroma-slider" min="0" max="0.4" step="0.001" value="0.2">
              <div class="slider-thumb"></div>
            </div>
          </div>

          <div class="visualization-item">
            <div class="visualization-label">
              <span class="label-text">Hue</span>
              <input type="text" class="label-value" id="hue-value" value="H: 0°" readonly>
            </div>
            <div class="canvas-container">
              <canvas class="visualization-canvas" id="hue-canvas" width="300" height="120"></canvas>
            </div>
            <div class="slider-container">
              <div class="slider-track"></div>
              <input type="range" class="slider" id="hue-slider" min="0" max="360" step="0.01" value="0">
              <div class="slider-thumb"></div>
            </div>
          </div>

          <div class="visualization-item">
            <div class="visualization-label">
              <span class="label-text">Alpha</span>
              <input type="text" class="label-value" id="alpha-value" value="A: 1.0000" readonly>
            </div>
            <div class="canvas-container">
              <canvas class="visualization-canvas" id="alpha-canvas" width="300" height="120"></canvas>
            </div>
            <div class="slider-container">
              <div class="slider-track"></div>
              <input type="range" class="slider" id="alpha-slider" min="0" max="1" step="0.01" value="1">
              <div class="slider-thumb"></div>
            </div>
          </div>
        </div>

        <div class="buttons">
          <button class="btn btn-cancel">Cancelar</button>
          <button class="btn btn-confirm">Confirmar</button>
        </div>
      </div>
    `;

    this.cacheReferences();
  }

  /**
   * Private selector function using $FROM with this.shadowRoot
   * @param {string} selector - CSS selector string
   * @returns {Element | null} - Selected element or null
   */
  #select(selector) {
    return $FROM(this.shadowRoot, selector);
  }

  cacheReferences() {
    // Cache DOM references
    this.modal = this.#select('.modal');
    this.colorSwatch = this.#select('.color-swatch:not(.fallback)');
    this.fallbackSwatch = this.#select('.color-swatch.fallback');
    this.gamutFallback = this.#select('.gamut-fallback');
    this.colorHex = this.#select('.color-hex');
    this.colorOklch = this.#select('.color-oklch');
    // this.hexInput = this.#select('#hex-input');

    // Gamut UI elements (mantenemos solo el badge)
    this.gamutBadge = this.#select('#gamut-badge');

    // Canvas elements
    this.canvases = {
      lightness: this.#select('#lightness-canvas'),
      chroma: this.#select('#chroma-canvas'),
      hue: this.#select('#hue-canvas'),
      alpha: this.#select('#alpha-canvas')
    };

    // Sliders
    this.sliders = {
      lightness: this.#select('#lightness-slider'),
      chroma: this.#select('#chroma-slider'),
      hue: this.#select('#hue-slider'),
      alpha: this.#select('#alpha-slider')
    };

    // Inputs
    this.inputs = {
      l: this.#select('#l-input'),
      c: this.#select('#c-input'),
      h: this.#select('#h-input'),
      a: this.#select('#a-input')
    };

    // Value displays (now editable inputs)
    this.valueDisplays = {
      lightness: this.#select('#lightness-value'),
      chroma: this.#select('#chroma-value'),
      hue: this.#select('#hue-value'),
      alpha: this.#select('#alpha-value')
    };
  }

  initializeCanvases() {
    const colorSpace = getRecommendedColorSpace();

    // Initialize canvas contexts
    Object.keys(this.canvases).forEach(key => {
      if (this.canvases[key]) {
        this.contexts[key] = this.canvases[key].getContext('2d', { colorSpace, alpha: true });
      }
    });

    this.renderAllVisualizations();
  }

  bindEvents() {
    // Clear any existing event listeners
    this.clearEventListeners();

    // Button events using UI emitter
    this.setupUIEvents();
    
    // Canvas interaction events using canvas emitter
    this.setupCanvasEvents();
    
    // Keyboard events using keyboard emitter
    this.setupKeyboardEvents();
  }

  setupUIEvents() {
    const closeBtn = this.#select('.close-btn');
    const cancelBtn = this.#select('.btn-cancel');
    const confirmBtn = this.#select('.btn-confirm');
    const copyBtn = this.#select('.copy-btn');

    // Register UI event listeners with the emitter for cleanup management
    this.eventEmitters.ui.on(
      addEventListener(closeBtn, 'click', () => this.cancel()),
      addEventListener(cancelBtn, 'click', () => this.cancel()),
      addEventListener(confirmBtn, 'click', () => this.confirm()),
      addEventListener(copyBtn, 'click', () => this.copyColor()),
      
      // Close on overlay click
      addEventListener(this, 'click', (e) => {
        if (e.target === this) {
          this.cancel();
        }
      }),

      // Prevent clicks inside the modal from propagating
      addEventListener(this.modal, 'click', (e) => {
        e.stopPropagation();
      })
    );

    // Slider events
    Object.keys(this.sliders).forEach(key => {
      if (this.sliders[key]) {
        this.eventEmitters.ui.on(
          addEventListener(this.sliders[key], 'input', (e) => this.handleSliderChange(e, key)),
          addEventListener(this.sliders[key], 'input', () => this.updateSliderThumb(key))
        );
      }
    });

    // Input events
    Object.keys(this.inputs).forEach(key => {
      if (this.inputs[key]) {
        this.eventEmitters.ui.on(
          addEventListener(this.inputs[key], 'input', (e) => this.handleInputChange(e, key))
        );
      }
    });

    // Value display inputs (label-value editables)
    Object.keys(this.valueDisplays).forEach(key => {
      const input = this.valueDisplays[key];
      if (input) {
        this.eventEmitters.ui.on(
          // Make editable on click
          addEventListener(input, 'click', () => {
            input.removeAttribute('readonly');
            input.select();
          }),

          // Handle input changes
          addEventListener(input, 'input', (e) => this.handleValueDisplayInput(e, key)),

          // Handle Enter and Escape keys
          addEventListener(input, 'keydown', (e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              input.blur();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              // Restore original value and make readonly again
              this.updateValueDisplay(key);
              input.setAttribute('readonly', '');
              input.blur();
            }
          }),

          // Make readonly again on blur
          addEventListener(input, 'blur', () => {
            input.setAttribute('readonly', '');
          })
        );
      }
    });
  }

  setupCanvasEvents() {
    // Canvas interactions using canvas emitter
    Object.keys(this.canvases).forEach(key => {
      if (this.canvases[key]) {
        this.eventEmitters.canvas.on(
          addEventListener(this.canvases[key], 'click', (e) => this.handleCanvasClick(e, key)),
          addEventListener(this.canvases[key], 'pointerdown', (e) => this.handleCanvasPointerDown(e, key))
        );
      }
    });
  }

  setupKeyboardEvents() {
    // Keyboard events using keyboard emitter
    this.eventEmitters.keyboard.on(
      addEventListener(this, 'keydown', this.handleKeydown.bind(this))
    );
  }

  clearEventListeners() {
    // Clear all event listeners using emitters
    if (this.eventEmitters) {
      Object.values(this.eventEmitters).forEach(emitter => {
        emitter.clear();
      });
    }
  }

  /**
   * Reinitialize event listeners - useful when DOM elements are recreated
   */
  reinitializeEvents() {
    this.clearEventListeners();
    this.cacheReferences();
    this.bindEvents();
  }

  renderAllVisualizations() {
    // Debounce rendering during drag operations
    if (this.isDragging) {
      if (this._renderRequestId) {
        cancelAnimationFrame(this._renderRequestId);
      }
      this._renderRequestId = requestAnimationFrame(() => {
        this._renderAllVisualizationsImmediate();
      });
    } else {
      this._renderAllVisualizationsImmediate();
    }
  }

  _renderAllVisualizationsImmediate() {
    // Check what actually needs to be re-rendered
    const currentParams = {
      l: this.oklch.l,
      c: this.oklch.c,
      h: this.oklch.h,
      a: this.oklch.a
    };

    const lastParams = this._lastRenderParams;

    // Only re-render graphs that are affected by the changes
    if (!lastParams.h || lastParams.h !== currentParams.h) {
      // Hue changed - affects lightness and chroma graphs
      this.renderLightnessGraph();
      this.renderChromaGraph();
    }
    
    if (!lastParams.l || lastParams.l !== currentParams.l) {
      // Lightness changed - affects chroma and hue graphs
      this.renderChromaGraph();
      this.renderHueGraph();
    }
    
    if (!lastParams.c || lastParams.c !== currentParams.c) {
      // Chroma changed - affects hue graph
      this.renderHueGraph();
    }

    // Alpha graph only needs update if alpha changed
    if (!lastParams.a || lastParams.a !== currentParams.a) {
      this.renderAlphaGraph();
    }

    // Always update indicators (they're fast)
    this._updateIndicators();

    this._lastRenderParams = { ...currentParams };
  }

  _updateIndicators() {
    // Redraw base graphs with indicators on top
    Object.keys(this.canvases).forEach(key => {
      const canvas = this.canvases[key];
      const ctx = this.contexts[key];
      if (!canvas || !ctx) return;

      // Restore base graph from stored ImageData
      if (this._baseGraphData[key]) {
        ctx.putImageData(this._baseGraphData[key], 0, 0);
      }
      
      // Draw indicator on top
      this._drawIndicatorForGraph(key, ctx, canvas);
    });
  }

  _drawIndicatorForGraph(graphType, ctx, canvas) {
    const width = canvas.width;
    const height = canvas.height;

    // Set indicator style
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.lineWidth = 2;

    switch (graphType) {
      case 'lightness':
        const lX = (this.oklch.c / 0.4) * width;
        const lY = (1 - this.oklch.l) * height;
        this._drawCrosshair(ctx, lX, lY, width, height);
        break;
        
      case 'chroma':
        const cX = (this.oklch.h / 360) * width;
        const cY = height - (this.oklch.c / 0.4) * height;
        this._drawCrosshair(ctx, cX, cY, width, height);
        break;
        
      case 'hue':
        const hX = (this.oklch.h / 360) * width;
        ctx.beginPath();
        ctx.moveTo(hX, 0);
        ctx.lineTo(hX, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(hX, height / 2, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        break;
        
      case 'alpha':
        const aX = this.oklch.a * width;
        ctx.beginPath();
        ctx.moveTo(aX, 0);
        ctx.lineTo(aX, height);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(aX, height / 2, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        break;
    }
  }

  _drawCrosshair(ctx, x, y, width, height) {
    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(Math.max(0, x - 10), y);
    ctx.lineTo(Math.min(width, x + 10), y);
    ctx.stroke();
    
    // Vertical line
    ctx.beginPath();
    ctx.moveTo(x, Math.max(0, y - 10));
    ctx.lineTo(x, Math.min(height, y + 10));
    ctx.stroke();
    
    // Center circle
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }

  renderLightnessGraph() {
    const canvas = this.canvases.lightness;
    const ctx = this.contexts.lightness;
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Use ImageData for better performance
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Draw lightness vs chroma graph with hue limitations
    // X axis: Chroma (0-0.4), Y axis: Lightness (1-0 from top to bottom)
    for (let x = 0; x < width; x++) {
      const chroma = (x / width) * 0.4;
      
      for (let y = 0; y < height; y++) {
        const lightness = 1 - (y / height); // Invert Y because 0 is at top
        const pixelIndex = (y * width + x) * 4;
        
        // Calculate maximum chroma for this lightness and current hue combination
        const maxChromaAtLH = this.calculateMaxChroma(lightness, this.oklch.h);
        
        // Only draw if this chroma is valid for this lightness/hue combination
        if (chroma <= maxChromaAtLH) {
          try {
            const oklchObj = {
              mode: 'oklch',
              l: lightness,
              c: chroma,
              h: this.oklch.h,
              alpha: 1
            };

            // Check if this color is in gamut
            const rgbObj = this.colorManager.toRgb(oklchObj);
            
            if (rgbObj && 
                rgbObj.r >= 0 && rgbObj.r <= 1 &&
                rgbObj.g >= 0 && rgbObj.g <= 1 &&
                rgbObj.b >= 0 && rgbObj.b <= 1) {
              
              data[pixelIndex] = Math.round(rgbObj.r * 255);     // R
              data[pixelIndex + 1] = Math.round(rgbObj.g * 255); // G
              data[pixelIndex + 2] = Math.round(rgbObj.b * 255); // B
              data[pixelIndex + 3] = 255; // A
            } else {
              // Try fallback conversion
              const [r, g, b] = this.oklchToRgb(lightness, chroma, this.oklch.h);
              
              if (r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1) {
                data[pixelIndex] = Math.round(r * 255);     // R
                data[pixelIndex + 1] = Math.round(g * 255); // G
                data[pixelIndex + 2] = Math.round(b * 255); // B
                data[pixelIndex + 3] = 255; // A
              }
              // If color is out of gamut, leave transparent (alpha = 0)
            }
          } catch (error) {
            // Skip invalid colors (leave transparent)
          }
        }
        // If chroma is too high for this L/H combination, leave transparent
      }
    }

    // Draw the ImageData to canvas
    ctx.putImageData(imageData, 0, 0);
    
    // Store base graph data for indicator rendering
    this._baseGraphData.lightness = ctx.getImageData(0, 0, width, height);

    // Add border only
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
  }

  renderChromaGraph() {
    const canvas = this.canvases.chroma;
    const ctx = this.contexts.chroma;
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Draw chroma vs hue graph with lightness limitations
    // X axis: Hue (0-360°), Y axis: Chroma (0-0.4 from bottom to top)
    // Only draw pixels where the color is valid in the OKLCH color space
    
    for (let x = 0; x < width; x++) {
      const hue = (x / width) * 360;
      
      for (let y = 0; y < height; y++) {
        const chroma = (y / height) * 0.4; // Y=0 is bottom (chroma=0), Y=height is top (chroma=0.4)
        
        // Calculate maximum chroma for current lightness and this hue combination
        const maxChromaAtLH = this.calculateMaxChroma(this.oklch.l, hue);
        
        // Only draw if this chroma is valid for this lightness/hue combination
        if (chroma <= maxChromaAtLH) {
          try {
            const oklchObj = {
              mode: 'oklch',
              l: this.oklch.l,
              c: chroma,
              h: hue,
              alpha: 1
            };

            // Check if this color is in gamut
            const rgbObj = this.colorManager.toRgb(oklchObj);
            
            if (rgbObj && 
                rgbObj.r >= 0 && rgbObj.r <= 1 &&
                rgbObj.g >= 0 && rgbObj.g <= 1 &&
                rgbObj.b >= 0 && rgbObj.b <= 1) {
              
              const r = Math.round(rgbObj.r * 255);
              const g = Math.round(rgbObj.g * 255);
              const b = Math.round(rgbObj.b * 255);
              ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
              ctx.fillRect(x, height - y - 1, 1, 1); // Flip Y to have chroma=0 at bottom
            } else {
              // Try fallback conversion
              const [r, g, b] = this.oklchToRgb(this.oklch.l, chroma, hue);
              
              if (r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1) {
                const rClamped = Math.round(r * 255);
                const gClamped = Math.round(g * 255);
                const bClamped = Math.round(b * 255);
                ctx.fillStyle = `rgb(${rClamped}, ${gClamped}, ${bClamped})`;
                ctx.fillRect(x, height - y - 1, 1, 1); // Flip Y to have chroma=0 at bottom
              }
              // If color is out of gamut, don't draw anything (leave transparent)
            }
          } catch (error) {
            // Skip invalid colors
          }
        }
        // If chroma is too high for this L/H combination, don't draw anything
      }
    }

    // Draw grid lines for better navigation
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Vertical lines every 60 degrees
    for (let i = 1; i < 6; i++) {
      const x = (i * 60 / 360) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines every 0.1 chroma
    for (let i = 1; i < 4; i++) {
      const y = height - (i * 0.1 / 0.4) * height; // Flip Y for chroma
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Store base graph data for indicator rendering
    this._baseGraphData.chroma = ctx.getImageData(0, 0, width, height);

    // Add border only
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
  }

  renderHueGraph() {
    const canvas = this.canvases.hue;
    const ctx = this.contexts.hue;
    
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);

    // Build image constrained by gamut: X = Hue, Y = Lightness, using current chroma
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    const chromaAtSelection = Math.min(Math.max(this.oklch.c, 0), 0.4);

    for (let x = 0; x < width; x++) {
      const hue = (x / width) * 360;
      for (let y = 0; y < height; y++) {
        const lightness = 1 - (y / height); // invert Y so top is L=1
        const idx = (y * width + x) * 4;

        // Allowed chroma for this (L, H)
        const maxChromaAtLH = this.calculateMaxChroma(lightness, hue);
        if (chromaAtSelection <= maxChromaAtLH) {
          try {
            const oklchObj = { mode: 'oklch', l: lightness, c: chromaAtSelection, h: hue, alpha: 1 };
            const rgbObj = this.colorManager.toRgb(oklchObj);
            if (rgbObj && rgbObj.r >= 0 && rgbObj.r <= 1 && rgbObj.g >= 0 && rgbObj.g <= 1 && rgbObj.b >= 0 && rgbObj.b <= 1) {
              data[idx] = Math.round(rgbObj.r * 255);
              data[idx + 1] = Math.round(rgbObj.g * 255);
              data[idx + 2] = Math.round(rgbObj.b * 255);
              data[idx + 3] = 255;
            } else {
              const [r, g, b] = this.oklchToRgb(lightness, chromaAtSelection, hue);
              if (r >= 0 && r <= 1 && g >= 0 && g <= 1 && b >= 0 && b <= 1) {
                data[idx] = Math.round(r * 255);
                data[idx + 1] = Math.round(g * 255);
                data[idx + 2] = Math.round(b * 255);
                data[idx + 3] = 255;
              }
            }
          } catch {
            // leave transparent
          }
        } else {
          // outside gamut for this L/H at chosen chroma → transparent
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);

    // Grid overlays
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    // Vertical lines (Hue) every 60°
    for (let i = 1; i < 6; i++) {
      const x = (i * 60 / 360) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    // Horizontal lines (Lightness)
    for (let i = 1; i < 5; i++) {
      const y = (i / 5) * height;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Store base graph data for indicator rendering
    this._baseGraphData.hue = ctx.getImageData(0, 0, width, height);

    // Add border
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, width, height);
  }

  renderAlphaGraph() {
    const canvas = this.canvases.alpha;
    const ctx = this.contexts.alpha;
    if (!canvas || !ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw checkerboard pattern
    const checkSize = 12;
    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#808080';
    for (let y = 0; y < height; y += checkSize) {
      for (let x = 0; x < width; x += checkSize) {
        if ((Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2) {
          ctx.fillRect(x, y, checkSize, checkSize);
        }
      }
    }

    // Draw alpha gradient using ColorManager
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    try {
      // Use ColorManager for better color conversion
      const oklchObj = {
        mode: 'oklch',
        l: this.oklch.l,
        c: this.oklch.c,
        h: this.oklch.h,
        alpha: 1
      };

      const rgbObj = this.colorManager.toRgb(oklchObj);
      if (rgbObj) {
        const rgbColor = `${Math.round(rgbObj.r * 255)}, ${Math.round(rgbObj.g * 255)}, ${Math.round(rgbObj.b * 255)}`;
        gradient.addColorStop(0, `rgba(${rgbColor}, 0)`);
        gradient.addColorStop(1, `rgba(${rgbColor}, 1)`);
      } else {
        // Fallback using manual conversion
        const [r, g, b] = this.oklchToRgb(this.oklch.l, this.oklch.c, this.oklch.h);
        const rgbColor = `${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}`;
        gradient.addColorStop(0, `rgba(${rgbColor}, 0)`);
        gradient.addColorStop(1, `rgba(${rgbColor}, 1)`);
      }
    } catch {
      // Fallback
      gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
      gradient.addColorStop(1, `rgba(0, 0, 0, 1)`);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Store base graph data for indicator rendering
    this._baseGraphData.alpha = ctx.getImageData(0, 0, width, height);
  }

  // Calculate maximum chroma for a given lightness and hue (with caching)
  calculateMaxChroma(lightness, hue) {
    // Create cache key with reduced precision for better hit rate
    const lKey = Math.round(lightness * 20) / 20; // Round to 0.05
    const hKey = Math.round(hue / 10) * 10; // Round to 10 degrees
    const cacheKey = `${lKey}_${hKey}`;
    
    if (this._renderCache.has(cacheKey)) {
      return this._renderCache.get(cacheKey);
    }

    try {
      // Use ColorManager to find maximum chroma
      // Try increasing chroma until we hit gamut boundary
      let maxChroma = 0;
      const step = 0.02; // Larger step for performance
      
      for (let c = 0; c <= 0.4; c += step) {
        const testColor = {
          mode: 'oklch',
          l: lightness,
          c: c,
          h: hue,
          alpha: 1
        };
        
        // Check if this color can be represented in RGB
        const rgbColor = this.colorManager.toRgb(testColor);
        if (rgbColor && 
            rgbColor.r >= 0 && rgbColor.r <= 1 &&
            rgbColor.g >= 0 && rgbColor.g <= 1 &&
            rgbColor.b >= 0 && rgbColor.b <= 1) {
          maxChroma = c;
        } else {
          break;
        }
      }
      
      const result = Math.min(maxChroma, 0.4);
      
      // Cache the result
      this._renderCache.set(cacheKey, result);
      
      // Limit cache size
      if (this._renderCache.size > 500) {
        const firstKey = this._renderCache.keys().next().value;
        this._renderCache.delete(firstKey);
      }
      
      return result;
    } catch (error) {
      // Fallback: simple triangular approximation
      const fallback = Math.min(lightness, 1 - lightness) * 0.4;
      this._renderCache.set(cacheKey, fallback);
      return fallback;
    }
  }

  // OKLCH to RGB conversion (simplified)
  // NOTE: This fallback method is kept for compatibility, but ColorManager's mode system is preferred
  oklchToRgb(l, c, h) {
    // Try using ColorManager first for more accurate conversion
    try {
      const oklchObj = { mode: 'oklch', l, c, h, alpha: 1 };
      const rgbObj = this.colorManager.toRgb(oklchObj);
      if (rgbObj) {
        return [rgbObj.r, rgbObj.g, rgbObj.b];
      }
    } catch (error) {
      console.warn('ColorManager conversion failed, using fallback:', error);
    }

    // Simplified OKLCH to RGB conversion (fallback)
    // This is a basic approximation - ColorManager provides better results
    const hRad = (h * Math.PI) / 180;
    const a = c * Math.cos(hRad);
    const b = c * Math.sin(hRad);

    // Simplified Lab to RGB (approximation)
    const y = (l + 0.16) / 1.16;
    const x = a / 500 + y;
    const z = y - b / 200;

    // XYZ to RGB (sRGB)
    const r = x * 3.2406 + y * -1.5372 + z * -0.4986;
    const g = x * -0.9689 + y * 1.8758 + z * 0.0415;
    const b_rgb = x * 0.0557 + y * -0.2040 + z * 1.0570;

    // Gamma correction
    const gamma = (c) => c > 0.0031308 ? 1.055 * Math.pow(c, 1 / 2.4) - 0.055 : 12.92 * c;

    return [
      Math.max(0, Math.min(1, gamma(r))),
      Math.max(0, Math.min(1, gamma(g))),
      Math.max(0, Math.min(1, gamma(b_rgb)))
    ];
  }

  // Event handlers for canvas interactions
  handleCanvasClick(e, canvasType) {
    const canvas = this.canvases[canvasType];
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    switch (canvasType) {
      case 'lightness':
        this.handleLightnessClick(x, y, canvas);
        break;
      case 'chroma':
        this.handleChromaClick(x, y, canvas);
        break;
      case 'hue':
        this.handleHueClick(x, y, canvas);
        break;
      case 'alpha':
        this.handleAlphaClick(x, y, canvas);
        break;
    }
  }

  handleLightnessClick(x, y, canvas) {
    // Clamp coordinates to canvas bounds
    x = Math.max(0, Math.min(canvas.width, x));
    y = Math.max(0, Math.min(canvas.height, y));
    
    // Convert canvas coordinates to OKLCH values
    // Eje X: Chroma (0 a 0.4)
    const chroma = (x / canvas.width) * 0.4;
    // Eje Y: Lightness (0% a 100%) - invertido porque Y=0 está arriba
    const lightness = 1 - (y / canvas.height);

    // Verificar que el punto esté dentro del triángulo válido del espacio de color
    // En OKLCH, el chroma máximo varía según la lightness
    const maxChromaAtLightness = this.calculateMaxChroma(lightness, this.oklch.h);

    // Clamp chroma to valid range for this lightness and hue
    const validChroma = Math.min(chroma, maxChromaAtLightness);

    // Actualizar valores OKLCH
    this.oklch.l = Math.max(0, Math.min(1, lightness));
    this.oklch.c = Math.max(0, Math.min(0.4, validChroma));
    this.updateFromOklch();
  }

  handleChromaClick(x, y, canvas) {
    // Clamp coordinates to canvas bounds
    x = Math.max(0, Math.min(canvas.width, x));
    y = Math.max(0, Math.min(canvas.height, y));
    
    // Convert canvas coordinates to OKLCH values
    // Eje X: Hue (0 a 360°)
    const hue = (x / canvas.width) * 360;
    // Eje Y: Chroma (0 a 0.4) - invertido porque Y=0 está abajo (chroma=0)
    const chroma = ((canvas.height - y) / canvas.height) * 0.4;

    // Calculate maximum chroma for current lightness and this hue combination
    const maxChromaAtLH = this.calculateMaxChroma(this.oklch.l, hue);
    
    // Only update if this chroma is valid for this lightness/hue combination
    // or clamp chroma to maximum valid value
    const validChroma = Math.min(chroma, maxChromaAtLH);

    // Verify the color is representable in RGB space
    try {
      const testColor = {
        mode: 'oklch',
        l: this.oklch.l,
        c: validChroma,
        h: hue,
        alpha: 1
      };

      const rgbTest = this.colorManager.toRgb(testColor);
      
      if (rgbTest && 
          rgbTest.r >= 0 && rgbTest.r <= 1 &&
          rgbTest.g >= 0 && rgbTest.g <= 1 &&
          rgbTest.b >= 0 && rgbTest.b <= 1) {
        
        // Valid color - update values
        this.oklch.h = Math.max(0, Math.min(360, hue));
        this.oklch.c = Math.max(0, Math.min(0.4, validChroma));
        this.updateFromOklch();
      } else {
        // Invalid color - try with reduced chroma
        const reducedChroma = validChroma * 0.8;
        const fallbackColor = {
          mode: 'oklch',
          l: this.oklch.l,
          c: reducedChroma,
          h: hue,
          alpha: 1
        };

        const fallbackRgb = this.colorManager.toRgb(fallbackColor);
        
        if (fallbackRgb && 
            fallbackRgb.r >= 0 && fallbackRgb.r <= 1 &&
            fallbackRgb.g >= 0 && fallbackRgb.g <= 1 &&
            fallbackRgb.b >= 0 && fallbackRgb.b <= 1) {
          
          this.oklch.h = Math.max(0, Math.min(360, hue));
          this.oklch.c = Math.max(0, Math.min(0.4, reducedChroma));
          this.updateFromOklch();
        }
        // If still invalid, don't update (clicked on empty/invalid area)
      }
    } catch (error) {
      // Error in color conversion - don't update
      console.warn('Invalid color selection in chroma graph:', error);
    }
  }

  handleHueClick(x, y, canvas) {
    // Clamp coordinates to canvas bounds
    x = Math.max(0, Math.min(canvas.width, x));
    y = Math.max(0, Math.min(canvas.height, y));
    
    // Convert canvas coordinates to OKLCH values
    // Eje X: Hue (0 a 360°)
    const hue = (x / canvas.width) * 360;
    // Eje Y: Lightness (1 a 0) - invertido porque Y=0 está arriba
    const lightness = 1 - (y / canvas.height);

    // Calculate maximum chroma for this lightness and hue combination
    const maxChromaAtLH = this.calculateMaxChroma(lightness, hue);
    
    // Only update if current chroma is valid for this lightness/hue combination
    // or clamp chroma to maximum valid value
    const validChroma = Math.min(this.oklch.c, maxChromaAtLH);

    // Verify the color is representable in RGB space
    try {
      const testColor = {
        mode: 'oklch',
        l: lightness,
        c: validChroma,
        h: hue,
        alpha: 1
      };

      const rgbTest = this.colorManager.toRgb(testColor);
      
      if (rgbTest && 
          rgbTest.r >= 0 && rgbTest.r <= 1 &&
          rgbTest.g >= 0 && rgbTest.g <= 1 &&
          rgbTest.b >= 0 && rgbTest.b <= 1) {
        
        // Valid color - update values
        this.oklch.h = Math.max(0, Math.min(360, hue));
        this.oklch.l = Math.max(0, Math.min(1, lightness));
        this.oklch.c = Math.max(0, Math.min(0.4, validChroma));
        this.updateFromOklch();
      } else {
        // Invalid color - try with reduced chroma
        const reducedChroma = validChroma * 0.8;
        const fallbackColor = {
          mode: 'oklch',
          l: lightness,
          c: reducedChroma,
          h: hue,
          alpha: 1
        };

        const fallbackRgb = this.colorManager.toRgb(fallbackColor);
        
        if (fallbackRgb && 
            fallbackRgb.r >= 0 && fallbackRgb.r <= 1 &&
            fallbackRgb.g >= 0 && fallbackRgb.g <= 1 &&
            fallbackRgb.b >= 0 && fallbackRgb.b <= 1) {
          
          this.oklch.h = Math.max(0, Math.min(360, hue));
          this.oklch.l = Math.max(0, Math.min(1, lightness));
          this.oklch.c = Math.max(0, Math.min(0.4, reducedChroma));
          this.updateFromOklch();
        }
        // If still invalid, don't update (clicked on empty/invalid area)
      }
    } catch (error) {
      // Error in color conversion - don't update
      console.warn('Invalid color selection in hue graph:', error);
    }
  }

  handleAlphaClick(x, y, canvas) {
    // Convert to alpha value (0 to 1)
    const alpha = x / canvas.width;
    const clampedAlpha = Math.max(0, Math.min(1, alpha));

    this.oklch.a = clampedAlpha;
    this.updateFromOklch();
  }

  handleCanvasPointerDown(e, canvasType) {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging = true;

    const canvas = this.canvases[canvasType];
    if (!canvas) return;

    // Create a temporary emitter for this specific drag interaction
    const dragEmitter = new Emitter();

    const handlePointerMove = (moveEvent) => {
      if (!this.isDragging) return;
      moveEvent.preventDefault();
      
      // Calculate coordinates relative to the canvas
      const rect = canvas.getBoundingClientRect();
      const canvasX = ((moveEvent.clientX - rect.left) / rect.width) * canvas.width;
      const canvasY = ((moveEvent.clientY - rect.top) / rect.height) * canvas.height;
      
      // Create a synthetic event with canvas coordinates
      const syntheticEvent = {
        clientX: rect.left + (canvasX / canvas.width) * rect.width,
        clientY: rect.top + (canvasY / canvas.height) * rect.height,
        preventDefault: () => {},
        stopPropagation: () => {}
      };
      
      this.handleCanvasClick(syntheticEvent, canvasType);
    };

    const handlePointerUp = () => {
      this.isDragging = false;
      // Clean up all drag-related listeners using the emitter
      dragEmitter.clear();
    };

    // Register drag event listeners with the temporary emitter
    dragEmitter.on(
      addEventListener(document, 'pointermove', handlePointerMove, { passive: false }),
      addEventListener(document, 'pointerup', handlePointerUp),
      addEventListener(document, 'pointercancel', handlePointerUp)
    );

    // Initial click
    this.handleCanvasClick(e, canvasType);
  }

  handleSliderChange(e, sliderType) {
    const value = parseFloat(e.target.value);

    switch (sliderType) {
      case 'lightness':
        this.oklch.l = value;
        break;
      case 'chroma':
        this.oklch.c = value;
        break;
      case 'hue':
        this.oklch.h = value;
        break;
      case 'alpha':
        this.oklch.a = value;
        break;
    }

    this.updateFromOklch();
  }

  handleInputChange(e, inputType) {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) return;

    switch (inputType) {
      case 'l':
        this.oklch.l = Math.max(0, Math.min(1, value));
        break;
      case 'c':
        this.oklch.c = Math.max(0, Math.min(0.4, value));
        break;
      case 'h':
        this.oklch.h = Math.max(0, Math.min(360, value));
        break;
      case 'a':
        this.oklch.a = Math.max(0, Math.min(1, value));
        break;
    }

    this.updateFromOklch();
  }

  handleHexInput(e) {
    // Use ColorManager's auto-formatting and validation
    this.colorManager.autoFormatHexInput(e.target);

    const hex = e.target.value;

    // Validate using ColorManager's improved validation
    if (this.colorManager.isValidHex(hex)) {
      // Normalize and convert to OKLCH if valid
      const normalizedHex = this.colorManager.normalizeHex(hex);
      if (normalizedHex.length === 7 || normalizedHex.length === 9) { // #RRGGBB or #RRGGBBAA
        this.setColorFromHex(normalizedHex);
      }
    }
  }

  handleKeydown(e) {
    if (e.key === 'Escape') {
      this.cancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      this.confirm();
    }
  }

  handleValueDisplayInput(e, displayType) {
    const value = e.target.value.trim();

    // Parse the value based on the format (L: 65%, C: 0.200, H: 180°, A: 100%)
    let numericValue;

    switch (displayType) {
      case 'lightness':
        // Extract number from "L: 0.6500" format (4 decimals)
        const lMatch = value.match(/L:\s*(\d+(?:\.\d{1,4})?)%?/i);
        if (lMatch) {
          numericValue = parseFloat(lMatch[1]);
          // Convert percentage to 0-1 range if needed
          if (numericValue > 1) numericValue = numericValue / 100;
          this.oklch.l = Math.max(0, Math.min(1, numericValue));
          this.updateFromOklch();
        }
        break;

      case 'chroma':
        // Extract number from "C: 0.200" format
        const cMatch = value.match(/C:\s*(\d+(?:\.\d+)?)/i);
        if (cMatch) {
          numericValue = parseFloat(cMatch[1]);
          this.oklch.c = Math.max(0, Math.min(0.4, numericValue));
          this.updateFromOklch();
        }
        break;

      case 'hue':
        // Extract number from "H: 180°" format
        const hMatch = value.match(/H:\s*(\d+(?:\.\d+)?)°?/i);
        if (hMatch) {
          numericValue = parseFloat(hMatch[1]);
          this.oklch.h = Math.max(0, Math.min(360, numericValue));
          this.updateFromOklch();
        }
        break;

      case 'alpha':
        // Extract number from "A: 1.0000" format (4 decimals)
        const aMatch = value.match(/A:\s*(\d+(?:\.\d{1,4})?)%?/i);
        if (aMatch) {
          numericValue = parseFloat(aMatch[1]);
          // Convert percentage to 0-1 range if needed
          if (numericValue > 1) numericValue = numericValue / 100;
          this.oklch.a = Math.max(0, Math.min(1, numericValue));
          this.updateFromOklch();
        }
        break;
    }
  }

  updateValueDisplay(displayType) {
    const input = this.valueDisplays[displayType];
    if (!input) return;

    // Only update if the input is not currently being edited (readonly)
    if (input.hasAttribute('readonly')) {
      switch (displayType) {
        case 'lightness':
          input.value = `L: ${this.oklch.l.toFixed(4)}`;
          break;
        case 'chroma':
          input.value = `C: ${this.oklch.c.toFixed(3)}`;
          break;
        case 'hue':
          input.value = `H: ${this.oklch.h.toFixed(2)}°`;
          break;
        case 'alpha':
          input.value = `A: ${this.oklch.a.toFixed(4)}`;
          break;
      }
    }
  }

  updateSliderThumb(sliderType) {
    const slider = this.sliders[sliderType];
    if (!slider) return;

    const thumb = slider.parentElement.querySelector('.slider-thumb');
    if (!thumb) return;

    const percentage = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    thumb.style.left = `${percentage}%`;
  }

  updateSliderGradient(sliderType) {
    const slider = this.sliders[sliderType];
    if (!slider) return;

    const track = slider.parentElement.querySelector('.slider-track');
    if (!track) return;

    let gradient = '';

    switch (sliderType) {
      case 'lightness':
        // Gradiente de lightness con chroma y hue actuales usando ColorManager
        try {
          const stops = [];
          for (let i = 0; i <= 10; i++) {
            const l = i / 10;
            const oklchObj = {
              mode: 'oklch',
              l: l,
              c: this.oklch.c,
              h: this.oklch.h,
              alpha: 1
            };

            // Use ColorManager to serialize the color
            const colorString = this.colorManager.serialize(oklchObj);
            if (colorString) {
              stops.push(`${colorString} ${i * 10}%`);
            } else {
              // Fallback to CSS oklch
              stops.push(`oklch(${l * 100}% ${this.oklch.c} ${this.oklch.h}) ${i * 10}%`);
            }
          }
          gradient = `linear-gradient(to right, ${stops.join(', ')})`;
        } catch {
          // Fallback simple
          gradient = 'linear-gradient(to right, #000, #fff)';
        }
        break;

      case 'chroma':
        // Gradiente de chroma de 0 a 0.4 con lightness y hue actuales usando ColorManager
        try {
          const stops = [];
          for (let i = 0; i <= 10; i++) {
            const c = (i / 10) * 0.4;
            const oklchObj = {
              mode: 'oklch',
              l: this.oklch.l,
              c: c,
              h: this.oklch.h,
              alpha: 1
            };

            // Use ColorManager to serialize the color
            const colorString = this.colorManager.serialize(oklchObj);
            if (colorString) {
              stops.push(`${colorString} ${i * 10}%`);
            } else {
              // Fallback to CSS oklch
              stops.push(`oklch(${this.oklch.l * 100}% ${c} ${this.oklch.h}) ${i * 10}%`);
            }
          }
          gradient = `linear-gradient(to right, ${stops.join(', ')})`;
        } catch {
          // Fallback
          gradient = 'linear-gradient(to right, #999, #f00)';
        }
        break;

      case 'hue':
        // Gradiente de hue de 0° a 360° con lightness y chroma actuales usando ColorManager
        try {
          const stops = [];
          for (let i = 0; i <= 12; i++) {
            const h = (i / 12) * 360;
            const oklchObj = {
              mode: 'oklch',
              l: this.oklch.l,
              c: this.oklch.c,
              h: h,
              alpha: 1
            };

            // Use ColorManager to serialize the color
            const colorString = this.colorManager.serialize(oklchObj);
            if (colorString) {
              stops.push(`${colorString} ${(i / 12) * 100}%`);
            } else {
              // Fallback to CSS oklch
              stops.push(`oklch(${this.oklch.l * 100}% ${this.oklch.c} ${h}) ${(i / 12) * 100}%`);
            }
          }
          gradient = `linear-gradient(to right, ${stops.join(', ')})`;
        } catch {
          // Fallback clásico
          gradient = 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';
        }
        break;

      case 'alpha':
        // Gradiente de alpha con checkerboard pattern usando ColorManager
        try {
          const oklchObj = {
            mode: 'oklch',
            l: this.oklch.l,
            c: this.oklch.c,
            h: this.oklch.h,
            alpha: 1
          };

          // Use ColorManager to serialize the color
          const baseColor = this.colorManager.serialize(oklchObj) || `oklch(${this.oklch.l * 100}% ${this.oklch.c} ${this.oklch.h})`;

          // Crear patrón de tablero de ajedrez
          track.style.background = `
            repeating-conic-gradient(#c0c0c0 0% 25%, transparent 0% 50%) 50% / 10px 10px,
            linear-gradient(to right, transparent, ${baseColor})
          `;
          return; // No usar la variable gradient
        } catch {
          gradient = 'linear-gradient(to right, transparent, #000)';
        }
        break;
    }

    if (gradient) {
      track.style.background = gradient;
    }
  }

  // Update color conversion and formatting
  updateFromOklch() {
    try {
      const oklchObj = {
        mode: 'oklch',
        l: this.oklch.l,
        c: this.oklch.c,
        h: this.oklch.h,
        alpha: this.oklch.a
      };

      // First check gamut and apply mapping if needed
      const { mappedColor, gamutState } = this.verifyAndMapGamut(oklchObj);

      // Use mapped color for display
      const hex = this.colorManager.colorToHex(mappedColor);
      if (hex) {
        // Add alpha to hex if not opaque
        if (this.oklch.a < 1) {
          const alphaHex = Math.round(this.oklch.a * 255).toString(16).padStart(2, '0').toUpperCase();
          this.currentColor = hex + alphaHex;
        } else {
          this.currentColor = hex;
        }
      } else {
        const [r, g, b] = this.oklchToRgb(this.oklch.l, this.oklch.c, this.oklch.h);
        this.currentColor = this.rgbToHex(r * 255, g * 255, b * 255);
        if (this.oklch.a < 1) {
          const alphaHex = Math.round(this.oklch.a * 255).toString(16).padStart(2, '0').toUpperCase();
          this.currentColor += alphaHex;
        }
      }

      // Update gamut state and UI
      this.currentGamutState = gamutState;
      this.updateGamutUI();
      this.updateUI();
      this.renderAllVisualizations();
    } catch (error) {
      console.warn('Failed to update color from OKLCH:', error);
    }
  }

  // ---------- GAMUT VERIFICATION SYSTEM ----------

  /**
   * Verifies color gamut and applies mapping if needed
   * @param {Object} oklchObj - OKLCH color object
   * @returns {Object} { mappedColor, gamutState }
   */
  verifyAndMapGamut(oklchObj) {
    try {
      const targetGamut = this.determineTargetGamut();

      // Safely check if color is in target gamut
      let isInTargetGamut = true;
      let actualGamut = 'srgb';

      try {
        isInTargetGamut = this.colorManager.isInGamut(oklchObj, targetGamut);
        actualGamut = this.colorManager.getWidestGamut(oklchObj);
      } catch (gamutError) {
        console.warn('Gamut checking failed, using fallback:', gamutError);
        // Conservative fallback - assume it's sRGB
        isInTargetGamut = targetGamut === 'srgb' || targetGamut === 'rgb';
        actualGamut = 'srgb';
      }

      let mappedColor = oklchObj;
      let needsMapping = false;

      if (!isInTargetGamut && this.gamutSettings.autoClamp) {
        try {
          mappedColor = this.mapColorToGamut(oklchObj, targetGamut);
          needsMapping = true;
        } catch (mappingError) {
          console.warn('Color mapping failed, using original color:', mappingError);
          mappedColor = oklchObj;
          needsMapping = false;
        }
      }

      const gamutState = {
        isInGamut: isInTargetGamut,
        actualGamut,
        targetGamut,
        needsMapping,
        originalColor: oklchObj,
        mappedColor
      };

      return { mappedColor, gamutState };
    } catch (error) {
      console.warn('Gamut verification failed completely, using safe defaults:', error);

      // Ultimate fallback
      const safeGamutState = {
        isInGamut: true,
        actualGamut: 'srgb',
        targetGamut: 'srgb',
        needsMapping: false,
        originalColor: oklchObj,
        mappedColor: oklchObj
      };

      return { mappedColor: oklchObj, gamutState: safeGamutState };
    }
  }

  /**
   * Determines the target gamut based on device capabilities and user preferences
   * @returns {string} Target gamut ('srgb', 'p3', 'rec2020')
   */
  determineTargetGamut() {
    try {
      if (this.gamutSettings.preferredGamut === 'auto') {
        const recommendedSpace = getRecommendedColorSpace();
        return recommendedSpace === 'display-p3' ? 'p3' : 'srgb';
      }
      return this.gamutSettings.preferredGamut;
    } catch (error) {
      console.warn('Failed to determine target gamut, using sRGB:', error);
      return 'srgb';
    }
  }

  /**
   * Maps a color to the target gamut using different algorithms
   * @param {Object} color - Input color object
   * @param {string} targetGamut - Target gamut
   * @returns {Object} Mapped color object
   */
  mapColorToGamut(color, targetGamut) {
    try {
      // Verify the target gamut is supported before mapping
      if (!isGamutSupported(targetGamut)) {
        console.warn(`Target gamut ${targetGamut} not supported, using sRGB`);
        targetGamut = 'srgb';
      }

      switch (this.gamutSettings.gamutMappingMethod) {
        case 'chroma':
          return this.mapGamutByChroma(color, targetGamut);
        case 'lightness':
          return this.mapGamutByLightness(color, targetGamut);
        case 'perceptual':
        default:
          return this.mapGamutPerceptual(color, targetGamut);
      }
    } catch (error) {
      console.warn('Gamut mapping failed, returning original color:', error);
      return color;
    }
  }

  /**
   * Perceptual gamut mapping - preserves overall appearance
   * @param {Object} color - Input color
   * @param {string} targetGamut - Target gamut
   * @returns {Object} Mapped color
   */
  mapGamutPerceptual(color, targetGamut) {
    // Use ColorManager's built-in clamping which handles perceptual mapping
    const clampedColor = this.colorManager.clampToGamut(color, targetGamut);
    if (clampedColor) {
      return clampedColor;
    }

    // Fallback: gradually reduce chroma until in gamut
    let mappedColor = { ...color };
    const step = 0.001;

    while (!this.colorManager.isInGamut(mappedColor, targetGamut) && mappedColor.c > 0) {
      mappedColor = { ...mappedColor, c: Math.max(0, mappedColor.c - step) };
    }

    return mappedColor;
  }

  /**
   * Chroma-priority gamut mapping - preserves hue and lightness
   * @param {Object} color - Input color
   * @param {string} targetGamut - Target gamut
   * @returns {Object} Mapped color
   */
  mapGamutByChroma(color, targetGamut) {
    let mappedColor = { ...color };
    const step = 0.005;

    // Reduce chroma while preserving hue and lightness
    while (!this.colorManager.isInGamut(mappedColor, targetGamut) && mappedColor.c > 0) {
      mappedColor.c = Math.max(0, mappedColor.c - step);
    }

    return mappedColor;
  }

  /**
   * Lightness-priority gamut mapping - adjusts lightness to fit gamut
   * @param {Object} color - Input color
   * @param {string} targetGamut - Target gamut
   * @returns {Object} Mapped color
   */
  mapGamutByLightness(color, targetGamut) {
    let mappedColor = { ...color };
    const stepL = 0.01;
    const stepC = 0.005;

    // Try adjusting lightness first
    let iterations = 0;
    const maxIterations = 100;

    while (!this.colorManager.isInGamut(mappedColor, targetGamut) && iterations < maxIterations) {
      // Alternate between lightness and chroma adjustments
      if (iterations % 2 === 0) {
        // Adjust lightness towards 0.5 (middle)
        if (mappedColor.l > 0.5) {
          mappedColor.l = Math.max(0.5, mappedColor.l - stepL);
        } else {
          mappedColor.l = Math.min(0.5, mappedColor.l + stepL);
        }
      } else {
        // Reduce chroma
        mappedColor.c = Math.max(0, mappedColor.c - stepC);
      }
      iterations++;
    }

    return mappedColor;
  }

  /**
   * Updates the gamut UI based on current state (simplified version)
   */
  updateGamutUI() {
    // El nuevo sistema de fallback visual se maneja en updateUI()
    // Esta función se mantiene vacía para compatibilidad
  }

  /**
   * Updates the gamut badge appearance and text (simplificado)
   * @param {boolean} isInGamut - Whether color is in target gamut
   * @param {string} actualGamut - Actual color gamut
   * @param {string} targetGamut - Target gamut
   */
  updateGamutBadge(isInGamut, actualGamut, targetGamut) {
    // Solo actualizar badge si existe
    if (!this.gamutBadge) return;

    // Remove existing classes
    this.gamutBadge.classList.remove('warning', 'error', 'srgb');

    if (isInGamut) {
      // Color is in gamut - show target gamut
      this.gamutBadge.textContent = this.getGamutDisplayName(targetGamut);
      this.gamutBadge.classList.add(targetGamut === 'srgb' ? 'srgb' : '');
    } else {
      // Color is out of gamut - show warning
      this.gamutBadge.textContent = `${this.getGamutDisplayName(actualGamut)} ⚠️`;
      this.gamutBadge.classList.add('warning');
    }
  }

  /**
   * Shows gamut warning with appropriate message (ya no se usa)
   * @param {string} actualGamut - Actual color gamut
   * @param {string} targetGamut - Target gamut
   * @param {boolean} needsMapping - Whether color was mapped
   */
  showGamutWarning(actualGamut, targetGamut, needsMapping) {
    // Función mantenida para compatibilidad, pero ya no se usa
    // El nuevo sistema visual está en updateUI()
  }

  /**
   * Hides the gamut warning (ya no se usa)
   */
  hideGamutWarning() {
    // Función mantenida para compatibilidad, pero ya no se usa
    // El nuevo sistema visual está en updateUI()
  }

  /**
   * Gets display name for gamut
   * @param {string} gamut - Gamut identifier
   * @returns {string} Display name
   */
  getGamutDisplayName(gamut) {
    const names = {
      'srgb': 'sRGB',
      'rgb': 'sRGB',
      'p3': 'Display P3',
      'display-p3': 'Display P3',
      'rec2020': 'Rec.2020'
    };
    return names[gamut] || gamut.toUpperCase();
  }

  /**
   * Clamps current color to target gamut
   */
  clampCurrentColorToGamut() {
    const oklchObj = {
      mode: 'oklch',
      l: this.oklch.l,
      c: this.oklch.c,
      h: this.oklch.h,
      alpha: this.oklch.a
    };

    const targetGamut = this.determineTargetGamut();
    const mappedColor = this.mapColorToGamut(oklchObj, targetGamut);

    // Update OKLCH values with mapped color
    this.oklch = {
      l: mappedColor.l || this.oklch.l,
      c: mappedColor.c || this.oklch.c,
      h: mappedColor.h || this.oklch.h,
      a: mappedColor.alpha || this.oklch.a
    };

    // Update everything
    this.updateFromOklch();
    // Ya no necesitamos hideGamutWarning() - el sistema visual se actualiza automáticamente
  }

  /**
   * Toggles gamut auto-clamping
   * @param {boolean} enabled - Whether to enable auto-clamping
   */
  setAutoClamp(enabled) {
    this.gamutSettings.autoClamp = enabled;
    this.updateFromOklch(); // Re-evaluate current color
  }

  /**
   * Sets the gamut mapping method
   * @param {string} method - Mapping method ('perceptual', 'chroma', 'lightness')
   */
  setGamutMappingMethod(method) {
    this.gamutSettings.gamutMappingMethod = method;
    if (this.gamutSettings.autoClamp) {
      this.updateFromOklch(); // Re-evaluate with new method
    }
  }

  /**
   * Sets preferred gamut
   * @param {string} gamut - Preferred gamut ('auto', 'srgb', 'p3', 'rec2020')
   */
  setPreferredGamut(gamut) {
    this.gamutSettings.preferredGamut = gamut;
    this.currentGamutState.targetGamut = this.determineTargetGamut();
    this.updateFromOklch(); // Re-evaluate with new target
  }

  updateUI() {
    // Check if current color is available in device gamut
    const oklchObj = {
      mode: 'oklch',
      l: this.oklch.l,
      c: this.oklch.c,
      h: this.oklch.h,
      alpha: this.oklch.a
    };

    const targetGamut = this.determineTargetGamut();
    let isInGamut = true;
    let fallbackColor = null;

    try {
      isInGamut = this.colorManager.isInGamut(oklchObj, targetGamut);
      if (!isInGamut) {
        // Generate fallback color by clamping to available gamut
        fallbackColor = this.colorManager.clampToGamut(oklchObj, targetGamut);
        if (fallbackColor) {
          fallbackColor = this.colorManager.colorToHex(fallbackColor);
        }
      }
    } catch (error) {
      console.warn('Failed to check gamut, assuming available:', error);
      isInGamut = true;
    }

    // Update main color swatch with alpha support
    if (this.colorSwatch) {
      try {
        // Create color with alpha using ColorManager
        const oklchWithAlpha = {
          mode: 'oklch',
          l: this.oklch.l,
          c: this.oklch.c,
          h: this.oklch.h,
          alpha: this.oklch.a
        };

        // Try to serialize the color with alpha
        let colorWithAlpha = this.colorManager.serialize(oklchWithAlpha);
        
        if (!colorWithAlpha) {
          // Fallback: convert to RGB and create rgba string
          const rgbColor = this.colorManager.toRgb(oklchWithAlpha);
          if (rgbColor) {
            colorWithAlpha = `rgba(${Math.round(rgbColor.r * 255)}, ${Math.round(rgbColor.g * 255)}, ${Math.round(rgbColor.b * 255)}, ${this.oklch.a})`;
          } else {
            // Ultimate fallback: use hex with CSS opacity
            colorWithAlpha = this.currentColor;
            this.colorSwatch.style.opacity = this.oklch.a.toString();
          }
        }

        // Use CSS custom property for the swatch color
        this.colorSwatch.style.setProperty('--swatch-color', colorWithAlpha);
        
        // Reset opacity if we're using a color format that includes alpha
        if (colorWithAlpha !== this.currentColor) {
          this.colorSwatch.style.opacity = '';
        }
      } catch (error) {
        console.warn('Failed to update swatch with alpha, using fallback:', error);
        this.colorSwatch.style.setProperty('--swatch-color', this.currentColor);
        this.colorSwatch.style.opacity = this.oklch.a.toString();
      }
    }

    // Show/hide fallback system
    if (this.gamutFallback && this.fallbackSwatch) {
      if (!isInGamut && fallbackColor) {
        this.gamutFallback.classList.add('show');
        // Use the same alpha-aware approach for fallback swatch
        try {
          const fallbackWithAlpha = `${fallbackColor}${Math.round(this.oklch.a * 255).toString(16).padStart(2, '0')}`;
          this.fallbackSwatch.style.setProperty('--fallback-swatch-color', fallbackWithAlpha);
        } catch (error) {
          this.fallbackSwatch.style.setProperty('--fallback-swatch-color', fallbackColor);
          this.fallbackSwatch.style.opacity = this.oklch.a.toString();
        }
      } else {
        this.gamutFallback.classList.remove('show');
      }
    }

    // Update hex display
    if (this.colorHex) {
      this.colorHex.textContent = this.currentColor;
    }

    // Update OKLCH display
    if (this.colorOklch) {
      this.colorOklch.textContent =
        `L: ${this.oklch.l.toFixed(4)} C: ${this.oklch.c.toFixed(3)} H: ${this.oklch.h.toFixed(2)}° A: ${this.oklch.a.toFixed(4)}`;
    }

    // Update hex input
    // if (this.hexInput) {
    //   this.hexInput.value = this.currentColor;
    // }

    // Update sliders
    if (this.sliders.lightness) this.sliders.lightness.value = this.oklch.l;
    if (this.sliders.chroma) this.sliders.chroma.value = this.oklch.c;
    if (this.sliders.hue) this.sliders.hue.value = this.oklch.h;
    if (this.sliders.alpha) this.sliders.alpha.value = this.oklch.a;

    // Update number inputs
    if (this.inputs.l) this.inputs.l.value = this.oklch.l.toFixed(2);
    if (this.inputs.c) this.inputs.c.value = this.oklch.c.toFixed(3);
    if (this.inputs.h) this.inputs.h.value = this.oklch.h.toFixed(2);
    if (this.inputs.a) this.inputs.a.value = this.oklch.a.toFixed(2);

    // Update value displays
    this.updateValueDisplay('lightness');
    this.updateValueDisplay('chroma');
    this.updateValueDisplay('hue');
    this.updateValueDisplay('alpha');

    // Update slider thumbs and gradients
    Object.keys(this.sliders).forEach(key => {
      this.updateSliderThumb(key);
      this.updateSliderGradient(key);
    });
  }

  rgbToHex(r, g, b) {
    const toHex = (n) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  setColor(hex) {
    if (!this.colorManager.isValidHex(hex)) return;

    this.currentColor = this.colorManager.normalizeHex(hex);
    this.setColorFromHex(this.currentColor);
  }

  setColorFromHex(hex) {
    try {
      // Use ColorManager's improved parseColor and convertTo methods
      const colorObj = this.colorManager.parseColor(hex);
      if (!colorObj) {
        console.warn('Failed to parse hex color:', hex);
        return;
      }

      // Convert to OKLCH using the mode system
      const oklchObj = this.colorManager.toOklch(colorObj);
      if (!oklchObj) {
        console.warn('Failed to convert to OKLCH:', hex);
        return;
      }

      // Update OKLCH values, preserving current alpha
      this.oklch = {
        l: oklchObj.l || 0,
        c: oklchObj.c || 0,
        h: oklchObj.h || 0,
        a: this.oklch.a // Preserve current alpha
      };

      this.currentColor = this.colorManager.normalizeHex(hex);
      this.updateUI();
      this.renderAllVisualizations();
    } catch (error) {
      console.warn('Failed to set color from hex:', error);
    }
  }

  rgbToOklch(r, g, b) {
    // Try using ColorManager first for more accurate conversion
    try {
      const rgbObj = { mode: 'rgb', r, g, b, alpha: 1 };
      const oklchObj = this.colorManager.toOklch(rgbObj);
      if (oklchObj) {
        return {
          l: oklchObj.l || 0,
          c: oklchObj.c || 0,
          h: oklchObj.h || 0
        };
      }
    } catch (error) {
      console.warn('ColorManager conversion failed, using fallback:', error);
    }

    // Simplified RGB to OKLCH conversion (fallback)
    // ColorManager provides more accurate results

    // sRGB to XYZ
    const toLinear = (c) => c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92;
    const rLin = toLinear(r);
    const gLin = toLinear(g);
    const bLin = toLinear(b);

    // XYZ conversion matrix (simplified)
    const x = rLin * 0.4124 + gLin * 0.3576 + bLin * 0.1805;
    const y = rLin * 0.2126 + gLin * 0.7152 + bLin * 0.0722;
    const z = rLin * 0.0193 + gLin * 0.1192 + bLin * 0.9505;

    // Lab conversion (approximation)
    const l = (y * 1.16) - 0.16;
    const a = (x - y) * 500;
    const bLab = (y - z) * 200;

    // Lab to LCh
    const c = Math.sqrt(a * a + bLab * bLab);
    let h = Math.atan2(bLab, a) * 180 / Math.PI;
    if (h < 0) h += 360;

    return {
      l: Math.max(0, Math.min(1, l)),
      c: Math.max(0, Math.min(0.4, c / 100)), // Scale chroma
      h: h
    };
  }

  // Public API methods
  show() {
    this.isOpen = true;
    this.setAttribute('open', '');
    this.style.display = 'flex';
    // Focus the modal for keyboard navigation
    this.focus();
  }

  hide() {
    this.isOpen = false;
    this.removeAttribute('open');
    this.style.display = 'none';
  }

  open(initialColor) {
    if (initialColor) {
      this.setColor(initialColor);
    }
    this.show();
  }

  cancel() {
    this.hide();
    this.dispatchEvent(new CustomEvent('colorcancel', {
      bubbles: true,
      detail: { canceled: true }
    }));
  }

  confirm() {
    this.hide();

    // Create comprehensive color information using ColorManager
    const oklchObj = {
      mode: 'oklch',
      l: this.oklch.l,
      c: this.oklch.c,
      h: this.oklch.h,
      alpha: this.oklch.a
    };

    // Generate additional color formats using ColorManager
    const colorFormats = {
      hex: this.currentColor,
      oklch: oklchObj,
      rgb: this.colorManager.toRgb(oklchObj),
      hsl: this.colorManager.toHsl(oklchObj),
      p3: this.colorManager.toP3(oklchObj),
      serialized: {
        oklch: this.colorManager.serialize(oklchObj),
        rgb: this.colorManager.serialize(this.colorManager.toRgb(oklchObj)),
        hsl: this.colorManager.serialize(this.colorManager.toHsl(oklchObj))
      }
    };

    // Add comprehensive gamut information
    const gamutInfo = {
      widestGamut: this.colorManager.getWidestGamut(oklchObj),
      inSrgb: this.colorManager.isInGamut(oklchObj, 'rgb'),
      inP3: this.colorManager.isInGamut(oklchObj, 'p3'),
      inRec2020: this.colorManager.isInGamut(oklchObj, 'rec2020'),
      currentGamutState: { ...this.currentGamutState },
      gamutSettings: { ...this.gamutSettings },
      targetGamut: this.determineTargetGamut(),
      wasMapped: this.currentGamutState.needsMapping,
      mappingMethod: this.gamutSettings.gamutMappingMethod
    };

    this.dispatchEvent(new CustomEvent('colorconfirm', {
      bubbles: true,
      detail: {
        color: this.currentColor,
        oklch: { ...this.oklch },
        colorSpace: getRecommendedColorSpace(),
        formats: colorFormats,
        gamut: gamutInfo
      }
    }));
  }

  copyColor() {
    try {
      // Create OKLCH object for better copying options
      const oklchObj = {
        mode: 'oklch',
        l: this.oklch.l,
        c: this.oklch.c,
        h: this.oklch.h,
        alpha: this.oklch.a
      };

      // Copy multiple formats - prioritize based on gamut
      const widestGamut = this.colorManager.getWidestGamut(oklchObj);
      let copyText = this.currentColor; // Default to HEX

      // If color supports wider gamuts, provide better format
      if (widestGamut === 'p3' || widestGamut === 'rec2020') {
        const serializedOklch = this.colorManager.serialize(oklchObj);
        if (serializedOklch) {
          copyText = serializedOklch;
        }
      }

      navigator.clipboard.writeText(copyText);

      // Show brief feedback
      const btn = this.#select('.copy-btn');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.textContent = originalText;
        }, 1000);
      }
    } catch (error) {
      console.warn('Failed to copy color to clipboard:', error);
    }
  }
}

// Register the custom element
customElements.define('oklch-color-picker', OKLCHColorPicker);