/**
 * svg.js — small SVG text helpers.
 */
function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Greedy word-wrap by approximate character budget. */
function wrap(text, maxChars) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if (!line) line = w;
    else if ((line + " " + w).length <= maxChars) line += " " + w;
    else { lines.push(line); line = w; }
  }
  if (line) lines.push(line);
  return lines;
}

/** Render wrapped text as a stack of <tspan> lines anchored at (x, y). */
function multiline(text, x, y, lineH, maxChars, attrs = "") {
  const lines = wrap(text, maxChars);
  const tspans = lines
    .map((ln, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineH}">${esc(ln)}</tspan>`)
    .join("");
  return { svg: `<text x="${x}" y="${y}" ${attrs}>${tspans}</text>`, count: lines.length };
}

module.exports = { esc, wrap, multiline };
