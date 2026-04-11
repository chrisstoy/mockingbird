import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'public/images/mockingbird-logo.png');
const outDir = join(root, 'public/icons');

await mkdir(outDir, { recursive: true });

// Standard icons — logo fills the canvas
await sharp(src).resize(192, 192).toFile(join(outDir, 'icon-192.png'));
await sharp(src).resize(512, 512).toFile(join(outDir, 'icon-512.png'));
await sharp(src).resize(180, 180).toFile(join(outDir, 'apple-touch-icon.png'));

// Maskable icon — ~80% safe zone: logo at 80% size, centered on white bg
const size = 512;
const logoSize = Math.round(size * 0.8);
const offset = Math.round((size - logoSize) / 2);

const logoBuffer = await sharp(src).resize(logoSize, logoSize).toBuffer();

await sharp({
  create: {
    width: size,
    height: size,
    channels: 4,
    background: { r: 255, g: 255, b: 255, alpha: 1 },
  },
})
  .composite([{ input: logoBuffer, top: offset, left: offset }])
  .png()
  .toFile(join(outDir, 'icon-maskable-512.png'));

console.log('Icons generated in public/icons/');
