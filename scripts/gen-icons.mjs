// Rastert die SVG-Icon-Quellen zu den PNGs, die das PWA-Manifest braucht.
// Einmalig/bei Designänderungen ausführen: `npm run gen:icons`.
// Die erzeugten PNGs werden committet (kein Build-Schritt, damit der reguläre
// Client-Build keine native Abhängigkeit (sharp) benötigt).

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
const any = readFileSync(join(dir, 'icon.svg'));
const maskable = readFileSync(join(dir, 'icon-maskable.svg'));

const jobs = [
  { src: any, size: 192, out: 'icon-192.png' },
  { src: any, size: 512, out: 'icon-512.png' },
  { src: maskable, size: 192, out: 'icon-192-maskable.png' },
  { src: maskable, size: 512, out: 'icon-512-maskable.png' },
  // Apple-Touch-Icon: vollflächig (iOS rundet selbst) -> Maskable-Quelle, 180px.
  { src: maskable, size: 180, out: 'apple-touch-icon.png' },
];

for (const { src, size, out } of jobs) {
  await sharp(src, { density: 384 })
    .resize(size, size, { fit: 'contain' })
    .png()
    .toFile(join(dir, out));
  console.log(`✓ ${out} (${size}×${size})`);
}
