// Pure game and tab logic. No browser APIs here, so it runs under `node --test`.
import { PETS } from './pets.js';

export const DAY = 24 * 60 * 60 * 1000;

// ---------- Mood ----------
export const MOODS = [
  { max: 8, key: 'thriving', label: 'Thriving', face: 'happy', hp: 5, color: '#2f9e5b', lines: ['Look at all this sky.', 'Eight tabs or fewer. I could run a marathon.'] },
  { max: 20, key: 'content', label: 'Content', face: 'dot', hp: 4, color: '#3b82f6', lines: ['Cozy. Not cramped.', 'A healthy amount of tabs.'] },
  { max: 40, key: 'tired', label: 'Tired', face: 'line', hp: 3, color: '#d08a00', lines: ['*yawn* So many tabs.', 'Are you going to read all of these?'] },
  { max: 70, key: 'grumpy', label: 'Grumpy', face: 'x', hp: 2, color: '#e2648a', lines: ['I don’t feel so good.', 'Each tab is a tiny weight on my chest.'] },
  { max: Infinity, key: 'buried', label: 'Buried', face: 'wide', hp: 1, color: '#c2410c', lines: ['Help. I’m under here.', 'I can’t see the sky anymore.'] },
];
export const moodFor = (count) => MOODS.find((m) => count <= m.max);
export const isNight = (date) => { const h = date.getHours(); return h >= 23 || h < 6; };

// ---------- Personality ----------
export const PERSONAS = [
  { key: 'minimalist', name: 'The Minimalist', test: (s) => s.tabs <= 10, line: 'Wait, that’s all of them?' },
  { key: 'hoarder', name: 'The Hoarder', test: (s) => s.tabs >= 80, line: 'I live in a museum of tabs.' },
  { key: 'ghost', name: 'The Ghost Collector', test: (s) => s.tabs >= 12 && s.ghostShare >= 0.45, line: 'Your tabs are haunted.' },
  { key: 'goblin', name: 'The Chaos Goblin', test: (s) => s.dups >= 5 || s.windows >= 5, line: 'Three copies of the same ticket. Iconic.' },
  { key: 'researcher', name: 'The Researcher', test: () => true, line: 'Deep in a rabbit hole, on purpose.' },
];
export const personaFor = (s) => PERSONAS.find((p) => p.test(s));

// ---------- Tabs ----------
/**
 * A tab is safe from eating when it is pinned, playing sound, in a tab group,
 * the active tab of its window, or not a normal web page.
 */
export function isProtected(tab) {
  if (tab.pinned || tab.audible || tab.active) return true;
  if (typeof tab.groupId === 'number' && tab.groupId !== -1) return true;
  if (tab.url && !/^(https?|file):/i.test(tab.url)) return true;
  return false;
}

export const ageMs = (tab, now) => (tab.lastAccessed ? Math.max(0, now - tab.lastAccessed) : 0);

export function ghostTabs(tabs, now, ghostMs) {
  return tabs.filter((t) => !isProtected(t) && t.lastAccessed && ageMs(t, now) >= ghostMs);
}

export function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    return u.toString().replace(/\/$/, '');
  } catch {
    return url || '';
  }
}

/** Every copy of a page except the one worth keeping (active, pinned, or most recently used). */
export function duplicateTabs(tabs) {
  const groups = new Map();
  for (const t of tabs) {
    if (!t.url) continue;
    const k = normalizeUrl(t.url);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(t);
  }
  const out = [];
  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const keep = [...list].sort((a, b) => (b.active - a.active) || (b.pinned - a.pinned) || ((b.lastAccessed || 0) - (a.lastAccessed || 0)))[0];
    for (const t of list) if (t !== keep && !isProtected(t)) out.push(t);
  }
  return out;
}

export function snapshot(tabs, now, ghostMs) {
  const ghosts = ghostTabs(tabs, now, ghostMs).length;
  const oldest = tabs.reduce((m, t) => Math.max(m, ageMs(t, now)), 0);
  return {
    tabs: tabs.length,
    windows: new Set(tabs.map((t) => t.windowId)).size,
    ghosts,
    ghostShare: tabs.length ? ghosts / tabs.length : 0,
    dups: tabs.some((t) => t.url) ? duplicateTabs(tabs).length : 0,
    oldestDays: Math.floor(oldest / DAY),
  };
}

// ---------- Hatching ----------
export const RARITY_ODDS = { legendary: 0.05, rare: 0.25 };
export const SHINY_ODDS = 1 / 50;

export function roll(egg, rand = Math.random) {
  const pool = PETS.filter((p) => p.egg === egg);
  const r = rand();
  const tier = r < RARITY_ODDS.legendary ? 'legendary' : r < RARITY_ODDS.legendary + RARITY_ODDS.rare ? 'rare' : 'common';
  const options = pool.filter((p) => p.rarity === tier);
  const list = options.length ? options : pool;
  const pet = list[Math.min(list.length - 1, Math.floor(rand() * list.length))];
  return { petId: pet.id, shiny: rand() < SHINY_ODDS };
}

export const REHATCH_WINDOW = DAY;
export const canRehatch = (pet, now) => !!pet && !pet.rehatched && now - pet.hatchedAt < REHATCH_WINDOW;

// ---------- Growth and rewards ----------
export const STAGES = [
  { key: 'baby', label: 'Baby', minXp: 0 },
  { key: 'teen', label: 'Teen', minXp: 150 },
  { key: 'grown', label: 'Grown', minXp: 500 },
];
/** XP: one per tab eaten, 25 per tidy day. */
export const xpFor = (pet) => (pet?.eaten || 0) + 25 * (pet?.tidyDays || 0);
export function stageFor(xp) {
  let s = STAGES[0];
  for (const st of STAGES) if (xp >= st.minXp) s = st;
  const next = STAGES[STAGES.indexOf(s) + 1];
  return { ...s, next: next ? next.minXp : null, progress: next ? (xp - s.minXp) / (next.minXp - s.minXp) : 1 };
}

/** A new egg for every 100 tabs eaten or every 7 tidy days, across all pets. */
export const eggsEarned = (totals) => Math.floor((totals.eaten || 0) / 100) + Math.floor((totals.tidyDays || 0) / 7);

// ---------- Days ----------
export const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Hourly samples of the open-tab count, kept for 60 days. */
export function recordSample(days, date, count) {
  const k = dayKey(date);
  const d = days[k] || { sum: 0, n: 0, max: 0 };
  const next = { ...days, [k]: { sum: d.sum + count, n: d.n + 1, max: Math.max(d.max, count) } };
  const cutoff = dayKey(new Date(date.getTime() - 60 * DAY));
  for (const key of Object.keys(next)) if (key < cutoff) delete next[key];
  return next;
}

/** Finished days (not today) whose average tab count stayed at or under the goal. */
export function tidyDayKeys(days, goal, todayKey) {
  return Object.entries(days)
    .filter(([k, d]) => k < todayKey && d.n > 0 && d.sum / d.n <= goal)
    .map(([k]) => k)
    .sort();
}

// ---------- Weekly summary ----------
/** log entries: { t, n, mb, kind: 'ghosts' | 'dups' | 'bankrupt' | 'auto' } */
export function weekSummary(log, now) {
  const recent = log.filter((e) => now - e.t < 7 * DAY);
  const sum = (f) => recent.reduce((s, e) => s + f(e), 0);
  return {
    eaten: sum((e) => e.n),
    mb: sum((e) => e.mb || 0),
    ghosts: sum((e) => (e.kind === 'ghosts' || e.kind === 'auto' ? e.n : 0)),
    dups: sum((e) => (e.kind === 'dups' ? e.n : 0)),
  };
}

export const formatMemory = (mb) => (mb >= 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`);

// ---------- Belly ----------
export const BELLY_MAX = 5000;
export function addToBelly(belly, items) {
  return [...items, ...belly].slice(0, BELLY_MAX);
}
export function searchBelly(belly, query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return belly;
  return belly.filter((t) => {
    const hay = `${t.title || ''} ${t.url || ''}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

export function ago(ms) {
  const m = Math.round(ms / 60000);
  if (m < 60) return `${Math.max(1, m)}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return `${d}d ago`;
}

// ---------- Belly browsing: meals, sites, ranked search ----------
export function hostOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

/** A stable colour per site, for letter tiles when there is no favicon. */
export function hueFor(host) {
  let h = 0;
  for (const c of host) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export const MEAL_LABEL = { ghosts: 'Forgotten tabs', dups: 'Duplicates', bankrupt: 'Tab bankruptcy', auto: 'Autopilot snacks' };

/**
 * Groups eaten tabs into meals: one per eating session, except autopilot,
 * whose hourly snacks merge into one meal per day. Newest first.
 */
export function groupMeals(belly, log) {
  const byTime = new Map(log.map((e) => [e.t, e]));
  const meals = new Map();
  for (const item of belly) {
    const entry = byTime.get(item.ateAt);
    const kind = entry?.kind || 'ghosts';
    const key = kind === 'auto' ? `auto-${dayKey(new Date(item.ateAt))}` : `m-${item.ateAt}`;
    if (!meals.has(key)) meals.set(key, { key, kind, at: item.ateAt, items: [], times: new Set() });
    const m = meals.get(key);
    m.items.push(item);
    m.at = Math.max(m.at, item.ateAt);
    m.times.add(item.ateAt);
  }
  return [...meals.values()]
    .map((m) => ({ key: m.key, kind: m.kind, at: m.at, items: m.items, mb: [...m.times].reduce((s, t) => s + (byTime.get(t)?.mb || 0), 0) }))
    .sort((a, b) => b.at - a.at);
}

/** Most-eaten sites first. */
export function topSites(belly, limit = 12) {
  const counts = new Map();
  for (const b of belly) { const h = hostOf(b.url); if (h) counts.set(h, (counts.get(h) || 0) + 1); }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([host, n]) => ({ host, n }));
}

/** Every word must match the title, site or link. Title hits rank above site hits, newer above older. */
export function rankBelly(belly, query, host = '') {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const out = [];
  for (const b of belly) {
    const h = hostOf(b.url);
    if (host && h !== host) continue;
    const title = (b.title || '').toLowerCase();
    const url = (b.url || '').toLowerCase();
    let score = 0;
    let ok = true;
    for (const w of words) {
      const s = (title.startsWith(w) ? 4 : 0) + (new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`).test(title) ? 3 : title.includes(w) ? 2 : 0) + (h.includes(w) ? 2 : 0) + (url.includes(w) ? 1 : 0);
      if (!s) { ok = false; break; }
      score += s;
    }
    if (ok) out.push({ item: b, score });
  }
  return out.sort((a, b) => b.score - a.score || b.item.ateAt - a.item.ateAt).map((x) => x.item);
}

export function mealWhen(at, now = Date.now()) {
  const d = new Date(at);
  const n = new Date(now);
  const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (dayKey(d) === dayKey(n)) return `Today, ${time}`;
  if (dayKey(d) === dayKey(new Date(now - DAY))) return `Yesterday, ${time}`;
  if (now - at < 6 * DAY) return `${d.toLocaleDateString([], { weekday: 'long' })}, ${time}`;
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: n.getFullYear() === d.getFullYear() ? undefined : 'numeric' });
}
