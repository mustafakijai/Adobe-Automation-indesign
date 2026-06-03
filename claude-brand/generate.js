/**************************************************************
 * generate.js — "Claude" brand design generator
 * A Claude design, by Claude. For Mr Khan (Mustafa).
 *
 * Outputs (vector, fully editable in Illustrator / browser):
 *   • claude-logo.svg        — the standalone spark + wordmark logo
 *   • claude-brand-board.svg  — a one-sheet brand board (logo, palette, type)
 *
 * Run:  node generate.js
 **************************************************************/

const fs = require("fs");
const path = require("path");

/* ---------------------------------------------------------------
 * BRAND TOKENS — the "Claude" palette
 * ------------------------------------------------------------- */
const C = {
  clay:   "#D97757", // primary — Claude's signature warm coral/clay
  clayDk: "#C15F3C", // deeper clay for accents/hover
  cream:  "#F0EEE6", // canvas / background
  paper:  "#FAF9F5", // lighter paper
  ink:    "#141413", // near-black text
  slate:  "#3D3D3A", // secondary text
  sand:   "#E3DACC", // muted divider / fill
};

/* ---------------------------------------------------------------
 * SPARK MARK — radial burst of rounded spokes (the Claude "spark")
 * Generates a centred starburst with alternating long/short petals.
 * ------------------------------------------------------------- */
function sparkMark(cx, cy, R, color, spokes = 11) {
  // Each spoke is a tapered rounded bar radiating from the centre.
  // Alternating lengths give the organic, hand-drawn burst feel.
  const parts = [];
  for (let i = 0; i < spokes; i++) {
    const ang = (i / spokes) * Math.PI * 2 - Math.PI / 2;
    const long = i % 2 === 0;
    const len = long ? R : R * 0.62;          // petal length
    const w = long ? R * 0.13 : R * 0.105;    // petal half-width at base
    const inner = R * 0.06;                    // small gap at centre

    // Build a rounded "teardrop" bar: wide near centre, tapering to a round cap.
    const ix = cx + Math.cos(ang) * inner;
    const iy = cy + Math.sin(ang) * inner;
    const ox = cx + Math.cos(ang) * len;
    const oy = cy + Math.sin(ang) * len;
    const px = Math.cos(ang + Math.PI / 2);    // perpendicular
    const py = Math.sin(ang + Math.PI / 2);

    const tipR = w * 0.9;
    // base-left, base-right, taper to rounded tip
    const blx = ix + px * w,  bly = iy + py * w;
    const brx = ix - px * w,  bry = iy - py * w;
    const tlx = ox + px * tipR, tly = oy + py * tipR;
    const trx = ox - px * tipR, tryy = oy - py * tipR;

    parts.push(
      `<path d="M${blx.toFixed(2)},${bly.toFixed(2)} ` +
      `L${tlx.toFixed(2)},${tly.toFixed(2)} ` +
      `A${tipR.toFixed(2)},${tipR.toFixed(2)} 0 0 1 ${trx.toFixed(2)},${tryy.toFixed(2)} ` +
      `L${brx.toFixed(2)},${bry.toFixed(2)} ` +
      `A${w.toFixed(2)},${w.toFixed(2)} 0 0 1 ${blx.toFixed(2)},${bly.toFixed(2)} Z" ` +
      `fill="${color}"/>`
    );
  }
  return `<g>${parts.join("")}</g>`;
}

/* ---------------------------------------------------------------
 * WORDMARK — "Claude" in a refined serif (echoes Claude's serif voice)
 * ------------------------------------------------------------- */
function wordmark(x, y, size, color) {
  return (
    `<text x="${x}" y="${y}" font-family="Georgia, 'Times New Roman', serif" ` +
    `font-size="${size}" font-weight="500" letter-spacing="${(size * -0.01).toFixed(1)}" ` +
    `fill="${color}">Claude</text>`
  );
}

/* ---------------------------------------------------------------
 * 1) STANDALONE LOGO
 * ------------------------------------------------------------- */
function buildLogo() {
  const W = 900, H = 360;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.cream}"/>
  ${sparkMark(180, 180, 110, C.clay)}
  ${wordmark(330, 222, 150, C.ink)}
</svg>
`;
}

/* ---------------------------------------------------------------
 * 2) BRAND BOARD — one polished sheet
 * ------------------------------------------------------------- */
function swatch(x, y, w, h, hex, name, fg) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${hex}" stroke="${C.sand}" stroke-width="1"/>
    <text x="${x + 18}" y="${y + h - 40}" font-family="Georgia, serif" font-size="22" fill="${fg}">${name}</text>
    <text x="${x + 18}" y="${y + h - 16}" font-family="'Courier New', monospace" font-size="16" fill="${fg}" opacity="0.7">${hex.toUpperCase()}</text>`;
}

function buildBoard() {
  const W = 1600, H = 1040;
  const swW = 220, swH = 180, swY = 470, gap = 18;
  let sx = 90;
  const swatches = [
    swatch(sx, swY, swW, swH, C.clay,  "Clay",  C.paper),                 sx += swW + gap,
    swatch(sx, swY, swW, swH, C.clayDk,"Deep Clay", C.paper),             sx += swW + gap,
    swatch(sx, swY, swW, swH, C.cream, "Cream", C.ink),                   sx += swW + gap,
    swatch(sx, swY, swW, swH, C.paper, "Paper", C.ink),                   sx += swW + gap,
    swatch(sx, swY, swW, swH, C.slate, "Slate", C.paper),                 sx += swW + gap,
    swatch(sx, swY, swW, swH, C.ink,   "Ink",   C.paper),
  ].join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="warm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.clay}"/>
      <stop offset="1" stop-color="${C.clayDk}"/>
    </linearGradient>
  </defs>

  <!-- canvas -->
  <rect width="${W}" height="${H}" fill="${C.cream}"/>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="28" fill="${C.paper}" stroke="${C.sand}" stroke-width="2"/>

  <!-- header: logo -->
  ${sparkMark(170, 175, 80, C.clay)}
  ${wordmark(280, 205, 110, C.ink)}
  <text x="284" y="250" font-family="'Helvetica Neue', Arial, sans-serif" font-size="24" letter-spacing="6" fill="${C.slate}">BRAND&#160;&#160;BOARD</text>

  <!-- tagline / mark in a clay chip -->
  <rect x="1090" y="110" width="420" height="150" rx="20" fill="url(#warm)"/>
  ${sparkMark(1175, 185, 46, C.paper)}
  <text x="1240" y="178" font-family="Georgia, serif" font-size="34" fill="${C.paper}">Designed by</text>
  <text x="1240" y="222" font-family="Georgia, serif" font-size="34" font-weight="600" fill="${C.paper}">Claude</text>

  <!-- divider -->
  <line x1="90" y1="320" x2="${W - 90}" y2="320" stroke="${C.sand}" stroke-width="2"/>

  <!-- section: palette -->
  <text x="90" y="400" font-family="'Helvetica Neue', Arial, sans-serif" font-size="22" letter-spacing="4" fill="${C.slate}">01 — COLOUR PALETTE</text>
  ${swatches}

  <!-- section: typography -->
  <text x="90" y="740" font-family="'Helvetica Neue', Arial, sans-serif" font-size="22" letter-spacing="4" fill="${C.slate}">02 — TYPOGRAPHY</text>
  <text x="90" y="820" font-family="Georgia, 'Times New Roman', serif" font-size="64" fill="${C.ink}">Aa — Clear, warm, human.</text>
  <text x="90" y="868" font-family="Georgia, serif" font-size="26" fill="${C.slate}">Serif display for headlines · the considered, editorial voice.</text>
  <text x="90" y="922" font-family="'Helvetica Neue', Arial, sans-serif" font-size="26" fill="${C.slate}">Neue / Arial for body &amp; UI · clean, legible, modern.</text>
  <text x="90" y="966" font-family="'Courier New', monospace" font-size="20" fill="${C.slate}">Monospace for code &amp; values · 0123456789 #D97757</text>

  <!-- logo lockup variants (right column) -->
  <text x="980" y="740" font-family="'Helvetica Neue', Arial, sans-serif" font-size="22" letter-spacing="4" fill="${C.slate}">03 — LOGO USAGE</text>
  <!-- on cream -->
  <rect x="980" y="770" width="240" height="190" rx="16" fill="${C.cream}" stroke="${C.sand}" stroke-width="1"/>
  ${sparkMark(1100, 845, 48, C.clay)}
  <text x="1100" y="935" text-anchor="middle" font-family="Georgia, serif" font-size="40" fill="${C.ink}">Claude</text>
  <!-- on ink -->
  <rect x="1240" y="770" width="240" height="190" rx="16" fill="${C.ink}"/>
  ${sparkMark(1360, 845, 48, C.clay)}
  <text x="1360" y="935" text-anchor="middle" font-family="Georgia, serif" font-size="40" fill="${C.paper}">Claude</text>

  <!-- footer -->
  <text x="${W - 90}" y="${H - 70}" text-anchor="end" font-family="'Courier New', monospace" font-size="16" fill="${C.slate}" opacity="0.6">claude-brand · v1.0</text>
</svg>
`;
}

/* ---------------------------------------------------------------
 * WRITE
 * ------------------------------------------------------------- */
const outDir = __dirname;
fs.writeFileSync(path.join(outDir, "claude-logo.svg"), buildLogo());
fs.writeFileSync(path.join(outDir, "claude-brand-board.svg"), buildBoard());
console.log("Wrote claude-logo.svg and claude-brand-board.svg");
