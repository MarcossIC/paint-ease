class Pencil {
  //Lienzo en el que dibujar el pincel
  canvas;
  //Configuraciones del pincel
  configurator;
  constructor(configurator, canvas) {
    this.canvas = canvas;
    this.configurator = configurator;
  }

  /* Pinta encima del lienzo 
    Posdata:  
       La funcion esta definida de esta forma, porque en el mundo magico de JavaScript
          donde permite llamar a funciones como parametros, al hacer esto pierde el bind de Pencil
          imposibilitando el uso de atributos de clase, la solucion, hacer tu funcion un atributo de clase
          de esta forma la funcion seguira siendo funcion pero no perdera el bind de Pencil
  */
  paint = (event)=> {
    const actualTool = configurator.actualTool;
    const axes = {axisX: event.offsetX, axisY: event.offsetY};
    const toolMethods = {
      brush: ()=> this.canvas.drawLine(axes),
      eraser: ()=> this.canvas.eraser(axes),
      rectangle:() => this.canvas.drawRectangle(axes, this.configurator),
      circle: ()=> this.canvas.drawCircle(axes, this.configurator),
      triangle: ()=> this.canvas.drawTriangle(axes, this.configurator),
    };
    toolMethods[actualTool](); 
  }

  preparingTheBrush({axisX, axisY}){
    this.configurator.previousX = axisX;
    this.configurator.previousY = axisY;
    this.canvas.applySettings(configurator);
  }

}
