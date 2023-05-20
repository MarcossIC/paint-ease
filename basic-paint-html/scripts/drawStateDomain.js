class DrawState{
    constructor(){
        this.color = "black";
        this.isMouseDown = false;
    }
    enableDrawing(){ this.isMouseDown = true; }
    disableDrawing(){ this.isMouseDown = false; }
    setColor(color){ this.color = color; }
    getColor(){ return this.color; }
    getIsMouseDown(){ return this.isMouseDown; }
}