export const drawLine = ({ ctx, axis, last }) => {
  const [currentX, currentY] = axis;
  const [lastX, lastY] = last;

  // Comenzar un nuevo trazo
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);

  // Calcular la distancia entre puntos
  const distX = currentX - lastX;
  const distY = currentY - lastY;
  const distance = Math.sqrt(distX * distX + distY * distY);

  // Ajustar los pasos según la distancia para un trazo más suave
  const minSteps = 2;
  const stepsPerPixel = 0.5;
  const steps = Math.max(minSteps, Math.ceil(distance * stepsPerPixel));

  // Interpolar puntos para un trazo más suave
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = lastX + distX * t;
    const y = lastY + distY * t;
    ctx.lineTo(x, y);
  }

  ctx.stroke();
  ctx.closePath();
};

export const eraser = ({ ctx, axis, last }) => {
  // El borrador debería comportarse como el pincel para mantener consistencia
  ctx.globalCompositeOperation = 'destination-out';
  drawLine({ ctx, axis, last });
  ctx.globalCompositeOperation = 'source-over';
};
