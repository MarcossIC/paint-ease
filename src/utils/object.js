/* eslint-disable no-multi-assign */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-bitwise */

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
