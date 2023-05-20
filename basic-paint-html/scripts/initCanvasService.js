class initCanvasService{
    drawReact(width, height, colorRect, contextDraw){
        contextDraw.fillStyle = colorRect;
        contextDraw.fillRect(0, 0, width, height);
    }
    drawStrokeReact(width, height, colorStroke, contextDraw){
        contextDraw.strokeStyle = colorStroke;
        contextDraw.strokeRect(0, 0, width, height);
    }
    drawRectOnCoords(x, y, color, contextDraw){
        contextDraw.fillStyle = color;
        contextDraw.fillRect(x, y, 50, 50);
    }
}