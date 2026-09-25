import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const research = path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/, '$1'));
const candidateDir = path.join(research, 'candidates');
const outputDir = path.join(research, '..', 'public', 'images');
await fs.mkdir(outputDir, { recursive: true });

const assets = [
  ['w02-dsc08826.jpg', 'hero-wedding-ceremony.webp', 'wedding', 'hero', 'https://classycaptures.com/wp-content/uploads/2025/11/DSC08826-scaled.jpg'],
  ['w01-dsc09512.jpg', 'wedding-joyful-ritual.webp', 'wedding', 'featured', 'https://classycaptures.com/wp-content/uploads/2025/11/DSC09512-1-scaled.jpg'],
  ['w04-dsc09766.jpg', 'wedding-rice-blessing.webp', 'wedding', 'gallery', 'https://classycaptures.com/wp-content/uploads/2025/11/DSC09766-1-scaled.jpg'],
  ['w05-01.jpg', 'wedding-bride-purple.webp', 'wedding', 'gallery', 'https://classycaptures.com/wp-content/uploads/2025/12/01-1.jpg'],
  ['w06-02.jpg', 'wedding-temple-portrait.webp', 'wedding', 'gallery', 'https://classycaptures.com/wp-content/uploads/2025/12/02-1.jpg'],
  ['w08-11.jpg', 'wedding-monochrome-collage.webp', 'wedding', 'gallery', 'https://classycaptures.com/wp-content/uploads/2025/12/11-2.jpg'],
  ['w09-13.jpg', 'wedding-couple-seated.webp', 'wedding', 'gallery', 'https://classycaptures.com/wp-content/uploads/2025/12/13-1.jpg'],
  ['p01-6036.jpg', 'prewedding-henna-detail.webp', 'pre-wedding', 'gallery', 'https://classycaptures.com/wp-content/uploads/2025/12/DSCF6036-scaled.jpg'],
  ['p03-6220.jpg', 'prewedding-close-embrace.webp', 'pre-wedding', 'featured', 'https://classycaptures.com/wp-content/uploads/2025/12/DSCF6220-scaled.jpg'],
  ['p04-6307.jpg', 'prewedding-intimate-portrait.webp', 'pre-wedding', 'gallery', 'https://classycaptures.com/wp-content/uploads/2025/12/DSCF6307-1-scaled.jpg'],
  ['p05-6412.jpg', 'prewedding-forest-couple.webp', 'pre-wedding', 'category', 'https://classycaptures.com/wp-content/uploads/2025/12/DSCF6412-2-scaled.jpg'],
  ['p06-6541.jpg', 'prewedding-riverside-couple.webp', 'pre-wedding', 'gallery', 'https://classycaptures.com/wp-content/uploads/2025/12/DSCF6541-scaled.jpg'],
  ['r02-4.jpg', 'portrait-groom-temple.webp', 'portrait', 'gallery', 'https://classycaptures.com/wp-content/uploads/2025/12/4.jpg'],
  ['r03-2.jpg', 'portrait-window-silhouette.webp', 'portrait', 'category', 'https://classycaptures.com/wp-content/uploads/2025/12/2-4.jpg'],
  ['r05-01.jpg', 'portrait-bride-reflection.webp', 'portrait', 'featured', 'https://classycaptures.com/wp-content/uploads/2025/12/01-3.jpg'],
  ['r06-02.jpg', 'portrait-bride-lamplight.webp', 'portrait', 'gallery', 'https://classycaptures.com/wp-content/uploads/2025/12/02-2.jpg'],
  ['f01-still.jpg', 'film-still-wedding-ritual.webp', 'film', 'category', 'https://classycaptures.com/wp-content/uploads/2025/11/DSC00047-scaled.jpg'],
];

const manifest = [];
for (const [sourceFile, file, category, role, sourceUrl] of assets) {
  const input = path.join(candidateDir, sourceFile);
  const original = await sharp(input).metadata();
  await sharp(input).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(path.join(outputDir, file));
  const optimized = await sharp(path.join(outputDir, file)).metadata();
  manifest.push({ key: path.basename(file, '.webp'), file: `/images/${file}`, category, role, sourcePage: `https://classycaptures.com/${category === 'pre-wedding' ? 'pre-wedding' : category === 'portrait' ? 'potraits' : category === 'film' ? 'films' : 'weddings'}/`, sourceUrl, originalDimensions: { width: original.width, height: original.height }, dimensions: { width: optimized.width, height: optimized.height } });
}

const videos = [
  ['Website-classy-images-1.mp4', 92366242],
  ['Website-classy-images-4.mp4', 43588102],
  ['Ashutosh-Sathvika-Srikanth-wed-Teaser-HD.mp4', 460524869],
  ['Wed-Story-03-1.mp4', 2852440],
  ['Red-outfit-story-01-prewed.mp4', 1842794],
  ['Pooja-and-Sourab-Teaser-1.mp4', 172151303],
].map(([name, contentLength]) => ({
  url: `https://classycaptures.com/wp-content/uploads/2025/11/${name}`,
  sourcePage: 'https://classycaptures.com/films/',
  verifiedStatus: 200,
  contentType: 'video/mp4',
  contentLength,
  verifiedOn: '2026-09-26',
}));

await fs.writeFile(path.join(research, 'asset-manifest.json'), JSON.stringify({ generatedFrom: 'https://classycaptures.com', heroRecommendation: 'hero-wedding-ceremony', assets: manifest, verifiedVideoSources: videos }, null, 2) + '\n');

const cellW = 400;
const cellH = 330;
const imageH = 290;
const columns = 4;
const rows = Math.ceil(manifest.length / columns);
const composites = [];
for (let index = 0; index < manifest.length; index += 1) {
  const item = manifest[index];
  const image = await sharp(path.join(outputDir, path.basename(item.file))).resize(cellW, imageH, { fit: 'cover', position: 'attention' }).jpeg({ quality: 80 }).toBuffer();
  const label = Buffer.from(`<svg width="${cellW}" height="40"><rect width="100%" height="100%" fill="#17130f"/><text x="12" y="26" fill="#f4eee5" font-family="Arial" font-size="17">${item.key}</text></svg>`);
  const x = (index % columns) * cellW;
  const y = Math.floor(index / columns) * cellH;
  composites.push({ input: image, left: x, top: y }, { input: label, left: x, top: y + imageH });
}
await sharp({ create: { width: columns * cellW, height: rows * cellH, channels: 3, background: '#17130f' } }).composite(composites).jpeg({ quality: 88 }).toFile(path.join(research, 'contact-sheet.jpg'));
console.log(`Processed ${manifest.length} assets.`);
