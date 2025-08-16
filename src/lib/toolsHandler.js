import { drawMethods, drawCatmullRomSpline } from './draw';
import { TOOL_BRUSH_ID, TOOL_ERASER_ID, TOOL_CLICK_ID } from '../utils/constants';
import { store } from './appState';

export default class ToolsHandler {
  _canvas;
  _infiniteCanvas;
  _toolState;
  _toolSetting;
  _points;

  constructor(canvas, infiniteCanvas, defaultTool) {
    this._canvas = canvas; // Keep for backward compatibility, but not used
    this._infiniteCanvas = infiniteCanvas;
    this._points = [];
    this._toolState = {
      axis: [0, 0],
      last: [0, 0],
      isPaddingOn: false,
      radius: 10,
    };
    this._toolSetting = {
      color: '#000000',
      paddingColor: 'transparent',
      size: 4,
      currentTool: defaultTool,
    };
  }

  getMousePosition(evt) {
    // Always use infinite canvas for coordinate conversion
    return this._infiniteCanvas.screenToWorld(evt.clientX, evt.clientY);
  }

  /* Cuando dibuja, en pointer move */
  useTool = e => {
    e.preventDefault();

    const tool = this._toolSetting.currentTool;
    
    if (tool === TOOL_CLICK_ID) {
      // Handle panning
      this._infiniteCanvas.updatePan(e.clientX, e.clientY);
      return;
    }

    const worldPos = this.getMousePosition(e);
    const isDrawLine = tool === TOOL_BRUSH_ID || tool === TOOL_ERASER_ID;

    if (isDrawLine) {
      // Add point to current stroke in world coordinates
      this._infiniteCanvas.addPointToStroke(worldPos.x, worldPos.y);
    } else {
      // Update current shape in world coordinates
      this._infiniteCanvas.updateShape(worldPos.x, worldPos.y);
    }
  };

  // Legacy function - no longer used with InfiniteCanvas
  drawPoints(axis) {
    // This function is obsolete with InfiniteCanvas
    // All drawing is handled by InfiniteCanvas methods
  }

  /* Prepara el pincel cuando se ejecuta pointer down */
  preparingTheBrush(e) {
    const tool = this._toolSetting.currentTool;
    
    if (tool === TOOL_CLICK_ID) {
      // Start panning
      this._infiniteCanvas.startPan(e.clientX, e.clientY);
      return;
    }

    const worldPos = this.getMousePosition(e);
    const isDrawLine = tool === TOOL_BRUSH_ID || tool === TOOL_ERASER_ID;

    if (isDrawLine) {
      // Start new stroke in world coordinates
      this._infiniteCanvas.startStroke(worldPos.x, worldPos.y, this._toolSetting);
    } else {
      // Start new shape in world coordinates
      this._infiniteCanvas.startShape(worldPos.x, worldPos.y, this._toolSetting);
    }
  }

  /**
   * Sirve para evitar un bug al dibujar en cordenadas verticales u horizantales con linewidth par o impares.
   * Linewidth es impar, es mejor que la coord termine con .5.
   * Linewdith, es par, es mejor que sea un numero entero.
   *
   * @param {[number, number]} axis
   * @returns {[number, number]}
   */
  getFixedCoords(axis) {
    const [X, Y] = axis;
    const { size } = this._toolSetting;
    const isEven = size % 2 === 0;
    if (isEven) return [Math.round(X), Math.round(Y)];

    return [Math.floor(X) + 0.5, Math.floor(Y) + 0.5];
  }

  resetToolState() {
    this.setPrevAxis([0, 0]);
    this.setCurrentAxis([0, 0]);
    this._points = [];
    
    // Reset infinite canvas states
    if (this._infiniteCanvas.currentStroke) {
      this._infiniteCanvas.currentStroke = null;
    }
    
    if (this._infiniteCanvas.currentShape) {
      this._infiniteCanvas.currentShape = null;
    }
    
    // Stop any ongoing panning
    if (this._infiniteCanvas.isPanning) {
      this._infiniteCanvas.stopPan();
    }
    
    // Redraw to clear any temporary shapes
    this._infiniteCanvas.redraw();
  }

  setCurrentAxis(axis) {
    this._toolState.axis = axis;
  }

  setPrevAxis(axis) {
    this._toolState.last = axis;
  }

  togglePaddingOn() {
    this._toolState.isPaddingOn = !this._toolState.isPaddingOn;
  }

  get _canvasElement() {
    return this._infiniteCanvas.canvas;
  }

  set currentTool(updated) {
    this._toolSetting.currentTool = updated;
  }

  get currentTool() {
    return this._toolSetting.currentTool;
  }

  setColor(hexColor) {
    if (typeof hexColor === 'string' && hexColor) {
      this._toolSetting.color = hexColor;
      // Sync global state for UI subscriptions
      try {
        store.setState({ currentColor: hexColor });
      } catch {}
    }
  }

  startPanning(e) {
    const { panOffsetX, panOffsetY } = store.getState();
    const { left, top } = this._infiniteCanvas.canvas.getBoundingClientRect();
    
    this._panStart = {
      x: e.pageX - left,
      y: e.pageY - top,
      offsetX: panOffsetX,
      offsetY: panOffsetY,
    };
    
    store.setState({ isPanning: true });
  }

  updatePanning(e) {
    if (!this._panStart) return;
    
    const { left, top } = this._infiniteCanvas.canvas.getBoundingClientRect();
    const currentX = e.pageX - left;
    const currentY = e.pageY - top;
    
    const deltaX = currentX - this._panStart.x;
    const deltaY = currentY - this._panStart.y;
    
    store.setState({
      panOffsetX: this._panStart.offsetX + deltaX,
      panOffsetY: this._panStart.offsetY + deltaY,
    });
  }

  stopPanning() {
    this._infiniteCanvas.stopPan();
  }

  // Finish current drawing operation
  finishDrawing() {
    const tool = this._toolSetting.currentTool;
    
    if (tool === TOOL_CLICK_ID) {
      this.stopPanning();
      return;
    }

    const isDrawLine = tool === TOOL_BRUSH_ID || tool === TOOL_ERASER_ID;

    if (isDrawLine) {
      // Finish current stroke
      this._infiniteCanvas.finishStroke();
    } else {
      // Finish current shape
      this._infiniteCanvas.finishShape();
    }
  }

  // Handle zoom
  handleZoom(e, deltaY) {
    const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
    this._infiniteCanvas.zoom(e.clientX, e.clientY, zoomFactor);
  }
}
