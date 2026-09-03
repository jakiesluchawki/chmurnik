export const workspaceRoutes = [
  "home", "journal", "atlas", "learn", "practice/metar", "practice/wind", "layers",
];

export function workspaceShortcut(event, { native = false, modal = false } = {}) {
  if (!native || modal || event.defaultPrevented || event.isComposing || event.repeat
    || !event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return null;
  if (event.target?.closest?.("input, textarea, select, [contenteditable]:not([contenteditable='false']), [role='textbox']")) return null;
  return /^[1-7]$/.test(event.key) ? workspaceRoutes[Number(event.key) - 1] : null;
}

export function isMacWorkspace() {
  return globalThis.window?.__CHMURNIK_NATIVE_DEVICE__ === "mac";
}
