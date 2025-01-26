import { VIEWPORT } from '../constants/system';

export const calcSteps = distance => {
  return Math.max(Math.floor(distance), 1);
};

export const calcDistance = (dx, dy) => {
  return Math.sqrt(dx * dx + dy * dy);
};

export const average = (a, b) => (a + b) / 2;

export const clamp = (value, min, max) => {
  return Math.min(Math.max(value, min), max);
};

export const round = (value, precision) => {
  const multiplier = 10 ** precision;
  return Math.round((value + Number.EPSILON) * multiplier) / multiplier;
};

export const rgbToHex = (r, g, b) =>
  `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

export const getNormalizedZoom = zoom =>
  clamp(round(zoom, 6), VIEWPORT.MIN_ZOOM, VIEWPORT.MAX_ZOOM);

export const isEven = value => value % 2 === 0;
