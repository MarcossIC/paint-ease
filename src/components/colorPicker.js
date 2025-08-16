import ColorManager from '../domain/colorManager.js';

/**
 * ColorPickerModal - True Web Component for color selection
 * Usage: <color-picker-modal></color-picker-modal>
 */
export class ColorPickerModal extends HTMLElement {
  constructor() {
    super();
    
    // Component state
    this.isOpen = false;
    this.currentColor = '#FF0000';
    this.hsv = { h: 0, s: 100, v: 100 };
    this.isDragging = false;
    
    // Use ColorManager for validations and normalizations
    this.colorManager = new ColorManager();
    
    // Shadow DOM for encapsulation
    this.attachShadow({ mode: 'open' });
    
    // Initialize
    this.render();
    this.bindEvents();
    this.renderCanvases();
  }

  // Define which attributes trigger updates
  static get observedAttributes() {
    return ['open', 'initial-color'];
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
    }
  }

  render() {
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
        }

        :host([open]) {
          display: flex;
        }

        .picker {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          display: flex;
          flex-direction: column;
          gap: 20px;
          min-width: 320px;
          max-width: 400px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          animation: fadeIn 0.2s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #6b7280;
          padding: 4px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          transition: all 0.15s ease;
        }

        .close-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .preview-section {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .preview {
          width: 60px;
          height: 60px;
          border: 3px solid white;
          box-shadow: 0 0 0 1px #e5e7eb, 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          background: var(--current-color, #ff0000);
          transition: all 0.15s ease;
        }

        .color-info {
          flex: 1;
        }

        .color-value {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
        }

        .color-desc {
          font-size: 14px;
          color: #6b7280;
          margin-top: 2px;
        }

        .canvas-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        canvas {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.15s ease;
        }

        canvas:hover {
          border-color: #d1d5db;
        }

        canvas:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .sv-canvas {
          cursor: crosshair;
          width: 280px;
          height: 180px;
        }

        .hue-canvas {
          cursor: pointer;
          width: 280px;
          height: 24px;
        }

        .input-section {
          display: flex;
          gap: 12px;
          align-items: center;
          background: #f9fafb;
          padding: 16px;
          border-radius: 8px;
        }

        .hex-label {
          font-weight: 600;
          color: #374151;
          min-width: 45px;
          font-size: 14px;
        }

        .hex-input {
          flex: 1;
          padding: 10px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
          font-size: 14px;
          text-transform: uppercase;
          background: white;
          transition: all 0.15s ease;
        }

        .hex-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .hex-input:invalid {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .buttons {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 8px;
        }

        button {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
          font-size: 14px;
        }

        .cancel-btn {
          border: 1px solid #d1d5db;
          background: white;
          color: #374151;
        }

        .cancel-btn:hover {
          background: #f9fafb;
          border-color: #9ca3af;
        }

        .confirm-btn {
          border: none;
          background: #3b82f6;
          color: white;
        }

        .confirm-btn:hover {
          background: #2563eb;
        }

        .confirm-btn:active {
          background: #1d4ed8;
        }

        /* Accessibility */
        @media (prefers-reduced-motion: reduce) {
          .picker {
            animation: none;
          }
        }

        /* Focus indicators */
        button:focus-visible,
        canvas:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      </style>

      <div class="picker" role="dialog" aria-modal="true" aria-labelledby="title">
        <div class="header">
          <h2 class="title" id="title">Seleccionar Color</h2>
          <button class="close-btn" aria-label="Cerrar selector de color">&times;</button>
        </div>
        
        <div class="preview-section">
          <div class="preview"></div>
          <div class="color-info">
            <div class="color-value">#FF0000</div>
            <div class="color-desc">Color seleccionado</div>
          </div>
        </div>
        
        <div class="canvas-section">
          <canvas class="sv-canvas" width="280" height="180" tabindex="0" 
                  aria-label="Seleccionar saturación y brillo. Use las flechas para ajustar."></canvas>
          <canvas class="hue-canvas" width="280" height="24" tabindex="0"
                  aria-label="Seleccionar matiz. Use las flechas izquierda y derecha para ajustar."></canvas>
        </div>
        
        <div class="input-section">
          <label class="hex-label" for="hex-input">HEX:</label>
          <input type="text" class="hex-input" id="hex-input" value="#FF0000"
                 maxlength="7" pattern="^#[0-9A-Fa-f]{3,6}$"
                 aria-describedby="hex-help">
        </div>
        
        <div class="buttons">
          <button class="cancel-btn" type="button">Cancelar</button>
          <button class="confirm-btn" type="button">Confirmar</button>
        </div>
      </div>
    `;

    // Cache DOM references
    this.picker = this.shadowRoot.querySelector('.picker');
    this.preview = this.shadowRoot.querySelector('.preview');
    this.colorValue = this.shadowRoot.querySelector('.color-value');
    this.svCanvas = this.shadowRoot.querySelector('.sv-canvas');
    this.hueCanvas = this.shadowRoot.querySelector('.hue-canvas');
    this.hexInput = this.shadowRoot.querySelector('.hex-input');
    
    // Canvas contexts
    this.svCtx = this.svCanvas.getContext('2d');
    this.hueCtx = this.hueCanvas.getContext('2d');
  }

  bindEvents() {
    // Button events
    const closeBtn = this.shadowRoot.querySelector('.close-btn');
    const cancelBtn = this.shadowRoot.querySelector('.cancel-btn');
    const confirmBtn = this.shadowRoot.querySelector('.confirm-btn');
    
    closeBtn.addEventListener('click', () => this.cancel());
    cancelBtn.addEventListener('click', () => this.cancel());
    confirmBtn.addEventListener('click', () => this.confirm());
    
    // Close on overlay click (only when clicking the backdrop, not the picker content)
    this.addEventListener('click', (e) => {
      if (e.target === this) {
        this.cancel();
      }
    });
    
    // Prevent clicks inside the picker from propagating to the overlay
    this.picker.addEventListener('click', (e) => {
      e.stopPropagation();
    });
    
    // Keyboard events
    this.addEventListener('keydown', this.handleKeydown.bind(this));
    
    // Canvas interactions
    this.svCanvas.addEventListener('pointerdown', this.handleSVPointerDown.bind(this));
    this.svCanvas.addEventListener('keydown', this.handleSVKeydown.bind(this));
    
    this.hueCanvas.addEventListener('pointerdown', this.handleHuePointerDown.bind(this));
    this.hueCanvas.addEventListener('keydown', this.handleHueKeydown.bind(this));
    
    // Hex input
    this.hexInput.addEventListener('input', this.handleHexInput.bind(this));
    this.hexInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.confirm();
      }
    });
  }

  renderCanvases() {
    this.renderHueCanvas();
    this.renderSVCanvas();
  }

  renderHueCanvas() {
    // Clear canvas
    this.hueCtx.clearRect(0, 0, 280, 24);
    
    // Create hue gradient
    const gradient = this.hueCtx.createLinearGradient(0, 0, 280, 0);
    for (let i = 0; i <= 6; i++) {
      const hue = (i / 6) * 360;
      gradient.addColorStop(i / 6, `hsl(${hue}, 100%, 50%)`);
    }
    
    this.hueCtx.fillStyle = gradient;
    this.hueCtx.fillRect(0, 0, 280, 24);
    
    // Draw marker
    this.drawHueMarker();
  }

  renderSVCanvas() {
    // Clear canvas
    this.svCtx.clearRect(0, 0, 280, 180);
    
    // Fill with current hue
    this.svCtx.fillStyle = `hsl(${this.hsv.h}, 100%, 50%)`;
    this.svCtx.fillRect(0, 0, 280, 180);
    
    // Saturation gradient (white to transparent)
    const satGradient = this.svCtx.createLinearGradient(0, 0, 280, 0);
    satGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    satGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    this.svCtx.fillStyle = satGradient;
    this.svCtx.fillRect(0, 0, 280, 180);
    
    // Value gradient (transparent to black)
    const valGradient = this.svCtx.createLinearGradient(0, 0, 0, 180);
    valGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    valGradient.addColorStop(1, 'rgba(0, 0, 0, 1)');
    this.svCtx.fillStyle = valGradient;
    this.svCtx.fillRect(0, 0, 280, 180);
    
    // Draw marker
    this.drawSVMarker();
  }

  drawHueMarker() {
    const x = (this.hsv.h / 360) * 280;
    
    // Draw marker line
    this.hueCtx.strokeStyle = 'white';
    this.hueCtx.lineWidth = 2;
    this.hueCtx.beginPath();
    this.hueCtx.moveTo(x, 0);
    this.hueCtx.lineTo(x, 24);
    this.hueCtx.stroke();
    
    // Draw black outline
    this.hueCtx.strokeStyle = 'black';
    this.hueCtx.lineWidth = 1;
    this.hueCtx.beginPath();
    this.hueCtx.moveTo(x - 1, 0);
    this.hueCtx.lineTo(x - 1, 24);
    this.hueCtx.moveTo(x + 1, 0);
    this.hueCtx.lineTo(x + 1, 24);
    this.hueCtx.stroke();
  }

  drawSVMarker() {
    const x = (this.hsv.s / 100) * 280;
    const y = (1 - this.hsv.v / 100) * 180;
    const radius = 8;
    
    // Draw outer white circle
    this.svCtx.strokeStyle = 'white';
    this.svCtx.lineWidth = 3;
    this.svCtx.beginPath();
    this.svCtx.arc(x, y, radius, 0, Math.PI * 2);
    this.svCtx.stroke();
    
    // Draw inner black circle
    this.svCtx.strokeStyle = 'black';
    this.svCtx.lineWidth = 1;
    this.svCtx.beginPath();
    this.svCtx.arc(x, y, radius - 2, 0, Math.PI * 2);
    this.svCtx.stroke();
  }

  handleSVPointerDown(e) {
    e.preventDefault();
    this.isDragging = true;
    this.svCanvas.setPointerCapture?.(e.pointerId);
    
    const handleMove = (e) => {
      const rect = this.svCanvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(280, ((e.clientX - rect.left) / rect.width) * 280));
      const y = Math.max(0, Math.min(180, ((e.clientY - rect.top) / rect.height) * 180));
      
      this.hsv.s = (x / 280) * 100;
      this.hsv.v = 100 - (y / 180) * 100;
      
      this.updateColor();
      this.renderSVCanvas();
    };
    
    const handleUp = () => {
      this.isDragging = false;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp, { once: true });
    
    // Initial update
    handleMove(e);
  }

  handleHuePointerDown(e) {
    e.preventDefault();
    this.isDragging = true;
    this.hueCanvas.setPointerCapture?.(e.pointerId);
    
    const handleMove = (e) => {
      const rect = this.hueCanvas.getBoundingClientRect();
      const x = Math.max(0, Math.min(280, ((e.clientX - rect.left) / rect.width) * 280));
      
      this.hsv.h = (x / 280) * 360;
      
      this.updateColor();
      this.renderCanvases();
    };
    
    const handleUp = () => {
      this.isDragging = false;
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
    
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp, { once: true });
    
    // Initial update
    handleMove(e);
  }

  handleSVKeydown(e) {
    const step = e.shiftKey ? 10 : 1;
    let changed = false;
    
    switch (e.key) {
      case 'ArrowLeft':
        this.hsv.s = Math.max(0, this.hsv.s - step);
        changed = true;
        break;
      case 'ArrowRight':
        this.hsv.s = Math.min(100, this.hsv.s + step);
        changed = true;
        break;
      case 'ArrowUp':
        this.hsv.v = Math.min(100, this.hsv.v + step);
        changed = true;
        break;
      case 'ArrowDown':
        this.hsv.v = Math.max(0, this.hsv.v - step);
        changed = true;
        break;
    }
    
    if (changed) {
      e.preventDefault();
      this.updateColor();
      this.renderSVCanvas();
    }
  }

  handleHueKeydown(e) {
    const step = e.shiftKey ? 10 : 1;
    let changed = false;
    
    switch (e.key) {
      case 'ArrowLeft':
        this.hsv.h = (this.hsv.h - step + 360) % 360;
        changed = true;
        break;
      case 'ArrowRight':
        this.hsv.h = (this.hsv.h + step) % 360;
        changed = true;
        break;
    }
    
    if (changed) {
      e.preventDefault();
      this.updateColor();
      this.renderCanvases();
    }
  }

  handleHexInput(e) {
    const value = e.target.value;
    
    // Use ColorManager for validation and normalization
    if (this.colorManager.isValidHex(value)) {
      const normalizedHex = this.colorManager.normalizeHex(value);
      if (normalizedHex !== this.currentColor) {
        this.setColor(normalizedHex);
      }
    }
  }

  handleKeydown(e) {
    // Global keyboard shortcuts
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.cancel();
        break;
      case 'Enter':
        if (e.target.tagName.toLowerCase() !== 'input') {
          e.preventDefault();
          this.confirm();
        }
        break;
    }
  }

  updateColor() {
    this.currentColor = this.hsvToHex(this.hsv.h, this.hsv.s, this.hsv.v);
    
    // Update UI
    this.style.setProperty('--current-color', this.currentColor);
    this.colorValue.textContent = this.currentColor;
    this.hexInput.value = this.currentColor;
    
    // Dispatch preview event
    this.dispatchEvent(new CustomEvent('colorpreview', {
      detail: { color: this.currentColor, hsv: { ...this.hsv } },
      bubbles: true
    }));
  }

  setColor(hex) {
    // Use ColorManager for normalization
    const normalizedHex = this.colorManager.normalizeHex(hex);
    this.currentColor = normalizedHex;
    this.hsv = this.hexToHsv(normalizedHex);
    
    // Update UI
    this.style.setProperty('--current-color', this.currentColor);
    this.colorValue.textContent = this.currentColor;
    this.hexInput.value = this.currentColor;
    
    this.renderCanvases();
  }

  // Public API methods
  open(initialColor = null) {
    if (initialColor && this.colorManager.isValidHex(initialColor)) {
      this.setColor(initialColor);
    }
    
    this.setAttribute('open', '');
  }

  show() {
    if (this.isOpen) return;
    
    this.isOpen = true;
    
    // Focus management
    this.previouslyFocusedElement = document.activeElement;
    
    // Focus the hex input after a short delay
    requestAnimationFrame(() => {
      this.hexInput?.focus();
      this.hexInput?.select();
    });
    
    // Dispatch open event
    this.dispatchEvent(new CustomEvent('colorpickeropen', { bubbles: true }));
  }

  hide() {
    if (!this.isOpen) return;
    
    this.isOpen = false;
    this.removeAttribute('open');
    
    // Restore focus
    if (this.previouslyFocusedElement && this.previouslyFocusedElement.focus) {
      try {
        this.previouslyFocusedElement.focus();
      } catch (e) {
        // Ignore focus errors
      }
    }
    
    // Dispatch close event
    this.dispatchEvent(new CustomEvent('colorpickerclose', { bubbles: true }));
  }

  confirm() {
    // Dispatch confirm event with color data
    this.dispatchEvent(new CustomEvent('colorconfirm', {
      detail: { 
        color: this.currentColor,
        hsv: { ...this.hsv }
      },
      bubbles: true
    }));
    
    this.hide();
  }

  cancel() {
    // Dispatch cancel event
    this.dispatchEvent(new CustomEvent('colorcancel', { bubbles: true }));
    
    this.hide();
  }

  // Color conversion utilities (leveraging ColorManager when possible)
  hsvToHex(h, s, v) {
    return this.colorManager.rgbToHex(...this.hsvToRgb(h, s, v));
  }

  hsvToRgb(h, s, v) {
    s = s / 100;
    v = v / 100;
    
    const c = v * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = v - c;
    
    let r, g, b;
    
    if (h >= 0 && h < 60) {
      r = c; g = x; b = 0;
    } else if (h >= 60 && h < 120) {
      r = x; g = c; b = 0;
    } else if (h >= 120 && h < 180) {
      r = 0; g = c; b = x;
    } else if (h >= 180 && h < 240) {
      r = 0; g = x; b = c;
    } else if (h >= 240 && h < 300) {
      r = x; g = 0; b = c;
    } else {
      r = c; g = 0; b = x;
    }
    
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255)
    ];
  }

  hexToHsv(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    const s = max === 0 ? 0 : diff / max;
    const v = max;
    
    if (diff !== 0) {
      if (max === r) {
        h = ((g - b) / diff) % 6;
      } else if (max === g) {
        h = (b - r) / diff + 2;
      } else {
        h = (r - g) / diff + 4;
      }
      h *= 60;
      if (h < 0) h += 360;
    }
    
    return { h, s: s * 100, v: v * 100 };
  }
}

// Register the custom element
customElements.define('color-picker-modal', ColorPickerModal);

export default ColorPickerModal;