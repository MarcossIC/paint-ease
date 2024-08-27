import { drawMethods } from './draw';
import Pencil from './pencil';

export default class ToolsHandler {
  _canvas;

  _toolState;

  _toolSetting;

  _pencil;

  constructor(canvas, defaultTool) {
    this._canvas = canvas;
    this._pencil = new Pencil();
    this._toolState = {
      ctx: canvas.context,
      axis: { X: 0, Y: 0 },
      prev: { X: 0, Y: 0 },
      isPaddingOn: false,
    };
    this._toolSetting = {
      color: '#000000',
      paddingColor: 'transparent',
      size: 4,
      currentTool: defaultTool,
    };
  }

  useTool = e => {
    e.preventDefault();
    // No ejeucta si, no se esta dibujando
    if (!this._pencil.isDrawing) return;

    // Recupera las cordenadas del puntero en el canvas
    const axis = [e.offsetX, e.offsetY];
    // Agregar al buffer de puntos
    this._pencil.buffer(axis);
    this._canvas.putImageData();
    this.setCurrentAxis(axis);
    drawMethods[this._toolSetting.currentTool](this._toolState);

    /*
    // Interpolación
    const lastPoint =
      this._pencil.pointsBuffer[this._pencil.pointsBuffer.length - 1];
    const distance = Math.sqrt(
      (axis[0] - lastPoint[0]) ** 2 + (axis[1] - lastPoint[1]) ** 2
    );

    if (distance > this._pencil.interpolationThreshold) {
      this.interpolateAndDraw(lastPoint, axis);
    }

    this._pencil.pointsBuffer.push(axis);
    this.setCurrentAxis(axis);
    drawMethods[this._toolSetting.currentTool](this._toolState); */
  };

  interpolateAndDraw = (start, end) => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];

    const steps = Math.ceil(
      Math.max(Math.abs(dx), Math.abs(dy)) / this._pencil.stepReductionFactor
    );

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = start[0] + dx * t;
      const y = start[1] + dy * t;
      this.setCurrentAxis([x, y]);
      drawMethods[this._toolSetting.currentTool](this._toolState);
    }
  };

  /* Captura las parametros del pincel (coords donde se empieza, colores, tamaños, nueva image data) */
  preparingTheBrush(axes) {
    this.setPrevAxis(axes);
    this._canvas.applySettings(this._toolSetting);
    this._toolState.ctx = this._canvas.context;
  }

  resetToolState() {
    this.setPrevAxis([0, 0]);
    this.setCurrentAxis([0, 0]);
  }

  setCurrentAxis([X, Y]) {
    this._toolState.axis.X = X;
    this._toolState.axis.Y = Y;
  }

  setPrevAxis([X, Y]) {
    this._toolState.prev.X = X;
    this._toolState.prev.Y = Y;
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

  get isDrawing() {
    return this._pencil.isDrawing;
  }

  set isDrawing(updated) {
    this._pencil.isDrawing = updated;
  }

  get pencil() {
    return this._pencil;
  }
}
