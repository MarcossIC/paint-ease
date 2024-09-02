const ICON_SIZE = 14;
const ICON_SIZE_MD = 16;
const BRUSH_ICON = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21v-4a4 4 0 1 1 4 4h-4" /><path d="M21 3a16 16 0 0 0 -12.8 10.2" /><path d="M21 3a16 16 0 0 1 -10.2 12.8" /><path d="M10.6 9a9 9 0 0 1 4.4 4.4" /></svg>`;
const RECTANGLE_ICON = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 3m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /></svg>`;
const TRIANGLE_ICON = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" /></svg>`;
const CIRCLE_ICON = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /></svg>`;
const ERASER_ICON = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 20h-10.5l-4.21 -4.3a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9.2 9.3" /><path d="M18 13.3l-6.3 -6.3" /></svg>`;
const TRASH_ICON = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>`;
const CLICK_ICON = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12l3 0" /><path d="M12 3l0 3" /><path d="M7.8 7.8l-2.2 -2.2" /><path d="M16.2 7.8l2.2 -2.2" /><path d="M7.8 16.2l-2.2 2.2" /><path d="M12 12l9 3l-4 2l-2 4l-3 -9" /></svg>`;
const UNDO_ICON = `<svg width="${ICON_SIZE_MD}" height="${ICON_SIZE_MD}"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 14l-4 -4l4 -4" /><path d="M5 10h11a4 4 0 1 1 0 8h-1" /></svg>`;
const REDO_ICON = `<svg width="${ICON_SIZE_MD}" height="${ICON_SIZE_MD}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 14l4 -4l-4 -4" /><path d="M19 10h-11a4 4 0 1 0 0 8h1" /></svg>`;
export const TOOL_CLICK_ID = 'btn-click';
export const TOOL_BRUSH_ID = 'btn-brush';
export const TOOL_RECTANGLE_ID = 'btn-rectangle';
export const TOOL_TRIANGLE_ID = 'btn-triangle';
export const TOOL_CIRCLE_ID = 'btn-circle';
export const TOOL_ERASER_ID = 'btn-eraser';
export const TOOL_TRASH_ID = 'btn-trash-board';
export const TOOL_UNDO_ID = 'btn-undo';
export const TOOL_REDO_ID = 'btn-redo';

export const TOOL_ICON = {
  [TOOL_BRUSH_ID]: BRUSH_ICON,
  [TOOL_RECTANGLE_ID]: RECTANGLE_ICON,
  [TOOL_TRIANGLE_ID]: TRIANGLE_ICON,
  [TOOL_CIRCLE_ID]: CIRCLE_ICON,
  [TOOL_ERASER_ID]: ERASER_ICON,
  [TOOL_TRASH_ID]: TRASH_ICON,
  [TOOL_CLICK_ID]: CLICK_ICON,
  [TOOL_UNDO_ID]: UNDO_ICON,
  [TOOL_REDO_ID]: REDO_ICON,
};

export const EVENTS = {
  PASTE: 'paste',
  KEYDOWN: 'keydown',
  KEYUP: 'keyup',
  MOUSE_MOVE: 'mousemove',
  RESIZE: 'resize',
  DRAG_OVER: 'dragover',
  DRAG_START: 'dragstart',
  POINTER_MOVE: 'pointermove',
  POINTER_DOWN: 'pointerdown',
  POINTER_UP: 'pointerup',
  POINTER_OUT: 'pointerout',
  POINTER_LEAVE: 'pointerleave',
  POINTER_CANCEL: 'pointercancel',
  TOUCH_MOVE: 'touchmove',
  STATE_CHANGE: 'statechange',
  FOCUS: 'focus',
  CONTEXT_MENU: 'contextmenu',
  LOAD: 'load',
  CLICK: 'click',
};

export const isDarwin = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
export const isWindows = /^Win/.test(navigator.platform);
export const isAndroid = /\b(android)\b/i.test(navigator.userAgent);
export const isFirefox =
  'netscape' in window &&
  navigator.userAgent.indexOf('rv:') > 1 &&
  navigator.userAgent.indexOf('Gecko') > 1;
export const isChrome =
  navigator.userAgent.indexOf('Chrome') !== -1 &&
  (!!window.chrome || !!window.chrome.runtime);
export const isSafari = !isChrome && navigator.userAgent.indexOf('Safari') !== -1;
export const isIOS =
  /iPad|iPhone/.test(navigator.platform) ||
  // iPadOS 13+
  (navigator.userAgent.includes('Mac') && 'ontouchend' in document);

// keeping function so it can be mocked in test
export const isBrave = () =>
  navigator?.brave && navigator.brave.isBrave?.name === 'isBrave';

export const supportsResizeObserver =
  typeof window !== 'undefined' && 'ResizeObserver' in window;

export const DEFAULT_TRANSFORM_HANDLE_SPACING = 2;
export const SIDE_RESIZING_THRESHOLD = 2 * DEFAULT_TRANSFORM_HANDLE_SPACING;

const EPSILON = 0.00001;
export const DEFAULT_COLLISION_THRESHOLD = 2 * SIDE_RESIZING_THRESHOLD - EPSILON;

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

export const MAX_DECIMALS_FOR_SVG_EXPORT = 2;

export const EXPORT_SCALES = [1, 2, 3];
export const DEFAULT_EXPORT_PADDING = 10;

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

export const ELEMENT_READY_TO_ERASE_OPACITY = 20;

// Radius represented as 25% of element's largest side (width/height).
// Used for LEGACY and PROPORTIONAL_RADIUS algorithms, or when the element is
// below the cutoff size.
export const DEFAULT_PROPORTIONAL_RADIUS = 0.25;
// Fixed radius for the ADAPTIVE_RADIUS algorithm. In pixels.
export const DEFAULT_ADAPTIVE_RADIUS = 32;

export const ROUGHNESS = {
  architect: 0,
  artist: 1,
  cartoonist: 2,
};

export const CURSOR_TYPE = {
  DEFAULT: 'default',
  TEXT: 'text',
  CROSSHAIR: 'crosshair',
  GRABBING: 'grabbing',
  GRAB: 'grab',
  POINTER: 'pointer',
  MOVE: 'move',
  AUTO: '',
  ERASER: `url("./icons/cursorEraser.png") 10 10, auto`,
};

export const TOOL_CURSOR_MAP = {
  [TOOL_CLICK_ID]: CURSOR_TYPE.DEFAULT,
  [TOOL_ERASER_ID]: CURSOR_TYPE.ERASER,
  [TOOL_TRASH_ID]: null,
  default: CURSOR_TYPE.CROSSHAIR,
};

export const SPECIAL_OBJ_PROPERTIES = new Set([
  '__proto__',
  'constructor',
  'prototype',
]);
