/* 
Maneja el cambio de seleccion del tool 
*/
const changeActiveTool = (tool)=>
    tool.onclick = ()=>{
        document.querySelector(".options .active").classList.remove("active");
        tool.classList.add("active");
        configurator.actualTool = tool.id;
    };
tools.forEach(changeActiveTool);

/* 
Define el color del pincel en base a las opciones 
*/
const changeSelectedOption = (option)=>{
    option.onclick = ()=>{
        console.log("Entre al onclick");
        document.querySelector(".options .selected").classList.remove("selected");
        option.classList.add("selected");
        configurator.color = window.getComputedStyle(option).getPropertyValue("background-color");
    };
};
    
colorOptions.forEach(changeSelectedOption);

/* 
Cambia el background del input color, para que se pueda definir el color del pincel 
*/
const changeColor = ()=>{
    colorPicker.parentElement.style.background = colorPicker.value;
    colorPicker.parentElement.click();
};
colorPicker.onchange = changeColor;

/* 
Cambia el tamaño del pincel si se modifica el valor del controlador 
*/
const cahngeSize = ()=>{
    configurator.size = sizeControl.value;
};
sizeControl.onchange = cahngeSize;

/*
    Vinculo el estado del checkBox a la clase
*/



const changeCheckBox = (event)=>{
    configurator.paddingOn = event.target.checked;
};
paddingOn.addEventListener("change", changeCheckBox);


/* 
Maneja el inicio del evento de dibujar 
*/

const startDrawEvent = (event)=>{
    pencil.preparingTheBrush({axisX: event.offsetX, axisY: event.offsetY});
    canvas.canvas.addEventListener("mousemove", pencil.paint);
}
canvas.canvas.onmousedown= startDrawEvent;

/*
 Maneja el evento de terminar de dibujar
*/
const stopDrawEvent = (event)=>{
    canvas.canvas.removeEventListener("mousemove", pencil.paint);
}
canvas.canvas.onmouseup = stopDrawEvent;
canvas.canvas.onmouseleave = stopDrawEvent;

/*
    Maneja el evento de limpiar el canvas 
*/
const clearCanvasEvent = ()=>{
    canvas.clear();
}
clearButton.onclick = clearCanvasEvent;

/* 
Maneja el evento de guardar el canvas como imagen
*/
const saveCanvasAsImageEvent = ()=>{
    canvas.saveAsImage( document.createElement("a") );
}
saveButton.onclick = saveCanvasAsImageEvent;

