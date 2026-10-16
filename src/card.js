// The two share cards (1200×630). Fixed light palette so they look the same wherever they're posted.
import { drawScene, petById } from './pets.js';
import { formatMemory } from './logic.js';

const ROUND = 'ui-rounded, "SF Pro Rounded", "Arial Rounded MT Bold", system-ui, sans-serif';
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

function device(ctx, pet, stage, face) {
  ctx.fillStyle = '#ff86a8';
  ctx.beginPath(); ctx.roundRect(60, 70, 430, 490, [64, 64, 84, 84]); ctx.fill();
  ctx.fillStyle = '#3b0f1f';
  ctx.beginPath(); ctx.roundRect(95, 115, 360, 280, 24); ctx.fill();
  const scene = document.createElement('canvas');
  scene.width = 64; scene.height = 48;
  drawScene(scene.getContext('2d'), { pet: petById(pet.petId), shiny: pet.shiny, stage, face });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(scene, 12, 12, 40, 31, 110, 130, 330, 256);
  ctx.fillStyle = '#3b0f1f';
  ctx.font = `600 34px ${ROUND}`;
  ctx.fillText(pet.name, 100, 450);
  const p = petById(pet.petId);
  ctx.font = `700 18px ${SANS}`;
  ctx.fillStyle = '#5a1a30';
  ctx.fillText(`${p.species} · ${p.rarity}${pet.shiny ? ' · shiny' : ''}`.toUpperCase(), 100, 484);
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
  ctx.fillStyle = '#5b5f86';
  ctx.font = `400 20px ${SANS}`;
  ctx.fillText(text, 560, 585);
}

export function drawPersonaCard(canvas, { pet, stage, persona, snap, ghostDays = 7 }) {
  canvas.width = 1200; canvas.height = 630;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#edf0fb'; ctx.fillRect(0, 0, 1200, 630);
  device(ctx, pet, stage, 'happy');
  ctx.fillStyle = '#5b5f86'; ctx.font = `700 22px ${SANS}`; ctx.fillText('MY TAB PERSONALITY', 560, 130);
  ctx.fillStyle = '#1d1f3b'; ctx.font = `700 66px ${ROUND}`;
  const y = wrap(ctx, persona.name, 560, 205, 580, 70);
  ctx.fillStyle = '#e2648a'; ctx.font = `600 30px ${ROUND}`; ctx.fillText(persona.line, 560, Math.max(y + 60, 300));
  [['Tabs open', snap.tabs], [`Untouched ${ghostDays}+ day${ghostDays === 1 ? '' : 's'}`, snap.ghosts], ['Oldest tab', `${snap.oldestDays} days`]].forEach(([k, v], i) => {
    const ry = 400 + i * 52;
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(560, ry - 34, 580, 44, 12); ctx.fill();
    ctx.fillStyle = '#5b5f86'; ctx.font = `400 22px ${SANS}`; ctx.fillText(k, 580, ry - 4);
    ctx.fillStyle = '#1d1f3b'; ctx.font = `700 26px ${ROUND}`; ctx.textAlign = 'right'; ctx.fillText(String(v), 1120, ry - 3); ctx.textAlign = 'left';
  });
  footer(ctx, 'What’s yours? Tab Pet · free for every browser');
  return canvas;
}

export function drawWeekCard(canvas, { pet, stage, week, peak }) {
  canvas.width = 1200; canvas.height = 630;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff4d6'; ctx.fillRect(0, 0, 1200, 630);
  device(ctx, pet, stage, week.eaten ? 'happy' : 'dot');
  ctx.fillStyle = '#5b5f86'; ctx.font = `700 22px ${SANS}`; ctx.fillText('THIS WEEK', 560, 130);
  ctx.fillStyle = '#1d1f3b'; ctx.font = `700 60px ${ROUND}`;
  wrap(ctx, `${pet.name} ate ${week.eaten} tab${week.eaten === 1 ? '' : 's'}`, 560, 205, 590, 66);
  if (week.mb >= 50) {
    ctx.fillStyle = '#2f7d4f'; ctx.font = `700 56px ${ROUND}`;
    ctx.fillText(`about ${formatMemory(week.mb)} back`, 560, 360);
  }
  ctx.fillStyle = '#5b5f86'; ctx.font = `400 24px ${SANS}`;
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
