const ICON_SIZE = 14;
const ICON_SIZE_MD = 16;
const BRUSH_ICON = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 21v-4a4 4 0 1 1 4 4h-4" /><path d="M21 3a16 16 0 0 0 -12.8 10.2" /><path d="M21 3a16 16 0 0 1 -10.2 12.8" /><path d="M10.6 9a9 9 0 0 1 4.4 4.4" /></svg>`;
const RECTANGLE_ICON = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 3m0 2a2 2 0 0 1 2 -2h14a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-14a2 2 0 0 1 -2 -2z" /></svg>`;
const TRIANGLE_ICON = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" /></svg>`;
const CIRCLE_ICON = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /></svg>`;
const ERASER_ICON = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19 20h-10.5l-4.21 -4.3a1 1 0 0 1 0 -1.41l10 -10a1 1 0 0 1 1.41 0l5 5a1 1 0 0 1 0 1.41l-9.2 9.3" /><path d="M18 13.3l-6.3 -6.3" /></svg>`;
const TRASH_ICON = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>`
const CLICK_ICON = `<svg width="${ICON_SIZE}" height="${ICON_SIZE}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M3 12l3 0" /><path d="M12 3l0 3" /><path d="M7.8 7.8l-2.2 -2.2" /><path d="M16.2 7.8l2.2 -2.2" /><path d="M7.8 16.2l-2.2 2.2" /><path d="M12 12l9 3l-4 2l-2 4l-3 -9" /></svg>`
const UNDO_ICON = `<svg width="${ICON_SIZE_MD}" height="${ICON_SIZE_MD}"  viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M9 14l-4 -4l4 -4" /><path d="M5 10h11a4 4 0 1 1 0 8h-1" /></svg>`;
const REDO_ICON = `<svg width="${ICON_SIZE_MD}" height="${ICON_SIZE_MD}" viewBox="0 0 24 24"  fill="none"  stroke="currentColor"  stroke-width="2"  stroke-linecap="round"  stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M15 14l4 -4l-4 -4" /><path d="M19 10h-11a4 4 0 1 0 0 8h1" /></svg>`
export const TOOL_CLICK_ID = "btn-click";
export const TOOL_BRUSH_ID = "btn-brush";
export const TOOL_RECTANGLE_ID = "btn-rectangle";
export const TOOL_TRIANGLE_ID = "btn-triangle";
export const TOOL_CIRCLE_ID = "btn-circle";
export const TOOL_ERASER_ID = "btn-eraser";
export const TOOL_TRASH_ID = "btn-trash-board";
export const TOOL_UNDO_ID = "btn-undo";
export const TOOL_REDO_ID = "btn-redo";

export const TOOL_ICON = {
    [TOOL_BRUSH_ID]: BRUSH_ICON,
    [TOOL_RECTANGLE_ID]: RECTANGLE_ICON,
    [TOOL_TRIANGLE_ID]: TRIANGLE_ICON,
    [TOOL_CIRCLE_ID]: CIRCLE_ICON,
    [TOOL_ERASER_ID]: ERASER_ICON,
    [TOOL_TRASH_ID]: TRASH_ICON,
    [TOOL_CLICK_ID]: CLICK_ICON,
    [TOOL_UNDO_ID]: UNDO_ICON,
    [TOOL_REDO_ID]: REDO_ICON
}