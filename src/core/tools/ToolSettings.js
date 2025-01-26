export class ToolSettings {
  constructor(defaultTool) {
    this.color = '#000000';
    this.paddingColor = 'transparent';
    this.size = 4;
    this.currentTool = defaultTool;
  }

  updateSettings({ color, paddingColor, size }) {
    if (color) this.color = color;
    if (paddingColor) this.paddingColor = paddingColor;
    if (size) this.size = size;
  }

  setCurrentTool(tool) {
    this.currentTool = tool;
  }
}
