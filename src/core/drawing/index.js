import {
  TOOL_BRUSH_ID,
  TOOL_CIRCLE_ID,
  TOOL_ERASER_ID,
  TOOL_RECTANGLE_ID,
  TOOL_TRIANGLE_ID,
} from '../../constants/tools';
import * as brush from './brush';
import { drawCatmullRomSpline, drawSmoothLine } from './splines';
import * as circle from './shapes/circle';
import * as rectangle from './shapes/rectangle';
import * as triangle from './shapes/triangle';

const drawMethods = {
  [TOOL_BRUSH_ID]: brush.drawLine,
  [TOOL_RECTANGLE_ID]: rectangle.drawRoundedRect,
  [TOOL_TRIANGLE_ID]: triangle.drawTriangle,
  [TOOL_CIRCLE_ID]: circle.drawCircle,
  [TOOL_ERASER_ID]: brush.eraser,
};

export {
  drawCatmullRomSpline,
  drawSmoothLine,
  brush,
  circle,
  rectangle,
  triangle,
  drawMethods,
};
