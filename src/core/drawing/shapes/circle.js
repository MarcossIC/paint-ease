export const drawCircle = ({ ctx, axis, last, isPaddingOn }) => {
  const [X, Y] = axis;
  const [lastX, lastY] = last;
  ctx.beginPath();

  const radius = Math.sqrt((lastX - X) ** 2 + (lastY - Y) ** 2);

  ctx.arc(lastX, lastY, radius, 0, Math.PI * 2);

  if (isPaddingOn) ctx.fill();
  else ctx.stroke();
};
