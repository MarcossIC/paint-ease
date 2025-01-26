export const drawRectangle = ({ ctx, axis, last, isPaddingOn }) => {
  const [startX, startY] = axis;
  const [lastX, lastY] = last;

  if (isPaddingOn) ctx.fillRect(startX, startY, lastX - startX, lastY - startY);
  else ctx.strokeRect(startX, startY, lastX - startX, lastY - startY);
};

export const customRoundRect = ({ ctx, radius, width, height, last }) => {
  const [startX, startY] = last;
  const radiusX = Math.min(Math.abs(width) / 2, radius);
  const radiusY = Math.min(Math.abs(height) / 2, radius);
  const right = startX + width;
  const bottom = startY + height;

  ctx.moveTo(startX + Math.sign(width) * radiusX, startY);
  ctx.lineTo(right - Math.sign(width) * radiusX, startY);
  ctx.quadraticCurveTo(right, startY, right, startY + Math.sign(height) * radiusY);
  ctx.lineTo(right, bottom - Math.sign(height) * radiusY);
  ctx.quadraticCurveTo(right, bottom, right - Math.sign(width) * radiusX, bottom);
  ctx.lineTo(startX + Math.sign(width) * radiusX, bottom);
  ctx.quadraticCurveTo(startX, bottom, startX, bottom - Math.sign(height) * radiusY);
  ctx.lineTo(startX, startY + Math.sign(height) * radiusY);
  ctx.quadraticCurveTo(startX, startY, startX + Math.sign(width) * radiusX, startY);
};

export const drawRoundedRect = ({ ctx, axis, last, radius }) => {
  const [X, Y] = axis;
  const [startX, startY] = last;
  // WIDTH es la diferencia entre la posicion X inicial y X acutal
  const width = X - startX;
  // HEIGHT es la diferencia entre la posicion Y inicial y Y acutal
  const height = Y - startY;
  ctx.save();
  ctx.beginPath();
  if (!ctx.roundRect) {
    // Si no hay soporte para 'roundRect' se utiliza 'customRoundRect'
    customRoundRect({ ctx, radius, width, height, last });
  } else {
    const adjustedStartX = Math.abs(startX) + 0.5;
    const adjustedStartY = Math.abs(startY) + 0.5;
    ctx.roundRect(adjustedStartX, adjustedStartY, width, height, radius);
  }
  ctx.stroke();
  ctx.closePath();
  ctx.restore();
};
