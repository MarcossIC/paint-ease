/* eslint-disable no-param-reassign */
import './styles/normalize.css';
import './styles/style.css';
import {
  TOOL_ICON,
  TOOL_CLICK_ID,
  TOOL_TRASH_ID,
  TOOL_CURSOR_MAP,
  TOOL_ERASER_ID,
} from './constants/tools';
import { VIEWPORT, CURSOR_TYPE } from './constants/system';
import { EVENTS } from './constants/events';
import { throttleRAF } from './utils/performance';
import { $, $FROM, addEventListener } from './utils/dom';
import { getNormalizedZoom, viewportCoordsToSceneCoords } from './utils/canvas';
import { Canvas } from './core/canvas';
import { ToolsHandler } from './core/tools';
import { store } from './state';
import { Emitter } from './core/events/emitter';
import { KEYS, isActionKey, KEYS_TO_TOOLS } from './constants/keys';
import { openColorDropper } from './core/dropper';

(() => {
  /*
  -----------------------------------------------
  --------------- VARIABLES ---------------------
  -----------------------------------------------
  */
  const canvasHtml = $('#canvas');
  const btnUndo = $('#btn-undo');
  const btnRedo = $('#btn-redo');
  const toolsContainer = $('#tool-controls');
  const btnZoomIn = $('#btn-zoomIn');
  const btnZoomOut = $('#btn-zoomOut');
  const canvas = new Canvas(canvasHtml);
  const toolHandler = new ToolsHandler(canvas, TOOL_CLICK_ID);
  const onRemoveEventListeners = new Emitter();
  const onRemoveHistoryListener = new Emitter();
  /*
  -----------------------------------------------
  --------------- ACTIONS ---------------------
  -----------------------------------------------
  */
  const onRedo = () => {
    btnRedo.disabled = !canvas.canvasRedo();
    btnUndo.disabled = !canvas.history.hasUndo();
  };

  const onUndo = () => {
    btnUndo.disabled = !canvas.canvasUndo();
    btnRedo.disabled = !canvas.history.hasRedo();
  };
  const setTool = (toolUpdated, target) => {
    let cursorType;
    if (toolUpdated !== TOOL_TRASH_ID) {
      if (target) target.click();
      toolHandler.currentTool = toolUpdated;
      cursorType = TOOL_CURSOR_MAP[toolUpdated] || TOOL_CURSOR_MAP.default;
      canvas.context.globalCompositeOperation =
        toolUpdated === TOOL_ERASER_ID ? 'destination-out' : 'source-over';
    }
    if (cursorType) store.setState({ cursor: cursorType });
  };
  const onCleanScreen = target => {
    if (target) target.checked = false;
    canvas.clear();
    if (canvas.history.hasEntries()) {
      canvas.saveState();
      store.setState({ hasHistory: Symbol(true) });
    }
  };
  const setZoom = (current, next) => {
    const { canvasSize, canvasRect, scroll } = store.getState();
    const [left, top] = canvasRect;
    const viewportX = canvasSize[0] / 2 + left;
    const viewportY = canvasSize[1] / 2 + top;
    const appLayerX = viewportX - left;
    const appLayerY = viewportY - top;

    const baseScrollX = scroll[0] + (appLayerX - appLayerX / current);
    const baseScrollY = scroll[1] + (appLayerY - appLayerY / current);
    const zoomOffsetScrollX = -(appLayerX - appLayerX / next);
    const zoomOffsetScrollY = -(appLayerY - appLayerY / next);
    store.setState({
      scroll: [baseScrollX + zoomOffsetScrollX, baseScrollY + zoomOffsetScrollY],
      zoom: next,
    });
  };
  const onZoomIn = () => {
    const { zoom } = store.getState();
    setZoom(zoom, getNormalizedZoom(zoom + 0.1));
  };
  const onZoomOut = () => {
    const { zoom } = store.getState();
    setZoom(zoom, getNormalizedZoom(zoom - 0.1));
  };

  const updateCanvaSizes = () => {
    if (canvasHtml) {
      const { left, top, width, height } = canvasHtml.getBoundingClientRect();
      store.setState({ canvasRect: [left, top], canvasSize: [width, height] });
    }
  };

  /*
  -----------------------------------------------
  --------------- EVENTS ---------------------
  -----------------------------------------------
  */
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
      if (event.key === KEYS.Z) {
        onUndo();
      } else if (event.key === KEYS.Y) {
        onRedo();
      } else if (isActionKey(event.key)) {
        event.preventDefault();
        const toolId = KEYS_TO_TOOLS[event.key];

        const btn = $FROM(toolsContainer, `#${toolId}`);
        if (toolId === TOOL_TRASH_ID) {
          onCleanScreen();
          return;
        }
        setTool(toolId, btn);
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

      setTool(toolTarget.id);

      // Si se clickeo la herramienta de limpiado
      if (toolTarget.id === TOOL_TRASH_ID) onCleanScreen(target);
      toolHandler.resetToolState();
    }
  };

  const onPointerDown = e => {
    e.preventDefault();
    const { zoom, scroll, canvasRect } = store.getState();
    if (toolHandler.currentTool !== TOOL_CLICK_ID && e.isPrimary) {
      store.setState({ isDrawing: true });
      const axis = viewportCoordsToSceneCoords(e, {
        zoom,
        scrollX: scroll[0],
        scrollY: scroll[1],
        offsetLeft: canvasRect[0],
        offsetTop: canvasRect[1],
      });
      toolHandler.preparingTheBrush(axis);
    }
  };
  const onPointerMove = e => {
    const { isDrawing, zoom, scroll, canvasRect } = store.getState();
    if (isDrawing) {
      e.preventDefault();
      const axis = viewportCoordsToSceneCoords(e, {
        zoom,
        scrollX: scroll[0],
        scrollY: scroll[1],
        offsetLeft: canvasRect[0],
        offsetTop: canvasRect[1],
      });
      toolHandler.useTool(axis);
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

  const onResize = e => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    store.setState({ width, height });
    updateCanvaSizes();
    canvas.resizeCanvas();
  };
  const onLoad = () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    store.setState({ width, height });
    throttleRAF(() => updateCanvaSizes(), { trailing: true });
    canvas.startCanvas();
  };
  const onWheel = e => {
    e.preventDefault();
    const { deltaY } = e;
    const { zoom } = store.getState();

    if (e.metaKey || e.ctrlKey) {
      const sign = Math.sign(deltaY);
      const MAX_STEP = VIEWPORT.ZOOM_STEP * 100;
      const absDelta = Math.abs(deltaY);
      let delta = deltaY;
      if (absDelta > MAX_STEP) {
        delta = MAX_STEP * sign;
      }
      let newZoom = zoom - delta / 100;
      newZoom += Math.log10(Math.max(1, zoom)) * -sign * Math.min(1, absDelta / 20);
      setZoom(zoom, getNormalizedZoom(newZoom));
    }
    /*
    if (e.shiftKey) {
      const updatedScrollX = scroll[0] - (deltaY || deltaX) / zoom;
      store.setState({ scroll: [updatedScrollX, scroll[1]] });
      return;
    }

    store.setState({
      scroll: [scroll[0] - deltaX / zoom, scroll[1] - deltaY / zoom],
    });
    */
  };

  /*
  -----------------------------------------------
  --------------- STORE SUBSCRIPTIONS ---------------------
  -----------------------------------------------
  */
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

  store.subscribe('zoom', newValue => {
    console.log({ zoom: newValue });
    // canvas.canvas.style.transform = `scale(${newValue})`;
    // canvas.canvas.style.transformOrigin = 'top left';
    // canvas.resizeCanvas();
    canvas.setCanvasScale(newValue);
  });
  store.subscribe('width', newValue => {
    canvas.updateWidth(newValue);
  });
  store.subscribe('height', newValue => {
    canvas.updateHeight(newValue);
  });

  /*
  -----------------------------------------------
  --------------- EVENT MANAGER / STARTERS ---------------------
  -----------------------------------------------
  */
  const removeEventListeners = () => {
    onRemoveEventListeners.trigger();
  };

  const addEventListeners = () => {
    removeEventListeners();

    onRemoveEventListeners.once(
      addEventListener(document, EVENTS.KEYDOWN, onKeydown),
      addEventListener(document, EVENTS.KEYUP, onKeyUp, {
        passive: true,
      }),
      addEventListener(document, EVENTS.CONTEXT_MENU, onContextMenu),
      addEventListener(document, EVENTS.TOUCH_MOVE, onTouchMove, {
        passive: false,
      }),
      addEventListener(window, EVENTS.LOAD, onLoad),
      addEventListener(window, EVENTS.RESIZE, onResize),
      addEventListener(canvasHtml, EVENTS.DRAG_START, () => false),
      addEventListener(toolsContainer, EVENTS.CLICK, onChangeTool),
      addEventListener(canvasHtml, EVENTS.POINTER_DOWN, onPointerDown),
      addEventListener(canvasHtml, EVENTS.POINTER_MOVE, onPointerMove),
      addEventListener(canvasHtml, EVENTS.POINTER_UP, onPointerStop),
      addEventListener(canvasHtml, EVENTS.POINTER_LEAVE, onPointerStop),
      addEventListener(canvasHtml, EVENTS.POINTER_CANCEL, onPointerStop),
      addEventListener(canvasHtml, EVENTS.POINTER_OUT, onPointerStop),
      addEventListener(canvasHtml, EVENTS.WHEEL, onWheel),

      addEventListener(btnZoomIn, EVENTS.CLICK, onZoomIn),
      addEventListener(btnZoomOut, EVENTS.CLICK, onZoomOut)
    );
  };

  const initHistoryTools = () => {
    onRemoveHistoryListener.trigger();
    const redoId = btnRedo.id;
    const undoId = btnUndo.id;
    // Agrego los iconos a los botones dinamicamente
    btnRedo.insertAdjacentHTML('beforeend', TOOL_ICON[redoId]);
    btnUndo.insertAdjacentHTML('beforeend', TOOL_ICON[undoId]);

    // Negacion en los "disabled", porque cuando es "true" NO tiene que desabilitarse
    onRemoveHistoryListener.once(
      addEventListener(btnRedo, EVENTS.CLICK, onRedo),
      addEventListener(btnUndo, EVENTS.CLICK, onUndo)
    );
  };

  addEventListeners();
  initHistoryTools();
})();
