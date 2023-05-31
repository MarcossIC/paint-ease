class Canvas {
    //Lienzo donde se dibuja
    canvas;
    //El contexto es la forma en la que dibujas dentro de este lienzo
    context;
    snapshot;
    
    constructor(canvasElement) {
      this.canvas = canvasElement;
      this.context = this.canvas.getContext("2d");
      window.addEventListener("load", ()=>{
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
      });
      this.snapshot = null;
    }
    
    /* Aplica las formatos del configurator brush */
    applySettings(configurator){
      this.context.strokeStyle = configurator.color;
      this.context.fillStyle = configurator.color;
      this.context.lineWidth = configurator.size;
      this.context.lineCap = "round";
      this.context.lineJoin = "round";
      this.context.beginPath();

      this.setSnapshot();
    }
    setSnapshot(){
      this.snapshot = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
    }
    putImageData(){
      this.context.putImageData(this.snapshot, 0, 0);
    }

    /* Pinta en el lienzo*/
    drawLine(axes){
      this.context.lineTo(axes.axisX, axes.axisY);
      this.context.stroke();
    }
    /* Borrar en el lienzo */
    eraser(axes){
      this.context.strokeStyle = "#fff";
      this.context.lineTo(axes.axisX, axes.axisY);
      this.context.stroke();
    }

    /* Dibuja en forma de rectangulo */
    drawRectangle(axes, configurator) {
      configurator.paddingOn
      ? this.context.fillRect(axes.axisX, axes.axisY, configurator.previousX - axes.axisX,configurator.previousY - axes.axisY)
      : this.context.strokeRect(axes.axisX, axes.axisY, configurator.previousX  - axes.axisX,configurator.previousY - axes.axisY);
    }
    
    /* Dibuja en forma de circulo */
    drawCircle(axes, configurator){
      this.context.beginPath();
      let radius = Math.sqrt(Math.pow(configurator.previousX - axes.axisX, 2) + Math.pow(configurator.previousY - axes.axisY, 2));
      this.context.arc(configurator.previousX, configurator.previousY, radius, 0, Math.PI*2);

      configurator.paddingOn ? this.context.fill() : this.context.stroke();
    }
    /* Dibuja en forma de triangulo */
    drawTriangle(axes, configurator) {
      this.context.beginPath();
      this.context.moveTo(configurator.previousX,configurator.previousY);
      this.context.lineTo(axes.axisX, axes.axisY);
      this.context.lineTo(configurator.previousX * 2 - axes.axisX, axes.axisY);
      this.context.closePath();
  
      configurator.paddingOn
      ? this.context.fill() 
      : this.context.stroke();
    }


    /* Limpiar Lienzo para dejarlo en blanco */
    clear(){
      this.context.clearRect(0,0, this.canvas.width, this.canvas.height);
    }
    /* Guardar el lienzo en una imagen jpg*/
    saveAsImage(link){
      link.download = `${Date.now()}.jpg`;
      link.href = this.canvas.toDataURL();
      link.click();
    }

    get context(){ return this.context; }
    get canvas(){ return this.canvas; }
    
    get snapshot(){
      return this.snapshot;
    }
}