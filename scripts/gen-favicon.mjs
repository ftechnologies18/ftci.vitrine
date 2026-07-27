/**
 * Génération du favicon FTCI à partir du logo triskel pixelisé.
 *
 * Logo analysé via VLM :
 *  - 3 branches en spiral horaire (triskel)
 *  - Bleu (haut-gauche), Vert (droite), Orange (bas)
 *  - Branche = pixels/carrés avec dégradé foncé(extérieur)→clair(intérieur)
 *
 * Sorties produites :
 *  - public/favicon.svg          (vectoriel, navigateurs modernes)
 *  - public/favicon.ico          (16/32/48 multi-résolution, legacy)
 *  - public/brand/apple-touch-icon.png  (180×180, iOS)
 *  - public/brand/icon-192.png   (192×192, PWA Android)
 *  - public/brand/icon-512.png   (512×512, PWA)
 *
 * Usage : `node scripts/gen-favicon.mjs` (nécessite sharp, déjà en dépendance)
 */

import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const PUBLIC_DIR = '/home/z/ftci.vitrine/public';
const BRAND_DIR = join(PUBLIC_DIR, 'brand');
mkdirSync(BRAND_DIR, { recursive: true });

// ────────────────────────────────────────────────────────────────────────────
// 1. Paramètres du triskel
// ────────────────────────────────────────────────────────────────────────────

const VIEWBOX = 128;
const CENTER = VIEWBOX / 2; // 64
const ARM_SWEEP_DEG = 150; // amplitude de la spirale par branche
const OUTER_R = 47;
const INNER_R = 15;
const PIXELS_PER_ARM = 8;
const PIXEL_SIZE = 8.5;
const PIXEL_RX = 1.6; // coins légèrement arrondis (effet pixel adouci)

// Couleurs marque FTCI (alignées avec src/data/products.ts + analyse VLM).
// dark = extérieur (bout de la branche), light = intérieur (proche centre).
const ARM_COLORS = [
  { name: 'blue', dark: '#1a237e', light: '#7986cb' }, // top
  { name: 'green', dark: '#0d4d1a', light: '#1e9e4f' }, // bottom-right
  { name: 'orange', dark: '#bf360c', light: '#ee6c1a' }, // bottom-left
];

// Angles de départ (degrés math, 0=droite, 90=bas, 180=gauche, 270=haut)
// Branche Bleu en haut, Verte en bas-droite, Orange en bas-gauche.
const START_ANGLES_DEG = [270, 30, 150];

// ────────────────────────────────────────────────────────────────────────────
// 2. Utilitaires couleur
// ────────────────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function lerpColor(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

// ────────────────────────────────────────────────────────────────────────────
// 3. Génération des pixels d'une branche (spirale Archimède simplifiée)
// ────────────────────────────────────────────────────────────────────────────

function armPixels(armIndex) {
  const startAngle = START_ANGLES_DEG[armIndex];
  const { dark, light } = ARM_COLORS[armIndex];
  const pixels = [];
  for (let i = 0; i < PIXELS_PER_ARM; i++) {
    const t = i / (PIXELS_PER_ARM - 1); // 0 = extérieur, 1 = intérieur
    const radius = OUTER_R - t * (OUTER_R - INNER_R);
    const angleDeg = startAngle + t * ARM_SWEEP_DEG;
    const angleRad = (angleDeg * Math.PI) / 180;
    const x = CENTER + radius * Math.cos(angleRad) - PIXEL_SIZE / 2;
    const y = CENTER + radius * Math.sin(angleRad) - PIXEL_SIZE / 2;
    const fill = lerpColor(dark, light, t);
    pixels.push({ x, y, fill });
  }
  return pixels;
}

// ────────────────────────────────────────────────────────────────────────────
// 4. Construction du SVG
// ────────────────────────────────────────────────────────────────────────────

function buildSvg() {
  const allArms = [0, 1, 2].map(armPixels);

  const rects = allArms
    .flatMap((pixels) =>
      pixels.map(
        (p) =>
          `        <rect x="${p.x.toFixed(2)}" y="${p.y.toFixed(2)}" width="${PIXEL_SIZE}" height="${PIXEL_SIZE}" rx="${PIXEL_RX}" fill="${p.fill}"/>`,
      ),
    )
    .join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX} ${VIEWBOX}" role="img" aria-label="Logo FTCI — triskel numérique bleu, vert, orange">
  <defs>
    <linearGradient id="ftci-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e3a5f"/>
      <stop offset="100%" stop-color="#0f1e3d"/>
    </linearGradient>
    <filter id="ftci-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Fond navy arrondi (cohérence marque + visibilité onglet navigateur) -->
  <rect x="3" y="3" width="${VIEWBOX - 6}" height="${VIEWBOX - 6}" rx="26" fill="url(#ftci-bg)"/>

  <!-- Triskel pixelisé : 3 branches horaires (bleu, vert, orange) -->
  <g filter="url(#ftci-glow)">
${rects}
  </g>

  <!-- Point central lumineux (signal visuel à petite taille) -->
  <circle cx="${CENTER}" cy="${CENTER}" r="4.5" fill="#ffffff" opacity="0.92"/>
  <circle cx="${CENTER}" cy="${CENTER}" r="2" fill="#0f1e3d" opacity="0.6"/>
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
  const dirSize = count * dirEntrySize;
  let offset = headerSize + dirSize;

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
    buf.writeUInt32LE(entry.data.length, 8); // image size
    buf.writeUInt32LE(offset, 12); // offset
    offset += entry.data.length;
    return buf;
  });

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map((e) => e.data)]);
}

// ────────────────────────────────────────────────────────────────────────────
// 6. Exécution
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  const svg = buildSvg();
  const svgPath = join(PUBLIC_DIR, 'favicon.svg');
  writeFileSync(svgPath, svg, 'utf8');
  console.log(`✓ SVG écrit : ${svgPath} (${svg.length} octets)`);

  const pngSizes = [
    { size: 16, file: null },
    { size: 32, file: null },
    { size: 48, file: null },
    { size: 180, file: join(BRAND_DIR, 'apple-touch-icon.png') },
    { size: 192, file: join(BRAND_DIR, 'icon-192.png') },
    { size: 512, file: join(BRAND_DIR, 'icon-512.png') },
  ];

  const pngResults = [];
  for (const { size, file } of pngSizes) {
    const data = await sharp(Buffer.from(svg))
      .resize(size, size, { fit: 'cover' })
      .png({ compressionLevel: 9 })
      .toBuffer();
    pngResults.push({ size, width: size, data, file });
    if (file) {
      writeFileSync(file, data);
      console.log(`✓ PNG ${size}×${size} écrit : ${file} (${data.length} octets)`);
    } else {
      console.log(`✓ PNG ${size}×${size} généré en mémoire (${data.length} octets)`);
    }
  }

  const icoBuffers = pngResults
    .filter((p) => [16, 32, 48].includes(p.size))
    .map((p) => ({ width: p.width, data: p.data }));
  const icoData = buildIco(icoBuffers);
  const icoPath = join(PUBLIC_DIR, 'favicon.ico');
  writeFileSync(icoPath, icoData);
  console.log(`✓ ICO multi-résolution écrit : ${icoPath} (${icoData.length} octets, ${icoBuffers.length} images)`);

  console.log('\n=== Récapitulatif ===');
  console.log(`  favicon.svg                  (${svg.length} o)  → vectoriel`);
  console.log(`  favicon.ico                  (${icoData.length} o)  → 16+32+48 px`);
  console.log(`  brand/apple-touch-icon.png   (180px) → iOS`);
  console.log(`  brand/icon-192.png           (192px) → PWA Android`);
  console.log(`  brand/icon-512.png           (512px) → PWA`);
}

main().catch((err) => {
  console.error('Erreur :', err);
  process.exit(1);
});
