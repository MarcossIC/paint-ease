class Pencil {
  _isDrawing;

  _lastDrawTime;

  _drawInterval;

  _pointsBuffer;

  _interpolationThreshold;

  _stepReductionFactor;

  /**
   * Create Pencil object.
   * @constructor
   */
  constructor() {
    this._isDrawing = false;
    this._lastDrawTime = 0;
    this._drawInterval = 1000 / 60;
    this._interpolationThreshold = 6;
    this._stepReductionFactor = 10;
    this._pointsBuffer = [];
  }

  isCorrectInterval() {
    const now = Date.now();
    if (now - this._lastDrawTime < this._drawInterval) return false;
    this._lastDrawTime = now;
    return true;
  }

  buffer(point) {
    this._pointsBuffer.push(point);
  }

  get stepReductionFactor() {
    return this._stepReductionFactor;
  }

  get interpolationThreshold() {
    return this._interpolationThreshold;
  }

  get isDrawing() {
    return this._isDrawing;
  }

  set isDrawing(value) {
    if (typeof value === 'boolean') {
      this._isDrawing = value;
    } else {
      console.error('isDrawing must be an boolean');
    }
  }

  // Getter y Setter para _lastDrawTime
  get lastDrawTime() {
    return this._lastDrawTime;
  }

  set lastDrawTime(value) {
    if (typeof value === 'number') {
      this._lastDrawTime = value;
    } else {
      console.error('lastDrawTime must be an number');
    }
  }

  // Getter y Setter para _drawInterval
  get drawInterval() {
    return this._drawInterval;
  }

  set drawInterval(value) {
    if (typeof value === 'number') {
      this._drawInterval = value;
    } else {
      console.error('drawInterval must be an number');
    }
  }

  // Getter y Setter para _pointsBuffer
  get pointsBuffer() {
    return this._pointsBuffer;
  }

  set pointsBuffer(value) {
    if (Array.isArray(value)) {
      this._pointsBuffer = value;
    } else {
      console.error('pointsBuffer must be an array');
    }
  }
}

export default Pencil;
