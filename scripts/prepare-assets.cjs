// Prepare the Amis skin assets:
// - landscape image   -> chat background (background.jpg)
// - newest portrait   -> sidebar FILL (opaque, sidebar.jpg) AND the moving character (transparent, character.webp)
// Output goes to dsh-amyth/assets/.
const fs = require('node:fs');
const path = require('node:path');

function loadSharp() {
  const candidates = [
    'C:/Users/35105/.dsh/profiles/node_modules/sharp',
    'C:/Users/35105/.dsh/profiles/web/node_modules/sharp',
  ];
  for (const c of candidates) {
    try { return require(c); } catch {}
  }
  throw new Error('sharp not found in profile node_modules');
}

(async () => {
  const sharp = loadSharp();
  const SRC_DIR = 'C:/Users/35105/Desktop/小爱同学';
  const OUT = 'C:/Users/35105/Desktop/爱弥斯yya/dsh-amyth/assets';
  fs.mkdirSync(OUT, { recursive: true });

  const files = fs.readdirSync(SRC_DIR).filter((f) => /\.png$/i.test(f));
  const metaList = [];
  for (const f of files) {
    const m = await sharp(path.join(SRC_DIR, f)).metadata();
    metaList.push({ f, w: m.width, h: m.height, ratio: m.width / m.height });
  }
  // landscape (main background): pick the NEWEST landscape file (newest upload wins).
  const landscape = metaList
    .filter((m) => m.ratio > 1)
    .sort((a, b) => fs.statSync(path.join(SRC_DIR, b.f)).mtimeMs - fs.statSync(path.join(SRC_DIR, a.f)).mtimeMs)[0];
  // portrait (sidebar character): pick the TALLEST portrait file.
  const portrait = metaList.filter((m) => m.ratio <= 1).sort((a, b) => b.h - a.h)[0];
  if (!landscape || !portrait) throw new Error('need one landscape + one portrait source');

  console.log('chat background source (landscape):', landscape.f, landscape.w + 'x' + landscape.h);
  console.log('sidebar / character source (portrait):', portrait.f, portrait.w + 'x' + portrait.h);

  // chat background: resize to 1920 wide, jpeg
  await sharp(path.join(SRC_DIR, landscape.f))
    .resize({ width: 1920, withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toFile(path.join(OUT, 'background.jpg'));

  // sidebar FILL (opaque): compress, pad white on top so the character sits lower.
  await sharp(path.join(SRC_DIR, portrait.f))
    .resize({ height: 1600, withoutEnlargement: true })
    .extend({ top: 120, background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .jpeg({ quality: 88 })
    .toFile(path.join(OUT, 'sidebar.jpg'));

  // moving character (transparent): remove the white background -> transparent webp
  const { data, info } = await sharp(path.join(SRC_DIR, portrait.f))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const px = (x, y) => (y * width + x) * channels;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = px(x, y);
      const mn = Math.min(data[i], data[i + 1], data[i + 2]); // whiteness
      let a = 255;
      if (mn >= 250) a = 0;
      else if (mn >= 225) a = Math.round(255 * (250 - mn) / 25);
      data[i + 3] = a;
    }
  }
  await sharp(data, { raw: { width, height, channels } })
    .resize({ height: 1400, withoutEnlargement: true })
    .webp({ quality: 92, alphaQuality: 92 })
    .toFile(path.join(OUT, 'character.webp'));

  const a = fs.statSync(path.join(OUT, 'background.jpg'));
  const b = fs.statSync(path.join(OUT, 'sidebar.jpg'));
  const c = fs.statSync(path.join(OUT, 'character.webp'));
  console.log('wrote background.jpg', a.size, '; sidebar.jpg', b.size, '; character.webp', c.size);
})().catch((e) => { console.error(e); process.exit(1); });
