export const drawTriangle = ({ ctx, axis, last, isPaddingOn }) => {
  const [X, Y] = axis;
  const [lastX, lastY] = last;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(X, Y);
  ctx.lineTo(lastX * 2 - X, Y);
  ctx.closePath();

  if (isPaddingOn) ctx.fill();
  else ctx.stroke();
};
