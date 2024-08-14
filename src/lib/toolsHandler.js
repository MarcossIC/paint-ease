import toolMethods from "./draw";
import Pencil from "./pencil";

class ToolsHandler {
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
      color: "#000000",
      paddingColor: "transparent",
      size: 4,
      currentTool: defaultTool,
    };
  }

  useTool = (e) => {
    e.preventDefault();
    // Si no se esta dibujando no se ejecuta
    if (!this._pencil.isDrawing) return;
    // Asegura que solo se ejecute cada 60 FPS
    if(!this._pencil.isCorrectInterval()) return;
    //Recupera las cordenadas del puntero en el canvas
    const axis = this.getMousePosition(this._canvasElement, e);
    //Agregar al buffer de puntos
    this._pencil.buffer(axis);

     // Interpolación básica
     const lastPoint = this._pencil.pointsBuffer[this._pencil.pointsBuffer.length - 1];
     const distance = Math.sqrt(
         (axis[0] - lastPoint[0]) ** 2 + (axis[1] - lastPoint[1]) ** 2
     );
 
     if (distance > this._pencil.interpolationThreshold) {
         this._pencil.pointsBuffer.push(axis);
         this.interpolateAndDraw(lastPoint, axis);
     } else {
         this._pencil.pointsBuffer.push(axis);
         this.setCurrentAxis(axis);
         toolMethods[this._toolSetting.currentTool](this._toolState);
     }
  };

  drawPoints = () => {
    this._pencil.frameId = null;
  
    const buffer = this._pencil.pointsBuffer;
    const bufferSize = buffer.length;
    if (bufferSize > 1) {
      this._canvas.putImageData(); 
      for (let i = 0; i < bufferSize - 1; i++) {
        const start = buffer[i];
        const end = buffer[i + 1];
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const distance = this._pencil.calcDistance(dx,dy);
        
        if (distance > 5) {
          this.interpolateAndDraw(start, distance, dx, dy);
        } else {
          this.setCurrentAxis(end);
          toolMethods[this._toolSetting.currentTool](this._toolState);
        }
      }
      this._pencil.pointsBuffer = [buffer[bufferSize - 1]];
    }
  
    if (this._pencil.isDrawing) {
      this._pencil.frameId = requestAnimationFrame(this.drawPoints);
    }
  };

  interpolateAndDraw = (start, end) => {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];

    const steps = Math.max(Math.abs(dx), Math.abs(dy)) / this._pencil.stepReductionFactor;

    for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = start[0] + dx * t;
        const y = start[1] + dy * t;
        this.setCurrentAxis([x, y]);
        toolMethods[this._toolSetting.currentTool](this._toolState);
    }
  };

  getMousePosition(canvas, e) {
    const rect = canvas.getBoundingClientRect();
    //const scaleX = canvas.width / rect.width;
    //const scaleY = canvas.height / rect.height;
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

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

export default ToolsHandler;
