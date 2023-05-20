class OptionsTools {
    constructor(actualTool, color, size){
        this.actualTool = actualTool;
        this.color = color;
        this.size = size;
        this.fillColor = false;
    }

    setToolSelected(tool){
        tool.forEach((element) => {
          element.addEventListener("click", ()=>{
            document.querySelector(".options .active").classList.remove("active");
            element.classList.add("active");
            this.actualTool = element.id;

          });
      });
    }

    setFillColor(check){ 
      this.fillColor = check; 
    }

    setSize(slider){
      slider.addEventListener("change", ()=>{
        this.size = slider.value;
      });
    }
    
    setColor(colors){
      colors.forEach(element =>{
        element.addEventListener("click", ()=>{
          document.querySelector(".options .selected").classList.remove("selected");
          element.classList.add("selected");
          this.color = window.getComputedStyle(element).getPropertyValue("background-color");
        });
      });
    }

    changeColorPicker(picker){
      picker.addEventListener("change", ()=>{
        picker.parentElement.style.background = picker.value;
        picker.parentElement.click();
      });
    }

    getColor() { return this.color; }
    getSize() { return this.size;}
    getActualTool() { return this.actualTool;}
    getFillColor() { return this.fillColor;}
}