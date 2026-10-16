import { api } from './api.js';

export const DEFAULT_SETTINGS = { ghostDays: 7, autopilot: false, tidyGoal: 20 };

const DEFAULTS = {
  settings: DEFAULT_SETTINGS,
  pets: [], // [{ uid, petId, shiny, name, egg, hatchedAt, rehatched, eaten, tidyDays }]
  activeUid: null,
  totals: { eaten: 0, mb: 0, tidyDays: 0, eggsSpent: 0 },
  belly: [], // [{ uid, url, title, favIconUrl, ateAt }]
  log: [], // [{ t, n, mb, kind }]
  days: {}, // { 'YYYY-MM-DD': { sum, n, max } }
  lastTidyKey: '',
  autopsy: null,
  away: 0, // tabs eaten by autopilot since the popup was last opened
  seen: {},
};

export async function load(...keys) {
  const want = keys.length ? keys : Object.keys(DEFAULTS);
  const got = await api.storage.local.get(want);
  const out = {};
  for (const k of want) {
    const d = DEFAULTS[k];
    out[k] = got[k] === undefined ? structuredClone(d) : d && typeof d === 'object' && !Array.isArray(d) && got[k] ? { ...d, ...got[k] } : got[k];
  }
  return out;
}

export const save = (patch) => api.storage.local.set(patch);

export const activePet = (s) => s.pets.find((p) => p.uid === s.activeUid) || null;

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
