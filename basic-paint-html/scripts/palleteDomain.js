class Palette {
    constructor(paletteElement) {
      this.palette = paletteElement;
      this.context = paletteElement.getContext("2d");
      this.colorRangeTop = this.createColorRange(0, 600, 50, 
        ["red", "green", "yellow", "blue", "black", "white", 
        "orange", "skyblue", "purple", "pink", "grey", "rosybrown"]);
      this.colorRangeBot = this.createColorRange(0, 600, 50, 
        ["maroon", "goldenrod", "limegreen", "coral", "silver", "antiquewhite", 
        "crimson", "mediumorchid", "mediumspringgreen", "sienna", "slategrey", "peachpuff"]);
    }
    initPalette() {
        const init = new initCanvasService();
        init.drawReact(600, 100, "white", this.context);
        init.drawStrokeReact(600, 100, "black", this.context);
    
        this.colorRangeTop.forEach( ({ start, end, color })=>{ 
            init.drawRectOnCoords(start, 0, color, this.context);
        });
        this.colorRangeBot.forEach( ({ start, end, color })=>{
            init.drawRectOnCoords(start, 50, color, this.context);
        });
    }
    setColor(event, drawState) {
        const x = event.clientX - this.palette.offsetLeft;
        const y = event.clientY - this.palette.getBoundingClientRect().top+0.75;
        const range = (y >= 0 && y < 50) ? 
            this.colorRangeTop.find(range => x >= range.start && x <= range.end) 
                                        :
            this.colorRangeBot.find(range => x >= range.start && x <= range.end);
        drawState.setColor(range.color);
    }
    createColorRange(start, end, step, colors) {
        return Array.from(
          { length: (end - start)/step },
          (_, i) => ({ start: i * step, end: (i + 1) * step,  color: colors[i] }));
    }
    getPaletteCanva(){ return this.palette; }
}