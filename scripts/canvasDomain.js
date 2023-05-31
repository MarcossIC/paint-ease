class Canvas {
    canvas;
    context;
    snapshot;
    
    constructor(canvasElement) {
      this.canvas = canvasElement;
      this.context = this.canvas.getContext("2d");

      window.addEventListener("load", ()=>{
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
      });
      this.snapshot = undefined;
    }

    clear(){
      this.context.clearRect(0,0, this.canvas.width, this.canvas.height);
    }
    
    save(link){
      link.download = `${Date.now()}.jpg`;
      link.href = this.canvas.toDataURL();
      link.click();
    }

    getContext(){ return this.context; }
    getCanvas(){ return this.canvas; }

    setSnapshot(){
      this.snapshot = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }

    setPutImage(){
      this.context.putImageData(this.snapshot, 0, 0);
    }
    
    getSnapshot(){
      return this.snapshot;
    }
}