import { api, allTabs, hasTabsPermission, requestTabsPermission } from './api.js';
import { load, save, activePet, uid } from './store.js';
import { EGGS, petById, drawEgg, drawScene, disc } from './pets.js';
import {
  DAY, moodFor, isNight, personaFor, snapshot, ghostTabs, duplicateTabs, roll, canRehatch,
  xpFor, stageFor, eggsEarned, weekSummary, formatMemory, isProtected,
} from './logic.js';
import { setHTML, esc } from './dom.js';
import { drawPersonaCard, drawWeekCard, downloadCanvas, copyCanvas } from './card.js';

const $ = (id) => document.getElementById(id);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

if (new URLSearchParams(location.search).has('welcome')) document.body.classList.add('welcome');

let S = null; // stored state
let tabs = [];
let perm = false;
let anim = { eatingUntil: 0 };

async function refresh() {
  [S, tabs, perm] = await Promise.all([load(), allTabs(), hasTabsPermission()]);
}

const VIEWS = ['v-egg', 'v-reveal', 'v-autopsy', 'v-result', 'v-main', 'v-pets', 'v-share', 'v-settings'];
function show(id) {
  for (const v of VIEWS) $(v).hidden = v !== id;
  window.scrollTo(0, 0);
}
document.querySelectorAll('[data-back]').forEach((b) => (b.onclick = () => renderMain()));

const pet = () => activePet(S);
const ghostMs = () => S.settings.ghostDays * DAY;
const stageOf = (p) => stageFor(xpFor(p));

// ---------- Eggs ----------
function renderEggs() {
  show('v-egg');
  setHTML($('eggs'), Object.entries(EGGS).map(([k, e]) => `<button class="egg" data-egg="${k}"><canvas width="24" height="28" data-eggc="${k}"></canvas><b>${e.label}</b><small>${e.hint}</small></button>`).join(''));
  document.querySelectorAll('[data-eggc]').forEach((c) => drawEgg(c.getContext('2d'), c.dataset.eggc, 12, 14));
  document.querySelectorAll('[data-egg]').forEach((b) => (b.onclick = () => hatch(b.dataset.egg)));
}

/** Hatches into a new pet, or re-rolls `replaceUid` (the one free re-hatch). The pet is saved at once so closing the popup can't farm re-rolls. */
async function hatch(egg, replaceUid = null) {
  const r = roll(egg);
  const p = petById(r.petId);
  let pets;
  let record;
  if (replaceUid) {
    pets = S.pets.map((x) => (x.uid === replaceUid ? (record = { ...x, petId: r.petId, shiny: r.shiny, egg, name: p.name, rehatched: true }) : x));
  } else {
    record = { uid: uid(), petId: r.petId, shiny: r.shiny, name: p.name, egg, hatchedAt: Date.now(), rehatched: false, eaten: 0, tidyDays: 0 };
    pets = [...S.pets, record];
  }
  const totals = !replaceUid && S.pets.length ? { ...S.totals, eggsSpent: S.totals.eggsSpent + 1 } : S.totals;
  await save({ pets, activeUid: record.uid, totals });
  await refresh();
  api.runtime.sendMessage({ type: 'paint' });
  revealAnim(record);
}

function revealAnim(record) {
  show('v-reveal');
  $('reveal-title').textContent = 'Hatching…';
  $('reveal-body').hidden = true;
  const ctx = $('reveal-lcd').getContext('2d');
  const t0 = performance.now();
  const dur = reduced ? 150 : 1600;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    ctx.fillStyle = '#e4f2de'; ctx.fillRect(0, 0, 64, 48);
    ctx.fillStyle = '#c3dbb6'; ctx.fillRect(0, 42, 64, 6);
    if (k < 1) {
      drawEgg(ctx, record.egg, 32, 30, reduced ? 0 : Math.sin(t / 50) * k * 2, k > 0.4);
      requestAnimationFrame(step);
    } else revealDone(record);
  };
  requestAnimationFrame(step);
}

function revealDone(record) {
  const p = petById(record.petId);
  const ctx = $('reveal-lcd').getContext('2d');
  drawScene(ctx, { pet: p, shiny: record.shiny, stage: 'baby', face: 'happy' });
  if (!reduced) for (let i = 0; i < 14; i++) disc(ctx, (i * 13) % 60 + 2, (i * 7) % 18 + 2, 0, 0, ['#ff86a8', '#ffcf5c', '#7fd6ff', '#7ccf8a'][i % 4]);
  $('reveal-title').textContent = record.shiny ? `A shiny ${p.species.toLowerCase()}!` : p.rarity === 'legendary' ? `A legendary ${p.species.toLowerCase()}!` : `It's a ${p.species.toLowerCase()}!`;
  setHTML($('reveal-pills'), `<span class="pill ${p.rarity}">${p.rarity}</span>${record.shiny ? '<span class="pill shiny">Shiny</span>' : ''}<span class="muted small">${EGGS[record.egg].label} egg</span>`);
  $('pet-name').value = record.name;
  $('keep').textContent = `Keep ${record.name}`;
  $('pet-name').oninput = () => { $('keep').textContent = `Keep ${$('pet-name').value.trim() || p.name}`; };
  const can = canRehatch(record, Date.now());
  $('rehatch').disabled = !can;
  $('rehatch').textContent = can ? 'Not my vibe, re-hatch once' : 'Re-hatch used';
  $('rehatch').onclick = () => hatch(record.egg, record.uid);
  $('keep').onclick = async () => {
    const name = $('pet-name').value.trim() || p.name;
    await save({ pets: S.pets.map((x) => (x.uid === record.uid ? { ...x, name } : x)) });
    await refresh();
    api.runtime.sendMessage({ type: 'paint' });
    if (!S.autopsy) renderAutopsy(); else renderMain();
  };
  $('reveal-body').hidden = false;
  $('pet-name').focus();
}

// ---------- Autopsy ----------
function statsHtml(items) {
  return items.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
}

async function renderAutopsy() {
  show('v-autopsy');
  const snap = snapshot(tabs, Date.now(), ghostMs());
  const persona = personaFor(snap);
  await save({ autopsy: { ...snap, at: Date.now() } });
  const name = pet().name;
  $('autopsy-lead').textContent = `${name} looked around your browser. Here's what it found.`;
  setHTML($('autopsy-stats'), statsHtml([['Tabs', snap.tabs], ['Windows', snap.windows], ['Ghosts', snap.ghosts], ['Oldest', `${snap.oldestDays}d`]]));
  $('persona-name').textContent = persona.name;
  $('persona-line').textContent = persona.line;
  const btn = $('eat-first');
  if (snap.ghosts) {
    btn.textContent = `Let ${name} eat the ${plural(snap.ghosts, 'ghost tab')}`;
    btn.onclick = () => feed('ghosts', true);
  } else {
    btn.textContent = 'No ghosts yet. Say hi';
    btn.onclick = () => renderMain();
  }
  $('skip-first').onclick = () => renderMain();
}

// ---------- Feeding ----------
let busy = false;
/** Called straight from a click, so the permission prompt keeps its user gesture. */
function feed(kind, first = false) {
  if (busy) return;
  const ask = perm ? Promise.resolve(true) : requestTabsPermission();
  busy = true;
  ask.then(async (granted) => {
    if (!granted) {
      busy = false;
      say(`I need to see tab titles to remember what I eat. Nothing leaves your computer.`);
      if (first) renderMain('I’ll wait. Click “Eat ghosts” whenever you’re ready.');
      return;
    }
    perm = true;
    setFeeding(true);
    const r = await api.runtime.sendMessage({ type: 'eat', kind });
    busy = false;
    setFeeding(false);
    await refresh();
    if (r?.error) return renderMain(`Hmm, something went wrong: ${r.error}`);
    anim.eatingUntil = performance.now() + 2500;
    if (first) return renderResult(r);
    renderMain(eatLine(r, kind));
  });
}

function eatLine(r, kind) {
  if (!r.n) return kind === 'dups' ? 'No duplicates. Sharp.' : 'Nothing to eat right now.';
  const mem = r.mb >= 50 ? ` About ${formatMemory(r.mb)} back.` : '';
  if (kind === 'bankrupt') return `Tab bankruptcy! ${plural(r.n, 'tab')} saved in my belly. I’m free!${mem}`;
  if (kind === 'dups') return `Sniffed out ${plural(r.n, 'duplicate')}. Gone.${mem}`;
  return `Crunch! ${plural(r.n, 'tab')}. *burp*${mem}`;
}

function setFeeding(on) {
  document.querySelectorAll('button').forEach((b) => { if (on) { b.dataset.was = b.disabled; b.disabled = true; } else if (b.dataset.was !== undefined) { b.disabled = b.dataset.was === 'true'; delete b.dataset.was; } });
  if (on) {
    say('Nom nom nom… digesting.');
    const t = $('eat-first');
    if (!$('v-autopsy').hidden) t.textContent = 'Nom nom nom… digesting';
  }
}

function renderResult(r) {
  show('v-result');
  const p = pet();
  drawScene($('result-lcd').getContext('2d'), { pet: petById(p.petId), shiny: p.shiny, stage: 'baby', face: 'happy', eating: true });
  $('result-title').textContent = `${p.name} ate ${plural(r.n, 'tab')}`;
  $('result-big').textContent = r.mb >= 50 ? `about ${formatMemory(r.mb)} back` : `${plural(r.n, 'tab')} lighter`;
  $('result-big').hidden = false;
  $('result-note').textContent = r.measured
    ? `Measured as free memory before and after, so it's approximate. Every tab is in ${p.name}'s belly if you need it.`
    : `Every tab is in ${p.name}'s belly if you need it.`;
  $('auto-on').textContent = `Let ${p.name} snack automatically`;
  $('auto-on').onclick = async () => {
    await save({ settings: { ...S.settings, autopilot: true } });
    await refresh();
    renderMain(`Autopilot on. I’ll quietly eat tabs untouched for ${plural(S.settings.ghostDays, 'day')}.`);
  };
  $('result-done').onclick = () => renderMain();
}

// ---------- Main ----------
let bubbleLine = '';
function say(t) { bubbleLine = t; $('m-bubble').textContent = t; }

function renderMain(line) {
  show('v-main');
  const p = pet();
  const now = Date.now();
  const mood = moodFor(tabs.length);
  const night = isNight(new Date());
  const st = stageOf(p);
  const ghosts = ghostTabs(tabs, now, ghostMs()).length;
  const dups = perm ? duplicateTabs(tabs).length : 0;

  $('m-name').textContent = p.name;
  $('m-mood').textContent = night ? (tabs.length <= 20 ? 'Asleep' : 'Awake at night') : mood.label;
  $('m-hp').textContent = '♥'.repeat(mood.hp) + '♡'.repeat(5 - mood.hp);
  $('m-count').textContent = `${tabs.length} TAB${tabs.length === 1 ? '' : 'S'}`;
  $('m-stage').textContent = `${st.label} ${petById(p.petId).species.toLowerCase()}`;
  $('m-xp').textContent = st.next ? `${xpFor(p)} / ${st.next} XP to ${st.key === 'baby' ? 'teen' : 'grown'}` : `Fully grown · ${xpFor(p)} XP`;
  $('m-bar').style.width = `${Math.round(st.progress * 100)}%`;
  setHTML($('m-stats'), statsHtml([['Tabs', tabs.length], ['Ghosts', ghosts], ['Dupes', perm ? dups : '–'], ['Belly', S.belly.length]]));

  const g = $('m-ghosts');
  g.textContent = ghosts ? `Eat ${plural(ghosts, 'ghost')}` : 'No ghosts';
  g.disabled = !ghosts;
  g.onclick = () => feed('ghosts');
  const d = $('m-dups');
  d.hidden = !dups;
  d.textContent = `Eat ${plural(dups, 'duplicate')}`;
  d.onclick = () => feed('dups');

  $('egg-dot').hidden = eggsEarned(S.totals) - S.totals.eggsSpent <= 0;

  if (line) say(line);
  else if (S.away > 0) { say(`I snacked ${plural(S.away, 'forgotten tab')} while you were away. They’re safe in my belly.`); save({ away: 0 }); }
  else if (night) say(tabs.length <= 20 ? 'Zzz… thanks for tidying up.' : `Can’t sleep. ${tabs.length} tabs.`);
  else if (ghosts >= 5) say(`${plural(ghosts, 'tab')} haven’t been touched in ${plural(S.settings.ghostDays, 'day')}. Can I eat them?`);
  else say(pick(mood.lines));
  startLcd();
}

let lcdRunning = false;
function startLcd() {
  if (lcdRunning) return;
  lcdRunning = true;
  const ctx = $('lcd').getContext('2d');
  const frame = (t) => {
    if ($('v-main').hidden) { lcdRunning = false; return; }
    const p = pet();
    const mood = moodFor(tabs.length);
    const night = isNight(new Date());
    const eating = t < anim.eatingUntil;
    const k = night ? (tabs.length <= 20 ? 'sleep' : 'awake') : mood.key;
    let face = k === 'sleep' ? 'line' : k === 'awake' ? 'wide' : eating ? 'happy' : mood.face;
    const bob = reduced || k === 'buried' || k === 'sleep' ? 0 : Math.round(Math.sin(t / (k === 'thriving' || eating ? 160 : 420)) * 1.2);
    if (!reduced && face !== 'line' && t % 3200 < 120) face = 'line';
    drawScene(ctx, { pet: petById(p.petId), shiny: p.shiny, stage: stageOf(p).key, face, night, eating, bob });
    if (k === 'tired' || k === 'sleep') { const z = Math.floor(t / 600) % 3; ctx.fillStyle = night ? '#ffe9a8' : '#26301a'; ctx.font = '7px monospace'; ctx.fillText('z', 46, 18 - z); if (z) ctx.fillText('Z', 50, 13 - z); }
    const g = Math.min(ghostTabs(tabs, Date.now(), ghostMs()).length, 6);
    for (let i = 0; i < g && !night; i++) {
      const a = t / 1400 + (i / g) * Math.PI * 2, gx = Math.round(32 + Math.cos(a) * 26), gy = Math.round(20 + Math.sin(a) * 11);
      disc(ctx, gx, gy, 3, 3, '#ffffff'); ctx.fillRect(gx - 3, gy, 7, 3); ctx.fillStyle = '#26301a'; ctx.fillRect(gx - 1, gy - 1, 1, 1); ctx.fillRect(gx + 1, gy - 1, 1, 1);
    }
    if (k === 'buried') for (let i = 0; i < 16; i++) { const x = 6 + ((i * 17) % 44), y = 42 - Math.floor(i / 3) * 4 - (i % 2) * 2; ctx.fillStyle = ['#a3b5e8', '#f7c6a3', '#c6e7b8', '#f3b7cc'][i % 4]; ctx.fillRect(x, y - 4, 13, 4); }
    if (eating) for (let i = 0; i < 6; i++) { ctx.fillStyle = '#ffcf5c'; ctx.fillRect(20 + ((i * 7 + Math.floor(t / 50)) % 24), (t / 12 + i * 9) % 30, 2, 2); }
    if (reduced) setTimeout(() => requestAnimationFrame(frame), 500); else requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

// ---------- Pets ----------
function renderPets() {
  show('v-pets');
  const available = eggsEarned(S.totals) - S.totals.eggsSpent;
  $('new-egg').hidden = available <= 0;
  $('hatch-new').onclick = renderEggs;
  setHTML($('collection'), S.pets.map((x) => {
    const p = petById(x.petId);
    return `<button class="pet" data-uid="${x.uid}" aria-pressed="${x.uid === S.activeUid}"><canvas width="64" height="48" data-pc="${x.uid}"></canvas><b>${esc(x.name)}</b><small>${stageOf(x).label} ${p.species.toLowerCase()}</small><span class="pill ${p.rarity}">${x.shiny ? 'shiny' : p.rarity}</span></button>`;
  }).join(''));
  document.querySelectorAll('[data-pc]').forEach((c) => {
    const x = S.pets.find((y) => y.uid === c.dataset.pc);
    drawScene(c.getContext('2d'), { pet: petById(x.petId), shiny: x.shiny, stage: stageOf(x).key, face: 'happy' });
  });
  document.querySelectorAll('[data-uid]').forEach((b) => (b.onclick = async () => {
    await save({ activeUid: b.dataset.uid });
    await refresh();
    api.runtime.sendMessage({ type: 'paint' });
    renderPets();
  }));
  const toTabs = 100 - (S.totals.eaten % 100);
  const toDays = 7 - (S.totals.tidyDays % 7);
  const active = pet();
  let note = `Next egg in ${plural(toTabs, 'tab')} eaten or ${plural(toDays, 'tidy day')}.`;
  if (canRehatch(active, Date.now())) note += ` Not loving ${active.name}? You can re-hatch once today.`;
  $('next-egg').textContent = note;
  if (canRehatch(active, Date.now()) && !document.getElementById('rehatch-active')) {
    const b = document.createElement('button');
    b.id = 'rehatch-active';
    b.textContent = `Re-hatch ${active.name}`;
    b.onclick = () => hatch(active.egg, active.uid);
    $('next-egg').after(b);
  }
}

// ---------- Share ----------
let cardKind = 'week';
function renderShare() {
  show('v-share');
  const p = pet();
  const stage = stageOf(p).key;
  const c = $('card');
  if (cardKind === 'week') drawWeekCard(c, { pet: p, stage, week: weekSummary(S.log, Date.now()), peak: tabs.length });
  else {
    const snap = snapshot(tabs, Date.now(), ghostMs());
    drawPersonaCard(c, { pet: p, stage, persona: personaFor(snap), snap, ghostDays: S.settings.ghostDays });
  }
  $('card-week').setAttribute('aria-pressed', String(cardKind === 'week'));
  $('card-persona').setAttribute('aria-pressed', String(cardKind === 'persona'));
  $('share-msg').textContent = '';
}
$('card-week').onclick = () => { cardKind = 'week'; renderShare(); };
$('card-persona').onclick = () => { cardKind = 'persona'; renderShare(); };
$('download').onclick = () => downloadCanvas($('card'), `tab-pet-${cardKind}.png`);
$('copy').onclick = async () => {
  try { await copyCanvas($('card')); $('share-msg').textContent = 'Copied. Paste it into your post.'; }
  catch { $('share-msg').textContent = 'Copy isn’t allowed here. Use Download.'; }
};

// ---------- Settings ----------
function renderSettings() {
  show('v-settings');
  $('s-ghost').value = String(S.settings.ghostDays);
  $('s-goal').value = String(S.settings.tidyGoal);
  $('s-auto').checked = !!S.settings.autopilot;
  const b = $('bankrupt');
  b.textContent = 'Declare bankruptcy';
  b.dataset.armed = '';
}
const saveSettings = async (patch) => { await save({ settings: { ...S.settings, ...patch } }); await refresh(); };
$('s-ghost').onchange = (e) => saveSettings({ ghostDays: Number(e.target.value) });
$('s-goal').onchange = (e) => saveSettings({ tidyGoal: Number(e.target.value) });
$('s-auto').onchange = (e) => {
  const on = e.target.checked;
  const ask = on && !perm ? requestTabsPermission() : Promise.resolve(true);
  ask.then((ok) => { if (!ok) { e.target.checked = false; return; } perm = perm || on; saveSettings({ autopilot: on }); });
};
$('bankrupt').onclick = (e) => {
  const b = e.currentTarget;
  if (!b.dataset.armed) {
    b.dataset.armed = '1';
    b.textContent = 'Click again to confirm';
    allTabs().then((fresh) => {
      tabs = fresh;
      if (b.dataset.armed) b.textContent = `Click again to eat ${plural(fresh.filter((t) => !isProtected(t)).length, 'tab')}`;
    });
    return;
  }
  feed('bankrupt');
};

$('to-belly').onclick = () => api.tabs.create({ url: api.runtime.getURL('src/belly.html') });
$('to-share').onclick = renderShare;
$('to-pets').onclick = renderPets;
$('to-settings').onclick = renderSettings;

// ---------- Boot ----------
await refresh();
if (!S.pets.length) renderEggs();
else if (!S.autopsy) renderAutopsy();
else renderMain();
