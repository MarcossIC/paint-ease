import { store } from './appState';
import WorldHistory from '../domain/worldHistory';
import { TOOL_RECTANGLE_ID, TOOL_CIRCLE_ID, TOOL_TRIANGLE_ID } from '../utils/constants';
import { strokeDrawingMethods, rectangleDrawingMethods } from './draw';

export class InfiniteCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    // Add willReadFrequently for better performance when reading pixel data frequently
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.worldElements = [];
    this.currentStroke = null;
    this.currentShape = null;
    
    // Camera properties
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1,
    };

    // Pan state
    this.panStart = null;
    this.isPanning = false;

    // Zoom constraints
    this.minZoom = 0.1;
    this.maxZoom = 5;

    // Performance optimizations
    this.isDirty = true; // Track if canvas needs redraw
    this.lastDrawnElementsCount = 0; // Track elements count for efficient updates
    this.animationId = null; // For requestAnimationFrame
    
    // Offscreen canvas for background (better performance)
    this.backgroundCanvas = null;
    this.backgroundCtx = null;
    this.backgroundDirty = true;

    // History system using WorldHistory
    this.history = new WorldHistory();
    
    // Drawing method selector - allows testing different approaches
    this.strokeDrawingMethod = 'quadratic'; // 'quadratic', 'catmullrom', 'bezier'
    this.shapeDrawingMethod = 'basic'; // 'basic', 'rounded'
  }

  // Convert screen coordinates to world coordinates
  screenToWorld(screenX, screenY) {
    // Since canvas now covers full viewport, we can use screenX/Y directly
    const x = screenX / this.camera.zoom + this.camera.x;
    const y = screenY / this.camera.zoom + this.camera.y;
    return { x, y };
  }

  // Convert world coordinates to screen coordinates
  worldToScreen(worldX, worldY) {
    const x = (worldX - this.camera.x) * this.camera.zoom;
    const y = (worldY - this.camera.y) * this.camera.zoom;
    return { x, y };
  }

  // Apply camera transformations to the context
  applyCameraTransform() {
    this.ctx.save();
    this.ctx.scale(this.camera.zoom, this.camera.zoom);
    this.ctx.translate(-this.camera.x, -this.camera.y);
  }

  // Reset camera transformations
  resetCameraTransform() {
    this.ctx.restore();
  }

  // Start panning operation
  startPan(screenX, screenY) {
    this.isPanning = true;
    this.panStart = {
      x: screenX,
      y: screenY,
      cameraX: this.camera.x,
      cameraY: this.camera.y,
    };
  }

  // Update pan during drag
  updatePan(screenX, screenY) {
    if (!this.isPanning || !this.panStart) return;

    const deltaX = (screenX - this.panStart.x) / this.camera.zoom;
    const deltaY = (screenY - this.panStart.y) / this.camera.zoom;

    this.camera.x = this.panStart.cameraX - deltaX;
    this.camera.y = this.panStart.cameraY - deltaY;

    // Update store
    store.setState({
      camera: { ...this.camera }
    });

    // Use optimized redraw for smooth panning
    this.markDirty();
  }

  // Stop panning
  stopPan() {
    this.isPanning = false;
    this.panStart = null;
  }

  // Zoom centered on cursor position
  zoom(screenX, screenY, deltaZoom) {
    const oldZoom = this.camera.zoom;
    const newZoom = Math.max(this.minZoom, Math.min(this.maxZoom, oldZoom * deltaZoom));
    
    
    if (newZoom === oldZoom) {
      console.log('⚠️ Zoom unchanged, returning early');
      return;
    }

    // Get world position under cursor before zoom
    const worldPos = this.screenToWorld(screenX, screenY);
    
    // Update zoom
    this.camera.zoom = newZoom;
    
    // Get new screen position of the same world point
    const newScreenPos = this.worldToScreen(worldPos.x, worldPos.y);
    
    // Adjust camera to keep the point under cursor
    // Since canvas covers full screen, screenX/Y are the target positions
    this.camera.x += (newScreenPos.x - screenX) / this.camera.zoom;
    this.camera.y += (newScreenPos.y - screenY) / this.camera.zoom;

    // Update store
    store.setState({
      camera: { ...this.camera }
    });

    // Use immediate redraw for responsive zooming
    this.redraw();
  }

  // Add a stroke element to the world
  addStroke(stroke) {
    this.worldElements.push(stroke);
    this.history.update(this.worldElements);
    store.setState({
      worldElements: [...this.worldElements]
    });
  }

  // Add a shape element to the world
  addShape(shape) {
    this.worldElements.push(shape);
    this.history.update(this.worldElements);
    store.setState({
      worldElements: [...this.worldElements]
    });
  }

  // Start a new stroke
  startStroke(worldX, worldY, toolSettings) {
    const state = store.getState();
    
    // Handle eraser - don't create a stroke, just start erasing
    if (toolSettings.currentTool === 'btn-eraser') {
      const eraserSize = toolSettings.size || 10;
      this.eraseAtPosition(worldX, worldY, eraserSize);
      this.currentStroke = {
        id: Date.now() + Math.random(),
        type: 'eraser',
        tool: toolSettings.currentTool,
        settings: { ...toolSettings },
      };
      return;
    }
    
    // For orthogonal chaining, use chainStartPoint if available
    let startX = worldX;
    let startY = worldY;
    
    if (state.isOrthogonalMode && state.chainStartPoint) {
      startX = state.chainStartPoint.x;
      startY = state.chainStartPoint.y;
    }
    
    this.currentStroke = {
      id: Date.now() + Math.random(),
      type: 'stroke',
      points: [{ x: startX, y: startY }],
      settings: { ...toolSettings },
      tool: toolSettings.currentTool,
      isStraightLine: state.isStraightLineMode || state.isOrthogonalMode,
      isOrthogonal: state.isOrthogonalMode,
    };
  }

  // Start a new shape (for preview during dragging)
  startShape(worldX, worldY, toolSettings) {
    this.currentShape = {
      id: Date.now() + Math.random(),
      type: 'shape',
      tool: toolSettings.currentTool,
      startX: worldX,
      startY: worldY,
      endX: worldX,
      endY: worldY,
      settings: { ...toolSettings },
    };
  }

  // Update shape end position during drag
  updateShape(worldX, worldY) {
    if (!this.currentShape) return;
    this.currentShape.endX = worldX;
    this.currentShape.endY = worldY;
    this.redraw();
  }

  // Finish current shape
  finishShape() {
    if (!this.currentShape) return;
    
    this.addShape(this.currentShape);
    this.currentShape = null;
  }

  // Calculate orthogonal point (restrict to 0°, 90°, 180°, 270°)
  getOrthogonalPoint(startX, startY, currentX, currentY) {
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    
    // Calculate which direction is stronger
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal line (0° or 180°)
      return { x: currentX, y: startY };
    } else {
      // Vertical line (90° or 270°)
      return { x: startX, y: currentY };
    }
  }

  // Check if a point intersects with any world element for erasing
  getElementsToErase(worldX, worldY, eraserSize = 10) {
    const elementsToRemove = [];
    
    for (let i = this.worldElements.length - 1; i >= 0; i--) {
      const element = this.worldElements[i];
      
      if (element.type === 'stroke') {
        // Check if eraser point intersects with any point in the stroke
        for (const point of element.points) {
          const distance = Math.sqrt(
            (worldX - point.x) ** 2 + (worldY - point.y) ** 2
          );
          if (distance <= eraserSize) {
            if (!elementsToRemove.includes(i)) {
              elementsToRemove.push(i);
            }
            break; // Found intersection, no need to check more points
          }
        }
      } else if (element.type === 'shape') {
        // Check if eraser point is inside the shape bounds
        const minX = Math.min(element.startX, element.endX) - eraserSize;
        const maxX = Math.max(element.startX, element.endX) + eraserSize;
        const minY = Math.min(element.startY, element.endY) - eraserSize;
        const maxY = Math.max(element.startY, element.endY) + eraserSize;
        
        if (worldX >= minX && worldX <= maxX && worldY >= minY && worldY <= maxY) {
          if (!elementsToRemove.includes(i)) {
            elementsToRemove.push(i);
          }
        }
      }
    }
    
    return elementsToRemove;
  }

  // Erase elements at the given world position
  eraseAtPosition(worldX, worldY, eraserSize = 10) {
    const elementsToRemove = this.getElementsToErase(worldX, worldY, eraserSize);
    
    if (elementsToRemove.length > 0) {
      // Remove elements from the array (in reverse order to maintain indices)
      elementsToRemove.sort((a, b) => b - a);
      for (const index of elementsToRemove) {
        this.worldElements.splice(index, 1);
      }
      
      // Update history and store
      this.history.update(this.worldElements);
      store.setState({
        worldElements: [...this.worldElements]
      });
      
      // Mark for redraw to show changes
      this.markDirty();
      return true; // Indicates something was erased
    }
    
    return false; // Nothing was erased
  }

  // Add point to current stroke
  addPointToStroke(worldX, worldY) {
    if (!this.currentStroke) return;
    
    // Handle erasing
    if (this.currentStroke.tool === 'btn-eraser') {
      const eraserSize = this.currentStroke.settings?.size || 10;
      this.eraseAtPosition(worldX, worldY, eraserSize);
      return;
    }
    
    if (this.currentStroke.isStraightLine) {
      let endX = worldX;
      let endY = worldY;
      
      // Apply orthogonal restriction if in orthogonal mode
      if (this.currentStroke.isOrthogonal) {
        const startPoint = this.currentStroke.points[0];
        const orthogonalPoint = this.getOrthogonalPoint(startPoint.x, startPoint.y, worldX, worldY);
        endX = orthogonalPoint.x;
        endY = orthogonalPoint.y;
      }
      
      // For straight lines, only keep start and current end point
      if (this.currentStroke.points.length === 1) {
        this.currentStroke.points.push({ x: endX, y: endY });
      } else {
        // Update the end point to current position
        this.currentStroke.points[1] = { x: endX, y: endY };
      }
    } else {
      // Normal curved stroke
      this.currentStroke.points.push({ x: worldX, y: worldY });
    }
    
    this.redrawStroke(this.currentStroke);
  }

  // Finish current stroke
  finishStroke() {
    if (!this.currentStroke) return;
    
    // Handle eraser - don't add to world elements
    if (this.currentStroke.type === 'eraser') {
      this.currentStroke = null;
      // Force a redraw to ensure elements are visible
      this.markDirty();
      return;
    }
    
    // For orthogonal mode, set up chaining for next line
    const state = store.getState();
    if (this.currentStroke.isOrthogonal && state.isOrthogonalMode) {
      // Set the end point of current line as start point for next line
      const endPoint = this.currentStroke.points[this.currentStroke.points.length - 1];
      store.setState({ chainStartPoint: { x: endPoint.x, y: endPoint.y } });
    }
    
    this.addStroke(this.currentStroke);
    this.currentStroke = null;
  }

  // Draw a single stroke - uses selected drawing method from draw.js
  drawStroke(stroke) {
    if (!stroke.points || stroke.points.length === 0) return;

    this.ctx.beginPath();
    this.ctx.strokeStyle = stroke.settings.color || '#000000';
    this.ctx.lineWidth = stroke.settings.size || 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (stroke.points.length === 1) {
      // Single point
      const point = stroke.points[0];
      this.ctx.arc(point.x, point.y, stroke.settings.size / 2, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (stroke.isStraightLine) {
      // Straight line - just draw from start to end
      this.ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      const endPoint = stroke.points[stroke.points.length - 1];
      this.ctx.lineTo(endPoint.x, endPoint.y);
      this.ctx.stroke();
    } else {
      // Use selected drawing method for curved lines from draw.js
      const drawFunction = strokeDrawingMethods[this.strokeDrawingMethod] || strokeDrawingMethods.quadratic;
      drawFunction(this.ctx, stroke.points);
    }
  }

  // Draw a single shape - uses selected drawing method from draw.js
  drawShape(shape) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = shape.settings.color || '#000000';
    this.ctx.fillStyle = shape.settings.paddingColor || 'transparent';
    this.ctx.lineWidth = shape.settings.size || 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    const { startX, startY, endX, endY, tool, settings } = shape;
    const isPaddingOn = settings.isPaddingOn || false;

    switch (tool) {
      case TOOL_RECTANGLE_ID:
        // Use selected rectangle drawing method from draw.js
        const rectangleDrawFunction = rectangleDrawingMethods[this.shapeDrawingMethod] || rectangleDrawingMethods.basic;
        rectangleDrawFunction(this.ctx, { startX, startY, endX, endY, isPaddingOn });
        break;

      case TOOL_CIRCLE_ID:
        const radius = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        this.ctx.arc(startX, startY, radius, 0, Math.PI * 2);
        if (isPaddingOn) {
          this.ctx.fill();
        } else {
          this.ctx.stroke();
        }
        break;

      case TOOL_TRIANGLE_ID:
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.lineTo(startX * 2 - endX, endY);
        this.ctx.closePath();
        if (isPaddingOn) {
          this.ctx.fill();
        } else {
          this.ctx.stroke();
        }
        break;
    }
  }

  // Redraw only the current stroke (for performance during drawing)
  redrawStroke(stroke) {
    // Use immediate redraw for responsiveness during drawing
    this.performRedraw();
  }

  // Clear the entire canvas
  clear() {
    const dpr = window.devicePixelRatio || 1;
    this.ctx.save();
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    this.ctx.restore();
  }

  // Set up canvas size and DPR
  setupCanvas() {
    const dpr = window.devicePixelRatio || 1;
    
    // Force canvas to fill entire viewport
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Set canvas internal dimensions (accounting for DPR)
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    
    // Scale the context to match DPR
    this.ctx.scale(dpr, dpr);
    
    // Set canvas CSS dimensions to match viewport
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    
    // Ensure canvas covers entire viewport
    this.canvas.style.position = 'fixed';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.zIndex = '2';
    
    // Setup offscreen background canvas
    this.setupBackgroundCanvas(width, height, dpr);
  }
  
  // Setup offscreen canvas for background
  setupBackgroundCanvas(width, height, dpr) {
    // Check if OffscreenCanvas is supported
    if (typeof OffscreenCanvas !== 'undefined') {
      try {
        this.backgroundCanvas = new OffscreenCanvas(width * dpr, height * dpr);
        this.backgroundCtx = this.backgroundCanvas.getContext('2d', { willReadFrequently: true });
        this.backgroundCtx.scale(dpr, dpr);
        this.backgroundDirty = true;
      } catch (e) {
        this.backgroundCanvas = null;
        this.backgroundCtx = null;
      }
    } else {
      this.backgroundCanvas = null;
      this.backgroundCtx = null;
    }
  }

  // Render background to offscreen canvas (only when dirty)
  renderBackgroundOffscreen() {
    if (!this.backgroundDirty || !this.backgroundCtx) return;
    
    const dpr = window.devicePixelRatio || 1;
    this.backgroundCtx.save();
    this.backgroundCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.backgroundCtx.fillStyle = '#fafafa';
    this.backgroundCtx.fillRect(0, 0, this.backgroundCanvas.width / dpr, this.backgroundCanvas.height / dpr);
    this.backgroundCtx.restore();
    
    this.backgroundDirty = false;
  }

  // Draw background (simplified)
  drawBackground() {
    this.ctx.save();
    // Reset any transformations to draw background in screen space
    const dpr = window.devicePixelRatio || 1;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.fillStyle = '#fafafa';
    this.ctx.fillRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr);
    this.ctx.restore();
  }

  // Update preview line for orthogonal mode
  updatePreviewLine(worldX, worldY) {
    const state = store.getState();
    
    if (state.isOrthogonalMode && state.chainStartPoint && !this.currentStroke) {
      const orthogonalPoint = this.getOrthogonalPoint(
        state.chainStartPoint.x, 
        state.chainStartPoint.y, 
        worldX, 
        worldY
      );
      
      const previewLine = {
        type: 'preview',
        startX: state.chainStartPoint.x,
        startY: state.chainStartPoint.y,
        endX: orthogonalPoint.x,
        endY: orthogonalPoint.y,
      };
      
      store.setState({ previewLine });
      this.redraw();
    }
  }

  // Clear preview line
  clearPreviewLine() {
    const state = store.getState();
    if (state.previewLine) {
      store.setState({ previewLine: null });
      this.redraw();
    }
  }

  // Draw preview line
  drawPreviewLine(preview) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#999999';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]); // Dashed line for preview
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    this.ctx.moveTo(preview.startX, preview.startY);
    this.ctx.lineTo(preview.endX, preview.endY);
    this.ctx.stroke();
    
    this.ctx.restore();
  }

  // Mark canvas as dirty for next frame
  markDirty() {
    if (!this.isDirty) {
      this.isDirty = true;
      this.scheduleRedraw();
    } 
  }

  // Schedule redraw using requestAnimationFrame
  scheduleRedraw() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    this.animationId = requestAnimationFrame(() => {
      if (this.isDirty) {
        this.performRedraw();
      }
    });
  }

  // Actual redraw implementation
  performRedraw() {
    // Ensure redraw uses normal blending, but restore previous mode afterwards
    const previousCompositeOperation = this.ctx.globalCompositeOperation;
    this.ctx.globalCompositeOperation = 'source-over';
    try {
      this.clear();
      this.drawBackground();
      
      this.applyCameraTransform();
    
    // Draw all world elements
    let drawnCount = 0;
    for (const element of this.worldElements) {
      if (element.type === 'stroke') {
        this.drawStroke(element);
        drawnCount++;
      } else if (element.type === 'shape') {
        this.drawShape(element);
        drawnCount++;
      }
    }
    
    // Draw current stroke if any (but not eraser)
    if (this.currentStroke && this.currentStroke.type !== 'eraser') {
      this.drawStroke(this.currentStroke);
    }
    
    // Draw current shape if any
    if (this.currentShape) {
      this.drawShape(this.currentShape);
    }
    
    // Draw preview line if any
    const state = store.getState();
    if (state.previewLine) {
      this.drawPreviewLine(state.previewLine);
    }
    
      this.resetCameraTransform();
      
      // Mark as clean
      this.isDirty = false;
      this.lastDrawnElementsCount = this.worldElements.length;
    } finally {
      // Restore whatever mode (e.g., legacy eraser) was active before redraw
      this.ctx.globalCompositeOperation = previousCompositeOperation;
    }
  }

  // Immediate redraw (legacy method)
  redraw() {
    this.performRedraw();
  }

  // Initialize the canvas
  init() {
    this.setupCanvas();
    
    // Sync with store state on initialization
    const state = store.getState();
    if (Array.isArray(state.worldElements)) {
      this.worldElements = [...state.worldElements];
    }
    
    this.redraw();
    // Initialize history with current state
    this.history.update(this.worldElements);
  }

  // Handle window resize
  resize() {
    this.backgroundDirty = true; // Mark background as dirty on resize
    this.setupCanvas();
    this.redraw();
  }

  // Clear all elements
  clearAll() {
    this.worldElements = [];
    this.history.update(this.worldElements);
    store.setState({
      worldElements: []
    });
    this.redraw();
  }

  // Undo last action
  undo() {
    const previousState = this.history.undo();
    if (previousState !== null) {
      this.worldElements = previousState;
      store.setState({
        worldElements: [...this.worldElements]
      });
      this.redraw();
      return true;
    }
    return false;
  }

  // Redo last undone action
  redo() {
    const nextState = this.history.redo();
    if (nextState !== null) {
      this.worldElements = nextState;
      store.setState({
        worldElements: [...this.worldElements]
      });
      this.redraw();
      return true;
    }
    return false;
  }

  // Check if undo is available
  canUndo() {
    return this.history.hasUndo();
  }

  // Check if redo is available
  canRedo() {
    return this.history.hasRedo();
  }

  // Check if there are any history entries
  hasHistory() {
    return this.history.hasEntries();
  }

  // Clean up resources and cancel pending animations
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.backgroundCanvas = null;
    this.backgroundCtx = null;
  }

  // ============ Drawing method selectors for testing different approaches ============
  
  // Change stroke drawing method ('quadratic', 'catmullrom', 'bezier')
  setStrokeDrawingMethod(method) {
    if (strokeDrawingMethods[method]) {
      this.strokeDrawingMethod = method;
      this.redraw(); // Redraw to apply changes to existing strokes
      console.log(`🎨 Stroke drawing method changed to: ${method}`);
    } else {
      console.warn(`❌ Unknown stroke drawing method: ${method}`);
    }
  }

  // Change shape drawing method ('basic', 'rounded')
  setShapeDrawingMethod(method) {
    if (rectangleDrawingMethods[method]) {
      this.shapeDrawingMethod = method;
      this.redraw(); // Redraw to apply changes to existing shapes
      console.log(`🔷 Shape drawing method changed to: ${method}`);
    } else {
      console.warn(`❌ Unknown shape drawing method: ${method}`);
    }
  }

  // Get available drawing methods (for UI or debugging)
  getAvailableStrokeMethods() {
    return Object.keys(strokeDrawingMethods);
  }

  getAvailableShapeMethods() {
    return Object.keys(rectangleDrawingMethods);
  }
}