export const isDarwin = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
export const isWindows = /^Win/.test(navigator.platform);
export const isAndroid = /\b(android)\b/i.test(navigator.userAgent);
export const isFirefox =
  'netscape' in window &&
  navigator.userAgent.indexOf('rv:') > 1 &&
  navigator.userAgent.indexOf('Gecko') > 1;
export const isChrome =
  navigator.userAgent.indexOf('Chrome') !== -1 &&
  (!!window.chrome || !!window.chrome.runtime);
export const isSafari = !isChrome && navigator.userAgent.indexOf('Safari') !== -1;
export const isIOS =
  /iPad|iPhone/.test(navigator.platform) ||
  // iPadOS 13+
  (navigator.userAgent.includes('Mac') && 'ontouchend' in document);

// keeping function so it can be mocked in test
export const isBrave = () =>
  navigator?.brave && navigator.brave.isBrave?.name === 'isBrave';
