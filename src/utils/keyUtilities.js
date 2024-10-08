import {
  isDarwin,
  TOOL_CLICK_ID,
  TOOL_BRUSH_ID,
  TOOL_RECTANGLE_ID,
  TOOL_CIRCLE_ID,
  TOOL_TRIANGLE_ID,
  TOOL_ERASER_ID,
  TOOL_TRASH_ID,
} from './constants';

export const CODES = {
  EQUAL: 'Equal',
  MINUS: 'Minus',
  NUM_ADD: 'NumpadAdd',
  NUM_SUBTRACT: 'NumpadSubtract',
  NUM_ZERO: 'Numpad0',
  BRACKET_RIGHT: 'BracketRight',
  BRACKET_LEFT: 'BracketLeft',
  ONE: 'Digit1',
  TWO: 'Digit2',
  THREE: 'Digit3',
  NINE: 'Digit9',
  QUOTE: 'Quote',
  ZERO: 'Digit0',
  SLASH: 'Slash',
  C: 'KeyC',
  D: 'KeyD',
  H: 'KeyH',
  V: 'KeyV',
  Z: 'KeyZ',
  R: 'KeyR',
  S: 'KeyS',
};

export const KEYS = {
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ARROW_UP: 'ArrowUp',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  BACKSPACE: 'Backspace',
  ALT: 'Alt',
  CTRL_OR_CMD: isDarwin ? 'metaKey' : 'ctrlKey',
  DELETE: 'Delete',
  ENTER: 'Enter',
  ESCAPE: 'Escape',
  QUESTION_MARK: '?',
  SPACE: ' ',
  TAB: 'Tab',
  CHEVRON_LEFT: '<',
  CHEVRON_RIGHT: '>',
  PERIOD: '.',
  COMMA: ',',
  SUBTRACT: '-',
  SLASH: '/',

  A: 'a',
  C: 'c',
  D: 'd',
  E: 'e',
  F: 'f',
  G: 'g',
  H: 'h',
  I: 'i',
  L: 'l',
  O: 'o',
  P: 'p',
  Q: 'q',
  R: 'r',
  S: 's',
  T: 't',
  V: 'v',
  X: 'x',
  Y: 'y',
  Z: 'z',
  K: 'k',
  W: 'w',

  0: '0',
  1: '1',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
};

/**
 * Determines if the key pressed is an arrow key
 *
 * @param {string} key - Pressed key
 * @returns {boolean} True if arrow key is pressed, false otherwise
 */
export const isArrowKey = key =>
  key === KEYS.ARROW_LEFT ||
  key === KEYS.ARROW_RIGHT ||
  key === KEYS.ARROW_DOWN ||
  key === KEYS.ARROW_UP;

export const KEYS_TO_TOOLS = {
  [KEYS['1']]: TOOL_CLICK_ID,
  [KEYS['2']]: TOOL_BRUSH_ID,
  [KEYS['3']]: TOOL_RECTANGLE_ID,
  [KEYS['4']]: TOOL_TRIANGLE_ID,
  [KEYS['5']]: TOOL_CIRCLE_ID,
  [KEYS['6']]: TOOL_ERASER_ID,
  [KEYS['7']]: TOOL_TRASH_ID,
  [KEYS.R]: TOOL_TRASH_ID,
};

export const isActionKey = key =>
  key === KEYS[1] ||
  key === KEYS[2] ||
  key === KEYS[3] ||
  key === KEYS[4] ||
  key === KEYS[5] ||
  key === KEYS[6] ||
  key === KEYS[7] ||
  key === KEYS.R;

/**
 * @param {MouseEvent | KeyboardEvent} event
 * @returns {boolean} True if the alt key is pressed, false otherwise.
 */
export const shouldResizeFromCenter = event => event.altKey;

/**
 * Determines if the aspect ratio should be maintained based on the shift key state.
 *
 * @param {MouseEvent | KeyboardEvent} event
 * @returns {boolean} True if the shift key is pressed, false otherwise.
 */
export const shouldMaintainAspectRatio = event => event.shiftKey;

/**
 * @param {MouseEvent | KeyboardEvent | PointerEvent} event
 * @returns {boolean} True if the shift key is pressed, false otherwise.
 */
export const shouldRotateWithDiscreteAngle = event => event.shiftKey;
