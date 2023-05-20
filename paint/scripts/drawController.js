const 
optionsTools = new OptionsTools("brush", "black", 4),
canvas = new Canvas( document.querySelector("canvas") ),
pencil = new Pencil(optionsTools),
serviceCanvas = new CanvasService(canvas),
service = new DrawService(pencil, canvas, optionsTools);

const 
toolElement = document.querySelectorAll(".tool"),
fillColorElement = document.querySelector("#fill-color"),
sizeSliderElement = document.querySelector("#size-slider"),
colorElement = document.querySelectorAll(".colors .option"),
colorPicker = document.querySelector("#color-picker"),
clearButton = document.getElementById("clear"),
saveButton = document.getElementById("save");


optionsTools.setToolSelected( toolElement );
optionsTools.setFillColor( fillColorElement );
optionsTools.setSize( sizeSliderElement );
optionsTools.setColor( colorElement );
optionsTools.changeColorPicker( colorPicker );

serviceCanvas.clearCanvas( clearButton );
serviceCanvas.saveAsImage( saveButton );

canvas.getCanvas().addEventListener("mousedown", service.startDrawService);
canvas.getCanvas().addEventListener("mouseup", service.stopDrawService);
canvas.getCanvas().addEventListener("mouseleave", service.stopDrawService);
