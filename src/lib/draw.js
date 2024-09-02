import {
  TOOL_BRUSH_ID,
  TOOL_CIRCLE_ID,
  TOOL_ERASER_ID,
  TOOL_RECTANGLE_ID,
  TOOL_TRIANGLE_ID,
} from '../constants';

export const drawLine = ({ ctx, axis, last }) => {
  const [X, Y] = axis;
  const [lastX, lastY] = last;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  const distX = X - lastX;
  const distY = Y - lastY;
  const distance = Math.sqrt(distX * distX + distY * distY);
  const steps = Math.ceil(distance / 2);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const interpolatedX = lastX + distX * t;
    const interpolatedY = lastY + distY * t;
    ctx.lineTo(interpolatedX, interpolatedY);
  }
  ctx.stroke();
};

export const drawSimpleLine = (ctx, points) => {
  if (points.length < 2) return;

  const [p0, p1] = points;

  ctx.beginPath();
  ctx.moveTo(p0[0], p0[1]);
  ctx.lineTo(p1[0], p1[1]);
  ctx.stroke();
};
export const drawSmoothLine = (ctx, points) => {
  const [p0, _, p2] = points;
  if (!p2) return;
  ctx.beginPath();

  if (points.length < 3) {
    ctx.arc(p0[0], p0[1], ctx.lineWidth / 2, 0, Math.PI * 2, true);
    ctx.fill();
    return;
  }
  ctx.moveTo(p0[0], p0[1]);

  for (let i = 1; i < points.length - 2; i++) {
    const c = (points[i][0] + points[i + 1][0]) / 2;
    const d = (points[i][1] + points[i + 1][1]) / 2;
    ctx.quadraticCurveTo(points[i][0], points[i][1], c, d);
  }

  ctx.quadraticCurveTo(
    points[points.length - 2][0],
    points[points.length - 2][1],
    points[points.length - 1][0],
    points[points.length - 1][1]
  );

  ctx.stroke();
};

export const eraser = ({ ctx, axis }) => {
  const [X, Y] = axis;
  ctx.beginPath();
  ctx.lineTo(X, Y);
  ctx.stroke();
};

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
  const width = X - startX;
  const height = Y - startY;
  ctx.beginPath();
  if (!ctx.roundRect) {
    customRoundRect({ ctx, radius, width, height, last });
  } else {
    const adjustedStartX = Math.abs(startX) + 0.5;
    const adjustedStartY = Math.abs(startY) + 0.5;
    ctx.roundRect(adjustedStartX, adjustedStartY, width, height, radius);
  }
  ctx.stroke();
  ctx.closePath();
};

export const drawCircle = ({ ctx, axis, last, isPaddingOn }) => {
  const [X, Y] = axis;
  const [lastX, lastY] = last;
  ctx.beginPath();

  const radius = Math.sqrt((lastX - X) ** 2 + (lastY - Y) ** 2);

  ctx.arc(lastX, lastY, radius, 0, Math.PI * 2);

  if (isPaddingOn) ctx.fill();
  else ctx.stroke();
};

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

export const drawMethods = {
  [TOOL_BRUSH_ID]: drawLine,
  [TOOL_RECTANGLE_ID]: drawRoundedRect,
  [TOOL_TRIANGLE_ID]: drawTriangle,
  [TOOL_CIRCLE_ID]: drawCircle,
  [TOOL_ERASER_ID]: drawLine,
};
