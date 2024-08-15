import './styles/normalize.css';
import './styles/style.css';
import {
  TOOL_ICON,
  TOOL_ERASER_ID,
  TOOL_CLICK_ID,
  TOOL_TRASH_ID,
  TOOL_UNDO_ID,
} from './constants';
import { $, $$ } from './lib/utils';
import Canvas from './lib/canvas';
import ToolsHandler from './lib/toolsHandler';

(() => {
  const canvasHtml = $('#canvas');
  const tools = $$('#tool-controls .btn');
  const historyTools = $$('#history-controls .btn');
  const btnUndo = $('#btn-undo');
  const canvas = new Canvas(canvasHtml);
  const toolHandler = new ToolsHandler(canvas, TOOL_CLICK_ID);

  const changeSelectedTool = e => {
    const toolTarget = e.target.closest('label');
    const selectedToolId = toolHandler.currentTool;
    const isCurrentSelected = selectedToolId === toolTarget?.id;

    console.log({ toolTarget });
    if (!toolTarget || isCurrentSelected) {
      toolHandler.resetToolState();
      return;
    }
    if (toolTarget.id !== TOOL_TRASH_ID) toolHandler.currentTool = toolTarget.id;

    if (toolTarget.id === TOOL_CLICK_ID) {
      canvas.canvas.style.removeProperty('--current-cursor');
    } else if (toolTarget.id === TOOL_ERASER_ID) {
      canvas.canvas.style.setProperty(
        '--current-cursor',
        `url("/icons/cursorEraser.png") 10 10, auto`
      );
    } else if (toolTarget.id === TOOL_TRASH_ID) {
      const inputTarget = toolTarget.querySelector('input');
      inputTarget.checked = false;
      canvas.clear();
      canvas.history.reset();
      historyTools.forEach(tool => {
        tool.disabled = true;
      });
    } else {
      canvas.canvas.style.setProperty('--current-cursor', `crosshair`);
    }
    toolHandler.resetToolState();
  };

  const historyMove = id => {
    if (id === TOOL_UNDO_ID) {
      return canvas.goBackHistory();
    }
    canvas.history.redo(canvas.context);
    const idx = canvas.history.index;
    return idx < 0 || canvas.history.isInLast();
  };

  const initTools = () => {
    tools.forEach(controlTool => {
      controlTool.insertAdjacentHTML('beforeend', TOOL_ICON[controlTool.id]);
      controlTool.addEventListener('click', changeSelectedTool);
    });
    historyTools.forEach(historyTool => {
      const { id } = historyTool;
      historyTool.insertAdjacentHTML('beforeend', TOOL_ICON[id]);
      historyTool.addEventListener('click', () => {
        historyTool.disabled = historyMove(id);
      });
    });
  };

  const disableContextMenu = () => {
    document.addEventListener('contextmenu', event => event.preventDefault());
  };

  const startDraw = e => {
    e.preventDefault();
    if (toolHandler.currentTool !== TOOL_CLICK_ID && e.isPrimary) {
      toolHandler.isDrawing = true;
      document.body.style.setProperty('--paintease-pointers-events', 'none');
      toolHandler.preparingTheBrush([e.offsetX, e.offsetY]);
      canvas.canvas.addEventListener('pointermove', toolHandler.useTool);
    }
  };

  const stopDraw = e => {
    e.preventDefault();
    if (toolHandler.isDrawing) {
      document.body.style.setProperty('--paintease-pointers-events', 'all');
      toolHandler.pencil.pointsBuffer = [];
      toolHandler.isDrawing = false;
      cancelAnimationFrame(toolHandler.pencil.frameId);
      toolHandler.pencil.frameId = null;
      canvas.canvas.removeEventListener('pointermove', toolHandler.useTool);
      canvas.saveState();
      if (btnUndo.disabled) btnUndo.disabled = false;
    }
  };

  const prepareCanvas = () => {
    canvas.canvas.addEventListener('dragstart', () => false);

    canvas.canvas.addEventListener('pointerdown', startDraw);
    canvas.canvas.addEventListener('pointerup', stopDraw);
    canvas.canvas.addEventListener('pointerleave', stopDraw);
    canvas.canvas.addEventListener('pointerout', stopDraw);
    canvas.canvas.addEventListener('pointercancel', stopDraw);
  };

  const init = () => {
    disableContextMenu();
    initTools();
    prepareCanvas();
  };

  init();
})();
