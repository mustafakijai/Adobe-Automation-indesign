# Claude — Brand Design

A Claude design, by Claude. A small, self-contained brand kit you can drop
straight into brand work — fully editable vector, no proprietary fonts required.

## Files

| File | What it is |
|------|------------|
| `claude-brand-board.svg` / `.png` | One-sheet brand board: logo, colour palette, typography, logo usage |
| `claude-logo.svg` / `.png` | The standalone spark mark + "Claude" wordmark |
| `generate.js` | Node script that builds the SVGs (edit tokens here, re-run) |

## Palette

| Name | Hex | Use |
|------|-----|-----|
| Clay | `#D97757` | Primary — the signature warm coral |
| Deep Clay | `#C15F3C` | Accents, hover, gradients |
| Cream | `#F0EEE6` | Canvas / background |
| Paper | `#FAF9F5` | Cards, light surfaces |
| Slate | `#3D3D3A` | Secondary text |
| Ink | `#141413` | Headlines, primary text |

## Typography

- **Display / headlines** — serif (Georgia stack) for a warm, editorial voice
- **Body / UI** — Helvetica Neue / Arial, clean and legible
- **Code / values** — monospace

## Regenerate

```bash
cd claude-brand
node generate.js          # writes the SVGs (tokens live at top of generate.js)
npm i @resvg/resvg-js     # one-time, only if you want PNG previews
node render.js            # writes the PNGs
```

The SVGs open directly in Adobe Illustrator, Figma, or any browser, and scale
to any size without quality loss.
