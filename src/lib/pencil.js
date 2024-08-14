class Pencil {
  _isDrawing;
  _lastDrawTime;
  _drawInterval;
  _pointsBuffer;
  _frameId;
  _interpolationThreshold;
  _stepReductionFactor;

  constructor() {
    this._isDrawing = false;
    this._lastDrawTime = 0;
    this._drawInterval = 1000 / 60; //60 FPS
    this._interpolationThreshold = 6;//Distancia minima para interpolar
    this._stepReductionFactor = 4;//Cantidad de pasos en la interpolacion
    this._pointsBuffer = [];
    this._frameId = null;
  }

  isCorrectInterval(){
    const now = Date.now();
    if (now - this._lastDrawTime < this._drawInterval) return false;
    this._lastDrawTime = now;
    return true;
  }

  calcSteps(distance){
    return Math.max(Math.floor(distance), 1);
  }
  calcDistance(dx, dy){
    return Math.sqrt(dx * dx + dy * dy);
  }

  buffer(point){
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
    if (typeof value === "boolean") {
      this._isDrawing = value;
    } else {
      console.error("isDrawing must be an boolean");
    }
  }

  // Getter y Setter para _lastDrawTime
  get lastDrawTime() {
    return this._lastDrawTime;
  }

  set lastDrawTime(value) {
    if (typeof value === "number") {
      this._lastDrawTime = value;
    } else {
      console.error("lastDrawTime must be an number");
    }
  }

  // Getter y Setter para _drawInterval
  get drawInterval() {
    return this._drawInterval;
  }

  set drawInterval(value) {
    if (typeof value === "number") {
      this._drawInterval = value;
    } else {
      console.error("drawInterval must be an number");
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
      console.error("pointsBuffer must be an array");
    }
  }

  // Getter y Setter para _frameId
  get frameId() {
    return this._frameId;
  }

  set frameId(value) {
    if (value === null || typeof value === "number") {
      this._frameId = value;
    } else {
      console.error("frameId must be an number or null");
    }
  }
}

export default Pencil;