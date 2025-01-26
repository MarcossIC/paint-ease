export class ToolState {
  constructor(canvas) {
    this.ctx = canvas.context;
    this.axis = [0, 0];
    this.last = [0, 0];
    this.isPaddingOn = false;
    this.radius = 10;
  }

  setCurrentAxis(axis) {
    this.axis = axis;
  }

  setPrevAxis(axis) {
    this.last = axis;
  }

  reset() {
    this.setPrevAxis([0, 0]);
    this.setCurrentAxis([0, 0]);
  }

  togglePadding() {
    this.isPaddingOn = !this.isPaddingOn;
  }
}
