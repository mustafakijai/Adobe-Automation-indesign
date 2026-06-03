/**
 * spark.js — the radial "spark" mark, computed geometry.
 * A burst of rounded petals (alternating long/short) radiating from a centre.
 */
function sparkMark(cx, cy, R, color, spokes = 11) {
  const parts = [];
  for (let i = 0; i < spokes; i++) {
    const ang = (i / spokes) * Math.PI * 2 - Math.PI / 2;
    const long = i % 2 === 0;
    const len = long ? R : R * 0.62;
    const w = long ? R * 0.13 : R * 0.105;
    const inner = R * 0.06;

    const ix = cx + Math.cos(ang) * inner;
    const iy = cy + Math.sin(ang) * inner;
    const ox = cx + Math.cos(ang) * len;
    const oy = cy + Math.sin(ang) * len;
    const px = Math.cos(ang + Math.PI / 2);
    const py = Math.sin(ang + Math.PI / 2);

    const tipR = w * 0.9;
    const blx = ix + px * w, bly = iy + py * w;
    const brx = ix - px * w, bry = iy - py * w;
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

module.exports = { sparkMark };
