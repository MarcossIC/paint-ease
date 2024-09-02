/**
 * @typedef {()=> void} UnsubscribeCallback
 * A function that, when called, unsubscribes the listener.
 * @returns {void}
 */

/**
 * @template T
 * @typedef {(...payload: T) => void} Subscriber
 * A function that receives payload and doesn't return anything.
 */

/**
 * @template {any[]} T
 */
class Emitter {
  /**
   * @type {Subscriber<T>[]}
   */
  subscribers = [];

  /**
   * Attaches subscriber(s)
   * @param {...(Subscriber<T>|Subscriber<T>[])} handlers - The handler(s) to attach
   * @returns {UnsubscribeCallback} Function to unsubscribe the attached handler(s)
   */
  on(...handlers) {
    const _handlers = handlers.flat().filter(item => typeof item === 'function');

    this.subscribers.push(..._handlers);

    return () => this.off(_handlers);
  }

  /**
   * Attaches subscriber(s) for one-time execution
   * @param {...(Subscriber<T>|Subscriber<T>[])} handlers - The handler(s) to attach
   * @returns {UnsubscribeCallback} Function to unsubscribe the attached handler(s)
   */
  once(...handlers) {
    const _handlers = handlers.flat().filter(item => typeof item === 'function');

    const detach = this.on(..._handlers);

    _handlers.push(() => detach());
    return detach;
  }

  /**
   * Detaches subscriber(s)
   * @param {...(Subscriber<T>|Subscriber<T>[])} handlers - The handler(s) to detach
   */
  off(...handlers) {
    const _handlers = handlers.flat();
    this.subscribers = this.subscribers.filter(
      handler => !_handlers.includes(handler)
    );
  }

  /**
   * Triggers all subscribers with the given payload
   * @param {...T} payload - The payload to pass to the subscribers
   * @returns {this} The Emitter instance for chaining
   */
  trigger(...payload) {
    this.subscribers.forEach(handler => handler(...payload));
    return this;
  }

  /**
   * Clears all subscribers
   */
  clear() {
    this.subscribers = [];
  }
}

export default Emitter;
