// Selectores del DOM
export const $ = el => document.querySelector(el);
export const $FROM = (e, s) => e.querySelector(s);
export const $$ = el => document.querySelectorAll(el);

/**
 * Actualiza el cursor activo
 * @param {HTMLCanvasElement} interactiveCanvas
 * @param {string} cursor
 */
export const setCursor = (interactiveCanvas, cursor) => {
  if (interactiveCanvas) {
    interactiveCanvas.style.setProperty('--current-cursor', cursor);
  }
};

/**
 * Añade un evento a un elemento del DOM y retorna una función para eliminar el evento.
 *
 * @template {Document | (Window & typeof globalThis) | FontFaceSet | HTMLElement | undefined | undefined | false} TargetType
 * @template {()=> void} UnsubscribeCallback
 *
 * @param {TargetType} target - El elemento al que se le añadirá el evento.
 * @param {keyof WindowEventMap | keyof DocumentEventMap | string} type - El tipo de evento a escuchar.
 * @param {(this: Document, ev: DocumentEventMap[K])=> any} listener - La función de callback que se ejecutará cuando ocurra el evento.
 * @param {boolean | AddEventListenerOptions} [options] - Un objeto de opciones que especifica las características del evento.
 *
 * @returns {UnsubscribeCallback} Una función que, cuando se llama, eliminará el evento.
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
