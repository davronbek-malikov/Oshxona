/**
 * Run once to generate placeholder app icons and splash screen.
 * Usage: node scripts/generate-assets.js
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

const assetsDir = path.join(__dirname, "..", "assets");
fs.mkdirSync(assetsDir, { recursive: true });

const ORANGE = { r: 249, g: 115, b: 22, alpha: 1 };

async function run() {
  console.log("Generating assets...");

  // icon.png — 1024x1024
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: ORANGE },
  })
    .png()
    .toFile(path.join(assetsDir, "icon.png"));
  console.log("✓ icon.png");

  // adaptive-icon.png — 1024x1024
  await sharp({
    create: { width: 1024, height: 1024, channels: 4, background: ORANGE },
  })
    .png()
    .toFile(path.join(assetsDir, "adaptive-icon.png"));
  console.log("✓ adaptive-icon.png");

  // splash.png — 1242x2436
  await sharp({
    create: { width: 1242, height: 2436, channels: 4, background: ORANGE },
  })
    .png()
    .toFile(path.join(assetsDir, "splash.png"));
  console.log("✓ splash.png");

  console.log("\n✅ All assets created in mobile/assets/");
}

run().catch(console.error);
