/* eslint-disable import/prefer-default-export */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-constructor-return */
import { CURSOR_TYPE, SPECIAL_OBJ_PROPERTIES } from '../constants';

const isObject = item => {
  return item && typeof item === 'object' && !Array.isArray(item);
};

const arraysEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) return false;
  }
  return true;
};

const getNestedValue = (obj, path) => {
  return path.reduce((current, key) => {
    if (current && Object.prototype.hasOwnProperty.call(current, key)) {
      return current[key];
    }
    return undefined;
  }, obj);
};

const deepEqual = (obj1, obj2) => {
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

class AppGlobalState {
  /** Estado global */
  state;

  rawState;

  /** Callback de los suscriptores */
  _subscribers = {};

  /** @type {WeakMap} Almacena en cache los proxy que ya han sido creados */
  _proxyCache = new WeakMap();

  /** @type {boolean} Bandera para continuar con la siguiente update */
  _batchUpdate = false;

  /** @type {Set} Almacena las actualizaciones pendientes */
  _pendingUpdates = new Set();

  _pathCache = new Map();

  _compiledPaths = new Map();

  /** @type {AppGlobalState} Almacena la referencia del AppGlobalState */
  static instance;

  constructor(initialState = {}) {
    if (AppGlobalState.instance) {
      return AppGlobalState.instance;
    }
    this.rawState = initialState;
    this.state = this.#createProxy(initialState);

    AppGlobalState.instance = this;
  }

  #createProxy(obj, path = []) {
    if (!isObject(obj)) {
      return obj;
    }

    if (this._proxyCache.has(obj)) {
      return this._proxyCache.get(obj);
    }

    const proxy = new Proxy(obj, {
      set: (target, property, value) => {
        try {
          const oldValue = target[property];
          const newValue = this.#createProxy(value, [...path, property]);
          if (!deepEqual(oldValue, newValue)) {
            target[property] = newValue;
            const key = [...path, property].join('.');
            if (this._batchUpdate) {
              this._pendingUpdates.add(key);
            } else {
              this.#notify(key, newValue, oldValue);
            }
          }
          return true;
        } catch (e) {
          console.error(`Error setting property ${property}:`, e);
          return false;
        }
      },
      get: (target, property) => {
        try {
          if (typeof property === 'symbol' || SPECIAL_OBJ_PROPERTIES.has(property)) {
            return Reflect.get(target, property);
          }

          const value = target[property];
          if (isObject(value)) {
            const cacheKey = `${property}`;
            if (this._pathCache.has(cacheKey)) {
              return this._pathCache.get(cacheKey);
            }
            const newPath = [...path, property];
            const newProxy = this.#createProxy(value, newPath);
            this._pathCache.set(cacheKey, newProxy);
            return newProxy;
          }
          return value;
        } catch (e) {
          console.error(`Error getting property ${property}:`, e);
          return undefined;
        }
      },
    });

    this._proxyCache.set(obj, proxy);
    return proxy;
  }

  subscribe(key, callback) {
    if (!this._subscribers[key]) {
      this._subscribers[key] = new Set();
    }
    this._subscribers[key].add(callback);
    return () => this.unsubscribe(key, callback);
  }

  unsubscribe(key, callback) {
    if (this._subscribers[key]) {
      this._subscribers[key].delete(callback);
      if (this._subscribers[key].size === 0) {
        delete this._subscribers[key];
      }
    }
  }

  #notify(key, newValue, oldValue) {
    if (this._subscribers[key]) {
      this._subscribers[key].forEach(callback => callback(newValue, oldValue, key));
    }
  }

  setState(newState) {
    this._batchUpdate = true;
    this.#deepMerge(this.state, newState);
    this._batchUpdate = false;

    this._pendingUpdates.forEach(key => {
      const newValue = getNestedValue(this.state, key.split('.'));
      const oldValue = getNestedValue(this.state, key.split('.'));
      this.#notify(key, newValue, oldValue);
    });
    this._pendingUpdates.clear();
  }

  #deepMerge(target, source, path = []) {
    Object.keys(source).forEach(key => {
      const newPath = [...path, key];
      const proxyKey = newPath.join('.');

      if (isObject(source[key])) {
        if (!(key in target)) {
          target[key] = {};
        }
        this.#deepMerge(target[key], source[key], newPath);
        return;
      }
      if (!deepEqual(target[key], source[key])) {
        target[key] = source[key];
        this._pendingUpdates.add(proxyKey);
      }
    });
  }

  getState() {
    return this.state;
  }
}

const store = new AppGlobalState({
  cursor: CURSOR_TYPE.DEFAULT,
  appOffsetX: 0,
  appOffsetY: 0,
  zoom: 1,
  zenEnabled: false,
  theme: 'light',
  isHoldingSpace: false,
  isDrawing: false,
  hasHistory: Symbol(false),
  lastViewportView: [0, 0],
});

export { store };
