import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1'));
const source = path.join(root, 'candidates');
const files = (await fs.readdir(source)).filter((name) => /\.(jpe?g|png|webp)$/i.test(name)).sort();
const cellW = 360;
const cellH = 290;
const imageH = 250;
const columns = 4;
const rows = Math.ceil(files.length / columns);
const composites = [];
const metadata = [];

for (let index = 0; index < files.length; index += 1) {
  const name = files[index];
  const input = path.join(source, name);
  const meta = await sharp(input).metadata();
  metadata.push({ name, width: meta.width, height: meta.height, format: meta.format });
  const thumb = await sharp(input)
    .resize(cellW, imageH, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 80 })
    .toBuffer();
  const label = Buffer.from(`<svg width="${cellW}" height="40"><rect width="100%" height="100%" fill="#17130f"/><text x="12" y="26" fill="#f4eee5" font-family="Arial" font-size="18">${name}</text></svg>`);
  const x = (index % columns) * cellW;
  const y = Math.floor(index / columns) * cellH;
  composites.push({ input: thumb, left: x, top: y }, { input: label, left: x, top: y + imageH });
}

await sharp({ create: { width: columns * cellW, height: rows * cellH, channels: 3, background: '#17130f' } })
  .composite(composites)
  .jpeg({ quality: 88 })
  .toFile(path.join(root, 'candidate-contact-sheet.jpg'));

console.log(JSON.stringify(metadata, null, 2));
