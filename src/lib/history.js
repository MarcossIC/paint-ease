import { getCompressed, getDecompressed, validateContext } from './utils';

const MAX_HISTORY_INDEX = 15;

export default class CanvasHistory {
  _history;

  _historyIndex;

  constructor() {
    this._history = [];
    this._historyIndex = -1;
  }

  hasEntries() {
    return this._history.length > 0;
  }

  isInLast() {
    return this._historyIndex === this._history.length - 1;
  }

  update = (ctx, width, height) => {
    if (this._historyIndex < this._history.length - 1) {
      this._history = this._history.slice(0, this._historyIndex + 1);
    }

    const compressed = getCompressed(ctx.getImageData(0, 0, width, height));

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
  }

  getLast() {
    if (!this.hasEntries()) {
      throw new Error('History no started');
    }
    return this._history[this._history.length - 1];
  }

  goToLast(ctx) {
    if (validateContext(ctx)) return;
    const imgData = getDecompressed(this.getLast());
    ctx.putImageData(imgData, 0, 0);
  }

  undo(ctx) {
    if (this._historyIndex <= 0 || validateContext(ctx)) {
      return;
    }
    this.subIndex();
    const imgData = this.getDecompressed(this._history[this._historyIndex]);
    ctx.putImageData(imgData, 0, 0);
  }

  redo(ctx) {
    if (this._historyIndex >= this._history.length - 1 || validateContext(ctx))
      return;
    this.addIndex();
    const imgData = this.getDecompressed(this._history[this._historyIndex]);
    ctx.putImageData(imgData, 0, 0);
  }

  subIndex() {
    this._historyIndex--;
  }

  addIndex() {
    this._historyIndex++;
  }

  get index() {
    return this._historyIndex;
  }
}
