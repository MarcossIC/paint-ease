# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Paint Ease is a vanilla JavaScript paint application built with Vite. It features **dual canvas architecture** - a legacy canvas system and a new infinite canvas system that supports panning, zooming, and world-space coordinates. The project is in **active transition** from the legacy system to the infinite canvas.

**Tech Stack:** Vanilla JS (ESM), Vite, Tailwind CSS 4, Pako (compression), RoughJS (partially integrated)  
**Entry Points:** `index.html` + `src/main.js`

## Development Commands

- `bun dev` - Start development server
- `bun build` - Build for production  
- `bun preview` - Preview production build

## Architecture

### Core Systems

**Dual Canvas Architecture (IN TRANSITION):**
- `src/lib/canvas.js` - **Legacy system** with ImageData snapshots, `globalCompositeOperation` for eraser
- `src/lib/infiniteCanvas.js` - **New system** with world coordinates, camera transforms, performance optimizations
- Both coexist: infinite canvas handles new features, legacy system being phased out

**State Management (`src/lib/appState.js`):**
- `AppGlobalState` class using Proxy-based reactivity with subscription system
- **Performance optimizations:** `_proxyCache`, `_pathCache`, batch updates with `_batchUpdate`
- **CRITICAL:** Subscriptions work on **primitive properties only**, not objects. Use `store.subscribe('camera.zoom', callback)`, not `store.subscribe('camera', callback)`
- **Known issues:** `_pathCache` uses only local property name (collision risk), `setState` batch notifications use mutated state for `oldValue`

**History Systems:**
- `src/lib/history.js` - **Legacy:** Compressed ImageData with Pako (default limit: 12 entries)
- `src/lib/worldHistory.js` - **New:** World-space element history for infinite canvas
- Both systems track undo/redo independently during transition

### Key Components

**Main Orchestration (`src/main.js`):**
- Instantiates `Canvas`, `InfiniteCanvas`, `ToolsHandler`, state store
- Manages all event listeners (keyboard, pointer, resize, tool clicks)
- Handles tool switching, cursor updates, undo/redo coordination between both systems

**Drawing Engine (`src/lib/toolsHandler.js` + `src/lib/draw.js`):**
- `ToolsHandler`: calculates pointer coordinates (corrects for zoom/brush size), accumulates points for smoothing
- `draw.js`: implements smooth lines (Catmull-Rom), rounded rectangles, circles, triangles
- **Dual system handling**: works with both legacy snapshots and infinite canvas world elements

**Utilities:**
- `src/utils/constants.js` - Tool IDs, SVG icons, cursor mappings, events
- `src/utils/keyUtilities.js` - Keyboard shortcuts with CapsLock normalization
- `src/utils/utils.js` - DOM helpers, compression/decompression utils

**Domain Layer:**
- `src/domain/emitter.js` - Simple pub/sub for listener cleanup
- `src/domain/device.js` - Device abstraction (unused)
- `src/domain/colorManager.js` - **Color management system:** validation, normalization, palette management, UI rendering, color extraction

### Drawing Features

**Tools Available:**
- **Neutral/Click** (panning mode with infinite canvas)
- **Brush** - Freehand with Catmull-Rom smoothing
- **Rectangle** - Rounded corners, supports fill mode
- **Circle** - Center-radius drawing
- **Triangle** - Isosceles triangle
- **Eraser** - Uses `globalCompositeOperation: 'destination-out'`
- **Trash** - Clear entire canvas

**Advanced Drawing Modes (New System Only):**
- **Straight line mode:** `Ctrl/Cmd + Alt` - 360° straight lines
- **Orthogonal mode:** `Ctrl/Cmd + Alt + Shift` - 90° angles with line chaining
- **Temporary panning:** `Space` key hold (without changing tool)

**Keyboard Shortcuts:**
- `Ctrl/Cmd + 1-6` - Switch tools
- `Ctrl/Cmd + 0` - Clear canvas  
- `Ctrl/Cmd + Z/Y` - Undo/Redo
- `Space` - Temporary pan mode
- `Shift + S` - Color dropper (WIP)

### Coordinate Systems

The infinite canvas uses two coordinate systems:
- **Screen coordinates**: Browser viewport coordinates
- **World coordinates**: Infinite canvas world space (transformed by camera)

Conversion methods in `InfiniteCanvas`:
- `screenToWorld(screenX, screenY)` 
- `worldToScreen(worldX, worldY)`

### Dependencies

- **RoughJS** (4.6.6) - Sketch-style drawing effects
- **Pako** (2.1.0) - Data compression for canvas state
- **Tailwind CSS** (4.1.11) - Utility-first styling with PostCSS

## Development Notes

- Canvas fills entire viewport using fixed positioning
- High DPI displays supported via `devicePixelRatio` scaling  
- Performance optimized with `requestAnimationFrame` and dirty flagging
- Touch devices supported with pointer events
- Keyboard shortcuts use normalized key handling for CapsLock compatibility

## State Structure

Key state properties in `store` (AppGlobalState):
- `camera: { x, y, zoom }` - Infinite canvas viewport
- `worldElements: []` - All drawn elements in world coordinates
- `isDrawing/isPanning/isTemporaryPanning` - Drawing state flags
- `isStraightLineMode/isOrthogonalMode` - Advanced drawing modes
- `chainStartPoint` - For orthogonal line chaining
- `cursor` - Current cursor type (synced with CSS)
- `hasHistory` - Symbol-based flag for undo/redo button states

## Known Issues & Limitations

**State Management:**
- `_pathCache` collision risk (uses only local property names)
- `setState` batch notifications use mutated state for `oldValue`

**Features Missing:**
- Color picker UI (values hardcoded in `ToolsHandler`)
- Zoom/pan implementation incomplete (only cursor feedback)
- RoughJS integration (installed but unused)
- Touch gesture support for pan/zoom

**Performance:**
- History stores full ImageData frames (memory intensive for large canvases)
- `MAX_HISTORY_INDEX` hardcoded to 12

**Canvas Context Configuration:**
- **CRITICAL:** Never use `desynchronized: true` in canvas context options
- This option causes drawing operations to render asynchronously, breaking real-time drawing
- Drawing strokes appear delayed or not at all because canvas updates are decoupled from main thread
- Stick to `{ willReadFrequently: true, alpha: true }` for paint applications

## Development Priority Areas

1. **Fix AppState issues:** Use full path in `_pathCache`, capture proper `oldValue` snapshots
2. **Complete infinite canvas transition:** Implement zoom/pan, finish tool integration
3. **Add tool settings UI:** Color picker, brush size, fill toggles
4. **Implement color dropper:** Use `getCurrentColor` utility in `src/utils/utils.js`
5. **RoughJS integration:** Hand-drawn style mode for shapes
6. **Export functionality:** PNG/JPEG export with configurable padding

## Critical Code Patterns

**Tool switching (main.js:57-71):**
```javascript
const onSetTool = (toolUpdated, target) => {
  toolHandler.currentTool = toolUpdated;
  canvas.context.globalCompositeOperation = 
    toolUpdated === TOOL_ERASER_ID ? 'destination-out' : 'source-over';
};
```

**Canvas redraw with composite operation safety (infiniteCanvas.js:642-644):**
```javascript
performRedraw() {
  // CRITICAL: Always preserve and restore globalCompositeOperation
  const previousCompositeOperation = this.ctx.globalCompositeOperation;
  this.ctx.globalCompositeOperation = 'source-over';
  try {
    // ... redraw logic
  } finally {
    this.ctx.globalCompositeOperation = previousCompositeOperation;
  }
}
```

**Why this matters:** The eraser tool sets `globalCompositeOperation = 'destination-out'`, which stays active until explicitly reset. Without this pattern, redraws would "erase" elements instead of drawing them.

**State subscriptions - granular property access (main.js:427):**
```javascript
// ❌ WRONG - Won't work because AppGlobalState only notifies primitive properties
store.subscribe('camera', (newCamera) => {
  // This callback will NEVER execute
});

// ✅ CORRECT - Subscribe to individual primitive properties
store.subscribe('camera.zoom', (newZoom) => {
  statusZoom.textContent = `Zoom: ${Math.round(newZoom * 100)}%`;
});
store.subscribe('camera.x', (newX) => { /* Handle camera X changes */ });
store.subscribe('camera.y', (newY) => { /* Handle camera Y changes */ });
```

**Why:** The `AppGlobalState` system uses deep proxy tracking and only notifies changes to primitive values (`camera.zoom`), not object references (`camera`).

**Store usage in Domain classes - CRITICAL PATTERN:**
```javascript
// ❌ WRONG - DO NOT pass store as constructor dependency
class ColorManager {
  constructor(store) {
    this.store = store; // Creates unnecessary coupling
  }
}
const colorManager = new ColorManager(store);

// ✅ CORRECT - Import store directly in domain classes
import { store } from '../lib/appState.js';

class ColorManager {
  constructor() {
    // No store dependency needed
  }
  
  someMethod() {
    // Use imported store directly
    const state = store.getState();
    store.setState({ ... });
  }
}
const colorManager = new ColorManager();
```

**Why:** The store is a singleton instance. Domain classes should import it directly rather than receiving it as a dependency. This reduces coupling and follows the established patterns in the codebase.

**Dual-system drawing (toolsHandler.js:127-139):**
```javascript
useTool = e => {
  const tool = this._toolSetting.currentTool;
  const isDrawLine = tool === TOOL_BRUSH_ID || tool === TOOL_ERASER_ID;
  if (!isDrawLine) {
    this._canvas.restoreImageData(); // Legacy system
    drawMethods[tool](this._toolState);
  } else {
    this.drawPoints(axis); // Both systems
  }
};
```