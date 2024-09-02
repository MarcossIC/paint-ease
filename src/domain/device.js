/*  A possible implementation is proposed to handle different devices. Not yet functional */
export default class DeviceContext {
  /** @type {{isMobile: boolean; isLandscape: boolean;}} */
  _viewport;

  /** @type {{isMobile: boolean; canFitSidebar: boolean;}} */
  _editor;

  /** @type {boolean} */
  _isTouchScreen;

  constructor() {
    this._viewport = { isMobile: false, isLandscape: false };
    this._editor = { isMobile: false, canFitSidebar: false };
    this._isTouchScreen = false;
  }

  /** @returns {{isMobile: boolean; isLandscape: boolean;}} */
  get viewport() {
    return this._viewport;
  }

  /** @param {{isMobile: boolean; isLandscape: boolean;}} */
  set viewport(value) {
    this._viewport = value;
  }

  /** @returns {boolean} */
  get isMobileViewport() {
    return this._viewport.isMobile;
  }

  /** @param {boolean} */
  set isMobileViewport(value) {
    this._viewport.isMobile = value;
  }

  /** @returns {boolean} */
  get isLandscapeViewport() {
    return this._viewport.isLandscape;
  }

  /** @param {boolean} */
  set isLandscapeViewport(value) {
    this._viewport.isLandscape = value;
  }

  /** @returns {{isMobile: boolean; canFitSidebar: boolean;}} */
  get editor() {
    return this._editor;
  }

  /** @param {{isMobile: boolean; canFitSidebar: boolean;}} */
  set editor(value) {
    this._editor = value;
  }

  /** @returns {boolean} */
  get isMobileEditor() {
    return this._editor.isMobile;
  }

  set isMobileEditor(value) {
    this._editor.isMobile = value;
  }

  /** @returns {boolean} */
  get canFitSidebarEditor() {
    return this._editor.canFitSidebar;
  }

  set canFitSidebarEditor(value) {
    this._editor.canFitSidebar = value;
  }

  /** @returns {boolean} */
  get isTouchScreen() {
    return this._isTouchScreen;
  }

  set isTouchScreen(value) {
    this._isTouchScreen = value;
  }
}
