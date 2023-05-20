const drawState = new DrawState();

const canvas = new Canvas( document.getElementById("canvas") );
canvas.initCanvas();

const palette = new Palette( document.getElementById("palette") );
palette.initPalette();

const service = new DrawService(canvas, palette, drawState);
service.selectColor();   
service.controlDrawing();
service.drawingClick();  
service.drawingClickMove();







