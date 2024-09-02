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
} from './constants';
import { $, addEventListener, debounce } from './lib/utils';
import Canvas from './lib/canvas';
import ToolsHandler from './lib/toolsHandler';
import { store } from './lib/appState';
import Emitter from './domain/emitter';
import { KEYS } from './lib/keyUtilities';
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
      store.setState({ cursor: cursorType, zoom: 2 });
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

      if (toolTarget.id !== TOOL_TRASH_ID) toolHandler.currentTool = toolTarget.id;
      // Se cambia el cursor segun el tipo de herramienta
      const cursorType = TOOL_CURSOR_MAP[toolTarget.id] || TOOL_CURSOR_MAP.default;
      if (cursorType) {
        store.setState({ cursor: cursorType });
      }

      canvas.context.globalCompositeOperation =
        toolHandler.currentTool === TOOL_ERASER_ID
          ? 'destination-out'
          : 'source-over';

      // Si se clickeo la herramienta de limpiado
      if (toolTarget.id === TOOL_TRASH_ID) {
        target.checked = false;
        canvas.clear();
        canvas.history.reset();
        store.setState({ hasHistory: Symbol(false) });
      }
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
    let isDisableRedo;
    let isDisableUndo;
    const isActive = newValue.description === 'true';
    if (isActive) {
      // Use denial to disabled
      isDisableRedo = !canvas.history.hasRedo();
      isDisableUndo = !canvas.history.hasUndo();
    } else {
      isDisableUndo = !isActive;
      isDisableRedo = !isActive;
    }
    btnRedo.disabled = isDisableRedo;
    btnUndo.disabled = isDisableUndo;
  });

  // --------------- EVENT MANAGER ---------------------

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
      addEventListener(window, EVENTS.RESIZE, debounce(canvas.resizeCanvas, 75)),
      addEventListener(toolsContainer, EVENTS.CLICK, onChangeTool),
      addEventListener(canvasHtml, EVENTS.POINTER_DOWN, onPointerDown),
      addEventListener(canvasHtml, EVENTS.POINTER_MOVE, onPointerMove),
      addEventListener(canvasHtml, EVENTS.POINTER_UP, onPointerStop),
      addEventListener(canvasHtml, EVENTS.POINTER_LEAVE, onPointerStop),
      addEventListener(canvasHtml, EVENTS.POINTER_CANCEL, onPointerStop),
      addEventListener(canvasHtml, EVENTS.POINTER_OUT, onPointerStop)
    );
  };

  const initHistoryTools = () => {
    onRemoveHistoryListener.trigger();
    const redoId = btnRedo.id;
    const undoId = btnUndo.id;
    btnRedo.insertAdjacentHTML('beforeend', TOOL_ICON[redoId]);
    btnUndo.insertAdjacentHTML('beforeend', TOOL_ICON[undoId]);

    onRemoveHistoryListener.once(
      addEventListener(btnRedo, EVENTS.CLICK, e => {
        const btn = e.target;
        btn.disabled = !canvas.canvasRedo();
        btnUndo.disabled = !canvas.history.hasUndo();
      }),
      addEventListener(btnUndo, EVENTS.CLICK, e => {
        const btn = e.target;
        btn.disabled = !canvas.canvasUndo();
        btnRedo.disabled = !canvas.history.hasRedo();
      })
    );
  };

  const init = () => {
    addEventListeners();
    initHistoryTools();
  };

  init();
})();
