/**
 * Regenerate favicon.ico + apple-icon.png from src/app/icon.svg.
 * Run after editing the SVG:  node scripts/gen-icons.mjs
 */
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const app = join(import.meta.dirname, "..", "src", "app");
const svg = readFileSync(join(app, "icon.svg"));

const png = (size) =>
  sharp(svg, { density: 384 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();

// apple-icon.png — Next serves it directly for the iOS home screen.
writeFileSync(join(app, "apple-icon.png"), await png(180));

// favicon.ico — multi-frame ICO wrapping PNGs (16 / 32 / 48).
const sizes = [16, 32, 48];
const imgs = await Promise.all(sizes.map(png));

const header = Buffer.alloc(6);
header.writeUInt16LE(1, 2); // type: icon
header.writeUInt16LE(sizes.length, 4);

let offset = 6 + sizes.length * 16;
const entries = imgs.map((img, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(sizes[i], 0); // width
  e.writeUInt8(sizes[i], 1); // height
  e.writeUInt16LE(1, 4); // color planes
  e.writeUInt16LE(32, 6); // bits per pixel
  e.writeUInt32LE(img.length, 8);
  e.writeUInt32LE(offset, 12);
  offset += img.length;
  return e;
});

writeFileSync(join(app, "favicon.ico"), Buffer.concat([header, ...entries, ...imgs]));
console.log(`favicon.ico ${offset}B (${sizes.join("/")}) + apple-icon.png written`);
