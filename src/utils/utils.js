/* eslint-disable no-restricted-syntax */
/* eslint-disable no-bitwise */
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
    return () => {};
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

export const rgbToHex = (r, g, b) =>
  `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

export const getCurrentColor = (ctx, [X, Y], [offsetLeft, offsetTop]) => {
  const pixel = ctx.getImageData(
    (X - offsetLeft) * window.devicePixelRatio,
    (Y - offsetTop) * window.devicePixelRatio,
    1,
    1
  ).data;

  return rgbToHex(pixel[0], pixel[1], pixel[2]);
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
