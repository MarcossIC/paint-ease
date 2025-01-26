import { CURSOR_TYPE } from '../constants/system';

export const INITIAL_STATE = {
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
  scroll: [0, 0],
  canvasRect: [0, 0],
  canvasSize: [0, 0],
  width: 0,
  height: 0,
};
