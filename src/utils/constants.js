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
const ZOOM_IN_ICON = `<svg width="${ICON_SIZE_MD}" height="${ICON_SIZE_MD}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M7 10l6 0" /><path d="M10 7l0 6" /><path d="M21 21l-6 -6" /></svg>`;
const ZOOM_OUT_ICON = `<svg width="${ICON_SIZE_MD}" height="${ICON_SIZE_MD}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" /><path d="M7 10l6 0" /><path d="M21 21l-6 -6" /></svg>`;
const LASER_ICON = `<svg xmlns="http://www.w3.org/2000/svg" height="${ICON_SIZE}px" viewBox="0 -960 960 960" width="${ICON_SIZE}px" fill="currentColor"><path d="M360-80q-50 0-85-35t-35-85q0-50 35-85t85-35q50 0 85 35t35 85q0 50-35 85t-85 35Zm179-139q-6-55-41-97t-87-57l106-107H236q-32 0-54-22t-22-54q0-20 10.5-37.5T198-622l486-291q18-11 38-5.5t31 23.5q11 18 5.5 37.5T736-827L360-600h364q32 0 54 22t22 54q0 18-4.5 35.5T778-458L539-219Z"/></svg>`;
export const TOOL_CLICK_ID = 'btn-click';
export const TOOL_BRUSH_ID = 'btn-brush';
export const TOOL_RECTANGLE_ID = 'btn-rectangle';
export const TOOL_TRIANGLE_ID = 'btn-triangle';
export const TOOL_CIRCLE_ID = 'btn-circle';
export const TOOL_ERASER_ID = 'btn-eraser';
export const TOOL_TRASH_ID = 'btn-trash-board';
export const TOOL_COLOR_ID = 'btn-color';
export const TOOL_UNDO_ID = 'btn-undo';
export const TOOL_REDO_ID = 'btn-redo';
export const ZOOM_IN_ID = 'zoom-in';
export const ZOOM_OUT_ID = 'zoom-out';
export const TOOL_LASER_ID = 'btn-laser';

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
  [ZOOM_IN_ID]: ZOOM_IN_ICON,
  [ZOOM_OUT_ID]: ZOOM_OUT_ICON,
  [TOOL_LASER_ID]: LASER_ICON,
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
  CHANGE: 'change',
  WHEEL: 'wheel',
  SCROLL: 'scroll',
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

export const ROUGHNESS = {
  architect: 0,
  artist: 1,
  cartoonist: 2,
};

export const CURSOR_TYPE = {
  DEFAULT: 'var(--default-cursor)',
  TEXT: 'text',
  CROSSHAIR: `url("${import.meta.env.BASE_URL || './'}cursors/crosshair.webp") 15 15, crosshair`,
  GRABBING: `url("${import.meta.env.BASE_URL || './'}cursors/grabbing.webp") 15 15, grabbing`,
  GRAB: `url("${import.meta.env.BASE_URL || './'}cursors/grab.webp") 15 15, grab`,
  POINTER: 'var(--pointer-cursor)',
  MOVE: 'move',
  AUTO: '',
  ERASER: `url("${import.meta.env.BASE_URL || './'}cursors/eraser.webp") 15 15, auto`,
  LASER: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="red" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" fill="red" opacity="0.8"/><circle cx="12" cy="12" r="1" fill="white"/></svg>')}") 12 12, crosshair`,
  UNAVAILABLE: `var(--unavalaible-cursor)`,
};

export const TOOL_CURSOR_MAP = {
  [TOOL_CLICK_ID]: CURSOR_TYPE.DEFAULT,
  [TOOL_ERASER_ID]: CURSOR_TYPE.ERASER,
  [TOOL_TRASH_ID]: null,
  [TOOL_COLOR_ID]: null,
  [TOOL_LASER_ID]: CURSOR_TYPE.LASER,
  default: CURSOR_TYPE.CROSSHAIR,
};

export const SPECIAL_OBJ_PROPERTIES = new Set([
  '__proto__',
  'constructor',
  'prototype',
]);

export const num = '([+-]?\\d*\\.?\\d+(?:[eE][+-]?\\d+)?)';
export const per = `${num}%`;
export const hue = `(?:${num}(deg|grad|rad|turn)|${num})`;
export const num_per = `(?:${num}%|${num})`;
export const c = `\\s*,\\s*`; // comma
export const so = '\\s*'; // space, optional
export const s = `\\s+`; // space
export const k = Math.pow(29, 3) / Math.pow(3, 3);
export const e = Math.pow(6, 3) / Math.pow(29, 3);
export const COLOR_SPACE_GAP = 0.0001;
export const α = 1.09929682680944;
export const β = 0.018053968510807;

export const D50 = {
	X: 0.3457 / 0.3585,
	Y: 1,
	Z: (1 - 0.3457 - 0.3585) / 0.3585
};

export const D65 = {
	X: 0.3127 / 0.329,
	Y: 1,
	Z: (1 - 0.3127 - 0.329) / 0.329
};

export const hsl_old = new RegExp(
	`^hsla?\\(\\s*${hue}${c}${per}${c}${per}\\s*(?:,\\s*${num_per}\\s*)?\\)$`
);
export const rgb_num_old = new RegExp(
	`^rgba?\\(\\s*${num}${c}${num}${c}${num}\\s*(?:,\\s*${num_per}\\s*)?\\)$`
);

export const rgb_per_old = new RegExp(
	`^rgba?\\(\\s*${per}${c}${per}${c}${per}\\s*(?:,\\s*${num_per}\\s*)?\\)$`
);
export const hex = /^#?([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{4}|[0-9a-f]{3})$/i;

export const IdentStartCodePoint = /[^\x00-\x7F]|[a-zA-Z_]/;
export const IdentCodePoint = /[^\x00-\x7F]|[-\w]/;

export const Tok = {
  Function: 'function',
  Ident: 'ident',
  Number: 'number',
  Percentage: 'percentage',
  ParenClose: ')',
  None: 'none',
  Hue: 'hue',
  Alpha: 'alpha'
};

export const huenits = {
  deg: 1,
  rad: 180 / Math.PI,
  grad: 9 / 10,
  turn: 360
};

export const named = {
	aliceblue: 0xf0f8ff,
	antiquewhite: 0xfaebd7,
	aqua: 0x00ffff,
	aquamarine: 0x7fffd4,
	azure: 0xf0ffff,
	beige: 0xf5f5dc,
	bisque: 0xffe4c4,
	black: 0x000000,
	blanchedalmond: 0xffebcd,
	blue: 0x0000ff,
	blueviolet: 0x8a2be2,
	brown: 0xa52a2a,
	burlywood: 0xdeb887,
	cadetblue: 0x5f9ea0,
	chartreuse: 0x7fff00,
	chocolate: 0xd2691e,
	coral: 0xff7f50,
	cornflowerblue: 0x6495ed,
	cornsilk: 0xfff8dc,
	crimson: 0xdc143c,
	cyan: 0x00ffff,
	darkblue: 0x00008b,
	darkcyan: 0x008b8b,
	darkgoldenrod: 0xb8860b,
	darkgray: 0xa9a9a9,
	darkgreen: 0x006400,
	darkgrey: 0xa9a9a9,
	darkkhaki: 0xbdb76b,
	darkmagenta: 0x8b008b,
	darkolivegreen: 0x556b2f,
	darkorange: 0xff8c00,
	darkorchid: 0x9932cc,
	darkred: 0x8b0000,
	darksalmon: 0xe9967a,
	darkseagreen: 0x8fbc8f,
	darkslateblue: 0x483d8b,
	darkslategray: 0x2f4f4f,
	darkslategrey: 0x2f4f4f,
	darkturquoise: 0x00ced1,
	darkviolet: 0x9400d3,
	deeppink: 0xff1493,
	deepskyblue: 0x00bfff,
	dimgray: 0x696969,
	dimgrey: 0x696969,
	dodgerblue: 0x1e90ff,
	firebrick: 0xb22222,
	floralwhite: 0xfffaf0,
	forestgreen: 0x228b22,
	fuchsia: 0xff00ff,
	gainsboro: 0xdcdcdc,
	ghostwhite: 0xf8f8ff,
	gold: 0xffd700,
	goldenrod: 0xdaa520,
	gray: 0x808080,
	green: 0x008000,
	greenyellow: 0xadff2f,
	grey: 0x808080,
	honeydew: 0xf0fff0,
	hotpink: 0xff69b4,
	indianred: 0xcd5c5c,
	indigo: 0x4b0082,
	ivory: 0xfffff0,
	khaki: 0xf0e68c,
	lavender: 0xe6e6fa,
	lavenderblush: 0xfff0f5,
	lawngreen: 0x7cfc00,
	lemonchiffon: 0xfffacd,
	lightblue: 0xadd8e6,
	lightcoral: 0xf08080,
	lightcyan: 0xe0ffff,
	lightgoldenrodyellow: 0xfafad2,
	lightgray: 0xd3d3d3,
	lightgreen: 0x90ee90,
	lightgrey: 0xd3d3d3,
	lightpink: 0xffb6c1,
	lightsalmon: 0xffa07a,
	lightseagreen: 0x20b2aa,
	lightskyblue: 0x87cefa,
	lightslategray: 0x778899,
	lightslategrey: 0x778899,
	lightsteelblue: 0xb0c4de,
	lightyellow: 0xffffe0,
	lime: 0x00ff00,
	limegreen: 0x32cd32,
	linen: 0xfaf0e6,
	magenta: 0xff00ff,
	maroon: 0x800000,
	mediumaquamarine: 0x66cdaa,
	mediumblue: 0x0000cd,
	mediumorchid: 0xba55d3,
	mediumpurple: 0x9370db,
	mediumseagreen: 0x3cb371,
	mediumslateblue: 0x7b68ee,
	mediumspringgreen: 0x00fa9a,
	mediumturquoise: 0x48d1cc,
	mediumvioletred: 0xc71585,
	midnightblue: 0x191970,
	mintcream: 0xf5fffa,
	mistyrose: 0xffe4e1,
	moccasin: 0xffe4b5,
	navajowhite: 0xffdead,
	navy: 0x000080,
	oldlace: 0xfdf5e6,
	olive: 0x808000,
	olivedrab: 0x6b8e23,
	orange: 0xffa500,
	orangered: 0xff4500,
	orchid: 0xda70d6,
	palegoldenrod: 0xeee8aa,
	palegreen: 0x98fb98,
	paleturquoise: 0xafeeee,
	palevioletred: 0xdb7093,
	papayawhip: 0xffefd5,
	peachpuff: 0xffdab9,
	peru: 0xcd853f,
	pink: 0xffc0cb,
	plum: 0xdda0dd,
	powderblue: 0xb0e0e6,
	purple: 0x800080,

	// Added in CSS Colors Level 4:
	// https://drafts.csswg.org/css-color/#changes-from-3
	rebeccapurple: 0x663399,

	red: 0xff0000,
	rosybrown: 0xbc8f8f,
	royalblue: 0x4169e1,
	saddlebrown: 0x8b4513,
	salmon: 0xfa8072,
	sandybrown: 0xf4a460,
	seagreen: 0x2e8b57,
	seashell: 0xfff5ee,
	sienna: 0xa0522d,
	silver: 0xc0c0c0,
	skyblue: 0x87ceeb,
	slateblue: 0x6a5acd,
	slategray: 0x708090,
	slategrey: 0x708090,
	snow: 0xfffafa,
	springgreen: 0x00ff7f,
	steelblue: 0x4682b4,
	tan: 0xd2b48c,
	teal: 0x008080,
	thistle: 0xd8bfd8,
	tomato: 0xff6347,
	turquoise: 0x40e0d0,
	violet: 0xee82ee,
	wheat: 0xf5deb3,
	white: 0xffffff,
	whitesmoke: 0xf5f5f5,
	yellow: 0xffff00,
	yellowgreen: 0x9acd32
};