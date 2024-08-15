import CanvasHistory from './history';

export default class Canvas {
  // Lienzo donde se dibuja
  _canvas;

  // El contexto es la forma en la que dibujas dentro de este lienzo
  _context2D;

  _snapshot;

  _history;

  constructor(canvasHtml) {
    this._canvas = canvasHtml;
    this._context2D = this._canvas.getContext('2d');
    this._history = new CanvasHistory();
    this._snapshot = null;
    window.addEventListener('load', () => {
      this._canvas.width = this._canvas.offsetWidth;
      this._canvas.height = this._canvas.offsetHeight;
      this._context2D.fillStyle = '#fafafa';
      this._context2D.strokeStyle = '#fafafa';
      this._context2D.fillRect(0, 0, this._canvas.width, this._canvas.height);
      this.setSnapshot();
    });
    window.addEventListener('resize', this.resizeCanvas.bind(this));
  }

  saveState() {
    this._history.update(this._context2D, this._canvas.width, this._canvas.height);
  }

  goBackHistory() {
    if (this._history.index <= 0) {
      this.clear();
      this._history.subIndex();
    } else {
      this._history.undo(this._context2D);
    }
    return this._history.index === -1;
  }

  redraw(ctx) {
    this.clear();
    if (this._snapshot || this._history.index >= 0) {
      this._history.goToLast(ctx);
    }
  }

  resizeCanvas() {
    // Redimensionar el lienzo
    this._canvas.width = this._canvas.offsetWidth;
    this._canvas.height = this._canvas.offsetHeight;

    // Redibujar el contenido ajustado al nuevo tamaño del lienzo
    // Si no hay entradas en el historial, no se dibuja nada
    if (this._history && this._history.hasEntries()) {
      this.redraw(this._context2D);
    }
  }

  /* Aplica las formatos del configurator brush */
  applySettings({ color, size, paddingColor }) {
    this._context2D.strokeStyle = color; // Color de bordes
    this._context2D.fillStyle = paddingColor; // Color de relleno
    this._context2D.lineWidth = size; // Grozor de la linea
    this._context2D.lineCap = 'round';
    this._context2D.lineJoin = 'round';
    this._context2D.beginPath();
    this.setSnapshot(); // Guarda
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

  putImageData() {
    this._context2D.putImageData(this._snapshot, 0, 0); //
  }

  /* Limpiar Lienzo para dejarlo en blanco */
  clear() {
    this._context2D.clearRect(0, 0, this._canvas.width, this._canvas.height);
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
}
