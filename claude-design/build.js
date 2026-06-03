#!/usr/bin/env node
/**
 * build.js — Claude Design generator CLI.
 *
 *   node build.js                       # uses config/claude.json
 *   node build.js config/acme.json      # any project config
 *
 * Outputs SVGs (always) and PNGs (if @resvg/resvg-js is installed) to:
 *   out/<project-name>/
 */
const fs = require("fs");
const path = require("path");
const { resolve } = require("./src/tokens");
const brand = require("./src/brand");
const { deck } = require("./src/deck");

const configPath = process.argv[2] || path.join(__dirname, "config", "claude.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const t = resolve(config);

const slug = (t.name || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const outDir = path.join(__dirname, "out", slug);
fs.mkdirSync(path.join(outDir, "brand"), { recursive: true });
fs.mkdirSync(path.join(outDir, "deck"), { recursive: true });

// --- collect assets ---
const assets = [
  { file: path.join(outDir, "brand", "logo.svg"), svg: brand.logo(t) },
  { file: path.join(outDir, "brand", "brand-board.svg"), svg: brand.board(t) },
  ...deck(t).map((s) => ({ file: path.join(outDir, "deck", `${s.name}.svg`), svg: s.svg })),
];

// --- optional PNG renderer ---
let Resvg = null;
try { Resvg = require("@resvg/resvg-js").Resvg; } catch (_) {}

function renderPng(svg, width) {
  const r = new Resvg(svg, { fitTo: { mode: "width", value: width } });
  return r.render().asPng();
}

let pngCount = 0;
for (const a of assets) {
  fs.writeFileSync(a.file, a.svg);
  if (Resvg) {
    const isBoard = a.file.endsWith("brand-board.svg");
    const width = isBoard ? 1600 : (a.file.includes(`${path.sep}deck${path.sep}`) ? 1920 : 900);
    fs.writeFileSync(a.file.replace(/\.svg$/, ".png"), renderPng(a.svg, width));
    pngCount++;
  }
}

console.log(`✓ ${t.name}: wrote ${assets.length} SVG${Resvg ? ` + ${pngCount} PNG` : ""} → ${path.relative(process.cwd(), outDir)}`);
if (!Resvg) console.log("  (PNG previews skipped — run `npm i @resvg/resvg-js` to enable)");
