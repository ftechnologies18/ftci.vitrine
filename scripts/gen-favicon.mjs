/**
 * Génération du favicon FTCI à partir du logo marque (triskel pixelisé).
 *
 * Source de vérité : public/brand/logo-ftci-nobg.png (PNG transparent 412×423).
 * Couleurs extraites par analyse pixel (PIL) :
 *   - Vert    #197f04  (rgb 25, 127, 4)   — branche dominante
 *   - Orange  #f65a05  (rgb 246, 90, 5)
 *   - Bleu    #696fa4  (rgb 105, 111, 164) — periwinkle
 *   - Navy    #02083e  (rgb 2, 8, 62)      — contour décoratif
 *
 * Stratégie :
 *   - favicon.svg : version vectorielle transparente (vraies couleurs), pour
 *     les navigateurs modernes. Fond TRANSPARENT pour s'adapter aux onglets
 *     clairs comme sombres.
 *   - favicon.ico + PNG (apple-touch, 192, 512) : générés directement depuis
 *     le PNG source pour fidélité maximale au logo réel.
 *
 * Sorties :
 *   - public/favicon.svg                 (vectoriel transparent)
 *   - public/favicon.ico                 (16+32+48 multi-résolution)
 *   - public/brand/apple-touch-icon.png  (180×180, iOS)
 *   - public/brand/icon-192.png          (192×192, PWA Android)
 *   - public/brand/icon-512.png          (512×512, PWA)
 *
 * Usage : `node scripts/gen-favicon.mjs`
 */

import sharp from 'sharp';
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = '/home/z/ftci.vitrine';
const PUBLIC_DIR = join(ROOT, 'public');
const BRAND_DIR = join(PUBLIC_DIR, 'brand');
const SOURCE_PNG = join(BRAND_DIR, 'logo-ftci-nobg.png');

mkdirSync(BRAND_DIR, { recursive: true });

// ────────────────────────────────────────────────────────────────────────────
// 1. Couleurs exactes FTCI (extraites du logo via PIL)
// ────────────────────────────────────────────────────────────────────────────

const COLORS = {
  green: '#197f04', // rgb(25, 127, 4)
  orange: '#f65a05', // rgb(246, 90, 5)
  blue: '#696fa4', // rgb(105, 111, 164) — periwinkle
  navy: '#02083e', // rgb(2, 8, 62) — contour
};

// ────────────────────────────────────────────────────────────────────────────
// 2. Paramètres du triskel (spirale 3 branches)
// ────────────────────────────────────────────────────────────────────────────

const VIEWBOX = 128;
const CENTER = VIEWBOX / 2;
const ARM_SWEEP_DEG = 150;
const OUTER_R = 50;
const INNER_R = 14;
const PIXELS_PER_ARM = 9;
const PIXEL_SIZE = 8;
const PIXEL_GAP_CORNER = 1.4; // coins légèrement arrondis

// Branche 1 = vert (haut), 2 = orange (bas-droite), 3 = bleu (bas-gauche)
// Sens horaire comme le logo original.
const ARMS = [
  { color: COLORS.green, startAngle: 270 }, // top
  { color: COLORS.orange, startAngle: 30 }, // bottom-right
  { color: COLORS.blue, startAngle: 150 }, // bottom-left
];

// ────────────────────────────────────────────────────────────────────────────
// 3. Génération des pixels d'une branche (spirale)
// ────────────────────────────────────────────────────────────────────────────

function armPixels(arm) {
  const pixels = [];
  for (let i = 0; i < PIXELS_PER_ARM; i++) {
    const t = i / (PIXELS_PER_ARM - 1); // 0 = extérieur, 1 = intérieur
    const radius = OUTER_R - t * (OUTER_R - INNER_R);
    const angleDeg = arm.startAngle + t * ARM_SWEEP_DEG;
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = CENTER + radius * Math.cos(angleRad) - PIXEL_SIZE / 2;
    const y = CENTER + radius * Math.sin(angleRad) - PIXEL_SIZE / 2;
    pixels.push({ x, y, fill: arm.color });
  }
  return pixels;
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Construction du SVG (transparent, vraies couleurs)
// ────────────────────────────────────────────────────────────────────────────

function buildSvg() {
  const allPixels = ARMS.flatMap(armPixels);

  const rects = allPixels
    .map(
      (p) =>
        `    <rect x="${p.x.toFixed(2)}" y="${p.y.toFixed(2)}" width="${PIXEL_SIZE}" height="${PIXEL_SIZE}" rx="${PIXEL_GAP_CORNER}" fill="${p.fill}"/>`,
    )
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}" role="img" aria-label="Logo FTCI — triskel numérique vert, orange, bleu">
  <defs>
    <filter id="ftci-glow" x="-10%" y="-10%" width="120%" height="120%">
      <feGaussianBlur stdDeviation="0.4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Triskel pixelisé : 3 branches horaires (vert, orange, bleu) — fond transparent -->
  <g filter="url(#ftci-glow)">
${rects}
  </g>

  <!-- Point central navy (cohérence avec logo source) -->
  <circle cx="${CENTER}" cy="${CENTER}" r="3.5" fill="${COLORS.navy}"/>
</svg>
`;
}

// ────────────────────────────────────────────────────────────────────────────
// 5. Encodage ICO (multi-résolution, PNG embarqués)
// ────────────────────────────────────────────────────────────────────────────

function buildIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + count * dirEntrySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = icon
  header.writeUInt16LE(count, 4);

  const dirEntries = pngBuffers.map((entry) => {
    const buf = Buffer.alloc(dirEntrySize);
    buf.writeUInt8(entry.width >= 256 ? 0 : entry.width, 0);
    buf.writeUInt8(entry.width >= 256 ? 0 : entry.width, 1);
    buf.writeUInt8(0, 2);
    buf.writeUInt8(0, 3);
    buf.writeUInt16LE(1, 4); // color planes
    buf.writeUInt16LE(32, 6); // bits per pixel
    buf.writeUInt32LE(entry.data.length, 8);
    buf.writeUInt32LE(offset, 12);
    offset += entry.data.length;
    return buf;
  });

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((e) => e.data)]);
}

// ────────────────────────────────────────────────────────────────────────────
// 6. Préparation du logo source (crop + padding pour format carré)
// ────────────────────────────────────────────────────────────────────────────

async function prepareLogoSquare(size) {
  // Le logo source est 412×423 (presque carré). On le rend carré en ajoutant
  // du padding transparent, puis on redimensionne à `size`.
  // Padding de 6% autour pour que le triskel ne touche pas les bords.
  const padding = Math.round(size * 0.06);
  const innerSize = size - padding * 2;

  return await sharp(SOURCE_PNG)
    .resize(innerSize, innerSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// ────────────────────────────────────────────────────────────────────────────
// 7. Exécution
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  // 7.1 — favicon.svg (vectoriel transparent)
  const svg = buildSvg();
  const svgPath = join(PUBLIC_DIR, 'favicon.svg');
  writeFileSync(svgPath, svg, 'utf8');
  console.log(`✓ SVG écrit : ${svgPath} (${svg.length} octets)`);

  // 7.2 — PNGs depuis le logo source (fidélité maximale)
  const pngTargets = [
    { size: 16, file: null, forIco: true },
    { size: 32, file: null, forIco: true },
    { size: 48, file: null, forIco: true },
    { size: 180, file: join(BRAND_DIR, 'apple-touch-icon.png'), forIco: false },
    { size: 192, file: join(BRAND_DIR, 'icon-192.png'), forIco: false },
    { size: 512, file: join(BRAND_DIR, 'icon-512.png'), forIco: false },
  ];

  const icoBuffers = [];
  for (const target of pngTargets) {
    const data = await prepareLogoSquare(target.size);
    if (target.file) {
      writeFileSync(target.file, data);
      console.log(`✓ PNG ${target.size}×${target.size} écrit : ${target.file} (${data.length} octets)`);
    }
    if (target.forIco) {
      icoBuffers.push({ width: target.size, data });
      console.log(`✓ PNG ${target.size}×${target.size} préparé pour ICO (${data.length} octets)`);
    }
  }

  // 7.3 — favicon.ico (16+32+48 multi-résolution)
  const icoData = buildIco(icoBuffers);
  const icoPath = join(PUBLIC_DIR, 'favicon.ico');
  writeFileSync(icoPath, icoData);
  console.log(`✓ ICO multi-résolution écrit : ${icoPath} (${icoData.length} octets, ${icoBuffers.length} images)`);

  // 7.4 — Récapitulatif
  console.log('\n=== Récapitulatif ===');
  console.log(`  favicon.svg                  (${svg.length} o)  → vectoriel transparent`);
  console.log(`  favicon.ico                  (${icoData.length} o)  → 16+32+48 px (depuis logo source)`);
  console.log(`  brand/apple-touch-icon.png   (180px) → iOS (depuis logo source)`);
  console.log(`  brand/icon-192.png           (192px) → PWA Android (depuis logo source)`);
  console.log(`  brand/icon-512.png           (512px) → PWA (depuis logo source)`);
  console.log(`\n  Couleurs FTCI (extraites du logo) :`);
  console.log(`    Vert    ${COLORS.green}`);
  console.log(`    Orange  ${COLORS.orange}`);
  console.log(`    Bleu    ${COLORS.blue}`);
  console.log(`    Navy    ${COLORS.navy}`);
}

main().catch((err) => {
  console.error('Erreur :', err);
  process.exit(1);
});
