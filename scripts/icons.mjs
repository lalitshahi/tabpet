// Renders the static store/toolbar icons from the same pixel art, with no dependencies:
// a tiny fake 2D context collects fillRect calls into a pixel buffer, then we write PNGs with zlib.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { drawPet, petById } from '../src/pets.js';

function fakeCanvas(w, h) {
  const px = new Uint8Array(w * h * 4);
  const parse = (c) => {
    const m = c.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
    if (!m) return [0, 0, 0, 0];
    const n = parseInt(m[1], 16);
    return [n >> 16, (n >> 8) & 255, n & 255, m[2] ? parseInt(m[2], 16) : 255];
  };
  let fill = [0, 0, 0, 255];
  const ctx = {
    set fillStyle(c) { fill = parse(c); },
    fillRect(x, y, rw, rh) {
      for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) {
        if (i < 0 || j < 0 || i >= w || j >= h) continue;
        const o = (j * w + i) * 4, a = fill[3] / 255;
        for (let k = 0; k < 3; k++) px[o + k] = Math.round(fill[k] * a + px[o + k] * (1 - a));
        px[o + 3] = Math.max(px[o + 3], fill[3]);
      }
    },
    clearRect(x, y, rw, rh) { for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) if (i >= 0 && j >= 0 && i < w && j < h) px.fill(0, (j * w + i) * 4, (j * w + i) * 4 + 4); },
  };
  return { ctx, px, w, h };
}

const crc32 = (buf) => { let c, crc = ~0; for (const b of buf) { c = (crc ^ b) & 255; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c; } return ~crc >>> 0; };
function png(w, h, rgba) {
  const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// Mochi the cat, happy, cropped to a 30×30 square, scaled with nearest neighbour.
const art = fakeCanvas(64, 48);
drawPet(art.ctx, petById('cat'), { cx: 32, cy: 30, face: 'happy', stage: 'baby' });
const S = 30, ox = 17, oy = 13;
for (const size of [16, 32, 48, 128]) {
  const out = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const sx = ox + Math.floor((x * S) / size), sy = oy + Math.floor((y * S) / size);
    out.set(art.px.subarray((sy * 64 + sx) * 4, (sy * 64 + sx) * 4 + 4), (y * size + x) * 4);
  }
  writeFileSync(new URL(`../icons/icon-${size}.png`, import.meta.url), png(size, size, out));
}
console.log('icons written');
