import { store } from '../lib/appState.js';

// Export initial support object
export const DEFAULT_VALUES = {
  p3: false,
  rec2020: false,
  cssColorFunction: false,
  displayP3Media: false,
  canvasDisplayP3: false,
};

/**
 * Initialize display and color space support detection
 * Should be called once during app initialization
 */
export function initSupport() {
  if (typeof window === 'undefined') {
    return { mediaP3: null, media2020: null, support: DEFAULT_VALUES };
  }

  let mediaP3 = null;
  let media2020 = null;

  const detectedSupport = DEFAULT_VALUES;

  try {
    // Check CSS color function support
    detectedSupport.cssColorFunction = CSS.supports('color', 'color(display-p3 1 1 1)');
    
    if (detectedSupport.cssColorFunction) {
      // Check media queries support
      mediaP3 = window.matchMedia('(color-gamut: p3)');
      media2020 = window.matchMedia('(color-gamut: rec2020)');
      
      detectedSupport.displayP3Media = mediaP3.matches;
      detectedSupport.p3 = mediaP3.matches;
      detectedSupport.rec2020 = media2020.matches;

      try {
        const testCanvas = document.createElement('canvas');
        const ctx = testCanvas.getContext('2d', { colorSpace: 'display-p3' });
        detectedSupport.canvasDisplayP3 = ctx !== null;
      } catch (e) {
        console.warn('Canvas display-p3 not supported:', e);
        detectedSupport.canvasDisplayP3 = false;
      }
    } else {
      console.warn('CSS color() function not supported');
    }
  } catch (e) {
    console.error('Error detecting color space support:', e);
  }
  return { mediaP3, media2020, support: detectedSupport };
}

/**
 * Get current support state from store
 */
export function getCurrentSupport() {
  return store.getState().support;
}

/**
 * Check if P3 is fully supported (both display and canvas)
 */
export function isP3Supported() {
  try {
    const currentSupport = getCurrentSupport();
    return currentSupport.p3 && currentSupport.canvasDisplayP3;
  } catch (error) {
    console.warn('Failed to check P3 support:', error);
    return false; // Safe fallback
  }
}

/**
 * Get recommended color space based on current support
 */
export function getRecommendedColorSpace() {
  try {
    return isP3Supported() ? 'display-p3' : 'srgb';
  } catch (error) {
    console.warn('Failed to get recommended color space:', error);
    return 'srgb'; // Safe fallback
  }
}

/**
 * Get available color gamuts for the current device
 */
export function getAvailableGamuts() {
  const support = getCurrentSupport();
  const gamuts = ['srgb']; // Always supported
  
  if (support.p3) {
    gamuts.push('p3', 'display-p3');
  }
  
  if (support.rec2020) {
    gamuts.push('rec2020');
  }
  
  return gamuts;
}

/**
 * Check if a specific gamut is supported
 */
export function isGamutSupported(gamut) {
  const support = getCurrentSupport();
  
  switch (gamut?.toLowerCase()) {
    case 'srgb':
    case 'rgb':
      return true; // Always supported
    case 'p3':
    case 'display-p3':
      return support.p3 && support.canvasDisplayP3;
    case 'rec2020':
      return support.rec2020;
    default:
      return false;
  }
}
