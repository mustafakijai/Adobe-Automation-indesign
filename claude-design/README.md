# Claude Design — config-driven design generator

A small "Claude Design"–style engine you can run on **any** project. Describe a
brand in one JSON file, run one command, and get a full **brand kit + pitch
deck** as editable vector (SVG) plus PNG previews. A Claude design, by Claude.

> This is a *local, code-based* generator — not Anthropic's hosted product at
> [claude.ai/design](https://claude.ai/design). It gives you the same idea
> (prompt/config → polished visuals) that you own and can run anywhere.

## Quick start

```bash
cd claude-design
node build.js                  # builds the default "Claude" project
node build.js config/acme.json  # builds any project config

# optional: PNG previews alongside the SVGs
npm i @resvg/resvg-js
node build.js
```

Output lands in `out/<project-name>/`:

```
out/claude/
  brand/   logo.svg/.png, brand-board.svg/.png
  deck/    slide-01-title … slide-NN-<type>  (.svg/.png)
```

## Configure a project

Every field is optional — anything you omit falls back to the Claude palette.

```jsonc
{
  "name": "Northwind",
  "tagline": "Logistics, simplified.",
  "colors": {
    "primary": "#2F6F8F", "primaryDark": "#1F4E66",
    "bg": "#EEF2F4", "surface": "#FBFCFD",
    "text": "#11212B", "muted": "#3C5462", "onPrimary": "#FBFCFD"
  },
  "fonts": {
    "display": "Georgia, serif",
    "body": "'Helvetica Neue', Arial, sans-serif",
    "mono": "'Courier New', monospace"
  },
  "deck": { "slides": [ /* see slide types below */ ] }
}
```

### Slide types

| `type`    | Fields |
|-----------|--------|
| `title`   | `title`, `subtitle` |
| `section` | `kicker` (e.g. "01"), `title` |
| `content` | `title`, `bullets[]` (up to 6, auto-wrapped) |
| `stat`    | `value` (big number), `label` |
| `quote`   | `quote`, `by` |
| `closing` | `title`, `contact` |

Unknown types fall back to `content`.

## Why SVG

Vector output scales to any size and opens directly in Adobe Illustrator,
Figma, or a browser — perfect for brand work and editing. PNGs are generated
only for quick previewing.

## Project layout

```
claude-design/
  build.js          CLI entry — reads a config, writes assets
  src/
    tokens.js       config → resolved design tokens (with defaults)
    spark.js        the radial "spark" mark (computed geometry)
    svg.js          text escaping + word-wrap helpers
    brand.js        logo + brand board
    deck.js         pitch-deck slide builders
  config/           one JSON per project (claude.json, acme.json)
  out/              generated assets (per project)
```

To restyle every asset, change a few values in `colors` and re-run. To extend,
add a builder in `src/deck.js` and register it in `BUILDERS`.
