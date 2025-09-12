import {
  TOOL_BRUSH_ID,
  TOOL_ERASER_ID,
} from '../utils/constants';
import rough from 'roughjs/bundled/rough.esm.js';

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

    // Calculate distance for adaptive step size
    const distance = Math.sqrt(
      Math.pow(p2[0] - p1[0], 2) + Math.pow(p2[1] - p1[1], 2)
    );
    
    // Higher resolution for smoother curves
    const stepSize = Math.max(0.02, Math.min(0.08, 1 / distance));

    for (let t = 0; t <= 1; t += stepSize) {
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

// ============ High-quality line smoothing utilities ============

/**
 * Smooths a path by reducing noise and filtering out micro-movements
 */
export const smoothPath = (points, tolerance = 2) => {
  if (points.length < 3) return points;
  
  const smoothed = [points[0]]; // Always keep first point
  
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    
    // Calculate distance from previous point
    const distance = Math.sqrt(
      Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
    );
    
    // Only add point if it's far enough from previous (reduces jitter)
    if (distance > tolerance) {
      // Apply slight smoothing using weighted average
      const smoothX = (prev.x + curr.x * 2 + next.x) * 0.25;
      const smoothY = (prev.y + curr.y * 2 + next.y) * 0.25;
      
      smoothed.push({ x: smoothX, y: smoothY });
    }
  }
  
  // Always keep last point
  if (points.length > 1) {
    smoothed.push(points[points.length - 1]);
  }
  
  return smoothed;
};

/**
 * Optimizes drawing settings for high-quality lines
 */
export const applyHighQualitySettings = (ctx, lineWidth = 2) => {
  // Enhanced anti-aliasing settings
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 10;
  
  // Enhanced smoothing
  if (ctx.imageSmoothingEnabled !== undefined) {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
  }
};

// ============ InfiniteCanvas-compatible drawing functions ============

// ---------- Advanced preprocessing pipeline (RDP simplify + resample + Chaikin) ----------
const sqr = (n) => n * n;
const distanceBetween = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// Ramer–Douglas–Peucker simplify to remove redundant points while preserving shape
const simplifyRDP = (points, epsilon = 0.75) => {
  if (!Array.isArray(points) || points.length < 3) return points;
  const first = points[0];
  const last = points[points.length - 1];
  let maxDist = 0;
  let index = 0;
  const A = first, B = last;
  const dx = B.x - A.x, dy = B.y - A.y;
  const denom = Math.sqrt(dx * dx + dy * dy) || 1;
  for (let i = 1; i < points.length - 1; i++) {
    const P = points[i];
    const area = Math.abs(dy * P.x - dx * P.y + B.x * A.y - B.y * A.x);
    const dist = area / denom;
    if (dist > maxDist) {
      maxDist = dist;
      index = i;
    }
  }
  if (maxDist > epsilon) {
    const left = simplifyRDP(points.slice(0, index + 1), epsilon);
    const right = simplifyRDP(points.slice(index), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
};

// Resample a path so successive points are spaced ~step pixels apart
const resamplePath = (points, step = 0.9) => {
  if (!Array.isArray(points) || points.length < 2) return points;
  const out = [points[0]];
  let accum = 0;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    let segLen = distanceBetween(prev, curr);
    if (segLen === 0) continue;
    let t = step - accum;
    while (t <= segLen) {
      const ratio = t / segLen;
      out.push({ x: prev.x + (curr.x - prev.x) * ratio, y: prev.y + (curr.y - prev.y) * ratio });
      t += step;
    }
    accum = segLen - (t - step);
  }
  // Always include last point
  const last = points[points.length - 1];
  if (out.length === 1 || last.x !== out[out.length - 1].x || last.y !== out[out.length - 1].y) {
    out.push(last);
  }
  return out;
};

// One iteration of Chaikin corner cutting for gentle smoothing
const chaikinSmooth = (points, iterations = 1, weight = 0.25) => {
  if (!Array.isArray(points) || points.length < 3 || iterations <= 0) return points;
  let input = points;
  for (let k = 0; k < iterations; k++) {
    const out = [input[0]];
    for (let i = 0; i < input.length - 1; i++) {
      const p = input[i];
      const q = input[i + 1];
      const Q = { x: p.x + (q.x - p.x) * weight, y: p.y + (q.y - p.y) * weight };
      const R = { x: q.x - (q.x - p.x) * weight, y: q.y - (q.y - p.y) * weight };
      out.push(Q, R);
    }
    out.push(input[input.length - 1]);
    input = out;
  }
  return input;
};

// Build the preprocessed input for curve drawing
const buildSmoothInput = (points, ctx) => {
  if (!Array.isArray(points) || points.length === 0) return points;
  // Base jitter filter
  const base = smoothPath(points, 1.0);
  // Simplify very close points (tolerance scales with line width)
  const epsilon = Math.max(0.4, (ctx?.lineWidth || 2) * 0.12);
  const simplified = simplifyRDP(base, epsilon);
  // Resample uniformly for consistent curvature
  const spacing = Math.max(0.7, (ctx?.lineWidth || 2) * 0.25);
  const resampled = resamplePath(simplified, spacing);
  // Light Chaikin for smooth corners (1 iteration maintains responsiveness)
  const refined = chaikinSmooth(resampled, 1);
  // Cap extreme point counts for performance
  if (refined.length > 2800) {
    return resamplePath(refined, spacing * 1.5);
  }
  return refined;
};

// RoughJS helpers (cache per-canvas instance to avoid re-creation)
const getRoughCanvas = (() => {
  const cache = new WeakMap();
  return (canvas) => {
    let rc = cache.get(canvas);
    if (!rc) {
      rc = rough.canvas(canvas);
      cache.set(canvas, rc);
    }
    return rc;
  };
})();

/**
 * Quadratic curve stroke drawing
 */
export const drawStrokeQuadratic = (ctx, points) => {
  const input = buildSmoothInput(points, ctx);
  const len = input.length;
  if (len === 0) return;
  
  // Apply high-quality settings (but don't override lineWidth)
  applyHighQualitySettings(ctx);
  
  const firstPoint = input[0];
  ctx.beginPath();
  ctx.moveTo(firstPoint.x, firstPoint.y);
  
  if (len === 2) {
    const secondPoint = input[1];
    ctx.lineTo(secondPoint.x, secondPoint.y);
  } else if (len > 2) {
    // Improved smoothing with better control points
    const loopEnd = len - 1;
    let i = 1;
    
    while (i < loopEnd) {
      const currentPoint = input[i];
      const nextPoint = input[i + 1];
      
      // Better midpoint calculation for smoother curves
      const xc = (currentPoint.x + nextPoint.x) * 0.5;
      const yc = (currentPoint.y + nextPoint.y) * 0.5;
      
      // Add slight tension control for better curve quality
      if (i === 1) {
        // First curve: use actual start point
        ctx.quadraticCurveTo(currentPoint.x, currentPoint.y, xc, yc);
      } else {
        // Subsequent curves: smooth connection
        const prevPoint = input[i - 1];
        const smoothX = currentPoint.x + (currentPoint.x - prevPoint.x) * 0.1;
        const smoothY = currentPoint.y + (currentPoint.y - prevPoint.y) * 0.1;
        ctx.quadraticCurveTo(smoothX, smoothY, xc, yc);
      }
      i++;
    }
    
    // Final segment with improved ending
    const lastIdx = len - 1;
    const secondLastPoint = input[lastIdx - 1];
    const lastPoint = input[lastIdx];
    
    // Better final control point
    const finalControlX = secondLastPoint.x + (lastPoint.x - secondLastPoint.x) * 0.8;
    const finalControlY = secondLastPoint.y + (lastPoint.y - secondLastPoint.y) * 0.8;
    
    ctx.quadraticCurveTo(finalControlX, finalControlY, lastPoint.x, lastPoint.y);
  }
  
  ctx.stroke();
};

/**
 * Catmull-Rom spline stroke drawing
 */
export const drawStrokeCatmullRom = (ctx, points) => {
  const input = buildSmoothInput(points, ctx);
  const len = input.length;
  
  // Apply high-quality settings (but don't override lineWidth)
  applyHighQualitySettings(ctx);
  
  if (len < 4) {
    if (len === 0) return;
    const firstPoint = input[0];
    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);
    
    let i = 1;
    while (i < len) {
      const point = input[i];
      ctx.lineTo(point.x, point.y);
      i++;
    }
    ctx.stroke();
    return;
  }

  const firstPoint = input[0];
  ctx.beginPath();
  ctx.moveTo(firstPoint.x, firstPoint.y);
  
  const outerLoopEnd = len - 3;
  // Increased density for smoother curves - adaptive based on distance
  const halfConstant = 0.5;
  
  let i = 0;
  while (i < outerLoopEnd) {
    const p0 = input[i];
    const p1 = input[i + 1];
    const p2 = input[i + 2]; 
    const p3 = input[i + 3];
    
    // Calculate distance to determine step density
    const distance = Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
    );
    
    // Adaptive step size: more steps for longer segments
    const stepIncrement = Math.max(0.05, Math.min(0.15, 2 / distance));
    
    const p0x = p0.x, p0y = p0.y;
    const p1x = p1.x, p1y = p1.y;
    const p2x = p2.x, p2y = p2.y;
    const p3x = p3.x, p3y = p3.y;
    
    const ax = -p0x + 3 * p1x - 3 * p2x + p3x;
    const bx = 2 * p0x - 5 * p1x + 4 * p2x - p3x;
    const cx = -p0x + p2x;
    const dx = 2 * p1x;
    
    const ay = -p0y + 3 * p1y - 3 * p2y + p3y;
    const by = 2 * p0y - 5 * p1y + 4 * p2y - p3y;
    const cy = -p0y + p2y;
    const dy = 2 * p1y;

    let t = 0;
    while (t <= 1) {
      const t2 = t * t;
      const t3 = t2 * t;
      
      const x = halfConstant * (dx + cx * t + bx * t2 + ax * t3);
      const y = halfConstant * (dy + cy * t + by * t2 + ay * t3);
      
      ctx.lineTo(x, y);
      t += stepIncrement;
    }
    i++;
  }

  ctx.stroke();
};

/**
 * Bézier curve stroke drawing
 */
export const drawStrokeBezier = (ctx, points, tension = 0.3) => {
  const input = buildSmoothInput(points, ctx);
  const len = input.length;
  if (len < 2) return;
  
  // Apply high-quality settings
  applyHighQualitySettings(ctx);
  
  const firstPoint = input[0];
  ctx.beginPath();
  ctx.moveTo(firstPoint.x, firstPoint.y);
  
  if (len === 2) {
    // Simple line for two points
    ctx.lineTo(input[1].x, input[1].y);
    ctx.stroke();
    return;
  }
  
  const loopEnd = len - 1;
  const lastIdx = len - 1;
  
  let i = 0;
  while (i < loopEnd) {
    const p0 = i === 0 ? input[0] : input[i - 1];
    const p1 = input[i];
    const p2 = input[i + 1];
    const p3 = (i + 2 > lastIdx) ? input[lastIdx] : input[i + 2];

    // Calculate distance for adaptive tension
    const segmentDistance = Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
    );
    
    // Adaptive tension based on segment length
    const adaptiveTension = Math.min(tension, tension * (segmentDistance / 50));
    
    // Pre-calculate deltas to reduce redundant arithmetic
    const dx02 = p2.x - p0.x;
    const dy02 = p2.y - p0.y;
    const dx31 = p3.x - p1.x;
    const dy31 = p3.y - p1.y;
    
    const cp1x = p1.x + dx02 * adaptiveTension;
    const cp1y = p1.y + dy02 * adaptiveTension;
    const cp2x = p2.x - dx31 * adaptiveTension;
    const cp2y = p2.y - dy31 * adaptiveTension;

    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    i++;
  }

  ctx.stroke();
};

/**
 * RoughJS-based curve stroke drawing (optional)
 * Provides an alternative renderer using RoughJS with parameters tuned for crisp lines
 */
export const drawStrokeRough = (ctx, points) => {
  const input = smoothPath(points, 1.1);
  const len = input.length;
  if (len === 0) return;
  
  // For a single point, draw a simple dot using native canvas to avoid RoughJS overhead
  if (len === 1) {
    const p = input[0];
    ctx.save();
    applyHighQualitySettings(ctx);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(1, ctx.lineWidth / 2), 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
    ctx.restore();
    return;
  }
  
  const rc = getRoughCanvas(ctx.canvas);
  const path = input.map(p => [p.x, p.y]);
  rc.curve(path, {
    stroke: ctx.strokeStyle,
    strokeWidth: ctx.lineWidth,
    roughness: 0,
    bowing: 0,
    disableMultiStroke: true,
    curveFitting: 0.95,
    curveStepCount: 180,
  });
};

// Shape drawing methods for InfiniteCanvas
export const drawBasicRectangle = (ctx, { startX, startY, endX, endY, isPaddingOn }) => {
  const width = endX - startX;
  const height = endY - startY;

  // Always draw stroke (border), then fill if requested
  ctx.strokeRect(startX, startY, width, height);
  
  if (isPaddingOn) {
    ctx.fillRect(startX, startY, width, height);
  }
};

export const drawRoundedRectangleInfinite = (ctx, { startX, startY, endX, endY, isPaddingOn, radius = 10 }) => {
  const width = endX - startX;
  const height = endY - startY;
  const adaptiveRadius = Math.min(Math.abs(width) * 0.1, Math.abs(height) * 0.1, radius);

  ctx.save();
  ctx.beginPath();
  
  if (ctx.roundRect) {
    // Use native roundRect if available
    ctx.roundRect(startX, startY, width, height, adaptiveRadius);
  } else {
    // Custom implementation for browsers without roundRect support
    drawCustomRoundRectInfinite(ctx, startX, startY, width, height, adaptiveRadius);
  }
  
  // Always draw stroke (border), then fill if requested
  ctx.stroke();
  
  if (isPaddingOn) {
    ctx.fill();
  }
  
  ctx.restore();
};

export const drawCustomRoundRectInfinite = (ctx, x, y, width, height, radius) => {
  const radiusX = Math.min(Math.abs(width) / 2, radius);
  const radiusY = Math.min(Math.abs(height) / 2, radius);
  const right = x + width;
  const bottom = y + height;

  ctx.moveTo(x + Math.sign(width) * radiusX, y);
  ctx.lineTo(right - Math.sign(width) * radiusX, y);
  ctx.quadraticCurveTo(right, y, right, y + Math.sign(height) * radiusY);
  ctx.lineTo(right, bottom - Math.sign(height) * radiusY);
  ctx.quadraticCurveTo(right, bottom, right - Math.sign(width) * radiusX, bottom);
  ctx.lineTo(x + Math.sign(width) * radiusX, bottom);
  ctx.quadraticCurveTo(x, bottom, x, bottom - Math.sign(height) * radiusY);
  ctx.lineTo(x, y + Math.sign(height) * radiusY);
  ctx.quadraticCurveTo(x, y, x + Math.sign(width) * radiusX, y);
};

// ============ Legacy drawing methods (original format) ============
export const drawMethods = {
  [TOOL_BRUSH_ID]: drawLine,
  [TOOL_ERASER_ID]: drawLine,
};

// ============ InfiniteCanvas drawing method collections ============
export const strokeDrawingMethods = {
  quadratic: drawStrokeQuadratic,
  catmullrom: drawStrokeCatmullRom,
  bezier: drawStrokeBezier,
  rough: drawStrokeRough,
};

export const rectangleDrawingMethods = {
  basic: drawBasicRectangle,
  rounded: drawRoundedRectangleInfinite,
};
