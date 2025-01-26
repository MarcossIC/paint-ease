import { TOOL_BRUSH_ID, TOOL_ERASER_ID } from '../../constants/tools';
import { store } from '../../state';
import { ToolState } from './ToolState';
import { ToolSettings } from './ToolSettings';
import { isEven } from '../../utils/math';
import { drawMethods, drawCatmullRomSpline } from '../drawing';

export class ToolsHandler {
  /** @type {import('../canvas').Canvas} - Clase de dominio para manejar el canvas */
  _canvas;

  _toolState;

  _toolSetting;

  _points;

  constructor(canvas, defaultTool) {
    this._canvas = canvas;
    this._points = [];
    this._toolState = new ToolState(canvas);
    this._toolSetting = new ToolSettings(defaultTool);
  }

  /**
   * Ajusta las coordenadas para alinear correctamente con el cursor
   * Linewidth es impar, es mejor que la coord termine con .5.
   * Linewdith, es par, es mejor que sea un numero entero.
   *
   * @param {[number, number]} axis
   * @returns {[number, number]}
   */
  getFixedCoords(axis) {
    const [X, Y] = axis;
    const { size } = this._toolSetting;
    const offset = isEven(size) ? 0 : 0.5;

    return [Math.floor(X) + offset, Math.floor(Y) + offset];
  }

  getMousePosition(evt) {
    const { zoom } = store.getState();
    const [left, top] = this._canvas.getCanvasOffsets();
    const [scaleX, scaleY] = this._canvas.getCanvasScale();
    const browserZoom = window.devicePixelRatio;
    const x = ((evt.clientX * browserZoom - left * browserZoom) * scaleX) / zoom;
    const y = ((evt.clientY * browserZoom - top * browserZoom) * scaleY) / zoom;

    return this.getFixedCoords([x, y]);
  }

  /* Cuando dibuja, en pointer move */
  useTool = axis => {
    const fixedAxis = this.getFixedCoords(axis);
    this._toolState.setCurrentAxis(fixedAxis);
    const tool = this._toolSetting.currentTool;
    const isDrawLine = tool === TOOL_BRUSH_ID || tool === TOOL_ERASER_ID;

    if (isDrawLine) {
      drawMethods[tool](this._toolState);
      this._toolState.setPrevAxis(fixedAxis);
      // this.drawPoints(fixedAxis);
    } else {
      this._canvas.restoreImageData();
      drawMethods[tool](this._toolState);
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
  preparingTheBrush(axis) {
    this._toolState.setCurrentAxis(axis);
    this._toolState.setPrevAxis(axis);
    this._canvas.applySettings(this._toolSetting);
    this._toolState.ctx = this._canvas.context;
    // this._toolState.ctx.translate(0.5, 0.5); No funciona como esperaba...
    this._points = [axis];
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
