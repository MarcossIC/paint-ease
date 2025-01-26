import { inflate, deflate } from 'pako';
import { clamp, rgbToHex, round } from './math';
import { VIEWPORT } from '../constants/system';

export const getDecompressed = ({ data, w, h }) => {
  const decompressed = inflate(data);
  return new ImageData(new Uint8ClampedArray(decompressed), w, h);
};

export const getCompressed = img => {
  const compressed = deflate(img.data);
  return { data: compressed, w: img.width, h: img.height };
};

export const validateContext = ctx => {
  if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
    throw new Error('Invalid canvas rendering 2D context');
  }
  return true;
};

export const getCurrentColor = (ctx, [X, Y], [offsetLeft, offsetTop]) => {
  const pixel = ctx.getImageData(
    (X - offsetLeft) * window.devicePixelRatio,
    (Y - offsetTop) * window.devicePixelRatio,
    1,
    1
  ).data;

  return rgbToHex(pixel[0], pixel[1], pixel[2]);
};

export const getNormalizedCanvasDimensions = (canvas, scale) => [
  canvas.width / scale,
  canvas.height / scale,
];

export const getNormalizedZoom = zoom =>
  clamp(round(zoom, 6), VIEWPORT.MIN_ZOOM, VIEWPORT.MAX_ZOOM);

export const viewportCoordsToSceneCoords = (
  { clientX, clientY },
  { zoom, offsetLeft, offsetTop, scrollX, scrollY }
) => {
  const x = (clientX - offsetLeft) / zoom - scrollX;
  const y = (clientY - offsetTop) / zoom - scrollY;

  return [x, y];
};

export const centerScrollOn = ({
  axis: [xAxe, yAxe],
  viewport: [vwpw, vwph],
  zoom,
}) => [vwpw / 2 / zoom - xAxe, vwph / 2 / zoom - yAxe];

export const calculateScrollCenter = () => {
  return [0, 0];
};
