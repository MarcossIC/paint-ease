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

export const drawSmoothLine = (ctx, points, tension = 0.55) => {
  if (points.length < 2) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);

  // Usar Catmull-Rom spline para interpolar puntos adicionales entre los puntos originales
  const size = points.length;
  for (let i = 0; i < size - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 === size ? i + 1 : i + 2];

    // Interpolar los puntos con la suavidad ajustada por el parámetro `tension`
    const cp1x = p1[0] + (p2[0] - p0[0]) * tension;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2[0], p2[1]);
  }

  ctx.stroke();
  ctx.restore();
};

export const drawCatmullRomSpline = (ctx, points) => {
  if (points.length < 4) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.stroke();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);

  for (let i = 0; i < points.length - 3; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const p2 = points[i + 2];
    const p3 = points[i + 3];

    for (let t = 0; t <= 1; t += 0.1) {
      const x =
        0.5 *
        (2 * p1[0] +
          (-p0[0] + p2[0]) * t +
          (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t * t +
          (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t * t * t);
      const y =
        0.5 *
        (2 * p1[1] +
          (-p0[1] + p2[1]) * t +
          (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t * t +
          (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t * t * t);
      ctx.lineTo(x, y);
    }
  }

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
