/**
 * Build a web-budget vista plate from a source photograph.
 *
 * Usage:
 *   node scripts/make-vista.mjs <src> <out-basename> [--aspect 0.85]
 *        [--focus 0.5,0.45] [--width 1000] [--trim]
 *
 * --aspect  width/height of the output. MATCH THE CONTAINER: `object-fit: cover`
 *           discards whatever doesn't fit, and a landscape plate in a portrait
 *           card loses the composition entirely.
 * --focus   normalized point in the SOURCE to keep centred (x,y).
 * --trim    strip a uniform archival mount border before cropping. Needed for
 *           most NARA scans; the Tetons plate is already borderless.
 *
 * No tonal grading happens here: the plate keeps its full range and the app's
 * scrim + band grade do the darkening in CSS, where it stays reversible.
 *
 * Sources must be PUBLIC DOMAIN or otherwise cleared. Plates in public/vistas/
 * come from National Archives series 79-AA (Ansel Adams' 1941-42 National Park
 * Service commission; US Government property, public domain).
 *
 * Budget: AVIF primary + WebP fallback, 40-80KB per plate.
 */
import sharp from 'sharp';
import { statSync } from 'fs';

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const positional = argv.filter((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'));

const [SRC, OUT] = positional;
const ASPECT = Number(flag('aspect', 0.85));
const WIDE = Number(flag('width', 1000));
const [FX, FY] = String(flag('focus', '0.5,0.45')).split(',').map(Number);
const ZOOM = Number(flag('zoom', 1));
const TRIM = argv.includes('--trim');

if (!SRC || !OUT) {
  console.error('usage: node scripts/make-vista.mjs <src> <out> [--aspect n] [--focus x,y] [--width n] [--trim]');
  process.exit(1);
}

// Trim first so the mount border never skews the crop maths.
const trimmed = TRIM ? await sharp(SRC).trim({ threshold: 25 }).toBuffer() : SRC;
const meta = await sharp(trimmed).metadata();

// Largest rectangle of the requested aspect that fits inside the source,
// shrunk by --zoom so the subject can be pulled clear of the app's scrim.
let cw = meta.width;
let ch = Math.round(cw / ASPECT);
if (ch > meta.height) {
  ch = meta.height;
  cw = Math.round(ch * ASPECT);
}
cw = Math.round(cw / ZOOM);
ch = Math.round(ch / ZOOM);
const clamp = (v, max) => Math.max(0, Math.min(Math.round(v), max));
const left = clamp(meta.width * FX - cw / 2, meta.width - cw);
const top = clamp(meta.height * FY - ch / 2, meta.height - ch);

const base = sharp(trimmed)
  .extract({ left, top, width: cw, height: ch })
  .resize({ width: WIDE });

await base.clone().avif({ quality: 46, effort: 6 }).toFile(`${OUT}.avif`);
await base.clone().webp({ quality: 58 }).toFile(`${OUT}.webp`);

const kb = (p) => Math.round(statSync(p).size / 1024) + 'KB';
console.log(`${meta.width}x${meta.height}${TRIM ? ' (trimmed)' : ''} -> crop ${cw}x${ch} @${left},${top} -> ${WIDE}x${Math.round(WIDE / ASPECT)}`);
console.log(`  ${OUT}.avif  ${kb(OUT + '.avif')}`);
console.log(`  ${OUT}.webp  ${kb(OUT + '.webp')}`);
