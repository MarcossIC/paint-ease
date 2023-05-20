class Canvas {
    constructor(canvasElement) {
      this.canvas = canvasElement;
      this.context = canvasElement.getContext("2d");
    }
    initCanvas() {
      let init = new initCanvasService();
      init.drawReact(600, 400, "white", this.context);
      init.drawStrokeReact(600, 400, "black", this.context);
    }
    drawCircle(drawState, event) {
      if(drawState.getIsMouseDown() || event.type === "click"){
        let x= event.x - this.canvas.offsetLeft;
        let y= event.y - this.canvas.offsetTop;
        this.context.fillStyle = drawState.getColor();
        this.context.beginPath();
        this.context.arc(x, y, 8, 0, Math.PI*2);
        this.context.fill();
      }
    }
    getMainCanvas(){ return this.canvas; } 
}