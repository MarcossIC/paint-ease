import {
  getCompressed,
  getDecompressed,
  validateContext as isValidContext,
} from './utils';

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
    if (this._historyIndex !== this._history.length - 1) {
      this._history = this._history.slice(0, this._historyIndex + 1);
    }

    this.forward();
    this._history.push(getCompressed(ctx.getImageData(0, 0, width, height)));

    if (this._history.length > MAX_HISTORY_INDEX) {
      this._history.shift();
      this.backward();
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
    if (!isValidContext(ctx)) return;
    const imgData = getDecompressed(this.getLast());
    ctx.putImageData(imgData, 0, 0);
  }

  undo(ctx) {
    if (!this.hasUndo() || !isValidContext(ctx)) return false;
    this.backward();
    const historyBackward = this._history[this._historyIndex];
    if (historyBackward) {
      const imgData = getDecompressed(historyBackward);
      ctx.putImageData(imgData, 0, 0);
    }
    return !historyBackward;
  }

  redo(ctx) {
    if (!this.hasRedo() || !isValidContext(ctx)) return;
    this.forward();
    const imgData = getDecompressed(this._history[this._historyIndex]);
    ctx.putImageData(imgData, 0, 0);
  }

  hasUndo() {
    return this._historyIndex >= 0;
  }

  hasRedo() {
    return this._historyIndex < this._history.length - 1;
  }

  backward() {
    this._historyIndex--;
  }

  forward() {
    this._historyIndex++;
  }

  get index() {
    return this._historyIndex;
  }
}
