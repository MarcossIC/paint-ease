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

export const throttleRAF = (fn, opts) => {
  let timerId = null;
  let lastArgs = null;
  let lastArgsTrailing = null;

  const scheduleFunc = args => {
    timerId = window.requestAnimationFrame(() => {
      timerId = null;
      fn(...args);
      lastArgs = null;
      if (lastArgsTrailing) {
        lastArgs = lastArgsTrailing;
        lastArgsTrailing = null;
        scheduleFunc(lastArgs);
      }
    });
  };

  const ret = (...args) => {
    lastArgs = args;
    if (timerId === null) {
      scheduleFunc(lastArgs);
    } else if (opts?.trailing) {
      lastArgsTrailing = args;
    }
  };
  ret.flush = () => {
    if (timerId !== null) {
      cancelAnimationFrame(timerId);
      timerId = null;
    }
    if (lastArgs) {
      fn(...(lastArgsTrailing || lastArgs));
      lastArgs = null;
      lastArgsTrailing = null;
    }
  };
  ret.cancel = () => {
    lastArgs = null;
    lastArgsTrailing = null;
    if (timerId !== null) {
      cancelAnimationFrame(timerId);
      timerId = null;
    }
  };
  return ret;
};
