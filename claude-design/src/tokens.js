/**
 * tokens.js — resolve a project config into design tokens.
 * Anything omitted in the project config falls back to these defaults
 * (which happen to be the Claude palette).
 */
const DEFAULTS = {
  name: "Claude",
  tagline: "Clear, warm, human.",
  colors: {
    primary: "#D97757",     // signature clay/coral
    primaryDark: "#C15F3C",
    bg: "#F0EEE6",          // cream canvas
    surface: "#FAF9F5",     // paper
    text: "#141413",        // ink
    muted: "#3D3D3A",       // slate
    onPrimary: "#FAF9F5",   // text on top of primary
  },
  fonts: {
    display: "Georgia, 'Times New Roman', serif",
    body: "'Helvetica Neue', Arial, sans-serif",
    mono: "'Courier New', monospace",
  },
  deck: { slides: [] },
};

function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }

function merge(base, over) {
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const k in over) {
    if (isObj(base[k]) && isObj(over[k])) out[k] = merge(base[k], over[k]);
    else out[k] = over[k];
  }
  return out;
}

function resolve(config = {}) {
  const t = merge(DEFAULTS, config);
  // convenience aliases
  t.c = t.colors;
  t.f = t.fonts;
  return t;
}

module.exports = { resolve, DEFAULTS };
