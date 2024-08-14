import { deflate, inflate } from 'pako';

export const $ = el => document.querySelector(el);
export const $FROM = (e, s) => e.querySelector(s);
export const $$ = el => document.querySelectorAll(el);

export const calcSteps = distance => {
  return Math.max(Math.floor(distance), 1);
};

export const calcDistance = (dx, dy) => {
  return Math.sqrt(dx * dx + dy * dy);
};

export const getDecompressed = ({ data, w, h }) => {
  const decompressed = inflate(data);
  return new ImageData(new Uint8ClampedArray(decompressed), w, h);
};

export const getCompressed = data => {
  const compressed = deflate(data);
  return { data: compressed, w: data.width, h: data.height };
};

export const validateContext = ctx => {
  if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
    throw new Error('Invalid canvas rendering 2D context');
  } else {
    return false;
  }
};
