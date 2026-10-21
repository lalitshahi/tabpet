// The roster and the pixel renderer. Shared by the popup, the share cards and the toolbar icon.
// All cute or fantasy. No reptiles, snakes, spiders or bugs.

const C = (body, belly, accent, eye = '#26201c') => ({ body, belly, accent, eye });

export const PETS = [
  // Cozy
  { id: 'cat', name: 'Mochi', species: 'Cat', egg: 'cozy', rarity: 'common', body: 'round', ears: 'cat', tail: 'cat', colors: C('#f2a65a', '#fde3c2', '#e07b39') },
  { id: 'bunny', name: 'Bao', species: 'Bunny', egg: 'cozy', rarity: 'common', body: 'round', ears: 'bunny', tail: 'puff', colors: C('#f4f1fb', '#ffd6e4', '#ff9db8') },
  { id: 'hamster', name: 'Pip', species: 'Hamster', egg: 'cozy', rarity: 'common', body: 'round', ears: 'round', extra: ['cheeks'], colors: C('#e8b07a', '#fff1dc', '#d48c55') },
  { id: 'puppy', name: 'Sprout', species: 'Puppy', egg: 'cozy', rarity: 'common', body: 'round', ears: 'floppy', tail: 'cat', colors: C('#d9b38c', '#f6e7d2', '#8a5a3a') },
  { id: 'duck', name: 'Puddle', species: 'Duckling', egg: 'cozy', rarity: 'common', body: 'round', ears: 'none', wings: 'tiny', extra: ['beak'], colors: C('#ffd84d', '#fff3a8', '#ff9a3c') },
  { id: 'otter', name: 'Nori', species: 'Otter', egg: 'cozy', rarity: 'rare', body: 'tall', ears: 'round', extra: ['whiskers'], colors: C('#9a6b4f', '#e8cdb2', '#6e4630') },
  { id: 'redpanda', name: 'Biscuit', species: 'Red panda', egg: 'cozy', rarity: 'rare', body: 'round', ears: 'round', tail: 'fluffy', extra: ['mask'], colors: C('#d9622b', '#fbe7d6', '#5a2a16') },
  { id: 'seal', name: 'Tofu', species: 'Seal pup', egg: 'cozy', rarity: 'legendary', body: 'seal', ears: 'none', extra: ['whiskers'], colors: C('#eef2f7', '#ffffff', '#b8c4d6') },
  // Spooky-cute
  { id: 'ghost', name: 'Boo', species: 'Ghost', egg: 'spooky', rarity: 'common', body: 'ghost', ears: 'none', extra: ['cheeks'], colors: C('#f5f3ff', '#ffffff', '#c9c2ff') },
  { id: 'bat', name: 'Nibs', species: 'Bat', egg: 'spooky', rarity: 'common', body: 'round', ears: 'cat', wings: 'bat', colors: C('#6d5a9c', '#b8a8e3', '#3f3166') },
  { id: 'pumpkin', name: 'Gourdy', species: 'Pumpkin sprite', egg: 'spooky', rarity: 'common', body: 'pumpkin', ears: 'leaf', colors: C('#f28c28', '#ffc06b', '#3e8e41') },
  { id: 'shroom', name: 'Shroom', species: 'Mushroom sprite', egg: 'spooky', rarity: 'common', body: 'round', ears: 'none', extra: ['cap'], colors: C('#fbe9d6', '#ffffff', '#e5484d') },
  { id: 'owl', name: 'Hoot', species: 'Owl', egg: 'spooky', rarity: 'common', body: 'tall', ears: 'tufts', wings: 'tiny', extra: ['beak', 'goggles'], colors: C('#8b6f5a', '#e9dcc9', '#d9a441') },
  { id: 'mooncat', name: 'Jinx', species: 'Moon cat', egg: 'spooky', rarity: 'rare', body: 'round', ears: 'cat', tail: 'cat', extra: ['moon'], colors: C('#2f2b45', '#4a4468', '#ffd84d', '#ffd84d') },
  { id: 'wisp', name: 'Wisp', species: 'Will-o-wisp', egg: 'spooky', rarity: 'rare', body: 'ghost', ears: 'none', extra: ['flame'], colors: C('#7fd6ff', '#d8f4ff', '#3aa0ff') },
  { id: 'witchkit', name: 'Hex', species: 'Witch kitten', egg: 'spooky', rarity: 'legendary', body: 'round', ears: 'cat', tail: 'cat', extra: ['hat'], colors: C('#c9b8ff', '#efe8ff', '#4b2f8a') },
  // Mythic
  { id: 'cloudsheep', name: 'Nimbus', species: 'Cloud sheep', egg: 'mythic', rarity: 'common', body: 'cloud', ears: 'floppy', colors: C('#ffffff', '#f2f4ff', '#9aa7d8') },
  { id: 'golem', name: 'Pebble', species: 'Pebble golem', egg: 'mythic', rarity: 'common', body: 'tall', ears: 'none', extra: ['moss'], colors: C('#a9adb8', '#cfd2da', '#5fa35f') },
  { id: 'starling', name: 'Lumen', species: 'Star sprite', egg: 'mythic', rarity: 'common', body: 'round', ears: 'none', extra: ['star', 'halo'], colors: C('#fff1a8', '#fffbe0', '#ffc533') },
  { id: 'kitsune', name: 'Kit', species: 'Fox spirit', egg: 'mythic', rarity: 'common', body: 'round', ears: 'cat', tail: 'fluffy', extra: ['flame'], colors: C('#ff9f5a', '#fff0e2', '#ff5a5a') },
  { id: 'dragon', name: 'Ember', species: 'Baby dragon', egg: 'mythic', rarity: 'rare', body: 'round', ears: 'horns', wings: 'dragon', tail: 'dragon', colors: C('#7ccf8a', '#e4f7d2', '#3f9a54') },
  { id: 'phoenix', name: 'Blaze', species: 'Phoenix chick', egg: 'mythic', rarity: 'rare', body: 'round', ears: 'none', wings: 'tiny', extra: ['beak', 'flame'], colors: C('#ff6b4a', '#ffd3a1', '#ffc533') },
  { id: 'unicorn', name: 'Sparkle', species: 'Unicorn foal', egg: 'mythic', rarity: 'legendary', body: 'round', ears: 'round', tail: 'puff', extra: ['horn'], colors: C('#ffffff', '#ffe6f6', '#ff7ac8') },
  { id: 'starwhale', name: 'Comet', species: 'Star whale', egg: 'mythic', rarity: 'legendary', body: 'seal', ears: 'none', extra: ['star', 'fin'], colors: C('#6a7dff', '#c9d2ff', '#ffd84d') },
];

export const SHINY = C('#ffd166', '#fff3c4', '#e0a100');

export const EGGS = {
  cozy: { label: 'Cozy', hint: 'cats, bunnies, pups', base: '#ffd9a8', spot: '#ff9db8' },
  spooky: { label: 'Spooky-cute', hint: 'ghosts, bats, sprites', base: '#8f7fd1', spot: '#ffd84d' },
  mythic: { label: 'Mythic', hint: 'dragons, unicorns, spirits', base: '#7fd8c8', spot: '#ffc533' },
};

export const petById = (id) => PETS.find((p) => p.id === id) || PETS[0];

// ---------- Pixel raster ----------
function P(ctx, x, y, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
function rect(ctx, x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); }
export function disc(ctx, cx, cy, rx, ry, c) {
  ctx.fillStyle = c;
  for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++)
    if ((x * x) / (rx * rx + 0.5) + (y * y) / (ry * ry + 0.5) <= 1) ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
}
function tri(ctx, a, b, c, col) {
  ctx.fillStyle = col;
  const minX = Math.floor(Math.min(a[0], b[0], c[0])), maxX = Math.ceil(Math.max(a[0], b[0], c[0]));
  const minY = Math.floor(Math.min(a[1], b[1], c[1])), maxY = Math.ceil(Math.max(a[1], b[1], c[1]));
  const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
  for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
    const pt = [x + 0.5, y + 0.5], d1 = s(pt, a, b), d2 = s(pt, b, c), d3 = s(pt, c, a);
    if (!((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0))) ctx.fillRect(x, y, 1, 1);
  }
}

const STAGE_SCALE = { baby: 0.75, teen: 0.87, grown: 1 };

/** Draw one creature centred at (cx, cy). face: happy | dot | line | x | wide */
export function drawPet(ctx, pet, { cx, cy, face = 'dot', stage = 'grown', shiny = false, eating = false }) {
  const col = shiny ? { ...SHINY, eye: pet.colors.eye } : pet.colors;
  const k = STAGE_SCALE[stage] ?? 1;
  const R = Math.round(11 * k), RY = Math.round(9.5 * k);
  const ex = pet.extra || [];
  const top = cy - RY;
  if (pet.tail === 'cat') for (let i = 0; i < 6; i++) P(ctx, cx + R + 1 + (i > 2 ? 1 : 0), cy + 4 - i, col.accent);
  if (pet.tail === 'fluffy') disc(ctx, cx + R + 2, cy + 2, 4, 3, col.accent);
  if (pet.tail === 'puff') disc(ctx, cx + R, cy + 4, 2, 2, col.belly);
  if (pet.tail === 'dragon') tri(ctx, [cx + R - 2, cy + 2], [cx + R + 6, cy + 6], [cx + R - 1, cy + 6], col.accent);
  if (pet.wings === 'bat') { tri(ctx, [cx - R + 1, cy - 3], [cx - R - 8, cy - 6], [cx - R - 4, cy + 4], col.accent); tri(ctx, [cx + R - 1, cy - 3], [cx + R + 8, cy - 6], [cx + R + 4, cy + 4], col.accent); }
  if (pet.wings === 'dragon') { tri(ctx, [cx - R + 2, cy - 4], [cx - R - 6, cy - 10], [cx - R - 3, cy + 2], col.accent); tri(ctx, [cx + R - 2, cy - 4], [cx + R + 6, cy - 10], [cx + R + 3, cy + 2], col.accent); }
  if (pet.ears === 'cat') { tri(ctx, [cx - R + 1, top + 5], [cx - R + 3, top - 5], [cx - 2, top + 2], col.body); tri(ctx, [cx + R - 1, top + 5], [cx + R - 3, top - 5], [cx + 2, top + 2], col.body); P(ctx, cx - R + 3, top - 2, col.accent); P(ctx, cx + R - 3, top - 2, col.accent); }
  if (pet.ears === 'bunny') { disc(ctx, cx - 4, top - 5, 2, 6, col.body); disc(ctx, cx + 4, top - 5, 2, 6, col.body); rect(ctx, cx - 4, top - 8, 1, 6, col.accent); rect(ctx, cx + 4, top - 8, 1, 6, col.accent); }
  if (pet.ears === 'round') { disc(ctx, cx - R + 3, top + 2, 3, 3, col.body); disc(ctx, cx + R - 3, top + 2, 3, 3, col.body); disc(ctx, cx - R + 3, top + 2, 1, 1, col.accent); disc(ctx, cx + R - 3, top + 2, 1, 1, col.accent); }
  if (pet.ears === 'floppy') { disc(ctx, cx - R + 1, cy - 2, 3, 5, col.accent); disc(ctx, cx + R - 1, cy - 2, 3, 5, col.accent); }
  if (pet.ears === 'horns') { tri(ctx, [cx - 6, top + 2], [cx - 5, top - 5], [cx - 2, top + 1], col.accent); tri(ctx, [cx + 6, top + 2], [cx + 5, top - 5], [cx + 2, top + 1], col.accent); }
  if (pet.ears === 'tufts') { tri(ctx, [cx - R + 2, top + 3], [cx - R + 1, top - 4], [cx - 3, top + 1], col.body); tri(ctx, [cx + R - 2, top + 3], [cx + R - 1, top - 4], [cx + 3, top + 1], col.body); }
  if (pet.body === 'round') disc(ctx, cx, cy, R, RY, col.body);
  if (pet.body === 'tall') disc(ctx, cx, cy - 1, R - 2, RY + 2, col.body);
  if (pet.body === 'seal') disc(ctx, cx, cy + 1, R + 3, RY - 1, col.body);
  if (pet.body === 'ghost') { disc(ctx, cx, cy - 2, R, RY, col.body); rect(ctx, cx - R, cy - 2, R * 2 + 1, RY, col.body); }
  if (pet.body === 'cloud') [[-6, 2], [6, 2], [0, -3], [-4, -4], [4, -4], [0, 4]].forEach(([dx, dy]) => disc(ctx, cx + dx * k, cy + dy * k, Math.round(6 * k), Math.round(5 * k), col.body));
  if (pet.body === 'pumpkin') { disc(ctx, cx, cy, R, RY, col.body); for (const dx of [-5, 0, 5]) rect(ctx, cx + dx * k, cy - RY + 2, 1, RY * 2 - 3, col.belly); }
  if (pet.ears === 'leaf') { rect(ctx, cx, top - 3, 1, 3, '#5a3a1a'); disc(ctx, cx + 3, top - 3, 2, 1, col.accent); }
  if (pet.body !== 'ghost' && pet.body !== 'pumpkin') disc(ctx, cx, cy + Math.round(RY * 0.45), Math.round(R * 0.55), Math.round(RY * 0.4), col.belly);
  if (pet.body === 'ghost') for (let i = -R + 2; i <= R; i += 5) ctx.clearRect(cx + i, cy + RY - 3, 2, 3);
  if (pet.wings === 'tiny') { disc(ctx, cx - R, cy + 1, 2, 3, col.accent); disc(ctx, cx + R, cy + 1, 2, 3, col.accent); }
  if (ex.includes('mask')) { disc(ctx, cx - 4, cy - 1, 3, 2, col.belly); disc(ctx, cx + 4, cy - 1, 3, 2, col.belly); }
  if (ex.includes('goggles')) { disc(ctx, cx - 4, cy - 1, 3, 3, col.belly); disc(ctx, cx + 4, cy - 1, 3, 3, col.belly); }
  if (ex.includes('moss')) { for (let i = -4; i <= 4; i += 2) P(ctx, cx + i, top + 1 + (i % 4 === 0 ? 0 : 1), col.accent); disc(ctx, cx - 2, top + 1, 2, 1, col.accent); }
  if (ex.includes('cap')) { disc(ctx, cx, top + 1, R + 2, 5, col.accent); rect(ctx, cx - R - 2, top + 2, (R + 2) * 2 + 1, 4, col.accent); P(ctx, cx - 5, top - 1, '#fff'); P(ctx, cx + 3, top - 2, '#fff'); P(ctx, cx + 7, top + 1, '#fff'); P(ctx, cx - 1, top + 2, '#fff'); }
  if (ex.includes('hat')) { tri(ctx, [cx - 6, top + 2], [cx + 1, top - 12], [cx + 6, top + 2], col.accent); rect(ctx, cx - 9, top + 1, 19, 2, col.accent); P(ctx, cx, top - 3, '#ffd84d'); }
  if (ex.includes('horn')) tri(ctx, [cx - 2, top + 1], [cx, top - 8], [cx + 2, top + 1], '#ffd84d');
  if (ex.includes('flame')) { tri(ctx, [cx - 3, top + 1], [cx, top - 7], [cx + 3, top + 1], col.accent); P(ctx, cx, top - 2, '#ffe9a8'); }
  if (ex.includes('halo')) { for (let x = -5; x <= 5; x++) P(ctx, cx + x, top - 4, '#ffc533'); P(ctx, cx - 6, top - 3, '#ffc533'); P(ctx, cx + 6, top - 3, '#ffc533'); }
  if (ex.includes('moon')) { disc(ctx, cx, top + 3, 2, 2, col.accent); disc(ctx, cx + 1, top + 2, 2, 2, col.body); }
  if (ex.includes('star')) { const sx = cx + (pet.body === 'seal' ? 6 : 0), sy = pet.body === 'seal' ? top + 2 : cy + 5; P(ctx, sx, sy - 2, col.accent); rect(ctx, sx - 2, sy - 1, 5, 1, col.accent); rect(ctx, sx - 1, sy, 3, 1, col.accent); P(ctx, sx - 1, sy + 1, col.accent); P(ctx, sx + 1, sy + 1, col.accent); }
  if (ex.includes('fin')) tri(ctx, [cx - R - 2, cy + 2], [cx - R - 7, cy - 3], [cx - R - 6, cy + 6], col.body);
  const dx = Math.max(3, Math.round(R * 0.38)), ey = cy - 1;
  const eye = (x) => {
    const c = col.eye;
    if (face === 'dot') rect(ctx, x, ey - 1, 2, 2, c);
    if (face === 'happy') { P(ctx, x - 1, ey, c); P(ctx, x, ey - 1, c); P(ctx, x + 1, ey - 1, c); P(ctx, x + 2, ey, c); }
    if (face === 'line') rect(ctx, x - 1, ey, 4, 1, c);
    if (face === 'x') { P(ctx, x - 1, ey - 1, c); P(ctx, x + 2, ey - 1, c); rect(ctx, x, ey, 2, 1, c); P(ctx, x - 1, ey + 1, c); P(ctx, x + 2, ey + 1, c); }
    if (face === 'wide') { rect(ctx, x - 1, ey - 2, 3, 3, c); P(ctx, x, ey - 2, '#fff'); }
  };
  eye(cx - dx - 1); eye(cx + dx);
  if (ex.includes('beak')) tri(ctx, [cx - 2, cy + 1], [cx + 2, cy + 1], [cx, cy + 4], '#ff9a3c');
  else if (face === 'happy' || eating) { P(ctx, cx - 1, cy + 2, col.eye); P(ctx, cx, cy + 3, col.eye); P(ctx, cx + 1, cy + 2, col.eye); }
  else if (face === 'x') { rect(ctx, cx - 2, cy + 3, 2, 1, col.eye); rect(ctx, cx, cy + 2, 2, 1, col.eye); }
  else if (face === 'wide') rect(ctx, cx - 1, cy + 2, 2, 2, col.eye);
  else rect(ctx, cx - 1, cy + 2, 2, 1, col.eye);
  if (ex.includes('cheeks') || face === 'happy' || eating) { P(ctx, cx - dx - 3, cy + 1, '#ff8fa8'); P(ctx, cx + dx + 3, cy + 1, '#ff8fa8'); }
  if (ex.includes('whiskers')) { rect(ctx, cx - R - 1, cy + 1, 3, 1, col.eye); rect(ctx, cx + R - 1, cy + 1, 3, 1, col.eye); }
}

export function drawEgg(ctx, type, cx, cy, wobble = 0, cracked = false) {
  const e = EGGS[type] || EGGS.cozy;
  const w = Math.round(wobble);
  disc(ctx, cx + w, cy, 8, 11, e.base);
  [[-3, -4], [3, -1], [-2, 4], [4, 6], [0, -8]].forEach(([x, y]) => disc(ctx, cx + w + x, cy + y, 1, 1, e.spot));
  disc(ctx, cx + w - 3, cy - 6, 1, 2, '#ffffffaa');
  if (cracked) [[-6, 0], [-4, -2], [-2, 0], [0, -2], [2, 0], [4, -2], [6, 0]].forEach(([x, y]) => P(ctx, cx + w + x, cy + y, '#3b2a20'));
}

/** The LCD scene used in the popup and on cards: background, ground, pet. */
export function drawScene(ctx, { pet, shiny, stage, face, night = false, eating = false, bob = 0, bg = true }) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  if (!bg) {
    // Transparent: the page paints the sky behind the pet. A soft shadow grounds it.
    // The pet stands two-thirds down whatever canvas it is given, with room for sky above.
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const cx = Math.round(W / 2), cy = Math.round(H * 0.64);
    ctx.fillStyle = 'rgba(20, 24, 48, 0.07)';
    ctx.fillRect(cx - 8, cy + 11, 16, 1); ctx.fillRect(cx - 10, cy + 12, 20, 1); ctx.fillRect(cx - 7, cy + 13, 14, 1);
    if (pet) drawPet(ctx, pet, { cx, cy: cy + bob, face, stage, shiny, eating });
    return;
  }
  ctx.fillStyle = night ? '#2c3352' : '#e4f2de';
  ctx.fillRect(0, 0, 64, 48);
  ctx.fillStyle = night ? '#4b5580' : '#c3dbb6';
  ctx.fillRect(0, 42, 64, 6);
  if (night) { disc(ctx, 54, 8, 3, 3, '#ffe9a8'); disc(ctx, 55, 7, 3, 3, '#2c3352'); [[8, 6], [20, 3], [40, 9], [14, 14]].forEach(([x, y]) => P(ctx, x, y, '#ffe9a8')); }
  if (pet) drawPet(ctx, pet, { cx: 32, cy: 30 + bob, face, stage, shiny, eating });
}
