import {
  TOOL_BRUSH_ID,
  TOOL_CIRCLE_ID,
  TOOL_ERASER_ID,
  TOOL_RECTANGLE_ID,
  TOOL_TRIANGLE_ID,
} from '../constants';

/** @type 
  {
    ctx: CanvasRenderingContext2D;
    axis: {X:number, Y:number};
    prevAxis: {X:number, Y:number};
    isPaddingOn: boolean;
  }
 */
export const drawLine = ({ ctx, axis }) => {
  ctx.lineTo(axis.X, axis.Y);
  ctx.stroke();
};

export const eraser = ({ ctx, axis }) => {
  ctx.strokeStyle = '#fafafa';
  ctx.lineTo(axis.X, axis.Y);
  ctx.stroke();
};

export const drawRectangle = ({ ctx, axis, prev, isPaddingOn }) => {
  if (isPaddingOn) ctx.fillRect(axis.X, axis.Y, prev.X - axis.X, prev.Y - axis.Y);
  else ctx.strokeRect(axis.X, axis.Y, prev.X - axis.X, prev.Y - axis.Y);
};

export const drawCircle = ({ ctx, axis, prev, isPaddingOn }) => {
  ctx.beginPath();

  const radius = Math.sqrt((prev.X - axis.X) ** 2 + (prev.Y - axis.Y) ** 2);

  ctx.arc(prev.X, prev.Y, radius, 0, Math.PI * 2);

  if (isPaddingOn) ctx.fill();
  else ctx.stroke();
};

export const drawTriangle = ({ ctx, axis, prev, isPaddingOn }) => {
  ctx.beginPath();
  ctx.moveTo(prev.X, prev.Y);
  ctx.lineTo(axis.X, axis.Y);
  ctx.lineTo(prev.X * 2 - axis.X, axis.Y);
  ctx.closePath();

  if (isPaddingOn) ctx.fill();
  else ctx.stroke();
};

export const drawMethods = {
  [TOOL_BRUSH_ID]: drawLine,
  [TOOL_RECTANGLE_ID]: drawRectangle,
  [TOOL_TRIANGLE_ID]: drawTriangle,
  [TOOL_CIRCLE_ID]: drawCircle,
  [TOOL_ERASER_ID]: eraser,
};
