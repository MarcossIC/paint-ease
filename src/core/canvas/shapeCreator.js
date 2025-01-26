/*
import { RoughGenerator } from 'roughjs/bin/generator';

export class ShapeCreator {
  static _rg;

  static _cache;

  constructor() {
    this._rg = new RoughGenerator();
    this._cache = new WeakMap();
  }

  static get = element => {
    return ShapeCreator.cache.get(element);
  };

  static set = (element, shape) => ShapeCreator.cache.set(element, shape);

  static delete = element => ShapeCreator.cache.delete(element);

  static destroy = () => {
    ShapeCreator.cache = new WeakMap();
  };

  static generateElementShape = (element, renderConfig) => {
    // when exporting, always regenerated to guarantee the latest shape
    const cachedShape = renderConfig?.isExporting
      ? undefined
      : ShapeCache.get(element);

    // `null` indicates no rc shape applicable for this element type,
    // but it's considered a valid cache value (= do not regenerate)
    if (cachedShape !== undefined) {
      return cachedShape;
    }

    elementWithCanvasCache.delete(element);

    const shape = _generateElementShape(
      element,
      ShapeCache.rg,
      renderConfig || {
        isExporting: false,
        canvasBackgroundColor: COLOR_PALETTE.white,
        embedsValidationStatus: null,
      }
    );

    ShapeCache.cache.set(element, shape);

    return shape;
  };
}

export default ShapeCreator;
*/
