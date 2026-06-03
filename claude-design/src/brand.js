/**
 * brand.js — brand-kit assets from tokens: standalone logo + brand board.
 */
const { sparkMark } = require("./spark");
const { esc } = require("./svg");

function logo(t) {
  const W = 900, H = 360, c = t.c, f = t.f;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  ${sparkMark(180, 180, 110, c.primary)}
  <text x="330" y="222" font-family="${f.display}" font-size="150" font-weight="500" fill="${c.text}">${esc(t.name)}</text>
</svg>
`;
}

function swatch(x, y, w, h, hex, name, fg, c) {
  return `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${hex}" stroke="${c.bg}" stroke-width="1"/>
    <text x="${x + 18}" y="${y + h - 40}" font-family="Georgia, serif" font-size="22" fill="${fg}">${esc(name)}</text>
    <text x="${x + 18}" y="${y + h - 16}" font-family="monospace" font-size="16" fill="${fg}" opacity="0.7">${hex.toUpperCase()}</text>`;
}

function board(t) {
  const W = 1600, H = 1040, c = t.c, f = t.f;
  const swW = 220, swH = 180, swY = 470, gap = 18;
  let sx = 90;
  const defs = [
    [c.primary, "Primary", c.onPrimary],
    [c.primaryDark, "Primary Dark", c.onPrimary],
    [c.bg, "Background", c.text],
    [c.surface, "Surface", c.text],
    [c.muted, "Muted", c.onPrimary],
    [c.text, "Text", c.onPrimary],
  ];
  const swatches = defs.map(([hex, name, fg]) => {
    const s = swatch(sx, swY, swW, swH, hex, name, fg, c);
    sx += swW + gap;
    return s;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="warm" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.primary}"/>
      <stop offset="1" stop-color="${c.primaryDark}"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${c.bg}"/>
  <rect x="40" y="40" width="${W - 80}" height="${H - 80}" rx="28" fill="${c.surface}" stroke="${c.bg}" stroke-width="2"/>

  ${sparkMark(170, 175, 80, c.primary)}
  <text x="280" y="205" font-family="${f.display}" font-size="110" font-weight="500" fill="${c.text}">${esc(t.name)}</text>
  <text x="284" y="250" font-family="${f.body}" font-size="24" letter-spacing="6" fill="${c.muted}">BRAND&#160;&#160;BOARD</text>

  <rect x="1090" y="110" width="420" height="150" rx="20" fill="url(#warm)"/>
  ${sparkMark(1175, 185, 46, c.onPrimary)}
  <text x="1240" y="178" font-family="${f.display}" font-size="34" fill="${c.onPrimary}">Designed by</text>
  <text x="1240" y="222" font-family="${f.display}" font-size="34" font-weight="600" fill="${c.onPrimary}">Claude</text>

  <line x1="90" y1="320" x2="${W - 90}" y2="320" stroke="${c.bg}" stroke-width="2"/>

  <text x="90" y="400" font-family="${f.body}" font-size="22" letter-spacing="4" fill="${c.muted}">01 — COLOUR PALETTE</text>
  ${swatches}

  <text x="90" y="740" font-family="${f.body}" font-size="22" letter-spacing="4" fill="${c.muted}">02 — TYPOGRAPHY</text>
  <text x="90" y="820" font-family="${f.display}" font-size="64" fill="${c.text}">Aa — ${esc(t.tagline)}</text>
  <text x="90" y="868" font-family="${f.display}" font-size="26" fill="${c.muted}">Serif display for headlines · the considered, editorial voice.</text>
  <text x="90" y="922" font-family="${f.body}" font-size="26" fill="${c.muted}">Sans for body &amp; UI · clean, legible, modern.</text>
  <text x="90" y="966" font-family="${f.mono}" font-size="20" fill="${c.muted}">Mono for code &amp; values · 0123456789 ${c.primary.toUpperCase()}</text>

  <text x="980" y="740" font-family="${f.body}" font-size="22" letter-spacing="4" fill="${c.muted}">03 — LOGO USAGE</text>
  <rect x="980" y="770" width="240" height="190" rx="16" fill="${c.bg}" stroke="${c.surface}" stroke-width="1"/>
  ${sparkMark(1100, 845, 48, c.primary)}
  <text x="1100" y="935" text-anchor="middle" font-family="${f.display}" font-size="40" fill="${c.text}">${esc(t.name)}</text>
  <rect x="1240" y="770" width="240" height="190" rx="16" fill="${c.text}"/>
  ${sparkMark(1360, 845, 48, c.primary)}
  <text x="1360" y="935" text-anchor="middle" font-family="${f.display}" font-size="40" fill="${c.surface}">${esc(t.name)}</text>

  <text x="${W - 90}" y="${H - 70}" text-anchor="end" font-family="${f.mono}" font-size="16" fill="${c.muted}" opacity="0.6">${esc(t.name.toLowerCase())} · brand v1.0</text>
</svg>
`;
}

module.exports = { logo, board };
