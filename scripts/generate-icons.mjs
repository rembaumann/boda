import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const regular = await readFile(new URL("../public/favicon.svg", import.meta.url));
const maskable = await readFile(new URL("../public/icon-maskable.svg", import.meta.url));
const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

async function png(source, size, name) {
  await sharp(source, { density: 384 }).resize(size, size).png().toFile(out(name));
}

await png(regular, 32, "favicon-32.png");
await png(regular, 180, "apple-touch-icon.png");
await png(regular, 192, "icon-192.png");
await png(regular, 512, "icon-512.png");
await png(maskable, 512, "icon-maskable-512.png");
