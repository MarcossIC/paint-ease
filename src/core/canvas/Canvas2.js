/* eslint-disable import/prefer-default-export */
import { RoughCanvas } from 'roughjs/bin/canvas';
import { DeviceContext } from '../device';
import { HistoryHandler } from '../history';
import { store } from '../../state';
import { getNormalizedCanvasDimensions } from '../../utils/canvas';

export class Canvas {
  /** @type {HTMLCanvasElement} - Canvas HTML donde se dibuja. */
  _canvas;

  /** @type {CanvasRenderingContext2D} - Context de renderizado 2D del canvas. */
  _context2D;

  /** @type {ImageData} - Snapshot del estado actual del lienzo. */
  _snapshot;

  /** @type {HistoryHandler} - Manaja el historial del canvas. */
  _history;

  /** @type {DeviceContext} */
  _deviceContext;

  /** @type {boolean} */
  _isHolding;

  /** @type {RoughCanvas} rx */
  rc;

  /**
   * Crea un Canvas Object. Agrupa las funciones aplicadas al canvas
   *
   * @param {HTMLCanvasElement} canvasHtml
   */
  constructor(canvasHtml) {
    this._canvas = canvasHtml;
    this.rc = new RoughCanvas(canvasHtml);

    this._context2D = this._canvas.getContext('2d', { willReadFrequently: true });
    this._history = new HistoryHandler();
    this._snapshot = null;
    this._deviceContext = new DeviceContext();
    this._isHolding = false;
  }

  updateWidth(updated) {
    this._canvas.width = updated;
  }

  updateHeight(updated) {
    this._canvas.height = updated;
  }

  startCanvas = () => {
    const { zoom } = store.getState();
    const useScale = zoom !== 1 ? zoom : window.devicePixelRatio || 1;
    this.setCanvasScale(useScale);
    const [normalizedWidth, normalizedHeight] = getNormalizedCanvasDimensions(
      this._canvas,
      useScale
    );
    this._context2D.clearRect(0, 0, normalizedWidth, normalizedHeight);
    this._context2D.save();
    this._context2D.fillStyle = '#fafafa';
    this._context2D.strokeStyle = '#fafafa';
    this._context2D.fillRect(0, 0, normalizedWidth, normalizedHeight);
    this._context2D.restore();
  };

  setCanvasScale(scale) {
    this._context2D.setTransform(1, 0, 0, 1, 0, 0);
    this._context2D.scale(scale, scale);
  }

  resizeCanvas = () => {
    // Redimensionar el lienzo
    const { zoom } = store.getState();
    const useScale = zoom !== 1 ? zoom : window.devicePixelRatio || 1;
    this.setCanvasScale(useScale);

    // Redibujar si hay entradas en el historial
    if (this._history.hasEntries()) {
      this.redraw(this._context2D);
    }
    this.setSnapshot();
  };

  saveState() {
    this._history.update(this._context2D, this._canvas.width, this._canvas.height);
  }

  canvasUndo() {
    if (this._history.hasUndo()) {
      this.clear();
      const isLast = this._history.undo(this._context2D);
      if (isLast) this.clear();
    }
    return this._history.hasUndo();
  }

  canvasRedo() {
    if (this._history.hasRedo()) {
      this.clear();
      this._history.redo(this._context2D);
    }
    return this._history.hasRedo();
  }

  redraw(ctx) {
    this.clear();
    if (this._history.index >= 0) {
      this._history.goToLast(ctx);
    }
  }

  /* Aplica las formatos del configurator brush */
  applySettings({ color, size, paddingColor }) {
    this._context2D.strokeStyle = color; // Color de bordes
    this._context2D.fillStyle = paddingColor; // Color de relleno
    this._context2D.lineWidth = size; // Grozor de la linea
    this._context2D.lineCap = 'round';
    this._context2D.lineJoin = 'round';
    this._context2D.globalAlpha = 1.0;

    this.setSnapshot();
  }

  setMoveto(axis) {
    const [lastX, lastY] = axis;
    this._context2D.moveTo(lastX, lastY);
  }

  setSnapshot() {
    // Captura datos de la imagen del lienzo (es decir, cantidad de pixeles, tamaño, colores, etc)
    this._snapshot = this.context.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
  }

  restoreImageData() {
    this._context2D.putImageData(this._snapshot, 0, 0); //
  }

  /**
   * Obtiene los desplazamientos (offsets) del canvas.
   *
   * @returns {[number, number]} Un array con dos elementos: [offsetX, offsetY]
   */
  getCanvasOffsets() {
    if (!this._canvas) return [0, 0];

    const { left, top } = this._canvas.getBoundingClientRect();
    return [left, top];
  }

  getCanvasScale() {
    if (!this._canvas) return [0, 0];
    const { width, height } = this._canvas.getBoundingClientRect();

    return [this._canvas.width / width, this._canvas.height / height];
  }

  /* Limpiar Lienzo para dejarlo en blanco */
  clear() {
    const { zoom } = store.getState();
    const useScale = zoom !== 1 ? zoom : window.devicePixelRatio || 1;
    const [normalizedWidth, normalizedHeight] = getNormalizedCanvasDimensions(
      this._canvas,
      useScale
    );
    this._context2D.clearRect(0, 0, normalizedWidth, normalizedHeight);
    this._context2D.save();
  }

  get context() {
    return this._context2D;
  }

  get canvas() {
    return this._canvas;
  }

  get history() {
    return this._history;
  }

  get isHolding() {
    return this._isHolding;
  }
}
