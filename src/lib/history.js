import { deflate, inflate } from "pako";
const MAX_HISTORY_INDEX = 15;

const validateContext = (ctx)=>{
  if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
    throw new Error('Invalid canvas rendering 2D context');
  } else {
    return false;
  }
}
class CanvasHistory {
  _history;
  _historyIndex;

  constructor() {
    this._history = [];
    this._historyIndex = -1;
  }

  hasEntries() {
    return this._history.length > 0;
  }

  isInLast(){
    return this._historyIndex === this._history.length - 1;
  }

  update = (ctx, width, height) => {
    if (this._historyIndex < this._history.length - 1) {
      this._history = this._history.slice(0, this._historyIndex + 1);
    }

    const compressed = deflate(ctx.getImageData(0, 0, width, height).data);
    this._history.push({ data: compressed, w: width, h: height });
    this._historyIndex++;

    if (this._history.length > MAX_HISTORY_INDEX) {
      this._history.shift();
      this._historyIndex--;
    }
  };

  reset() {
    this._history = [];
    this._historyIndex = -1;
  };

  getLast() {
    if (!this.hasEntries()) {
      throw new Error("History no started");
    }
    return this._history[this._history.length - 1];
  }

  getDecompressed({ data, w, h }) {
    const decompressed = inflate(data);
    return new ImageData(new Uint8ClampedArray(decompressed), w, h);
  };

  goToLast = (ctx) => {
    if (validateContext(ctx)) return;
    const imgData = this.getDecompressed(this.getLast());
    ctx.putImageData(imgData, 0, 0);
  };

  undo = (ctx) => {
    if (this._historyIndex <= 0 || validateContext(ctx)) {
      return;
    }
    this.subIndex();
    const imgData = this.getDecompressed(this._history[this._historyIndex]);
    ctx.putImageData(imgData, 0, 0);
  };

  redo = (ctx) => {
    if (this._historyIndex >= history.length - 1 || validateContext(ctx)) return;
    this.addIndex();
    const imgData = this.getDecompressed(this._history[this._historyIndex]);
    ctx.putImageData(imgData, 0, 0);
  };
  subIndex(){
    this._historyIndex--;
  }
  addIndex(){
    this._historyIndex++;
  }
  get index() {
    return this._historyIndex;
  }
}

export default CanvasHistory;
