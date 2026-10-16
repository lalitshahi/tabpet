// One small layer over the browser so the same code runs in Chrome, Edge, Brave, Opera, Firefox and Safari.
// Every target supports promise-based extension APIs in MV3; Firefox and Safari expose them as `browser`.
export const api = globalThis.browser ?? globalThis.chrome;

/** Measured memory exists only in Chromium browsers (system.memory). Elsewhere we report tabs eaten. */
export const hasMemoryApi = () => !!api.system?.memory?.getInfo;

export const TABS_PERMISSION = { permissions: ['tabs'] };
export const hasTabsPermission = () => api.permissions.contains(TABS_PERMISSION);

/**
 * Must be called straight from a click handler, before any `await`,
 * or Firefox and Safari drop the user gesture and refuse.
 */
export const requestTabsPermission = () => api.permissions.request(TABS_PERMISSION);

/**
 * All normal tabs, with lastAccessed filled in. Chromium and Firefox provide it;
 * where a browser doesn't, we fall back to when we last saw the tab activated.
 */
export async function allTabs() {
  const [tabs, { seen = {} }] = await Promise.all([
    api.tabs.query({}),
    api.storage.local.get('seen'),
  ]);
  const now = Date.now();
  return tabs
    .filter((t) => !t.incognito)
    .map((t) => ({ ...t, lastAccessed: t.lastAccessed || seen[t.id] || now }));
}

export async function freeMemoryMb() {
  if (!hasMemoryApi()) return null;
  try {
    const info = await api.system.memory.getInfo();
    return info.availableCapacity / (1024 * 1024);
  } catch {
    return null;
  }
}
