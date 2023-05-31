class Pencil {
  constructor(tools) {
    this.color = tools.getColor();
    this.size = tools.getSize();
    this.previusX = 0;
    this.previusY = 0;
  }

  brushDraw(cursorX, cursorY, context, tools) {
    context.strokeStyle = tools.getActualTool() === "eraser" ? "#fff" : tools.getColor();
    
    context.lineTo(cursorX, cursorY);
    context.stroke();
  }

  reactangleDraw(cursorX, cursorY, context, tools) {
    tools.getFillColor().checked ? 
        context.fillRect(cursorX, cursorY, this.previusX - cursorX, this.previusY - cursorY)
        :
        context.strokeRect(cursorX, cursorY, this.previusX - cursorX, this.previusY - cursorY);
  }
  circleDraw(cursorX, cursorY, context, tools){
    context.beginPath();
    let radius = Math.sqrt(Math.pow(this.previusX - cursorX, 2) + Math.pow(this.previusY - cursorY, 2));
    context.arc(this.previusX, this.previusY, radius, 0, Math.PI*2);

    tools.getFillColor().checked ? context.fill() : context.stroke();
  }

  triangleDraw(cursorX, cursorY, context, tools) {
    context.beginPath();
    context.moveTo(this.previusX, this.previusY);
    context.lineTo(cursorX, cursorY);
    context.lineTo(this.previusX * 2 - cursorX, cursorY);
    context.closePath();

    tools.getFillColor().checked ? context.fill() : context.stroke();
  }

  startDrawing(canvas){
    let context = canvas.getContext();
    context.lineWidth = this.size;
    context.strokeStyle = this.color;
    context.fillStyle = this.color;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();

    canvas.setSnapshot();
  }

  setColor(color) { this.color = color; }
  setSize(size) { this.size = size; }
  setPreviusX(previusX) { this.previusX = previusX; }
  setPreviusY(previusY) { this.previusY = previusY; }
}
