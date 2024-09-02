import { drawMethods } from './draw';
import { TOOL_BRUSH_ID, TOOL_ERASER_ID } from '../constants';
import { store } from './appState';

export default class ToolsHandler {
  _canvas;

  _toolState;

  _toolSetting;

  constructor(canvas, defaultTool) {
    this._canvas = canvas;
    this._toolState = {
      ctx: canvas.context,
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
    const { zoom } = store.getState();
    const [left, top] = this._canvas.getCanvasOffsets();
    return [(evt.clientX - left) / zoom, (evt.clientY - top) / zoom];
  }

  /* Cuando dibuja, en pointer move */
  useTool = e => {
    e.preventDefault();

    const axis = this.getMousePosition(e);
    this.setCurrentAxis(axis);
    const tool = this._toolSetting.currentTool;
    const isDrawLine = tool === TOOL_BRUSH_ID || tool === TOOL_ERASER_ID;
    if (!isDrawLine) {
      this._canvas.restoreImageData();
    }
    drawMethods[tool](this._toolState);
    if (isDrawLine) {
      this.setPrevAxis(axis);
    }
  };

  /* Prepara el pincel cuando se ejecuta pointer down */
  preparingTheBrush(e) {
    const axis = this.getMousePosition(e);
    this.setCurrentAxis(axis);
    this.setPrevAxis(axis);
    this._canvas.applySettings(this._toolSetting);
    this._toolState.ctx = this._canvas.context;
  }

  resetToolState() {
    this.setPrevAxis([0, 0]);
    this.setCurrentAxis([0, 0]);
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
    return this._canvas.canvas;
  }

  set currentTool(updated) {
    this._toolSetting.currentTool = updated;
  }

  get currentTool() {
    return this._toolSetting.currentTool;
  }
}
