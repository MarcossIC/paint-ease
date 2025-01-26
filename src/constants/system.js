export const SPECIAL_OBJ_PROPERTIES = new Set([
  '__proto__',
  'constructor',
  'prototype',
]);

export const VALID_CONTEXTS = new Set(['2d', 'webgl', 'webgl2']);

export const IMAGE_MIME_TYPES = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  avif: 'image/avif',
  jfif: 'image/jfif',
};

export const CURSOR_TYPE = {
  DEFAULT: 'var(--default-cursor)',
  TEXT: 'text',
  CROSSHAIR: 'url("./cursors/crosshair.webp") 15 15, crosshair',
  GRABBING: 'url("./cursors/grabbing.webp") 15 15, grabbing',
  GRAB: 'url("./cursors/grab.webp") 15 15, grab',
  POINTER: 'var(--pointer-cursor)',
  MOVE: 'move',
  AUTO: '',
  ERASER: `url("./cursors/eraser.webp") 15 15, auto`,
  UNAVAILABLE: `var(--unavalaible-cursor)`,
};

export const VERTICAL_ALIGN = {
  TOP: 'top',
  MIDDLE: 'middle',
  BOTTOM: 'bottom',
};

export const TEXT_ALIGN = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
};

/**
 * Configuración del viewport y zoom
 * @readonly
 * @enum {number}
 */
export const VIEWPORT = {
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 3,
  ZOOM_STEP: 0.1,
};

export const DEFAULT_TRANSFORM_HANDLE_SPACING = 2;
export const SIDE_RESIZING_THRESHOLD = 2 * DEFAULT_TRANSFORM_HANDLE_SPACING;

const EPSILON = 0.00001;
export const DEFAULT_COLLISION_THRESHOLD = 2 * SIDE_RESIZING_THRESHOLD - EPSILON;

export const MAX_DECIMALS_FOR_SVG_EXPORT = 2;

export const EXPORT_SCALES = [1, 2, 3];
export const DEFAULT_EXPORT_PADDING = 10;

export const supportsResizeObserver =
  typeof window !== 'undefined' && 'ResizeObserver' in window;
