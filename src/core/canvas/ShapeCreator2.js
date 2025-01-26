/* eslint-disable no-constructor-return */

import { RoughCanvas } from 'roughjs/bin/canvas';
import {
  TOOL_RECTANGLE_ID,
  TOOL_CIRCLE_ID,
  TOOL_TRIANGLE_ID,
  TOOL_BRUSH_ID,
} from '../../constants/tools';

export class ShapeCreator {
  static _instances = new WeakMap();

  /**
   * Singleton pattern para obtener una instancia única por canvas
   * @param {HTMLCanvasElement} canvas
   * @returns {ShapeCreator}
   */
  static getInstance(canvas) {
    if (!ShapeCreator._instances.has(canvas)) {
      const instance = new ShapeCreator(canvas);
      ShapeCreator._instances.set(canvas, instance);
    }
    return ShapeCreator._instances.get(canvas);
  }

  constructor(canvas) {
    if (ShapeCreator._instances.has(canvas)) {
      return ShapeCreator._instances.get(canvas);
    }
    this.rc = new RoughCanvas(canvas);
    this._canvas = canvas;
    this._shapes = [];
  }

  /**
   * Crea una nueva forma basada en las coordenadas y configuración
   * @param {string} tool - Tipo de herramienta
   * @param {{start: [number, number], end: [number, number], settings: Object}} params
   * @returns {Object|null} - Objeto de forma o null si no es válido
   */
  createShape(tool, { start, end, settings }) {
    const shape = ShapeCreator._generateShape(tool, start, end, settings);
    if (shape) {
      this._shapes.push(shape);
      return shape;
    }
    return null;
  }

  static _generateShape(tool, [startX, startY], [endX, endY], settings) {
    const options = ShapeCreator._getShapeOptions(settings);
    const width = endX - startX;
    const height = endY - startY;

    switch (tool) {
      case TOOL_RECTANGLE_ID:
        return {
          type: 'rectangle',
          props: {
            x: Math.min(startX, endX),
            y: Math.min(startY, endY),
            width: Math.abs(width),
            height: Math.abs(height),
            options,
          },
          draw: rc => {
            rc.rectangle(
              Math.min(startX, endX),
              Math.min(startY, endY),
              Math.abs(width),
              Math.abs(height),
              options
            );
          },
        };

      case TOOL_CIRCLE_ID: {
        // Calculamos el radio basado en la distancia del centro al punto final
        const radius = Math.sqrt(width * width + height * height);
        // Mantenemos el centro en el punto inicial
        return {
          type: 'circle',
          props: {
            x: startX,
            y: startY,
            radius,
            options,
          },
          draw: rc => {
            rc.circle(startX, startY, radius * 2, options);
          },
        };
      }

      case TOOL_TRIANGLE_ID: {
        const points = ShapeCreator._calculateTrianglePoints(
          startX,
          startY,
          endX,
          endY
        );
        return {
          type: 'triangle',
          props: {
            points,
            options,
          },
          draw: rc => {
            rc.polygon(points, options);
          },
        };
      }

      case TOOL_BRUSH_ID:
        return {
          type: 'line',
          props: {
            x1: startX,
            y1: startY,
            x2: endX,
            y2: endY,
            options,
          },
          draw: rc => {
            rc.line(startX, startY, endX, endY, options);
          },
        };

      default:
        return null;
    }
  }

  /**
   * Configura las opciones de estilo para RoughJS
   * @param {Object} settings - Configuración de la herramienta
   * @returns {Object} Opciones para RoughJS
   */
  static _getShapeOptions(settings) {
    return {
      stroke: settings.color,
      strokeWidth: settings.size,
      roughness: 1.5,
      bowing: 1,
      fill: settings.isPaddingOn ? settings.paddingColor : undefined,
      fillStyle: settings.isPaddingOn ? 'solid' : 'hachure',
      hachureAngle: 60,
      hachureGap: 8,
    };
  }

  /**
   * Calcula los puntos del triángulo isósceles
   */
  static _calculateTrianglePoints(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const _dy = y2 - y1;

    const x3 = x1 - dx;
    const y3 = y2;

    return [
      [x1, y1],
      [x2, y2],
      [x3, y3],
    ];
  }

  /**
   * Dibuja una forma específica
   * @param {Object} shape - Forma a dibujar
   */
  drawShape(shape) {
    if (shape?.draw) {
      shape.draw(this.rc);
    }
  }

  /**
   * Redibuja todas las formas
   */
  redrawShapes() {
    this._shapes.forEach(shape => this.drawShape(shape));
  }

  getShapes() {
    return [...this._shapes];
  }

  setShapes(shapes) {
    this._shapes = shapes ? [...shapes] : [];
  }

  clear() {
    this._shapes = [];
  }
}
