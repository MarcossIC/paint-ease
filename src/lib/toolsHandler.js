import { drawMethods, drawCatmullRomSpline } from './draw';
import { TOOL_BRUSH_ID, TOOL_ERASER_ID } from '../utils/constants';
import { store } from './appState';

export default class ToolsHandler {
  _canvas;

  _toolState;

  _toolSetting;

  _points;

  constructor(canvas, defaultTool) {
    this._canvas = canvas;
    this._points = [];
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
    const { left, top } = this._canvas.canvas.getBoundingClientRect();

    return this.getFixedCoords([
      (evt.pageX - left) / zoom,
      (evt.pageY - top) / zoom,
    ]);
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
      drawMethods[tool](this._toolState);
    } else {
      this.drawPoints(axis);
      this.setPrevAxis(axis);
    }
  };

  drawPoints(axis) {
    this._points.push(axis);
    if (this._points.length >= 3) {
      drawCatmullRomSpline(this._toolState.ctx, this._points);
      // Mantén los últimos 3 puntos para la siguiente curva
      this._points = this._points.slice(-3);
    }
  }

  /* Prepara el pincel cuando se ejecuta pointer down */
  preparingTheBrush(e) {
    const axis = this.getMousePosition(e);
    this.setCurrentAxis(axis);
    this.setPrevAxis(axis);
    this._canvas.applySettings(this._toolSetting);
    this._toolState.ctx = this._canvas.context;
    // this._toolState.ctx.translate(0.5, 0.5); No funciona como esperaba...
    this._points = [axis];
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
