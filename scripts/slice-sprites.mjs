// Schneidet die Pixel-Art-Sprites aus art/source-sheet.png aus und stellt den
// Holzhintergrund per Flood-Fill (von den Rändern) frei. Das Fell der Mäuse
// bleibt durch ihre dunkle Outline geschützt. Ergebnis -> public/sprites/*.png.
// Erneut ausführen: `node scripts/slice-sprites.mjs`.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';

const SRC = 'art/source-sheet.png';
const OUT = 'public/sprites';
mkdirSync(OUT, { recursive: true });

// Erkannte Boxen (aus art/analyze.mjs). Jeweils {name,x,y,w,h}.
const SPRITES = [
  // Spieler-Mäuse (Reihenfolge = Spielerindex/Schalfarbe)
  { name: 'mouse-0', x: 81, y: 16, w: 196, h: 224 },
  { name: 'mouse-1', x: 303, y: 16, w: 193, h: 224 },
  { name: 'mouse-2', x: 531, y: 16, w: 194, h: 224 },
  { name: 'mouse-3', x: 757, y: 16, w: 192, h: 224 },
  { name: 'mouse-4', x: 980, y: 16, w: 192, h: 224 },
  { name: 'mouse-5', x: 1204, y: 16, w: 193, h: 224 },
  // Stimmungs-Mäuse
  { name: 'mouse-crowned', x: 225, y: 240, w: 193, h: 222 },
  { name: 'mouse-win', x: 532, y: 253, w: 226, h: 209 },
  { name: 'mouse-sad', x: 863, y: 253, w: 180, h: 203 },
  // Icons / Objekte
  { name: 'trophy', x: 1224, y: 674, w: 174, h: 172 },
  { name: 'crown', x: 200, y: 738, w: 121, h: 92 },
  { name: 'ai', x: 391, y: 733, w: 166, h: 105 },
  { name: 'paw', x: 625, y: 737, w: 84, h: 79 },
  { name: 'music-on', x: 877, y: 728, w: 93, h: 102 },
  { name: 'music-off', x: 1035, y: 728, w: 104, h: 105 },
  { name: 'cheese', x: 828, y: 846, w: 215, h: 158 },
];

const PAD = 5;
const raw = await sharp(SRC).raw().toBuffer({ resolveWithObject: true });
const D = raw.data,
  IW = raw.info.width,
  IH = raw.info.height,
  IC = raw.info.channels;
const woodAt = (x, y) => {
  const i = (y * IW + x) * IC;
  const r = D[i],
    g = D[i + 1],
    b = D[i + 2];
  if (r < 85 || r > 192) return false;
  return Math.abs(g / r - 0.61) < 0.085 && Math.abs(b / r - 0.31) < 0.085;
};

for (const s of SPRITES) {
  const x0 = Math.max(0, s.x - PAD),
    y0 = Math.max(0, s.y - PAD);
  const x1 = Math.min(IW, s.x + s.w + PAD),
    y1 = Math.min(IH, s.y + s.h + PAD);
  const w = x1 - x0,
    h = y1 - y0;
  const out = Buffer.alloc(w * h * 4);
  // RGB kopieren, Alpha=255
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const si = ((y0 + y) * IW + (x0 + x)) * IC,
        di = (y * w + x) * 4;
      out[di] = D[si];
      out[di + 1] = D[si + 1];
      out[di + 2] = D[si + 2];
      out[di + 3] = 255;
    }
  // Flood-Fill Holz -> transparent, von allen Rändern.
  const vis = new Uint8Array(w * h);
  const qx = [];
  const qy = [];
  const push = (x, y) => {
    if (x >= 0 && x < w && y >= 0 && y < h && !vis[y * w + x] && woodAt(x0 + x, y0 + y)) {
      vis[y * w + x] = 1;
      qx.push(x);
      qy.push(y);
    }
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  let head = 0;
  while (head < qx.length) {
    const x = qx[head],
      y = qy[head];
    head++;
    out[(y * w + x) * 4 + 3] = 0; // transparent
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  let transparent = 0;
  for (let p = 0; p < w * h; p++) if (out[p * 4 + 3] === 0) transparent++;
  await sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .trim({ threshold: 1 })
    .png()
    .toFile(`${OUT}/${s.name}.png`);
  console.log(
    `${s.name}.png ${w}x${h}  transparent ${((100 * transparent) / (w * h)).toFixed(0)}%`
  );
}
console.log('done ->', OUT);
