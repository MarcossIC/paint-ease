import { store } from '../lib/appState';
import { getWorldElementsCompressed, getWorldElementsDecompressed } from '../utils/utils';

const MAX_HISTORY_INDEX = 50; // Aumentamos un poco para elementos del mundo

export default class WorldHistory {
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

  update = (worldElements) => {
    if (this._historyIndex !== this._history.length - 1) {
      this._history = this._history.slice(0, this._historyIndex + 1);
    }

    this.forward();
    // Compress the world elements before storing
    this._history.push(getWorldElementsCompressed(worldElements));

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

  goToLast() {
    if (!this.hasEntries()) return [];
    return getWorldElementsDecompressed(this.getLast());
  }

  undo() {
    if (!this.hasUndo()) return null;
    this.backward();
    const historyBackward = this._history[this._historyIndex];
    if (historyBackward) {
      return getWorldElementsDecompressed(historyBackward);
    }
    return [];
  }

  redo() {
    if (!this.hasRedo()) return null;
    this.forward();
    return getWorldElementsDecompressed(this._history[this._historyIndex]);
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

  // Get current state for comparison
  getCurrentState() {
    if (this._historyIndex >= 0 && this._historyIndex < this._history.length) {
      return getWorldElementsDecompressed(this._history[this._historyIndex]);
    }
    return [];
  }
}