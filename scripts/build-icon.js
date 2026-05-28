/**
 * Gera public/icon.ico a partir do monogram SVG (app/apple-icon.svg).
 * Roda com: node scripts/build-icon.js
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const pngToIco = require("png-to-ico").default || require("png-to-ico");

const ROOT = path.resolve(__dirname, "..");
const SVG = path.join(ROOT, "app", "apple-icon.svg");
const PNG_DIR = path.join(ROOT, ".icon-tmp");
const ICO = path.join(ROOT, "public", "icon.ico");

const SIZES = [16, 24, 32, 48, 64, 128, 256];

async function main() {
  if (!fs.existsSync(PNG_DIR)) fs.mkdirSync(PNG_DIR, { recursive: true });
  const svgBuffer = fs.readFileSync(SVG);

  const pngPaths = [];
  for (const size of SIZES) {
    const out = path.join(PNG_DIR, `${size}.png`);
    await sharp(svgBuffer, { density: 300 })
      .resize(size, size, { fit: "contain", background: "#000000" })
      .png()
      .toFile(out);
    pngPaths.push(out);
    console.log(`generated ${size}x${size}`);
  }

  const ico = await pngToIco(pngPaths);
  if (!fs.existsSync(path.dirname(ICO)))
    fs.mkdirSync(path.dirname(ICO), { recursive: true });
  fs.writeFileSync(ICO, ico);
  console.log(`wrote ${ICO} (${(ico.length / 1024).toFixed(1)} KB)`);

  // cleanup
  for (const p of pngPaths) fs.unlinkSync(p);
  fs.rmdirSync(PNG_DIR);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
