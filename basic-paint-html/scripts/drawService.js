class DrawService {
    constructor(canvas, palette, drawState){
        this.canvas = canvas;
        this.palette = palette;
        this.drawState = drawState;
    }
    drawingClickMove(){
        this.canvas.getMainCanvas().onmousemove =(event)=> { 
            this.canvas.drawCircle(this.drawState, event); 
        };
    }
    drawingClick(){
        this.canvas.getMainCanvas().onclick =(event)=> { 
            this.canvas.drawCircle(this.drawState, event); 
        };
    }
    controlDrawing(){
        this.canvas.getMainCanvas().onmousedown = () =>{ this.drawState.enableDrawing(); }
        this.canvas.getMainCanvas().onmouseup = () =>{ this.drawState.disableDrawing(); }
    }
    selectColor(){
        this.palette.getPaletteCanva().onclick = (event)=> { 
            this.palette.setColor(event, this.drawState);
        };
    }
}