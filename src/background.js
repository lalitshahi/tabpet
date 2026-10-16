// Background: toolbar icon and badge, hourly tidy tracking, autopilot, and the eating itself.
// Runs as a service worker in Chromium and Safari, and as an event page in Firefox.
import { api, allTabs, freeMemoryMb, hasTabsPermission, hasMemoryApi } from './api.js';
import { load, save, activePet } from './store.js';
import { petById, drawScene, drawEgg } from './pets.js';
import {
  DAY, moodFor, isNight, ghostTabs, duplicateTabs, isProtected, stageFor, xpFor,
  recordSample, tidyDayKeys, dayKey, addToBelly,
} from './logic.js';

// ---------- Toolbar ----------
function iconImage(size, pet, mood, night) {
  const scene = new OffscreenCanvas(64, 48);
  const sctx = scene.getContext('2d');
  if (pet) {
    const stage = stageFor(xpFor(pet)).key;
    drawScene(sctx, { pet: petById(pet.petId), shiny: pet.shiny, stage, face: night ? 'line' : mood.face });
  }
  const c = new OffscreenCanvas(size, size);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  if (pet) {
    // Crop to the face, drop the scene background so the icon sits on the toolbar.
    const crop = new OffscreenCanvas(30, 30);
    const cctx = crop.getContext('2d');
    cctx.drawImage(scene, 17, 13, 30, 30, 0, 0, 30, 30);
    const img = cctx.getImageData(0, 0, 30, 30);
    for (let i = 0; i < img.data.length; i += 4) {
      const [r, g, b] = img.data.slice(i, i + 3);
      const bg = (r === 0xe4 && g === 0xf2 && b === 0xde) || (r === 0xc3 && g === 0xdb && b === 0xb6) || (r === 0x2c && g === 0x33 && b === 0x52) || (r === 0x4b && g === 0x55 && b === 0x80);
      if (bg) img.data[i + 3] = 0;
    }
    cctx.putImageData(img, 0, 0);
    ctx.drawImage(crop, 0, 0, 30, 30, 0, 0, size, size);
  } else {
    const e = new OffscreenCanvas(24, 24);
    drawEgg(e.getContext('2d'), 'cozy', 12, 12);
    ctx.drawImage(e, 0, 0, 24, 24, 0, 0, size, size);
  }
  return ctx.getImageData(0, 0, size, size);
}

let paintTimer = null;
function schedulePaint() {
  clearTimeout(paintTimer);
  paintTimer = setTimeout(paint, 250);
}

async function paint() {
  try {
    const [tabs, s] = await Promise.all([allTabs(), load('pets', 'activeUid')]);
    const pet = activePet(s);
    const mood = moodFor(tabs.length);
    const night = isNight(new Date());
    await api.action.setIcon({ imageData: { 16: iconImage(16, pet, mood, night), 32: iconImage(32, pet, mood, night) } });
    await api.action.setBadgeText({ text: pet ? String(tabs.length) : '!' });
    await api.action.setBadgeBackgroundColor({ color: pet ? mood.color : '#e2648a' });
    api.action.setBadgeTextColor?.({ color: '#ffffff' });
    await api.action.setTitle({ title: pet ? `${pet.name} · ${mood.label} · ${tabs.length} tabs` : 'Tab Pet: an egg is waiting' });
  } catch (e) {
    console.warn('[tab-pet] paint failed', e);
  }
}

// ---------- Eating ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Picks tabs, saves them to the belly, closes them and measures memory. */
async function eat(kind) {
  if (!(await hasTabsPermission())) return { error: 'permission' };
  const s = await load('settings', 'pets', 'activeUid', 'totals', 'belly', 'log');
  const tabs = await allTabs();
  const now = Date.now();
  const ghostMs = s.settings.ghostDays * DAY;
  let victims;
  if (kind === 'ghosts' || kind === 'auto') victims = ghostTabs(tabs, now, ghostMs);
  else if (kind === 'dups') victims = duplicateTabs(tabs);
  else if (kind === 'bankrupt') victims = tabs.filter((t) => !isProtected(t));
  else return { error: 'kind' };
  if (!victims.length) return { n: 0, mb: 0 };

  // Save first, close second: a tab is never lost even if closing fails halfway.
  const items = victims.map((t) => ({ uid: `${now}-${t.id}`, url: t.url, title: t.title || t.url, favIconUrl: t.favIconUrl?.startsWith('data:') ? t.favIconUrl : '', ateAt: now }));
  await save({ belly: addToBelly(s.belly, items) });

  const before = await freeMemoryMb();
  await api.tabs.remove(victims.map((t) => t.id));
  let mb = 0;
  if (before !== null) {
    await sleep(kind === 'auto' ? 1500 : 3500);
    const after = await freeMemoryMb();
    mb = Math.max(0, (after ?? before) - before);
  }

  const n = victims.length;
  const pets = s.pets.map((p) => (p.uid === s.activeUid ? { ...p, eaten: (p.eaten || 0) + n } : p));
  const log = [{ t: now, n, mb, kind }, ...s.log].filter((e) => now - e.t < 60 * DAY);
  await save({ pets, log, totals: { ...s.totals, eaten: s.totals.eaten + n, mb: s.totals.mb + mb } });
  schedulePaint();
  return { n, mb, measured: before !== null };
}

async function restore(uids) {
  const { belly } = await load('belly');
  const pick = belly.filter((b) => uids.includes(b.uid));
  for (const b of pick) if (b.url) await api.tabs.create({ url: b.url, active: false });
  await save({ belly: belly.filter((b) => !uids.includes(b.uid)) });
  return { n: pick.length };
}

// ---------- Hourly tick: tidy days and autopilot ----------
async function tick() {
  const tabs = await allTabs();
  const s = await load('settings', 'days', 'lastTidyKey', 'pets', 'activeUid', 'totals', 'away');
  const now = new Date();
  const days = recordSample(s.days, now, tabs.length);
  const fresh = tidyDayKeys(days, s.settings.tidyGoal, dayKey(now)).filter((k) => k > s.lastTidyKey);
  const patch = { days };
  if (fresh.length) {
    patch.lastTidyKey = fresh[fresh.length - 1];
    patch.totals = { ...s.totals, tidyDays: s.totals.tidyDays + fresh.length };
    patch.pets = s.pets.map((p) => (p.uid === s.activeUid ? { ...p, tidyDays: (p.tidyDays || 0) + fresh.length } : p));
  }
  await save(patch);
  if (s.settings.autopilot && activePet(s)) {
    const r = await eat('auto');
    if (r.n) await save({ away: (s.away || 0) + r.n });
  }
  schedulePaint();
}

// ---------- Fallback "last seen" for browsers without tab.lastAccessed ----------
async function markSeen(tabId) {
  const { seen = {} } = await api.storage.local.get('seen');
  seen[tabId] = Date.now();
  const ids = Object.keys(seen);
  if (ids.length > 2000) for (const id of ids.slice(0, ids.length - 2000)) delete seen[id];
  await api.storage.local.set({ seen });
}

// ---------- Wiring (listeners registered synchronously at top level) ----------
api.runtime.onInstalled.addListener(async ({ reason }) => {
  api.alarms.create('tick', { periodInMinutes: 60 });
  if (reason === 'install') await api.tabs.create({ url: api.runtime.getURL('src/popup.html?welcome=1') });
  schedulePaint();
});
api.runtime.onStartup?.addListener(() => {
  api.alarms.create('tick', { periodInMinutes: 60 });
  schedulePaint();
});
api.alarms.onAlarm.addListener((a) => { if (a.name === 'tick') tick(); });
api.tabs.onCreated.addListener(schedulePaint);
api.tabs.onRemoved.addListener(schedulePaint);
api.tabs.onActivated.addListener(({ tabId }) => { markSeen(tabId); });
api.storage.onChanged.addListener((changes) => { if (changes.pets || changes.activeUid) schedulePaint(); });

api.runtime.onMessage.addListener((msg, _sender, reply) => {
  const run = {
    eat: () => eat(msg.kind),
    restore: () => restore(msg.uids || []),
    paint: () => paint().then(() => ({ ok: true })),
    tick: () => tick().then(() => ({ ok: true })),
    capabilities: async () => ({ memory: hasMemoryApi() }),
  }[msg?.type];
  if (!run) return false;
  run().then(reply, (e) => reply({ error: String(e?.message || e) }));
  return true;
});

schedulePaint();
