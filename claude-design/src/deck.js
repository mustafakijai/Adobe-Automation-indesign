/**
 * deck.js — pitch-deck slides from tokens (16:9, 1920×1080).
 * Slide types: title | section | content | stat | quote | closing
 */
const { sparkMark } = require("./spark");
const { esc, multiline } = require("./svg");

const W = 1920, H = 1080, M = 130;

function footer(t, page, total, onDark) {
  const c = t.c, f = t.f;
  const fg = onDark ? c.surface : c.muted;
  return `
    ${sparkMark(M, H - 78, 16, c.primary)}
    <text x="${M + 34}" y="${H - 72}" font-family="${f.body}" font-size="22" fill="${fg}" opacity="0.85">${esc(t.name)}</text>
    <text x="${W - M}" y="${H - 72}" text-anchor="end" font-family="${f.mono}" font-size="20" fill="${fg}" opacity="0.6">${page} / ${total}</text>`;
}

function titleSlide(t, s, page, total) {
  const c = t.c, f = t.f;
  return wrapSvg(`
    <rect width="${W}" height="${H}" fill="${c.bg}"/>
    ${sparkMark(M + 60, 300, 80, c.primary)}
    <rect x="${M}" y="430" width="120" height="8" rx="4" fill="${c.primary}"/>
    <text x="${M}" y="600" font-family="${f.display}" font-size="150" font-weight="500" fill="${c.text}">${esc(s.title || t.name)}</text>
    ${multiline(s.subtitle || t.tagline, M, 690, 58, 52, `font-family="${f.body}" font-size="46" fill="${c.muted}"`).svg}
    ${footer(t, page, total, false)}`);
}

function sectionSlide(t, s, page, total) {
  const c = t.c, f = t.f;
  return wrapSvg(`
    <rect width="${W}" height="${H}" fill="${c.primary}"/>
    <text x="${W - M}" y="${H - 60}" text-anchor="end" font-family="${f.display}" font-size="640" font-weight="700" fill="${c.primaryDark}" opacity="0.45">${esc(s.kicker || "")}</text>
    <text x="${M}" y="360" font-family="${f.body}" font-size="28" letter-spacing="8" fill="${c.onPrimary}" opacity="0.8">${esc((s.kicker ? s.kicker + " — " : "") + "SECTION")}</text>
    ${multiline(s.title || "", M, 560, 130, 22, `font-family="${f.display}" font-size="120" font-weight="600" fill="${c.onPrimary}"`).svg}`);
}

function contentSlide(t, s, page, total) {
  const c = t.c, f = t.f;
  const bullets = (s.bullets || []).slice(0, 6);
  let y = 420;
  const rows = bullets.map((b) => {
    const ml = multiline(b, M + 56, y + 8, 56, 56, `font-family="${f.body}" font-size="40" fill="${c.text}"`);
    const dot = `${sparkMark(M + 18, y - 6, 16, c.primary)}`;
    y += 56 * ml.count + 44;
    return dot + ml.svg;
  }).join("");
  return wrapSvg(`
    <rect width="${W}" height="${H}" fill="${c.surface}"/>
    <text x="${M}" y="270" font-family="${f.display}" font-size="84" font-weight="500" fill="${c.text}">${esc(s.title || "")}</text>
    <rect x="${M}" y="310" width="160" height="8" rx="4" fill="${c.primary}"/>
    ${rows}
    ${footer(t, page, total, false)}`);
}

function statSlide(t, s, page, total) {
  const c = t.c, f = t.f;
  return wrapSvg(`
    <rect width="${W}" height="${H}" fill="${c.bg}"/>
    <text x="${W / 2}" y="${H / 2 + 40}" text-anchor="middle" font-family="${f.display}" font-size="300" font-weight="700" fill="${c.primary}">${esc(s.value || "")}</text>
    <text x="${W / 2}" y="${H / 2 + 180}" text-anchor="middle" font-family="${f.body}" font-size="48" fill="${c.muted}">${esc(s.label || "")}</text>
    ${footer(t, page, total, false)}`);
}

function quoteSlide(t, s, page, total) {
  const c = t.c, f = t.f;
  return wrapSvg(`
    <rect width="${W}" height="${H}" fill="${c.text}"/>
    <text x="${M - 10}" y="420" font-family="${f.display}" font-size="280" fill="${c.primary}" opacity="0.5">&#8220;</text>
    ${multiline(s.quote || "", M, 500, 96, 36, `font-family="${f.display}" font-size="80" fill="${c.surface}"`).svg}
    <text x="${M}" y="${H - 200}" font-family="${f.body}" font-size="34" fill="${c.primary}">— ${esc(s.by || "")}</text>
    ${footer(t, page, total, true)}`);
}

function closingSlide(t, s, page, total) {
  const c = t.c, f = t.f;
  return wrapSvg(`
    <defs><linearGradient id="cw" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.primary}"/><stop offset="1" stop-color="${c.primaryDark}"/>
    </linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#cw)"/>
    ${sparkMark(W / 2, 360, 90, c.onPrimary)}
    <text x="${W / 2}" y="640" text-anchor="middle" font-family="${f.display}" font-size="120" font-weight="600" fill="${c.onPrimary}">${esc(s.title || "Thank you.")}</text>
    <text x="${W / 2}" y="730" text-anchor="middle" font-family="${f.mono}" font-size="40" fill="${c.onPrimary}" opacity="0.9">${esc(s.contact || "")}</text>`);
}

function wrapSvg(inner) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${inner}
</svg>
`;
}

const BUILDERS = {
  title: titleSlide, section: sectionSlide, content: contentSlide,
  stat: statSlide, quote: quoteSlide, closing: closingSlide,
};

function deck(t) {
  const slides = (t.deck && t.deck.slides) || [];
  const total = slides.length;
  return slides.map((s, i) => {
    const build = BUILDERS[s.type] || contentSlide;
    return {
      name: `slide-${String(i + 1).padStart(2, "0")}-${s.type || "content"}`,
      svg: build(t, s, i + 1, total),
    };
  });
}

module.exports = { deck };
