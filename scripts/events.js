/* 
Maneja el cambio de seleccion de las herramientas
*/
const changeActiveTool = (tool)=>
    tool.onclick = ()=>{
        document.querySelector(".options .active").classList.remove("active");
        tool.classList.add("active");
        configurator.actualTool = tool.id;
    };
tools.forEach(changeActiveTool);

/* 
    Define la opcion de color que esta seleccionada
*/
const changeSelectedOption = (option)=>{
    option.onclick = ()=>{
        document.querySelector(".options .selected").classList.remove("selected");//Quita la clase selected de la opcion que tiene
        option.classList.add("selected");//Se selecciona el nuevo elemento
        configurator.color = window.getComputedStyle(option).getPropertyValue("background-color");//Pone el color, igual al bg del elemento
    };
};
//color options es un array de todos los elementos con la clase "option"
colorOptions.forEach(changeSelectedOption);

/* 
    Maneja el cambio de color por el input color
*/
const eventChangeColor = ()=>{
    colorPicker.parentElement.style.background = colorPicker.value;
    configurator.color = colorPicker.value;
};
colorPicker.oninput = eventChangeColor;

/* 
 Maneja el evento de cambiar el tamaño del pincel
*/
const eventChangeSize = ()=>{
    configurator.size = sizeControl.value;
};
sizeControl.onchange = eventChangeSize;

/*
    Maneja el cambio de estado de relleno
*/
const changeCheckBox = (event)=>{
    configurator.paddingOn = event.target.checked;
};
paddingOn.addEventListener("change", changeCheckBox);


/* 
Maneja el inicio del evento de dibujar 
*/
const startDrawEvent = (event)=>{
    pencil.preparingTheBrush({axisX: event.offsetX, axisY: event.offsetY});//Aplica las configuraciones actuales
    canvas.canvas.addEventListener("mousemove", pencil.paint);//Se dibuja al mover el mouse
}
canvas.canvas.onmousedown= startDrawEvent;

/*
 Maneja el evento de terminar de dibujar
*/
const stopDrawEvent = ()=>{
    canvas.canvas.removeEventListener("mousemove", pencil.paint);//Se remueve el evento de mover el mouse
}
canvas.canvas.onmouseup = stopDrawEvent;//Se para al levantar al soltar el click
canvas.canvas.onmouseleave = stopDrawEvent;//Se para al sacar el mouse del lienzo

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

