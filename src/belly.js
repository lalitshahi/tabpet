// The belly: every eaten tab, grouped into meals, filterable by site, searchable from the keyboard.
import { api } from './api.js';
import { load, save, activePet } from './store.js';
import { petById, drawScene } from './pets.js';
import { stageFor, xpFor, groupMeals, topSites, rankBelly, hostOf, hueFor, mealWhen, MEAL_LABEL, formatMemory } from './logic.js';

const $ = (id) => document.getElementById(id);
const MEAL_PREVIEW = 12;
const MAX_HITS = 60;
const hasFavicons = (api.runtime.getManifest().permissions || []).includes('favicon');

let S = { belly: [], log: [], totals: {} };
let pet = null;
let query = '';
let host = '';
let expanded = new Set();
let sel = -1;

// ---------- Small builders (no innerHTML) ----------
function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
  }
  n.append(...kids.flat().filter((k) => k != null && k !== false));
  return n;
}

// Chrome hands back the same grey globe for any site it has no icon for. Fingerprint that globe once,
// and show the coloured letter tile instead of it.
const sig = (img) => {
  const c = document.createElement('canvas'); c.width = 16; c.height = 16;
  const x = c.getContext('2d'); x.drawImage(img, 0, 0, 16, 16);
  return Array.from(x.getImageData(0, 0, 16, 16).data).join(',');
};
const globe = hasFavicons ? new Promise((res) => {
  const img = new Image();
  img.onload = () => res(sig(img));
  img.onerror = () => res('');
  img.src = api.runtime.getURL(`/_favicon/?pageUrl=${encodeURIComponent('https://tab-pet.invalid/')}&size=32`);
}) : Promise.resolve('');

function fav(item) {
  const h = hostOf(item.url) || '?';
  const box = el('span', { class: 'fav', 'aria-hidden': 'true', style: `background:hsl(${hueFor(h)} 36% 52%)` }, h[0].toUpperCase());
  const src = item.favIconUrl || (hasFavicons && item.url ? api.runtime.getURL(`/_favicon/?pageUrl=${encodeURIComponent(item.url)}&size=32`) : '');
  if (src) {
    const img = el('img', { alt: '', src, loading: 'lazy' });
    img.addEventListener('load', async () => {
      if (img.naturalWidth <= 1 || sig(img) === (await globe)) return;
      box.textContent = ''; box.append(img); box.classList.add('has-img');
    });
  }
  return box;
}

/** Wraps matches of the query words in <mark>. */
function highlight(text) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [text];
  const lower = text.toLowerCase();
  const marks = new Array(text.length).fill(false);
  for (const w of words) { let i = lower.indexOf(w); while (i !== -1) { marks.fill(true, i, i + w.length); i = lower.indexOf(w, i + 1); } }
  const out = [];
  let i = 0;
  while (i < text.length) {
    let j = i;
    while (j < text.length && marks[j] === marks[i]) j++;
    out.push(marks[i] ? el('mark', {}, text.slice(i, j)) : text.slice(i, j));
    i = j;
  }
  return out;
}

function tile(item, { showWhen = false } = {}) {
  const title = item.title || item.url;
  const main = el('button', { class: 'main', type: 'button', title: `Bring back: ${title}`, onclick: () => bringBack(item.times > 1 ? S.belly.filter((b) => b.url.replace(/#.*$/, '') === item.url.replace(/#.*$/, '')) : [item]) },
    fav(item),
    el('span', { class: 't' }, highlight(title)),
    el('span', { class: 'd' }, highlight(hostOf(item.url) || item.url)),
    showWhen ? el('span', { class: 'when' }, `Eaten ${mealWhen(item.ateAt).replace(/^(Today|Yesterday)/, (m) => m.toLowerCase())}${item.times > 1 ? ` · ${item.times} times` : ''}`) : null,
  );
  const acts = el('span', { class: 'acts' },
    el('button', { type: 'button', title: 'Copy link', onclick: (e) => { e.stopPropagation(); navigator.clipboard.writeText(item.url).then(() => toast('Link copied.')); } }, 'Copy link'),
    el('button', { type: 'button', title: 'Forget this tab for good', onclick: (e) => { e.stopPropagation(); forget([item]); } }, 'Forget'),
  );
  const h = hostOf(item.url) || item.url;
  let n = 0; for (const ch of h) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return el('article', { class: 'tile', 'data-uid': item.uid, style: `--c: var(--p${(n % 5) + 1})` }, main, acts);
}

// ---------- Render ----------
function renderHeader() {
  const meals = groupMeals(S.belly, S.log);
  const name = pet ? pet.name : 'Your pet';
  $('title').textContent = `${name}’s belly`;
  document.title = `${name}’s belly · Tab Pet`;
  const mb = S.totals.mb || 0;
  $('sub').textContent = S.belly.length
    ? `${S.belly.length} tab${S.belly.length === 1 ? '' : 's'} from ${meals.length} meal${meals.length === 1 ? '' : 's'}${mb >= 50 ? ` · about ${formatMemory(mb)} of memory freed so far` : ''}. Click any tab to bring it back.`
    : 'Nothing in here yet.';
  if (pet) {
    const scene = document.createElement('canvas'); scene.width = 64; scene.height = 48;
    drawScene(scene.getContext('2d'), { pet: petById(pet.petId), shiny: pet.shiny, stage: stageFor(xpFor(pet)).key, face: S.belly.length ? 'happy' : 'dot', bg: false });
    const x = $('pet').getContext('2d'); x.imageSmoothingEnabled = false;
    x.clearRect(0, 0, 64, 48); x.drawImage(scene, 12, 12, 40, 30, 0, 0, 64, 48);
  }
}

function renderShelves() {
  const sites = topSites(S.belly, 8);
  $('shelves').replaceChildren(...(sites.length > 1 ? sites : []).map(({ host: h, n }) =>
    el('button', { class: 'shelf', type: 'button', 'aria-pressed': String(h === host), onclick: () => { host = host === h ? '' : h; sel = -1; render(); } },
      fav({ url: `https://${h}/` }), h, el('small', {}, String(n)))));
}

function renderResults() {
  const box = $('results');
  if (!S.belly.length) {
    box.replaceChildren(el('div', { class: 'empty' },
      el('h2', {}, `${pet ? pet.name : 'Your pet'} hasn’t eaten anything yet`),
      el('p', {}, 'Open the Tab Pet popup from your toolbar and feed it your forgotten tabs. They’ll all show up here, grouped by meal.')));
    return;
  }
  if (query.trim() || host) {
    const seen = new Map();
    const hits = [];
    for (const h of rankBelly(S.belly, query, host)) {
      const k = h.url.replace(/#.*$/, '');
      if (seen.has(k)) { seen.get(k).times++; continue; }
      const entry = { ...h, times: 1 };
      seen.set(k, entry); hits.push(entry);
    }
    const label = query.trim() ? `${hits.length} match${hits.length === 1 ? '' : 'es'}${host ? ` on ${host}` : ''}` : `${hits.length} tab${hits.length === 1 ? '' : 's'} from ${host}`;
    if (!hits.length) {
      box.replaceChildren(el('div', { class: 'empty' }, el('h2', {}, 'Nothing matches that'), el('p', {}, host ? `Try clearing the ${host} filter, or search with fewer words.` : 'Try fewer words, or part of the site name.')));
      return;
    }
    const all = hits.length > 1 && hits.length <= 30
      ? el('button', { type: 'button', onclick: () => bringBack(hits) }, `Bring back all ${hits.length}`) : null;
    box.replaceChildren(el('div', { class: 'hits-head' }, el('h2', {}, label), all), el('div', { class: 'tiles' }, hits.slice(0, MAX_HITS).map((h) => tile(h, { showWhen: true }))));
    return;
  }
  const meals = groupMeals(S.belly, S.log);
  box.replaceChildren(...meals.map((m) => {
    const open = expanded.has(m.key);
    const shown = open ? m.items : m.items.slice(0, MEAL_PREVIEW);
    const sites = [...new Set(m.items.map((i) => hostOf(i.url)))].slice(0, 5);
    return el('section', { class: 'meal', 'aria-label': `${MEAL_LABEL[m.kind]}, ${mealWhen(m.at)}` },
      el('div', { class: 'meal-head' },
        el('span', { class: 'stack', 'aria-hidden': 'true' }, sites.map((h) => fav({ url: `https://${h}/` }))),
        el('h2', {}, MEAL_LABEL[m.kind]),
        el('span', { class: 'meta' }, `${mealWhen(m.at)} · ${m.items.length} tab${m.items.length === 1 ? '' : 's'}${m.mb >= 50 ? ` · ${formatMemory(m.mb)} back` : ''}`),
        el('span', { class: 'spacer' }),
        el('button', { type: 'button', onclick: () => bringBack(m.items) }, m.items.length > 1 ? `Bring back all ${m.items.length}` : 'Bring it back'),
        el('button', { type: 'button', class: 'link', onclick: () => forget(m.items) }, 'Forget'),
      ),
      el('div', { class: 'tiles' }, shown.map((i) => tile(i))),
      m.items.length > MEAL_PREVIEW
        ? el('button', { type: 'button', class: 'link more', onclick: () => { open ? expanded.delete(m.key) : expanded.add(m.key); render(); } }, open ? 'Show fewer' : `Show ${m.items.length - MEAL_PREVIEW} more`)
        : null,
    );
  }));
}

function render() {
  renderHeader();
  renderShelves();
  renderResults();
  paintSel();
}

// ---------- Keyboard ----------
const mains = () => [...document.querySelectorAll('#results .tile .main')];
function paintSel() {
  const list = mains();
  if (sel >= list.length) sel = list.length - 1;
  document.querySelectorAll('.tile.sel').forEach((t) => t.classList.remove('sel'));
  if (sel >= 0 && list[sel]) { const t = list[sel].closest('.tile'); t.classList.add('sel'); t.scrollIntoView({ block: 'nearest' }); }
}
$('q').addEventListener('input', (e) => { query = e.target.value; sel = query.trim() ? 0 : -1; render(); });
$('q').addEventListener('keydown', (e) => {
  const list = mains();
  if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(list.length - 1, sel + 1); paintSel(); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); paintSel(); }
  else if (e.key === 'Enter' && list.length) { e.preventDefault(); list[Math.max(0, sel)].click(); }
});
function clearAll() { query = ''; host = ''; sel = -1; $('q').value = ''; render(); $('q').focus(); }
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && document.activeElement !== $('q')) { e.preventDefault(); $('q').focus(); }
  else if (e.key === 'Escape') { e.preventDefault(); $('toast').hidden = true; clearAll(); }
});

// ---------- Actions ----------
let toastTimer;
function toast(text, undo) {
  const t = $('toast');
  t.replaceChildren(el('span', {}, text), undo ? el('button', { type: 'button', onclick: () => { t.hidden = true; $('q').focus(); undo(); } }, 'Undo') : null);
  t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 6000);
}

async function bringBack(items) {
  const r = await api.runtime.sendMessage({ type: 'restore', uids: items.map((i) => i.uid) });
  await reload();
  const n = r?.tabIds?.length ?? items.length;
  const what = n === 1 ? `“${items[0].title || hostOf(items[0].url)}”` : `${n} tabs`;
  toast(`Brought back ${what}. ${n === 1 ? 'It’s' : 'They’re'} open in ${n === 1 ? 'a new tab' : 'new tabs'}.`, async () => {
    await api.runtime.sendMessage({ type: 'unrestore', items, tabIds: r?.tabIds || [] });
    await reload();
  });
}

async function forget(items) {
  const uids = new Set(items.map((i) => i.uid));
  const { belly } = await load('belly');
  await save({ belly: belly.filter((b) => !uids.has(b.uid)) });
  await reload();
  toast(items.length === 1 ? 'Forgotten.' : `Forgot ${items.length} tabs.`, async () => {
    const now = await load('belly');
    await save({ belly: [...items, ...now.belly].sort((a, b) => b.ateAt - a.ateAt) });
    await reload();
  });
}

function paintSky() {
  const h = new Date().getHours();
  const sky = h >= 5 && h < 8 ? 'dawn' : h >= 8 && h < 17 ? 'day' : h >= 17 && h < 20 ? 'dusk' : 'night';
  document.querySelectorAll('[data-world]').forEach((w) => { w.dataset.sky = sky; });
}
paintSky();

async function reload() {
  S = await load('belly', 'log', 'totals', 'pets', 'activeUid');
  pet = activePet(S);
  render();
}

api.storage.onChanged.addListener((c) => { if (c.belly || c.log) reload(); });
await reload();
$('q').focus();
