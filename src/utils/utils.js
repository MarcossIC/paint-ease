/* eslint-disable no-restricted-syntax */
/* eslint-disable no-bitwise */
import { deflate, inflate } from 'pako';
import { parsers, colorProfiles, getMode } from './modes.js';
import { huenits, IdentCodePoint, IdentStartCodePoint, Tok } from './constants.js';
import { converters } from './modes.js';




let _i = 0;

export const $ = el => document.querySelector(el);
export const $FROM = (e, s) => e.querySelector(s);
export const $$ = el => document.querySelectorAll(el);

export const calcSteps = distance => {
  return Math.max(Math.floor(distance), 1);
};

export const calcDistance = (dx, dy) => {
  return Math.sqrt(dx * dx + dy * dy);
};

export const average = (a, b) => (a + b) / 2;

export const getDecompressed = ({ data, w, h }) => {
  const decompressed = inflate(data);
  return new ImageData(new Uint8ClampedArray(decompressed), w, h);
};

/** @param {ImageData} img */
export const getCompressed = img => {
  const compressed = deflate(img.data);
  return { data: compressed, w: img.width, h: img.height };
};

/** @param {Array} worldElements - Array of world elements to compress */
export const getWorldElementsCompressed = worldElements => {
  // Convert to JSON string and then to Uint8Array for compression
  const jsonString = JSON.stringify(worldElements);
  const uint8Array = new TextEncoder().encode(jsonString);
  const compressed = deflate(uint8Array);
  return { data: compressed, elementCount: worldElements.length };
};

/** @param {Object} compressedData - Compressed world elements data */
export const getWorldElementsDecompressed = ({ data, elementCount }) => {
  const decompressed = inflate(data);
  const jsonString = new TextDecoder().decode(decompressed);
  const worldElements = JSON.parse(jsonString);

  // Validate that we got the expected number of elements
  if (worldElements.length !== elementCount) {
    console.warn('Decompressed element count mismatch:', {
      expected: elementCount,
      actual: worldElements.length
    });
  }

  return worldElements;
};

export const validateContext = ctx => {
  if (!ctx || !(ctx instanceof CanvasRenderingContext2D)) {
    throw new Error('Invalid canvas rendering 2D context');
  }
  return true;
};

/**
 * Adds an event listener to the specified target.
 *
 * @template {Document | (Window & typeof globalThis) | FontFaceSet | HTMLElement | undefined | undefined | false} TargetType
 * @template {()=> void} UnsubscribeCallback
 *
 * @param {TargetType} target - The target to which the event listener will be added.
 * @param {keyof WindowEventMap | keyof DocumentEventMap | string} type - The type of event to listen for.
 * @param {(this: Document, ev: DocumentEventMap[K])=> any} listener - The callback function to execute when the event occurs.
 * @param {boolean | AddEventListenerOptions} [options] - An options object specifying characteristics about the event listener.
 *
 * @returns {UnsubscribeCallback} A function that, when called, will remove the event listener.
 */
export function addEventListener(target, type, listener, options) {
  if (!target) {
    return () => { };
  }
  target?.addEventListener?.(type, listener, options);
  return () => {
    target?.removeEventListener?.(type, listener, options);
  };
}

/**
 * Update cursor on canvas
 *
 * @param {HTMLCanvasElement} interactiveCanvas
 * @param {string} cursor
 */
export const setCursor = (interactiveCanvas, cursor) => {
  if (interactiveCanvas) {
    interactiveCanvas.style.setProperty('--current-cursor', cursor);
  }
};

export const debounce = (callback, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      callback(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const advancedDebounce = (callback, delay) => {
  let timeoutId = null;
  let lastArgs = null;

  const debounced = (...args) => {
    lastArgs = args;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      lastArgs = null;
      callback(...args);
    }, delay);
  };

  debounced.flush = () => {
    clearTimeout(timeoutId);
    if (lastArgs) {
      callback(...lastArgs);
      lastArgs = null;
    }
  };

  debounced.cancel = () => {
    lastArgs = null;
    clearTimeout(timeoutId);
  };

  return debounced;
};

export const isObject = item => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

export const arraysEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
};

export const getNestedValue = (obj, path) => {
  return path.reduce((current, key) => {
    if (current && Object.prototype.hasOwnProperty.call(current, key)) {
      return current[key];
    }
    return undefined;
  }, obj);
};

export const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;

  if (
    typeof obj1 !== 'object' ||
    obj1 === null ||
    typeof obj2 !== 'object' ||
    obj2 === null
  )
    return false;
  // Obtiene las claves de ambos objetos
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  // Si los objetos tienen diferente número de claves, devuelve false
  if (keys1.length !== keys2.length) return false;
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;

    if (typeof obj1[key] === 'object' && typeof obj2[key] === 'object') {
      if (!deepEqual(obj1[key], obj2[key])) return false;
    } else if (Array.isArray(obj1[key]) && Array.isArray(obj2[key])) {
      if (!arraysEqual(obj1[key], obj2[key])) return false;
    } else if (obj1[key] !== obj2[key]) return false;
  }
  return true;
};



function ident(chars) {
  let v = '';
  while (_i < chars.length && IdentCodePoint.test(chars[_i])) {
    v += chars[_i++];
  }
  return v;
}

export const is_num = (chars) => {
  let ch = chars[_i];
  let ch1 = chars[_i + 1];
  if (ch === '-' || ch === '+') {
    return /\d/.test(ch1) || (ch1 === '.' && /\d/.test(chars[_i + 2]));
  }
  if (ch === '.') {
    return /\d/.test(ch1);
  }
  return /\d/.test(ch);
}

export const is_ident = (chars) => {
  if (_i >= chars.length) {
    return false;
  }
  let ch = chars[_i];
  if (IdentStartCodePoint.test(ch)) {
    return true;
  }
  if (ch === '-') {
    if (chars.length - _i < 2) {
      return false;
    }
    let ch1 = chars[_i + 1];
    if (ch1 === '-' || IdentStartCodePoint.test(ch1)) {
      return true;
    }
    return false;
  }
  return false;
}

function digits(chars) {
  let v = '';
  while (/\d/.test(chars[_i])) {
    v += chars[_i++];
  }
  return v;
}

function num(chars) {
  let value = '';
  if (chars[_i] === '-' || chars[_i] === '+') {
    value += chars[_i++];
  }
  value += digits(chars);
  if (chars[_i] === '.' && /\d/.test(chars[_i + 1])) {
    value += chars[_i++] + digits(chars);
  }
  if (chars[_i] === 'e' || chars[_i] === 'E') {
    if (
      (chars[_i + 1] === '-' || chars[_i + 1] === '+') &&
      /\d/.test(chars[_i + 2])
    ) {
      value += chars[_i++] + chars[_i++] + digits(chars);
    } else if (/\d/.test(chars[_i + 1])) {
      value += chars[_i++] + digits(chars);
    }
  }
  if (is_ident(chars)) {
    let id = ident(chars);
    if (id === 'deg' || id === 'rad' || id === 'turn' || id === 'grad') {
      return { type: Tok.Hue, value: value * huenits[id] };
    }
    return undefined;
  }
  if (chars[_i] === '%') {
    _i++;
    return { type: Tok.Percentage, value: +value };
  }
  return { type: Tok.Number, value: +value };
}

export const tokenize = (str = '') => {
  let chars = str.trim();
  let tokens = [];
  let ch;

  /* reset counter */
  _i = 0;

  while (_i < chars.length) {
    ch = chars[_i++];

    /*
      Consume whitespace without emitting it
     */
    if (ch === '\n' || ch === '\t' || ch === ' ') {
      while (
        _i < chars.length &&
        (chars[_i] === '\n' || chars[_i] === '\t' || chars[_i] === ' ')
      ) {
        _i++;
      }
      continue;
    }

    if (ch === ',') {
      return undefined;
    }

    if (ch === ')') {
      tokens.push({ type: Tok.ParenClose });
      continue;
    }

    if (ch === '+') {
      _i--;
      if (is_num(chars)) {
        tokens.push(num(chars));
        continue;
      }
      return undefined;
    }

    if (ch === '-') {
      _i--;
      if (is_num(chars)) {
        tokens.push(num(chars));
        continue;
      }
      if (is_ident(chars)) {
        tokens.push({ type: Tok.Ident, value: ident(chars) });
        continue;
      }
      return undefined;
    }

    if (ch === '.') {
      _i--;
      if (is_num(chars)) {
        tokens.push(num(chars));
        continue;
      }
      return undefined;
    }

    if (ch === '/') {
      while (
        _i < chars.length &&
        (chars[_i] === '\n' || chars[_i] === '\t' || chars[_i] === ' ')
      ) {
        _i++;
      }
      let alpha;
      if (is_num(chars)) {
        alpha = num(chars);
        if (alpha.type !== Tok.Hue) {
          tokens.push({ type: Tok.Alpha, value: alpha });
          continue;
        }
      }
      if (is_ident(chars)) {
        if (ident(chars) === 'none') {
          tokens.push({
            type: Tok.Alpha,
            value: { type: Tok.None, value: undefined }
          });
          continue;
        }
      }
      return undefined;
    }

    if (/\d/.test(ch)) {
      _i--;
      tokens.push(num(chars));
      continue;
    }

    if (IdentStartCodePoint.test(ch)) {
      _i--;
      tokens.push(identlike(chars));
      continue;
    }

    /*
      Treat everything not already handled as an error.
     */
    return undefined;
  }

  return tokens;
}

function consumeCoords(tokens, includeHue) {
  const coords = [];
  let token;
  while (tokens._i < tokens.length) {
    token = tokens[tokens._i++];
    if (
      token.type === Tok.None ||
      token.type === Tok.Number ||
      token.type === Tok.Alpha ||
      token.type === Tok.Percentage ||
      (includeHue && token.type === Tok.Hue)
    ) {
      coords.push(token);
      continue;
    }
    if (token.type === Tok.ParenClose) {
      if (tokens._i < tokens.length) {
        return undefined;
      }
      continue;
    }
    return undefined;
  }

  if (coords.length < 3 || coords.length > 4) {
    return undefined;
  }

  if (coords.length === 4) {
    if (coords[3].type !== Tok.Alpha) {
      return undefined;
    }
    coords[3] = coords[3].value;
  }
  if (coords.length === 3) {
    coords.push({ type: Tok.None, value: undefined });
  }

  return coords.every(c => c.type !== Tok.Alpha) ? coords : undefined;
}

export function parseModernSyntax(tokens, includeHue) {
  tokens._i = 0;
  let token = tokens[tokens._i++];
  if (!token || token.type !== Tok.Function) {
    return undefined;
  }
  let coords = consumeCoords(tokens, includeHue);
  if (!coords) {
    return undefined;
  }
  coords.unshift(token.value);
  return coords;
}

export function parseColorSyntax(tokens) {
  tokens._i = 0;
  let token = tokens[tokens._i++];
  if (!token || token.type !== Tok.Function || token.value !== 'color') {
    return undefined;
  }
  token = tokens[tokens._i++];
  if (token.type !== Tok.Ident) {
    return undefined;
  }
  const mode = colorProfiles[token.value];
  if (!mode) {
    return undefined;
  }
  const res = { mode };
  const coords = consumeCoords(tokens, false);
  if (!coords) {
    return undefined;
  }
  const channels = getMode(mode).channels;
  for (let ii = 0, c, ch; ii < channels.length; ii++) {
    c = coords[ii];
    ch = channels[ii];
    if (c.type !== Tok.None) {
      res[ch] = c.type === Tok.Number ? c.value : c.value / 100;
      if (ch === 'alpha') {
        res[ch] = Math.max(0, Math.min(1, res[ch]));
      }
    }
  }
  return res;
}

export const parse = color => {
  if (typeof color !== 'string') {
    return undefined;
  }
  const tokens = tokenize(color);
  const parsed = tokens ? parseModernSyntax(tokens, true) : undefined;
  let result = undefined;
  let i = 0;
  let len = parsers.length;
  while (i < len) {
    if ((result = parsers[i++](color, parsed)) !== undefined) {
      return result;
    }
  }
  return tokens ? parseColorSyntax(tokens) : undefined;
};

export const prepare = (color, mode) =>
  color === undefined
    ? undefined
    : typeof color !== 'object'
      ? parse(color)
      : color.mode !== undefined
        ? color
        : mode
          ? { ...color, mode }
          : undefined;

export const converter =
  (target_mode = 'rgb') =>
    color =>
      (color = prepare(color, target_mode)) !== undefined
        ? // if the color's mode corresponds to our target mode
        color.mode === target_mode
          ? // then just return the color
          color
          : // otherwise check to see if we have a dedicated
          // converter for the target mode
          converters[color.mode] && converters[color.mode][target_mode]
            ? // and return its result...
            converters[color.mode][target_mode](color)
            : // ...otherwise pass through RGB as an intermediary step.
            // if the target mode is RGB...
            target_mode === 'rgb'
              ? // just return the RGB
              converters[color.mode] && converters[color.mode].rgb ? converters[color.mode].rgb(color) : undefined
              : // otherwise convert color.mode -> RGB -> target_mode
              converters.rgb && converters.rgb[target_mode] && converters[color.mode] && converters[color.mode].rgb
                ? converters.rgb[target_mode](converters[color.mode].rgb(color))
                : undefined
        : undefined;

const inrange_rgb = c => {
  return (
    c !== undefined &&
    (c.r === undefined || (c.r >= 0 && c.r <= 1)) &&
    (c.g === undefined || (c.g >= 0 && c.g <= 1)) &&
    (c.b === undefined || (c.b >= 0 && c.b <= 1))
  );
};

export function inGamut(searchMode = 'rgb') {
  const mode = getMode(searchMode);
  if (!mode?.gamut) {
    return color => true;
  }
  const conv = converter(typeof mode?.gamut === 'string' ? mode?.gamut : mode);
  return color => inrange_rgb(conv(color));
}