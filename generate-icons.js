// generate-icons.js
// Run: node generate-icons.js
// Requires: npm install sharp (or uses Canvas fallback)
// This script converts the source icon to the required PNG sizes.

const fs   = require('fs');
const path = require('path');

// ── Canvas-based icon generation (no external deps) ────────
// Generates pure purple→pink gradient icons at each required size.

function generateIconCanvas(size) {
  const { createCanvas } = require('canvas');
  const canvas = createCanvas(size, size);
  const ctx    = canvas.getContext('2d');

  // Background: rounded rect with gradient
  const r = size * 0.18;
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#7C3AED');
  grad.addColorStop(1, '#EC4899');

  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Letter M
  ctx.fillStyle = 'white';
  ctx.font = `bold ${Math.round(size * 0.58)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Glow
  ctx.shadowColor = 'rgba(255,255,255,0.6)';
  ctx.shadowBlur  = size * 0.08;
  ctx.fillText('M', size / 2, size / 2 + size * 0.02);

  return canvas.toBuffer('image/png');
}

// ── Sharp-based resizing (if canvas fails) ─────────────────
async function generateIconSharp(size, sourcePath, outPath) {
  const sharp = require('sharp');
  await sharp(sourcePath).resize(size, size).png().toFile(outPath);
  console.log(`✅ Generated: ${outPath}`);
}

// ── Main ───────────────────────────────────────────────────
const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

const sizes = [16, 48, 128];

// Try canvas first, then sharp, then fallback message
async function run() {
  // Attempt 1: canvas
  try {
    const { createCanvas } = require('canvas');
    for (const size of sizes) {
      const buf = generateIconCanvas(size);
      const out = path.join(iconsDir, `icon${size}.png`);
      fs.writeFileSync(out, buf);
      console.log(`✅ Generated via canvas: icon${size}.png`);
    }
    return;
  } catch (e) {
    console.log('⚠️  canvas not available, trying sharp...');
  }

  // Attempt 2: sharp
  const srcJpg = path.join(__dirname, '..', 'icon_source.jpg');
  if (!fs.existsSync(srcJpg)) {
    console.log('⚠️  icon_source.jpg not found next to script. Place the generated icon there.');
    writeFallbackNotice();
    return;
  }
  try {
    for (const size of sizes) {
      const out = path.join(iconsDir, `icon${size}.png`);
      await generateIconSharp(size, srcJpg, out);
    }
    return;
  } catch (e) {
    console.log('⚠️  sharp not available either.');
  }

  writeFallbackNotice();
}

function writeFallbackNotice() {
  console.log('\n📌 INSTRUÇÃO MANUAL:');
  console.log('   Coloque ícones PNG nas seguintes dimensões na pasta icons/:');
  sizes.forEach(s => console.log(`   • icon${s}.png  (${s}×${s}px)`));
  console.log('\n   Você pode usar: https://www.favicon-generator.org/ ou qualquer editor.');
}

run().catch(console.error);
