class BrushConfigurator {
    //Herramienta actual
    actualTool;
    //Color actual del pincel
    color;
    //Tamaño actual del pincel
    size;
    //Estado de relleno activo/desactivado
    paddingOn;
    //Coorrdenada anterior donde se dibujo
    previousX;
    previousY;
    
    constructor(actualTool, color, size){
        this.actualTool = actualTool;
        this.color = color;
        this.size = size;
        this.paddingOn = false;
        this.previousX = 0;
        this.previousY = 0;
    }
  
    set color(color) {
        this.color = color;
    }
    set size(size) {
        this.size = size;
    }
    set paddingOn(paddingOn) {
        this.paddingOn = paddingOn;
    }
    set previousX(previousX) {
        this.previousX = previousX;
    }
    set previousY(previousY) {
        this.previousY = previousY;
    }

    get actualTool() {
        return this.actualTool;
    }
    get color() {
        return this.color;
    }
    get size() {
        return this.size;
    }
    get paddingOn() {
        return this.paddingOn;
    }
    get previousX() {
        return this.previousX;
    }
    get previousY() {
        return this.previousY;
    }
  }