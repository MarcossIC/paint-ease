class CanvasService{
    constructor(canvasDomain) {
        this.domain = canvasDomain;
    }

    clearCanvas(btn){
        btn.addEventListener("click", ()=>{
            this.domain.clear();
        });
    }

    saveAsImage(btn){
        btn.addEventListener("click", ()=>{
           this.domain.save( document.createElement("a") );
        });
    }
}