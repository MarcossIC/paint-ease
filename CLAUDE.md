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
- `src/legacy/canvas.js` - **Legacy system** with ImageData snapshots, `globalCompositeOperation` for eraser
- `src/lib/infiniteCanvas.js` - **New system** with world coordinates, camera transforms, performance optimizations
- `src/lib/laserPointer.js` - **Laser pointer system** with trail effects and animation
- Both coexist: infinite canvas handles new features, legacy system being phased out

**State Management (`src/lib/appState.js`):**
- `AppGlobalState` class using Proxy-based reactivity with subscription system
- **Performance optimizations:** `_proxyCache`, `_pathCache`, batch updates with `_batchUpdate`
- **CRITICAL:** Subscriptions work on **primitive properties only**, not objects. Use `store.subscribe('camera.zoom', callback)`, not `store.subscribe('camera', callback)`
- **Known issues:** `_pathCache` uses only local property name (collision risk), `setState` batch notifications use mutated state for `oldValue`
- **Recent fixes:** Color button toggle state correctly managed - button visual state now properly syncs with popover visibility

**History Systems:**
- `src/legacy/history.js` - **Legacy:** Compressed ImageData with Pako (default limit: 12 entries)  
- `src/domain/worldHistory.js` - **New:** World-space element history for infinite canvas
- Both systems track undo/redo independently during transition

### Key Components

**Main Orchestration (`src/main.js`):**
- Instantiates `Canvas`, `InfiniteCanvas`, `LaserPointer`, `ToolsHandler`, state store
- Manages all event listeners (keyboard, pointer, resize, tool clicks)
- Handles tool switching, cursor updates, undo/redo coordination between both systems
- **Laser pointer integration:** Manages laser pointer activation and trail rendering
- **Color palette management:** Special handling for color button toggle state and popover visibility

**Drawing Engine (`src/lib/toolsHandler.js` + `src/lib/draw.js`):**
- `ToolsHandler`: calculates pointer coordinates (corrects for zoom/brush size), accumulates points for smoothing
- `draw.js`: implements smooth lines (Catmull-Rom), rounded rectangles, circles, triangles
- **Dual system handling**: works with both legacy snapshots and infinite canvas world elements

**Utilities:**
- `src/utils/constants.js` - Tool IDs, SVG icons, cursor mappings, events
- `src/utils/keyUtilities.js` - Keyboard shortcuts with CapsLock normalization  
- `src/utils/utils.js` - DOM helpers, compression/decompression utils
- `src/utils/supports.js` - Feature detection and color space support

**Domain Layer:**
- `src/domain/emitter.js` - Simple pub/sub for listener cleanup
- `src/domain/device.js` - Device abstraction (unused)
- `src/domain/colorManager.js` - **Color management system:** validation, normalization, palette management, UI rendering, color extraction
- `src/domain/worldHistory.js` - World-space element history for infinite canvas

### Drawing Features

**Tools Available:**
- **Neutral/Click** (panning mode with infinite canvas)
- **Brush** - Freehand with Catmull-Rom smoothing
- **Rectangle** - Rounded corners, supports fill mode
- **Circle** - Center-radius drawing
- **Triangle** - Isosceles triangle
- **Eraser** - Uses `globalCompositeOperation: 'destination-out'`
- **Laser Pointer** - Interactive laser pointer with trail effect (new)
- **Trash** - Clear entire canvas
- **Color Palette** - Toggle color popover with special button state management

**Advanced Drawing Modes (New System Only):**
- **Straight line mode:** `Ctrl/Cmd + Alt` - 360° straight lines
- **Orthogonal mode:** `Ctrl/Cmd + Alt + Shift` - 90° angles with line chaining
- **Temporary panning:** `Space` key hold (without changing tool)

**Keyboard Shortcuts:**
- `Ctrl/Cmd + 1-7` - Switch tools (1-6 original tools, 7 for laser pointer)
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
- Zoom/pan implementation incomplete (only cursor feedback)
- RoughJS integration (installed but unused)
- Touch gesture support for pan/zoom

**UI Features Working:**
- Color palette with toggle functionality and proper visual state management
- Color popover with modal editor for custom colors
- Automatic popover closing when clicking outside

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

**Color button toggle state management (main.js:119-131):**
```javascript
const onSetTool = (toolUpdated, target) => {
  // Special case: open color palette, do not change cursor/tool
  if (toolUpdated === TOOL_COLOR_ID) {
    const isCurrentlyHidden = colorPopover?.classList.contains('hidden');
    // Toggle popover visibility
    colorPopover?.classList.toggle('hidden');
    // While popover is open, mark button as active (checked). When closing, uncheck
    const shouldBeChecked = Boolean(isCurrentlyHidden);
    if (target) target.checked = shouldBeChecked;
    return;
  }
  // ... rest of tool handling
};
```

**Why this matters:** The color button uses a special toggle pattern where the radio button's checked state must manually sync with the popover's visibility. Standard radio button behavior would interfere with the toggle functionality.

**Color popover auto-close on outside clicks (main.js:361-374):**
```javascript
const onPointerDown = e => {
  // Only handle canvas clicks, not toolbar clicks
  if (!e.target.closest('#canvas')) {
    return;
  }
  if (!colorPopover.classList.contains('hidden')) {
    const isInside = e.target.closest('#color-popover') || e.target.closest('#btn-color');
    if (!isInside) {
      const colorRadio = colorButton?.querySelector('input[type="radio"]');
      if (colorRadio) colorRadio.checked = false;
      colorPopover.classList.add('hidden');
    }
  }
  // ... rest of pointer handling
};
```

**Color selection handling - auto-close after color pick (main.js:508-513):**
```javascript
// Uncheck the color tool radio to remove active style
const colorRadio = colorButton?.querySelector('input[type="radio"]');
if (colorRadio) colorRadio.checked = false;
colorPopover?.classList.add('hidden');
```

**Event handling for color tool to prevent double-click issues (main.js:315-323):**
```javascript
// Prevent double execution for color tool due to event bubbling
// Only process clicks on the label itself, not on the input inside
if (toolTarget.id === TOOL_COLOR_ID && rawTarget.tagName === 'INPUT') {
  return; // Don't process input clicks, only label clicks
}

// For color tool, prevent the default radio toggle and manage checked manually
if (toolTarget.id === TOOL_COLOR_ID) {
  e.preventDefault();
}
```

## Event Listener Best Practices

### **CRITICAL: No Inline Callbacks Pattern**

**❌ WRONG - Inline callbacks that redefine on every execution:**
```javascript
addEventListener(element, 'click', (e) => {
  // Complex logic here...
  // This callback is recreated every time addEventListeners() is called
  // causing memory leaks and performance issues
});
```

**✅ CORRECT - Named functions defined in events section:**
```javascript
// In events section
const onElementClick = (e) => {
  // Complex logic here...
  // Function is defined once and reused
};

// In addEventListeners()
addEventListener(element, 'click', onElementClick);
```

**Why this matters:** Inline callbacks are recreated every time `addEventListeners()` is called, leading to memory leaks and performance degradation. Named functions are defined once and reused.

### **Event Listener Management with Emitters**

**Automatic cleanup pattern using `onRemoveEventListeners.once()`:**
```javascript
const addEventListeners = () => {
  removeEventListeners(); // Clean up previous listeners
  
  onRemoveEventListeners.once(
    addEventListener(element1, 'click', onElement1Click),
    addEventListener(element2, 'input', onElement2Input),
    addEventListener(element3, 'blur', onElement3Blur),
    // All listeners are automatically cleaned up when removeEventListeners() is called
  );
};
```

### **Recently Refactored Event Handlers**

The following event handlers have been refactored from inline callbacks to named functions:

**Modal Active Grid Click Handler (main.js:296-328):**
- `onModalActiveGridClick` - Handles custom color grid interactions
- `onModalActiveGridRemove` - Removes custom colors
- `onModalActiveGridEdit` - Opens color picker for editing
- `onModalActiveGridColorSelect` - Sets selected color as active

**Modal Default Grid Click Handler (main.js:330-379):**
- `onModalDefaultGridClick` - Handles default color grid selections with alpha support

**Modal Add Button Click Handler (main.js:381-404):**
- `onModalAddBtnClick` - Adds new custom colors to palette

**Color Picker Event Management:**
- Uses `onRemoveColorPickerListeners` emitter for automatic cleanup
- Eliminates redundant `handleColorCancel` callbacks
- Manages OKLCH color picker event lifecycle properly

### **Performance Benefits Achieved**

1. **Memory Management:** No callback recreation on each `addEventListeners()` call
2. **Better Cleanup:** Automatic event listener removal with emitter pattern
3. **Modular Code:** Event handlers can be tested and reused independently
4. **Maintainability:** Clear separation between event logic and listener registration