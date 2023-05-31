/* Definicion de clases */
const canvas = new Canvas( document.querySelector("canvas") );
const configurator = new BrushConfigurator("brush","#000",4);
const pencil = new Pencil(configurator, canvas);
/* Definicion de elementos HTML */
const 
tools = document.querySelectorAll(".tool"),
paddingOn = document.querySelector("#fill-color"),
sizeControl = document.querySelector("#size-control"),
colorOptions = document.querySelectorAll(".colors .option"),
colorPicker = document.querySelector("#color-picker"),
clearButton = document.getElementById("clear"),
saveButton = document.getElementById("save");


