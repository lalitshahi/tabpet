// The two share cards (1200×630). Fixed light palette so they look the same wherever they're posted.
import { drawScene, petById } from './pets.js';
import { formatMemory } from './logic.js';

const FONT = 'Onest, "Onest Variable", system-ui, -apple-system, "Segoe UI", sans-serif';
const ROUND = FONT;
const SANS = FONT;
const INK = '#1d2030', MUTED = '#6b7088', ACCENT = '#3f8467', PAPER = '#f4f5f8';

/** The pet in its little world: a soft day sky, two hills, the pet, then name and species. */
function device(ctx, pet, stage, face) {
  const x = 60, y = 60, w = 440, h = 510;
  ctx.save();
  ctx.shadowColor = 'rgba(20, 24, 48, 0.12)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 36); ctx.fill();
  ctx.restore();
  // sky
  ctx.save();
  ctx.beginPath(); ctx.roundRect(x, y, w, 380, [36, 36, 0, 0]); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + 380);
  g.addColorStop(0, '#cfe3f3'); g.addColorStop(0.75, '#eef4ec');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, 380);
  ctx.fillStyle = '#cfe3cf'; ctx.beginPath(); ctx.ellipse(x + 120, y + 420, 260, 110, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#b9d6be'; ctx.beginPath(); ctx.ellipse(x + 360, y + 440, 240, 110, 0, 0, Math.PI * 2); ctx.fill();
  const scene = document.createElement('canvas');
  scene.width = 64; scene.height = 48;
  drawScene(scene.getContext('2d'), { pet: petById(pet.petId), shiny: pet.shiny, stage, face, bg: false });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(scene, 10, 12, 44, 33, x + 70, y + 80, 300, 225);
  ctx.restore();
  // name strip
  ctx.fillStyle = INK; ctx.font = `650 34px ${FONT}`;
  ctx.fillText(pet.name, x + 32, y + 440);
  const p = petById(pet.petId);
  ctx.fillStyle = MUTED; ctx.font = `500 20px ${FONT}`;
  ctx.fillText(`${p.species} · ${p.rarity}${pet.shiny ? ' · shiny' : ''}`, x + 32, y + 474);
}

function wrap(ctx, text, x, y, max, lh) {
  let line = '', yy = y;
  for (const w of text.split(' ')) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > max && line) { ctx.fillText(line, x, yy); line = w; yy += lh; } else line = t;
  }
  ctx.fillText(line, x, yy);
  return yy;
}

function footer(ctx, text) {
  ctx.fillStyle = MUTED;
  ctx.font = `400 20px ${SANS}`;
  ctx.fillText(text, 560, 585);
}

export function drawPersonaCard(canvas, { pet, stage, persona, snap, ghostDays = 7 }) {
  canvas.width = 1200; canvas.height = 630;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 1200, 630);
  device(ctx, pet, stage, 'happy');
  ctx.fillStyle = MUTED; ctx.font = `500 24px ${SANS}`; ctx.fillText('My tab personality', 560, 130);
  ctx.fillStyle = INK; ctx.font = `680 64px ${ROUND}`;
  const y = wrap(ctx, persona.name, 560, 205, 580, 70);
  ctx.fillStyle = ACCENT; ctx.font = `550 30px ${ROUND}`; ctx.fillText(persona.line, 560, Math.max(y + 60, 300));
  [['Tabs open', snap.tabs], [`Untouched ${ghostDays}+ day${ghostDays === 1 ? '' : 's'}`, snap.ghosts], ['Oldest tab', `${snap.oldestDays} days`]].forEach(([k, v], i) => {
    const ry = 400 + i * 52;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(560, ry - 34, 580, 44, 12); ctx.fill();
    ctx.fillStyle = MUTED; ctx.font = `400 22px ${SANS}`; ctx.fillText(k, 580, ry - 4);
    ctx.fillStyle = INK; ctx.font = `650 26px ${ROUND}`; ctx.textAlign = 'right'; ctx.fillText(String(v), 1120, ry - 3); ctx.textAlign = 'left';
  });
  footer(ctx, 'What’s yours? Tab Pet · free for every browser');
  return canvas;
}

export function drawWeekCard(canvas, { pet, stage, week, peak }) {
  canvas.width = 1200; canvas.height = 630;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, 1200, 630);
  device(ctx, pet, stage, week.eaten ? 'happy' : 'dot');
  ctx.fillStyle = MUTED; ctx.font = `500 24px ${SANS}`; ctx.fillText('This week', 560, 130);
  ctx.fillStyle = INK; ctx.font = `680 60px ${ROUND}`;
  wrap(ctx, `${pet.name} ate ${week.eaten} tab${week.eaten === 1 ? '' : 's'}`, 560, 205, 590, 66);
  if (week.mb >= 50) {
    ctx.fillStyle = ACCENT; ctx.font = `680 56px ${ROUND}`;
    ctx.fillText(`about ${formatMemory(week.mb)} back`, 560, 360);
  }
  ctx.fillStyle = MUTED; ctx.font = `400 24px ${SANS}`;
  ctx.fillText(`${week.ghosts} forgotten · ${week.dups} duplicates · ${peak} tabs open now`, 560, 420);
  ctx.fillText('Nothing lost: every tab is saved in its belly.', 560, 460);
  footer(ctx, 'Get a tab pet · free for every browser');
  return canvas;
}

export async function downloadCanvas(canvas, filename) {
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = filename;
  a.click();
}

export async function copyCanvas(canvas) {
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/png'));
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
