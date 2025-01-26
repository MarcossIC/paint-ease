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
      // Necesitas zetas magicas para entender el calculo
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
