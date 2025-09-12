import { store } from './appState';
import WorldHistory from '../domain/worldHistory';
// Shape tool constants - these are now internal to the shapes system
import { strokeDrawingMethods, rectangleDrawingMethods } from './draw';
import { getRecommendedColorSpace } from '../utils/supports';

export class InfiniteCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    const colorSpace = getRecommendedColorSpace();
    // Enhanced context options for better rendering quality
    this.ctx = canvas.getContext('2d', {
      colorSpace, 
      willReadFrequently: true,
      alpha: true,
      // CRITICAL: Do NOT use desynchronized: true
      // It causes drawing operations to not appear immediately on screen
      // because the canvas renders asynchronously from the main thread.
      // This breaks real-time drawing functionality in paint applications.
      // desynchronized: true // BROKEN - causes drawing to fail
    });
    
    // Enable high-quality rendering
    this.setupHighQualityRendering();
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
    // Default to Bézier; expose 'rough' (RoughJS) as an alternative
    this.strokeDrawingMethod = 'bezier'; // 'quadratic', 'catmullrom', 'bezier', 'rough'
    this.shapeDrawingMethod = 'basic'; // 'basic', 'rounded'
  }
  
  // Setup high-quality rendering settings
  setupHighQualityRendering() {
    // Only configure quality-related flags here. Sizing and DPR scaling
    // are handled in setupCanvas() to prevent compounded transforms.
    // High-quality rendering settings
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
    
    // Better line rendering
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    
    // Text rendering quality
    this.ctx.textRenderingOptimization = 'optimizeQuality';
  }

  // Convert screen coordinates to world coordinates
  screenToWorld(screenX, screenY) {
    // Normalize to canvas viewport in case layout offsets exist
    const rect = this.canvas.getBoundingClientRect();
    const localX = screenX - rect.left;
    const localY = screenY - rect.top;
    const x = localX / this.camera.zoom + this.camera.x;
    const y = localY / this.camera.zoom + this.camera.y;
    return { x, y };
  }

  // Convert world coordinates to screen coordinates
  worldToScreen(worldX, worldY) {
    // Return coordinates relative to the canvas top-left (local screen space)
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
    const rect = this.canvas.getBoundingClientRect();
    this.panStart = {
      x: screenX,
      y: screenY,
      cameraX: this.camera.x,
      cameraY: this.camera.y,
      rectLeft: rect.left,
      rectTop: rect.top,
    };
  }

  // Update pan during drag
  updatePan(screenX, screenY) {
    if (!this.isPanning || !this.panStart) return;

    // Compute deltas in local canvas coordinates
    const rect = this.canvas.getBoundingClientRect();
    const localX = screenX - rect.left;
    const localY = screenY - rect.top;
    const deltaX = (localX - (this.panStart.x - this.panStart.rectLeft)) / this.camera.zoom;
    const deltaY = (localY - (this.panStart.y - this.panStart.rectTop)) / this.camera.zoom;

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
    
    // Get new screen position of the same world point (local to canvas)
    const newScreenPos = this.worldToScreen(worldPos.x, worldPos.y);
    
    // Adjust camera to keep the point under cursor
    const rect = this.canvas.getBoundingClientRect();
    const localTargetX = screenX - rect.left;
    const localTargetY = screenY - rect.top;
    this.camera.x += (newScreenPos.x - localTargetX) / this.camera.zoom;
    this.camera.y += (newScreenPos.y - localTargetY) / this.camera.zoom;

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

    // Set stroke properties before drawing
    this.ctx.strokeStyle = stroke.settings.color || '#000000';
    this.ctx.lineWidth = stroke.settings.size || 2;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';

    if (stroke.points.length === 1) {
      // Single point
      const point = stroke.points[0];
      this.ctx.beginPath();
      this.ctx.fillStyle = stroke.settings.color || '#000000';
      this.ctx.arc(point.x, point.y, stroke.settings.size / 2, 0, Math.PI * 2);
      this.ctx.fill();
    } else if (stroke.isStraightLine) {
      // Straight line - just draw from start to end
      this.ctx.beginPath();
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
    const ctx = this.ctx;
    ctx.save();
    
    // Shape properties
    const { startX, startY, endX, endY, tool, settings } = shape;
    const strokeWidth = settings.size || 2;
    const strokeColor = settings.color || '#000000';
    const fillColor = settings.paddingColor || strokeColor;
    const isPaddingOn = settings.isPaddingOn || false;
    const cornerRadius = Number(settings.cornerRadius) || 0;
    const lineStyle = settings.lineStyle || 'solid';
    const opacity = settings.opacity ?? 100; // Default to 100% if not specified

    // Apply opacity for shapes (0-100 percentage to 0-1 range)
    ctx.globalAlpha = opacity / 100;

    // Set stroke properties
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Set fill properties
    if (isPaddingOn) {
      ctx.fillStyle = fillColor;
    }

    // Set line dash pattern based on line style
    if (lineStyle === 'dashed') {
      ctx.setLineDash([strokeWidth * 3, strokeWidth * 2]);
    } else if (lineStyle === 'dotted') {
      ctx.setLineDash([strokeWidth, strokeWidth]);
    } else {
      ctx.setLineDash([]);
    }

    ctx.beginPath();

    switch (tool) {
      case 'btn-rectangle': {
        // Use selected rectangle drawing method from draw.js; prefer rounded if radius > 0
        const useRounded = cornerRadius > 0;
        const method = useRounded ? 'rounded' : this.shapeDrawingMethod;
        const rectangleDrawFunction = rectangleDrawingMethods[method] || rectangleDrawingMethods.basic;
        rectangleDrawFunction(ctx, { startX, startY, endX, endY, isPaddingOn, radius: cornerRadius });
        break;
      }

      case 'btn-circle': {
        const radius = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        ctx.arc(startX, startY, radius, 0, Math.PI * 2);
        
        // Always draw stroke (border), then fill if requested
        ctx.stroke();
        
        if (isPaddingOn) {
          ctx.fill();
        }
        break;
      }

      case 'btn-triangle-isosceles': {
        // Create isosceles triangle (two equal sides)
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineTo(startX * 2 - endX, endY);
        ctx.closePath();
        
        // Always draw stroke (border), then fill if requested
        ctx.stroke();
        
        if (isPaddingOn) {
          ctx.fill();
        }
        break;
      }

      case 'btn-triangle-scalene': {
        // Create scalene triangle (all different sides)
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        // Third point offset to create unequal sides
        const thirdX = startX - deltaX * 0.3;
        const thirdY = endY + deltaY * 0.2;
        
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineTo(thirdX, thirdY);
        ctx.closePath();
        
        // Always draw stroke (border), then fill if requested
        ctx.stroke();
        
        if (isPaddingOn) {
          ctx.fill();
        }
        break;
      }

      case 'btn-triangle-equilateral': {
        // Create equilateral triangle (all equal sides)
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Calculate equilateral triangle points
        const height = distance * Math.sin(Math.PI / 3); // 60 degrees
        const centerX = (startX + endX) / 2;
        const centerY = (startY + endY) / 2;
        
        // Third point to form equilateral triangle
        const thirdX = centerX - height * (deltaY / distance);
        const thirdY = centerY + height * (deltaX / distance);
        
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.lineTo(thirdX, thirdY);
        ctx.closePath();
        
        // Always draw stroke (border), then fill if requested
        ctx.stroke();
        
        if (isPaddingOn) {
          ctx.fill();
        }
        break;
      }
    }

    ctx.restore();
  }

  // Redraw only the current stroke (for performance during drawing)
  redrawStroke(stroke) {
    // Use immediate redraw for responsiveness during drawing
    this.performRedraw();
  }

  // Clear the entire canvas
  clear() {
    this.ctx.save();
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.restore();
  }

  // Set up canvas size and DPR
  setupCanvas() {
    // Use the exact devicePixelRatio to avoid fractional blurring
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    
    // Force canvas to fill entire viewport
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Set canvas internal dimensions (accounting for DPR)
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    
    // Reset any previous transform and apply DPR scale only once
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    
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
        this.backgroundCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
    
    this.backgroundCtx.save();
    this.backgroundCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.backgroundCtx.fillStyle = '#fafafa';
    this.backgroundCtx.fillRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
    this.backgroundCtx.restore();
    
    this.backgroundDirty = false;
  }

  // Draw background (simplified)
  drawBackground() {
    this.ctx.save();
    // Reset any transformations to draw background in screen space
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.fillStyle = '#fafafa';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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
      } else if (element.type === 'laser') {
        this.drawLaserLine(element);
        drawnCount++;
      } else if (element.type === 'laser-point') {
        this.drawLaserPoint(element);
        drawnCount++;
      } else if (element.type === 'laser-trail') {
        this.drawLaserTrail(element);
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
    } else {
      console.warn(`❌ Unknown stroke drawing method: ${method}`);
    }
  }

  // Change shape drawing method ('basic', 'rounded')
  setShapeDrawingMethod(method) {
    if (rectangleDrawingMethods[method]) {
      this.shapeDrawingMethod = method;
      this.redraw(); // Redraw to apply changes to existing shapes
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

  // Draw laser line with glow effect
  drawLaserLine(element) {
    if (!element.points || element.points.length < 2) return;

    const ctx = this.ctx;
    ctx.save();

    // Set opacity
    ctx.globalAlpha = element.opacity || 1;

    // Create glow effect with multiple passes
    const glowIntensity = element.glowIntensity || 0.6;
    const color = element.color || '#ff0000';
    const strokeWidth = element.strokeWidth || 1; // Thinner default

    // Outer glow (wider, more transparent) 
    ctx.shadowColor = color;
    ctx.shadowBlur = element.shadowBlur || 4; // Reduced blur
    ctx.lineWidth = strokeWidth * 1.5; // Less wide glow
    ctx.strokeStyle = color;
    ctx.globalAlpha = (element.opacity || 1) * 0.2; // More transparent glow

    ctx.beginPath();
    ctx.moveTo(element.points[0].x, element.points[0].y);
    for (let i = 1; i < element.points.length; i++) {
      ctx.lineTo(element.points[i].x, element.points[i].y);
    }
    ctx.stroke();

    // Inner line (solid, bright)
    ctx.shadowBlur = 0;
    ctx.lineWidth = strokeWidth;
    ctx.globalAlpha = element.opacity || 1;
    ctx.strokeStyle = color;

    ctx.beginPath();
    ctx.moveTo(element.points[0].x, element.points[0].y);
    for (let i = 1; i < element.points.length; i++) {
      ctx.lineTo(element.points[i].x, element.points[i].y);
    }
    ctx.stroke();

    ctx.restore();
  }

  // Draw laser point with glow effect
  drawLaserPoint(element) {
    const ctx = this.ctx;
    ctx.save();

    const x = element.x;
    const y = element.y;
    const radius = element.radius || 4;
    const color = element.color || '#ff0000';

    // Set opacity
    ctx.globalAlpha = element.opacity || 1;

    // Outer glow
    ctx.shadowColor = color;
    ctx.shadowBlur = element.shadowBlur || 12;
    ctx.fillStyle = color;
    ctx.globalAlpha = (element.opacity || 1) * 0.4;

    ctx.beginPath();
    ctx.arc(x, y, radius * 2, 0, 2 * Math.PI);
    ctx.fill();

    // Inner bright dot
    ctx.shadowBlur = 0;
    ctx.globalAlpha = element.opacity || 1;
    ctx.fillStyle = color;

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fill();

    // White center dot
    ctx.fillStyle = 'white';
    ctx.globalAlpha = (element.opacity || 1) * 0.8;
    
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.3, 0, 2 * Math.PI);
    ctx.fill();

    ctx.restore();
  }

  // Draw laser trail with proper fade effect (oldest fades first)
  drawLaserTrail(element) {
    if (!element.trailPoints || element.trailPoints.length < 2) return;

    const ctx = this.ctx;
    const now = element.currentTime || Date.now();
    const trailDuration = element.trailDuration || 600;
    const color = element.color || '#ff0000';
    
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Draw trail with individual point opacity based on age
    for (let i = 1; i < element.trailPoints.length; i++) {
      const prevPoint = element.trailPoints[i - 1];
      const currentPoint = element.trailPoints[i];
      
      // Calculate opacity based on point age (older points are more transparent)
      const pointAge = now - currentPoint.timestamp;
      const ageProgress = Math.min(1, pointAge / trailDuration);
      
      // Smooth fade curve - slower at start, faster at end (laser trail effect)
      let opacity;
      if (ageProgress < 0.2) {
        opacity = 1 - (ageProgress * 0.1); // Very slow fade initially
      } else if (ageProgress < 0.8) {
        const fadeProgress = (ageProgress - 0.2) / 0.6;
        opacity = 0.98 - (fadeProgress * 0.7); // Moderate fade
      } else {
        const fadeProgress = (ageProgress - 0.8) / 0.2;
        opacity = 0.28 * Math.pow(1 - fadeProgress, 2); // Accelerated fade at end
      }
      
      opacity = Math.max(0, Math.min(1, opacity));
      
      if (opacity <= 0.01) continue; // Skip nearly invisible segments
      
      // Draw segment with calculated opacity and glow
      ctx.globalAlpha = opacity;
      
      // Outer glow
      ctx.shadowColor = color;
      ctx.shadowBlur = 3 * opacity; // Blur reduces with opacity
      ctx.lineWidth = element.strokeWidth * 1.5;
      ctx.strokeStyle = color;
      ctx.globalAlpha = opacity * 0.3;
      
      ctx.beginPath();
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
      
      // Inner bright line
      ctx.shadowBlur = 0;
      ctx.lineWidth = element.strokeWidth || 1;
      ctx.globalAlpha = opacity;
      
      ctx.beginPath();
      ctx.moveTo(prevPoint.x, prevPoint.y);
      ctx.lineTo(currentPoint.x, currentPoint.y);
      ctx.stroke();
    }

    ctx.restore();
  }
}