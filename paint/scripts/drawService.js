class DrawService {
    constructor(pencil, canvas, tools){
        this.pencil = pencil;    
        this.canvas = canvas;
        this.tools = tools;

        this.startDrawService = (event) =>{
            this.pencil.setColor(tools.getColor());
            this.pencil.setSize(tools.getSize());
            this.pencil.setPreviusX(event.offsetX);
            this.pencil.setPreviusY(event.offsetY);

            this.pencil.startDrawing(canvas);            
            canvas.getCanvas().addEventListener("mousemove", service.drawService);
        };

        this.drawService = (event) =>{
            canvas.setPutImage();
            const actualTool = tools.getActualTool();
            const toolMethods = {
                brush: () => this.pencil.brushDraw(event.offsetX, event.offsetY, canvas.getContext(), tools),
                eraser: () => this.pencil.brushDraw(event.offsetX, event.offsetY, canvas.getContext(), tools),
                rectangle: () => this.pencil.reactangleDraw(event.offsetX, event.offsetY, canvas.getContext(), tools),
                circle: () => this.pencil.circleDraw(event.offsetX, event.offsetY, canvas.getContext(), tools),
                triangle: () => this.pencil.triangleDraw(event.offsetX, event.offsetY, canvas.getContext(), tools),
            };
            toolMethods[actualTool]();
        };

        this.stopDrawService = (event) =>{
            this.canvas.getCanvas().removeEventListener("mousemove", this.drawService);
        };
    }
}

