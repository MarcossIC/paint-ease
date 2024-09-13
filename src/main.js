/* eslint-disable no-param-reassign */
import './styles/normalize.css';
import './styles/style.css';
import {
  TOOL_ICON,
  TOOL_CLICK_ID,
  TOOL_TRASH_ID,
  TOOL_CURSOR_MAP,
  EVENTS,
  TOOL_ERASER_ID,
  CURSOR_TYPE,
} from './utils/constants';
import { $, $FROM, addEventListener } from './utils/utils';
import Canvas from './lib/canvas';
import ToolsHandler from './lib/toolsHandler';
import { store } from './lib/appState';
import Emitter from './domain/emitter';
import { KEYS, isActionKey, KEYS_TO_TOOLS } from './utils/keyUtilities';
import { openColorDropper } from './lib/colorDropper';

(() => {
  // --------------- VARIABLES ---------------------
  const canvasHtml = $('#canvas');
  const btnUndo = $('#btn-undo');
  const btnRedo = $('#btn-redo');
  const toolsContainer = $('#tool-controls');
  const canvas = new Canvas(canvasHtml);
  const toolHandler = new ToolsHandler(canvas, TOOL_CLICK_ID);
  const onRemoveEventListeners = new Emitter();
  const onRemoveHistoryListener = new Emitter();

  // --------------- ACTIONS ---------------------
  const onRedo = () => {
    btnRedo.disabled = !canvas.canvasRedo();
    btnUndo.disabled = !canvas.history.hasUndo();
  };

  const onUndo = () => {
    btnUndo.disabled = !canvas.canvasUndo();
    btnRedo.disabled = !canvas.history.hasRedo();
  };
  const onSetTool = (toolUpdated, target) => {
    console.log({ toolUpdated });
    let cursorType;
    if (toolUpdated !== TOOL_TRASH_ID) {
      if (target) target.click();
      toolHandler.currentTool = toolUpdated;
      cursorType = TOOL_CURSOR_MAP[toolUpdated] || TOOL_CURSOR_MAP.default;
      canvas.context.globalCompositeOperation =
        toolUpdated === TOOL_ERASER_ID ? 'destination-out' : 'source-over';
    }
    console.log({ cursorType });
    if (cursorType) {
      store.setState({ cursor: cursorType });
    }
  };
  const onCleanScreen = target => {
    if (target) target.checked = false;
    canvas.clear();
    if (canvas.history.hasEntries()) {
      canvas.saveState();
      store.setState({ hasHistory: Symbol(true) });
    }
  };

  // --------------- EVENTS ---------------------

  const onKeydown = event => {
    // Normalizar las teclas cuando se presiona CapsLock / Mayus
    if (
      'Proxy' in window &&
      ((!event.shiftKey && /^[A-Z]$/.test(event.key)) ||
        (event.shiftKey && /^[a-z]$/.test(event.key)))
    ) {
      // Si el objeto Proxy es soportado y se esta presionando el capslock y otra tecla
      // Redefinimos el evento
      event = new Proxy(event, {
        get(ev, prop) {
          const value = ev[prop];
          if (typeof value === 'function') {
            return value.bind(ev);
          }
          if (prop === 'key') {
            return event.shiftKey ? ev.key.toUpperCase() : ev.key.toLowerCase();
          }

          return value;
        },
      });
    }
    if (event.key === KEYS.SPACE) {
      canvas.isHoldingSpace = true;
      store.setState({ cursor: CURSOR_TYPE.GRAB });
      event.preventDefault();
    }

    if (event[KEYS.CTRL_OR_CMD]) {
      event.preventDefault();
      if (event.key === KEYS.Z) {
        onUndo();
      } else if (event.key === KEYS.Y) {
        onRedo();
      } else if (isActionKey(event.key)) {
        const toolId = KEYS_TO_TOOLS[event.key];

        const btn = $FROM(toolsContainer, `#${toolId}`);
        if (toolId === TOOL_TRASH_ID) {
          onCleanScreen();
          return;
        }
        onSetTool(toolId, btn);
      }
    }

    // Cuenta gotas
    const lowerCased = event.key.toLocaleLowerCase();
    const isPickingStroke = lowerCased === KEYS.S && event.shiftKey;

    if (isPickingStroke) {
      openColorDropper({
        type: 'stroke',
        canvas,
      });
    }
  };

  const onKeyUp = event => {
    if (event.key === KEYS.SPACE) {
      const cursorType =
        TOOL_CURSOR_MAP[toolHandler.currentTool.id] || TOOL_CURSOR_MAP.default;
      store.setState({ cursor: cursorType, zoom: 1 });
    }
  };

  const onChangeTool = e => {
    const { target } = e;
    if (target.tagName === 'INPUT' && target.type === 'radio') {
      const toolTarget = target.closest('label');
      const selectedToolId = toolHandler.currentTool;
      const isCurrentSelected = selectedToolId === toolTarget.id;

      if (!toolTarget || isCurrentSelected) {
        toolHandler.resetToolState();
        return;
      }

      onSetTool(toolTarget.id);

      // Si se clickeo la herramienta de limpiado
      if (toolTarget.id === TOOL_TRASH_ID) onCleanScreen(target);
      toolHandler.resetToolState();
    }
  };

  const onPointerDown = e => {
    e.preventDefault();
    if (toolHandler.currentTool !== TOOL_CLICK_ID && e.isPrimary) {
      store.setState({ isDrawing: true });
      toolHandler.preparingTheBrush(e);
    }
  };
  const onPointerMove = e => {
    const { isDrawing } = store.getState();
    if (isDrawing) {
      toolHandler.useTool(e);
    }
  };

  const onPointerStop = e => {
    e.preventDefault();
    const { isDrawing } = store.getState();
    if (isDrawing) {
      canvas.saveState();
      store.setState({ isDrawing: false, hasHistory: Symbol(true) });
    }
  };

  const onContextMenu = e => {
    e.preventDefault();
  };
  const onTouchMove = e => {
    // Block pinch-zooming
    if (typeof e.scale === 'number' && e.scale !== 1) {
      e.preventDefault();
    }
  };

  // --------------- STORE SUBSCRIPTIONS ---------------------

  store.subscribe('cursor', newValue => {
    canvasHtml.style.setProperty('--current-cursor', newValue);
  });
  store.subscribe('isDrawing', newValue => {
    document.body.style.setProperty(
      '--paintease-pointers-events',
      newValue ? 'none' : 'all'
    );
  });
  store.subscribe('hasHistory', newValue => {
    let isDisableRedo = true;
    let isDisableUndo = true;
    const isActive = newValue.description === 'true';
    if (isActive) {
      // Use denial to disabled
      isDisableRedo = !canvas.history.hasRedo();
      isDisableUndo = !canvas.history.hasUndo();
    }
    btnRedo.disabled = isDisableRedo;
    btnUndo.disabled = isDisableUndo;
  });

  // --------------- EVENT MANAGER / STARTERS ---------------------

  const removeEventListeners = () => {
    onRemoveEventListeners.trigger();
  };

  const addEventListeners = () => {
    removeEventListeners();

    onRemoveEventListeners.once(
      addEventListener(document, EVENTS.KEYDOWN, onKeydown),
      addEventListener(document, EVENTS.KEYUP, onKeyUp),
      addEventListener(document, EVENTS.CONTEXT_MENU, onContextMenu),
      addEventListener(canvasHtml, EVENTS.DRAG_START, () => false),
      addEventListener(window, EVENTS.LOAD, canvas.startCanvas),
      addEventListener(window, EVENTS.RESIZE, canvas.resizeCanvas),
      addEventListener(toolsContainer, EVENTS.CLICK, onChangeTool),
      addEventListener(canvasHtml, EVENTS.POINTER_DOWN, onPointerDown),
      addEventListener(canvasHtml, EVENTS.POINTER_MOVE, onPointerMove),
      addEventListener(canvasHtml, EVENTS.POINTER_UP, onPointerStop),
      addEventListener(canvasHtml, EVENTS.POINTER_LEAVE, onPointerStop),
      addEventListener(canvasHtml, EVENTS.POINTER_CANCEL, onPointerStop),
      addEventListener(canvasHtml, EVENTS.POINTER_OUT, onPointerStop),
      addEventListener(document, EVENTS.TOUCH_MOVE, onTouchMove, {
        passive: false,
      })
    );
  };

  const initHistoryTools = () => {
    onRemoveHistoryListener.trigger();
    const redoId = btnRedo.id;
    const undoId = btnUndo.id;
    btnRedo.insertAdjacentHTML('beforeend', TOOL_ICON[redoId]);
    btnUndo.insertAdjacentHTML('beforeend', TOOL_ICON[undoId]);

    // Negacion en los "disabled", porque cuando es "true" NO tiene que desabilitarse
    onRemoveHistoryListener.once(
      addEventListener(btnRedo, EVENTS.CLICK, onRedo),
      addEventListener(btnUndo, EVENTS.CLICK, onUndo)
    );
  };

  const init = () => {
    addEventListeners();
    initHistoryTools();
  };

  init();
})();
