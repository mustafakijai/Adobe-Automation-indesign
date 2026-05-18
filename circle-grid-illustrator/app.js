/* Circle Grid Illustrator
 * A web app for designing illustrations on a circle (and shape) grid.
 * Features: paint/erase/fill/line/rect/ring tools, symmetry (X/Y/diag/radial),
 * brush size, cell shapes (circle, ring, square, diamond, hexagon, triangle, star),
 * solid/gradient/rainbow/palette color modes, presets, effects (glow, rotation, scatter, animation),
 * undo/redo, save/load JSON, export PNG/SVG.
 */

(() => {
  // ---------- State ----------
  const state = {
    cols: 32,
    rows: 32,
    cellPx: 22,
    gap: 2,
    bg: "#0e1116",
    showGrid: true,
    showGuides: false,
    tool: "paint",
    brushSize: 1,
    shape: "circle",
    fillPct: 85,
    primary: "#7ee8fa",
    secondary: "#eec0c6",
    activeSwatch: -1,
    swatches: ["#7ee8fa","#b388ff","#ffb86b","#ff7a8a","#7af0a0","#f7c948","#56a3ff","#ff6dd0"],
    colorMode: "solid",
    symX: false, symY: false, symDiag: false, symRadial: false,
    radialFolds: 6,
    fxGlow: 0, fxRot: 0, fxScatter: 0, fxAnim: "none",
    zoom: 1,
    pan: { x: 0, y: 0 },
    // grid data: 2D array of cells { c: color, s: shape, r: rotation deg, sc: scale 0-1, sx: scatter px, sy: scatter px }
    grid: null,
    history: [],
    historyIdx: -1,
    historyLimit: 80,
    isDrawing: false,
    lastCell: null,
    panning: false,
    panStart: null,
  };

  // ---------- DOM ----------
  const $ = (id) => document.getElementById(id);
  const host = $("canvasHost");
  const board = $("board");
  const overlay = $("overlay");
  const ctx = board.getContext("2d");
  const octx = overlay.getContext("2d");

  // ---------- Helpers ----------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  function hexToRgb(hex) {
    const m = hex.replace("#", "");
    const v = m.length === 3 ? m.split("").map(c => c + c).join("") : m;
    const n = parseInt(v, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function rgbToHex(r, g, b) {
    const h = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
    return "#" + h(r) + h(g) + h(b);
  }
  function lerpColor(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return rgbToHex(lerp(A.r, B.r, t), lerp(A.g, B.g, t), lerp(A.b, B.b, t));
  }
  function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r=0,g=0,b=0;
    if (h < 60) { r=c; g=x; }
    else if (h < 120) { r=x; g=c; }
    else if (h < 180) { g=c; b=x; }
    else if (h < 240) { g=x; b=c; }
    else if (h < 300) { r=x; b=c; }
    else { r=c; b=x; }
    return rgbToHex((r+m)*255, (g+m)*255, (b+m)*255);
  }

  function makeGrid(cols, rows) {
    const g = new Array(rows);
    for (let r = 0; r < rows; r++) {
      g[r] = new Array(cols).fill(null);
    }
    return g;
  }

  function cellAt(c, r) {
    if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) return null;
    return state.grid[r][c];
  }
  function setCell(c, r, val) {
    if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) return;
    state.grid[r][c] = val;
  }

  // ---------- History ----------
  function snapshot() {
    const snap = JSON.stringify(state.grid);
    // drop redo branch
    state.history = state.history.slice(0, state.historyIdx + 1);
    state.history.push(snap);
    if (state.history.length > state.historyLimit) state.history.shift();
    state.historyIdx = state.history.length - 1;
  }
  function undo() {
    if (state.historyIdx <= 0) return;
    state.historyIdx--;
    state.grid = JSON.parse(state.history[state.historyIdx]);
    redraw();
  }
  function redo() {
    if (state.historyIdx >= state.history.length - 1) return;
    state.historyIdx++;
    state.grid = JSON.parse(state.history[state.historyIdx]);
    redraw();
  }

  // ---------- Canvas sizing ----------
  function fitCanvas() {
    const cellTotal = state.cellPx + state.gap;
    const w = state.cols * cellTotal - state.gap;
    const h = state.rows * cellTotal - state.gap;
    const padding = 18;
    const totalW = w + padding * 2;
    const totalH = h + padding * 2;
    const dpr = window.devicePixelRatio || 1;

    board.width = totalW * dpr;
    board.height = totalH * dpr;
    board.style.width = totalW + "px";
    board.style.height = totalH + "px";
    overlay.width = board.width;
    overlay.height = board.height;
    overlay.style.width = board.style.width;
    overlay.style.height = board.style.height;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    octx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // center
    const left = Math.max(0, (host.clientWidth - totalW) / 2);
    const top = Math.max(0, (host.clientHeight - totalH) / 2);
    board.style.left = left + "px";
    board.style.top = top + "px";
    overlay.style.left = left + "px";
    overlay.style.top = top + "px";
  }

  function cellOrigin(c, r) {
    const padding = 18;
    const cellTotal = state.cellPx + state.gap;
    return {
      x: padding + c * cellTotal,
      y: padding + r * cellTotal,
    };
  }
  function cellCenter(c, r) {
    const o = cellOrigin(c, r);
    return { x: o.x + state.cellPx / 2, y: o.y + state.cellPx / 2 };
  }
  function pointToCell(px, py) {
    const padding = 18;
    const cellTotal = state.cellPx + state.gap;
    const c = Math.floor((px - padding) / cellTotal);
    const r = Math.floor((py - padding) / cellTotal);
    if (c < 0 || r < 0 || c >= state.cols || r >= state.rows) return null;
    return { c, r };
  }

  // ---------- Drawing ----------
  function drawShape(ctx2, cx, cy, size, shape, color, fillPct, rot, glow) {
    const r = size * (fillPct / 100) / 2;
    ctx2.save();
    ctx2.translate(cx, cy);
    ctx2.rotate((rot || 0) * Math.PI / 180);
    if (glow > 0) {
      ctx2.shadowBlur = glow;
      ctx2.shadowColor = color;
    }
    ctx2.fillStyle = color;
    ctx2.strokeStyle = color;
    ctx2.lineWidth = Math.max(1, r * 0.25);

    switch (shape) {
      case "circle":
        ctx2.beginPath();
        ctx2.arc(0, 0, r, 0, Math.PI * 2);
        ctx2.fill();
        break;
      case "ring":
        ctx2.beginPath();
        ctx2.arc(0, 0, r, 0, Math.PI * 2);
        ctx2.lineWidth = Math.max(1, r * 0.35);
        ctx2.stroke();
        break;
      case "square":
        ctx2.fillRect(-r, -r, r * 2, r * 2);
        break;
      case "diamond":
        ctx2.beginPath();
        ctx2.moveTo(0, -r);
        ctx2.lineTo(r, 0);
        ctx2.lineTo(0, r);
        ctx2.lineTo(-r, 0);
        ctx2.closePath();
        ctx2.fill();
        break;
      case "hexagon": {
        ctx2.beginPath();
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 2;
          const x = Math.cos(a) * r, y = Math.sin(a) * r;
          if (i === 0) ctx2.moveTo(x, y); else ctx2.lineTo(x, y);
        }
        ctx2.closePath();
        ctx2.fill();
        break;
      }
      case "triangle": {
        ctx2.beginPath();
        for (let i = 0; i < 3; i++) {
          const a = (Math.PI * 2 / 3) * i - Math.PI / 2;
          const x = Math.cos(a) * r, y = Math.sin(a) * r;
          if (i === 0) ctx2.moveTo(x, y); else ctx2.lineTo(x, y);
        }
        ctx2.closePath();
        ctx2.fill();
        break;
      }
      case "star": {
        const outer = r, inner = r * 0.45;
        ctx2.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = (Math.PI / 5) * i - Math.PI / 2;
          const rad = i % 2 === 0 ? outer : inner;
          const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
          if (i === 0) ctx2.moveTo(x, y); else ctx2.lineTo(x, y);
        }
        ctx2.closePath();
        ctx2.fill();
        break;
      }
    }
    ctx2.restore();
  }

  function drawGridLines() {
    if (!state.showGrid) return;
    const cellTotal = state.cellPx + state.gap;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let c = 0; c <= state.cols; c++) {
      const o = cellOrigin(c, 0);
      ctx.moveTo(o.x - state.gap / 2 + 0.5, 18);
      ctx.lineTo(o.x - state.gap / 2 + 0.5, 18 + state.rows * cellTotal - state.gap);
    }
    for (let r = 0; r <= state.rows; r++) {
      const o = cellOrigin(0, r);
      ctx.moveTo(18, o.y - state.gap / 2 + 0.5);
      ctx.lineTo(18 + state.cols * cellTotal - state.gap, o.y - state.gap / 2 + 0.5);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawGuides() {
    if (!state.showGuides) return;
    ctx.save();
    ctx.strokeStyle = "rgba(126,232,250,0.25)";
    ctx.setLineDash([4, 4]);
    const padding = 18;
    const cellTotal = state.cellPx + state.gap;
    const w = state.cols * cellTotal - state.gap;
    const h = state.rows * cellTotal - state.gap;
    // center cross
    ctx.beginPath();
    ctx.moveTo(padding + w / 2, padding);
    ctx.lineTo(padding + w / 2, padding + h);
    ctx.moveTo(padding, padding + h / 2);
    ctx.lineTo(padding + w, padding + h / 2);
    ctx.stroke();
    // diagonals
    if (state.symDiag) {
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding + w, padding + h);
      ctx.moveTo(padding + w, padding);
      ctx.lineTo(padding, padding + h);
      ctx.stroke();
    }
    ctx.restore();
  }

  let animT = 0;
  function redraw() {
    const padding = 18;
    const cellTotal = state.cellPx + state.gap;
    const w = state.cols * cellTotal - state.gap;
    const h = state.rows * cellTotal - state.gap;

    ctx.save();
    ctx.fillStyle = state.bg;
    ctx.fillRect(0, 0, board.width, board.height);
    // background panel for working area
    ctx.fillStyle = state.bg;
    ctx.fillRect(padding - 6, padding - 6, w + 12, h + 12);
    ctx.restore();

    drawGridLines();

    // draw cells
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = state.grid[r][c];
        if (!cell) continue;
        let { c: color, s: shape, r: rot = 0, sc = 1, sx = 0, sy = 0 } = cell;
        let glow = state.fxGlow;

        // animation
        if (state.fxAnim !== "none") {
          if (state.fxAnim === "pulse") {
            sc = sc * (0.85 + 0.15 * Math.sin(animT * 2 + (c + r) * 0.3));
          } else if (state.fxAnim === "wave") {
            sy = sy + Math.sin(animT * 2 + c * 0.5) * 2;
          } else if (state.fxAnim === "rotate") {
            rot = (rot + animT * 30) % 360;
          } else if (state.fxAnim === "rainbow") {
            color = hslToHex(((c * 8 + r * 8 + animT * 60) % 360), 80, 60);
          }
        }

        const center = cellCenter(c, r);
        const size = state.cellPx * sc;
        drawShape(ctx, center.x + sx, center.y + sy, size, shape, color, state.fillPct, rot, glow);
      }
    }

    drawGuides();
    updateStatus();
  }

  // ---------- Symmetry ----------
  function symPoints(c, r) {
    const pts = new Set();
    const add = (cc, rr) => pts.add(rr * 1000 + cc);
    add(c, r);
    const lastC = state.cols - 1, lastR = state.rows - 1;
    if (state.symX) add(lastC - c, r);
    if (state.symY) add(c, lastR - r);
    if (state.symX && state.symY) add(lastC - c, lastR - r);
    if (state.symDiag && state.cols === state.rows) {
      add(r, c);
      add(lastC - r, lastR - c);
    }
    if (state.symRadial) {
      const folds = clamp(state.radialFolds, 2, 12);
      const cx = (state.cols - 1) / 2;
      const cy = (state.rows - 1) / 2;
      const dx = c - cx, dy = r - cy;
      for (let i = 1; i < folds; i++) {
        const a = (Math.PI * 2 / folds) * i;
        const nx = Math.round(cx + dx * Math.cos(a) - dy * Math.sin(a));
        const ny = Math.round(cy + dx * Math.sin(a) + dy * Math.cos(a));
        if (nx >= 0 && ny >= 0 && nx < state.cols && ny < state.rows) {
          add(nx, ny);
        }
      }
    }
    return [...pts].map(v => ({ c: v % 1000, r: Math.floor(v / 1000) }));
  }

  // ---------- Color pick ----------
  function getPaintColor(c, r) {
    if (state.colorMode === "solid") return state.primary;
    if (state.colorMode === "gradient") {
      const t = (c + r) / (state.cols + state.rows - 2);
      return lerpColor(state.primary, state.secondary, t);
    }
    if (state.colorMode === "rainbow") {
      const t = ((c * 8 + r * 8) % 360);
      return hslToHex(t, 75, 60);
    }
    if (state.colorMode === "palette") {
      if (!state.swatches.length) return state.primary;
      const i = (c + r) % state.swatches.length;
      return state.swatches[i];
    }
    return state.primary;
  }

  // ---------- Painting ----------
  function paintCellRaw(c, r, color) {
    const cell = {
      c: color,
      s: state.shape,
      r: state.fxRot,
      sc: 1,
      sx: state.fxScatter ? (Math.random() - 0.5) * state.fxScatter : 0,
      sy: state.fxScatter ? (Math.random() - 0.5) * state.fxScatter : 0,
    };
    setCell(c, r, cell);
  }

  function applyTo(c, r, tool) {
    if (tool === "erase") {
      symPoints(c, r).forEach(p => setCell(p.c, p.r, null));
      return;
    }
    if (tool === "paint") {
      const radius = state.brushSize;
      for (let dr = -radius + 1; dr < radius; dr++) {
        for (let dc = -radius + 1; dc < radius; dc++) {
          if (Math.hypot(dc, dr) >= radius) continue;
          const nc = c + dc, nr = r + dr;
          if (nc < 0 || nr < 0 || nc >= state.cols || nr >= state.rows) continue;
          const color = getPaintColor(nc, nr);
          symPoints(nc, nr).forEach(p => paintCellRaw(p.c, p.r, getPaintColor(p.c, p.r)));
        }
      }
    }
  }

  function bresenham(x0, y0, x1, y1, fn) {
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    let x = x0, y = y0;
    while (true) {
      fn(x, y);
      if (x === x1 && y === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
  }

  function floodFill(c, r, targetKey) {
    const stack = [{ c, r }];
    const seen = new Set();
    const key = (cc, rr) => rr * 1000 + cc;
    const getKey = (cc, rr) => {
      const cell = cellAt(cc, rr);
      return cell ? cell.c : null;
    };
    while (stack.length) {
      const { c: cc, r: rr } = stack.pop();
      if (cc < 0 || rr < 0 || cc >= state.cols || rr >= state.rows) continue;
      const k = key(cc, rr);
      if (seen.has(k)) continue;
      if (getKey(cc, rr) !== targetKey) continue;
      seen.add(k);
      const color = getPaintColor(cc, rr);
      symPoints(cc, rr).forEach(p => paintCellRaw(p.c, p.r, getPaintColor(p.c, p.r)));
      stack.push({ c: cc + 1, r: rr });
      stack.push({ c: cc - 1, r: rr });
      stack.push({ c: cc, r: rr + 1 });
      stack.push({ c: cc, r: rr - 1 });
    }
  }

  // ---------- Tool handlers ----------
  let shapeStart = null;

  function onPointerDown(e) {
    const pt = getPointer(e);
    if (state.panning) {
      state.panStart = pt;
      return;
    }
    const cell = pointToCell(pt.x, pt.y);
    if (!cell) return;
    state.isDrawing = true;
    state.lastCell = cell;

    if (state.tool === "paint" || state.tool === "erase") {
      applyTo(cell.c, cell.r, state.tool);
      redraw();
    } else if (state.tool === "fill") {
      const target = cellAt(cell.c, cell.r);
      floodFill(cell.c, cell.r, target ? target.c : null);
      redraw();
    } else if (state.tool === "picker") {
      const c = cellAt(cell.c, cell.r);
      if (c) {
        state.primary = c.c;
        $("primaryColor").value = c.c;
      }
    } else if (state.tool === "line" || state.tool === "rect" || state.tool === "circle") {
      shapeStart = cell;
    } else if (state.tool === "move") {
      shapeStart = cell;
    }
  }

  function onPointerMove(e) {
    const pt = getPointer(e);
    const cell = pointToCell(pt.x, pt.y);
    $("cursorInfo").textContent = cell ? `r${cell.r},c${cell.c}` : "—";

    if (state.panning && state.panStart && (e.buttons & 1)) {
      const dx = pt.x - state.panStart.x;
      const dy = pt.y - state.panStart.y;
      host.scrollLeft -= dx;
      host.scrollTop -= dy;
      state.panStart = pt;
      return;
    }

    if (!state.isDrawing || !cell) return;

    if (state.tool === "paint" || state.tool === "erase") {
      if (state.lastCell) {
        bresenham(state.lastCell.c, state.lastCell.r, cell.c, cell.r, (cc, rr) => {
          applyTo(cc, rr, state.tool);
        });
      }
      state.lastCell = cell;
      redraw();
    } else if (state.tool === "line" || state.tool === "rect" || state.tool === "circle") {
      drawPreview(shapeStart, cell);
    } else if (state.tool === "move" && shapeStart) {
      // live preview not implemented; commit on release
    }
  }

  function onPointerUp(e) {
    const pt = getPointer(e);
    const cell = pointToCell(pt.x, pt.y);

    if (state.isDrawing && (state.tool === "line" || state.tool === "rect" || state.tool === "circle") && shapeStart && cell) {
      commitShape(shapeStart, cell, state.tool);
      redraw();
    } else if (state.isDrawing && state.tool === "move" && shapeStart && cell) {
      const dc = cell.c - shapeStart.c;
      const dr = cell.r - shapeStart.r;
      moveAll(dc, dr);
      redraw();
    }

    state.isDrawing = false;
    state.lastCell = null;
    shapeStart = null;
    clearOverlay();
    if (state.tool !== "picker") snapshot();
  }

  function moveAll(dc, dr) {
    const ng = makeGrid(state.cols, state.rows);
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const cell = state.grid[r][c];
        if (!cell) continue;
        const nc = c + dc, nr = r + dr;
        if (nc < 0 || nr < 0 || nc >= state.cols || nr >= state.rows) continue;
        ng[nr][nc] = cell;
      }
    }
    state.grid = ng;
  }

  function commitShape(a, b, tool) {
    if (!a || !b) return;
    if (tool === "line") {
      bresenham(a.c, a.r, b.c, b.r, (c, r) => {
        symPoints(c, r).forEach(p => paintCellRaw(p.c, p.r, getPaintColor(p.c, p.r)));
      });
    } else if (tool === "rect") {
      const x0 = Math.min(a.c, b.c), x1 = Math.max(a.c, b.c);
      const y0 = Math.min(a.r, b.r), y1 = Math.max(a.r, b.r);
      for (let r = y0; r <= y1; r++) {
        for (let c = x0; c <= x1; c++) {
          if (r === y0 || r === y1 || c === x0 || c === x1) {
            symPoints(c, r).forEach(p => paintCellRaw(p.c, p.r, getPaintColor(p.c, p.r)));
          }
        }
      }
    } else if (tool === "circle") {
      const cx = a.c, cy = a.r;
      const radius = Math.round(Math.hypot(b.c - a.c, b.r - a.r));
      const steps = Math.max(8, radius * 8);
      for (let i = 0; i < steps; i++) {
        const ang = (Math.PI * 2 / steps) * i;
        const c = Math.round(cx + Math.cos(ang) * radius);
        const r = Math.round(cy + Math.sin(ang) * radius);
        if (c >= 0 && r >= 0 && c < state.cols && r < state.rows) {
          symPoints(c, r).forEach(p => paintCellRaw(p.c, p.r, getPaintColor(p.c, p.r)));
        }
      }
    }
  }

  function drawPreview(a, b) {
    clearOverlay();
    if (!a || !b) return;
    octx.save();
    octx.strokeStyle = "rgba(126,232,250,0.75)";
    octx.lineWidth = 1.5;
    octx.setLineDash([4, 4]);

    if (state.tool === "line") {
      const A = cellCenter(a.c, a.r);
      const B = cellCenter(b.c, b.r);
      octx.beginPath();
      octx.moveTo(A.x, A.y);
      octx.lineTo(B.x, B.y);
      octx.stroke();
    } else if (state.tool === "rect") {
      const A = cellOrigin(Math.min(a.c, b.c), Math.min(a.r, b.r));
      const w = (Math.abs(b.c - a.c) + 1) * (state.cellPx + state.gap) - state.gap;
      const h = (Math.abs(b.r - a.r) + 1) * (state.cellPx + state.gap) - state.gap;
      octx.strokeRect(A.x, A.y, w, h);
    } else if (state.tool === "circle") {
      const A = cellCenter(a.c, a.r);
      const B = cellCenter(b.c, b.r);
      const radius = Math.hypot(B.x - A.x, B.y - A.y);
      octx.beginPath();
      octx.arc(A.x, A.y, radius, 0, Math.PI * 2);
      octx.stroke();
    }
    octx.restore();
  }
  function clearOverlay() {
    octx.clearRect(0, 0, overlay.width, overlay.height);
  }

  function getPointer(e) {
    const rect = board.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  // ---------- Status ----------
  function updateStatus() {
    $("gridInfo").textContent = `${state.cols}×${state.rows}`;
    $("statusLeft").textContent = `Tool: ${state.tool}  •  Brush: ${state.brushSize}  •  Shape: ${state.shape}`;
    let count = 0;
    for (let r = 0; r < state.rows; r++)
      for (let c = 0; c < state.cols; c++) if (state.grid[r][c]) count++;
    $("statusRight").textContent = `${count} dots`;
  }

  // ---------- Wiring ----------
  function selectTool(t) {
    state.tool = t;
    document.querySelectorAll(".tool").forEach(b => {
      b.classList.toggle("active", b.dataset.tool === t);
    });
    updateStatus();
  }

  function buildPalette() {
    const el = $("palette");
    el.innerHTML = "";
    state.swatches.forEach((color, i) => {
      const d = document.createElement("div");
      d.className = "swatch" + (i === state.activeSwatch ? " active" : "");
      d.style.background = color;
      d.title = color + " (click=primary, shift+click=secondary, alt+click=delete)";
      d.addEventListener("click", (ev) => {
        if (ev.altKey) {
          state.swatches.splice(i, 1);
          buildPalette();
          return;
        }
        if (ev.shiftKey) {
          state.secondary = color;
          $("secondaryColor").value = color;
        } else {
          state.primary = color;
          $("primaryColor").value = color;
          state.activeSwatch = i;
          buildPalette();
        }
      });
      el.appendChild(d);
    });
  }

  // ---------- Presets ----------
  const PRESETS = [
    {
      name: "Mandala",
      build: () => {
        state.symRadial = true; state.radialFolds = 8;
        state.colorMode = "rainbow"; state.shape = "circle";
        const cx = state.cols / 2, cy = state.rows / 2;
        for (let r = 2; r < Math.min(state.cols, state.rows) / 2; r += 2) {
          for (let i = 0; i < 16; i++) {
            const a = (Math.PI * 2 / 16) * i;
            const c = Math.round(cx + Math.cos(a) * r);
            const rr = Math.round(cy + Math.sin(a) * r);
            if (c >= 0 && rr >= 0 && c < state.cols && rr < state.rows) {
              paintCellRaw(c, rr, hslToHex((r * 30 + i * 10) % 360, 80, 60));
            }
          }
        }
      }
    },
    {
      name: "Halftone",
      build: () => {
        state.shape = "circle";
        const cx = state.cols / 2, cy = state.rows / 2;
        const maxD = Math.hypot(cx, cy);
        for (let r = 0; r < state.rows; r++) {
          for (let c = 0; c < state.cols; c++) {
            const d = Math.hypot(c - cx, r - cy) / maxD;
            if (Math.random() > d * 1.2) {
              paintCellRaw(c, r, lerpColor(state.primary, state.secondary, d));
            }
          }
        }
      }
    },
    {
      name: "Checker",
      build: () => {
        state.shape = "square";
        for (let r = 0; r < state.rows; r++)
          for (let c = 0; c < state.cols; c++)
            if ((c + r) % 2 === 0) paintCellRaw(c, r, state.primary);
            else paintCellRaw(c, r, state.secondary);
      }
    },
    {
      name: "Sun",
      build: () => {
        state.shape = "circle";
        const cx = (state.cols - 1) / 2, cy = (state.rows - 1) / 2;
        const R = Math.min(state.cols, state.rows) * 0.32;
        for (let r = 0; r < state.rows; r++)
          for (let c = 0; c < state.cols; c++) {
            const d = Math.hypot(c - cx, r - cy);
            if (d <= R) paintCellRaw(c, r, hslToHex(45 + d * 4, 90, 60));
          }
        // rays
        for (let i = 0; i < 16; i++) {
          const a = (Math.PI * 2 / 16) * i;
          for (let k = R + 1; k < R + 6; k++) {
            const c = Math.round(cx + Math.cos(a) * k);
            const r = Math.round(cy + Math.sin(a) * k);
            if (c >= 0 && r >= 0 && c < state.cols && r < state.rows) paintCellRaw(c, r, "#ffb86b");
          }
        }
      }
    },
    {
      name: "Wave",
      build: () => {
        state.shape = "circle";
        for (let c = 0; c < state.cols; c++) {
          const y = Math.round((Math.sin(c / 4) + 1) / 2 * (state.rows - 1));
          for (let r = y - 1; r <= y + 1; r++) {
            if (r >= 0 && r < state.rows) paintCellRaw(c, r, hslToHex(180 + c * 8, 80, 60));
          }
        }
      }
    },
    {
      name: "Spiral",
      build: () => {
        state.shape = "circle";
        const cx = state.cols / 2, cy = state.rows / 2;
        let a = 0, r = 0;
        for (let i = 0; i < 200; i++) {
          a += 0.4; r += 0.18;
          const c = Math.round(cx + Math.cos(a) * r);
          const rr = Math.round(cy + Math.sin(a) * r);
          if (c >= 0 && rr >= 0 && c < state.cols && rr < state.rows) {
            paintCellRaw(c, rr, hslToHex((i * 6) % 360, 80, 60));
          }
        }
      }
    },
    {
      name: "Grid Dots",
      build: () => {
        state.shape = "circle";
        for (let r = 0; r < state.rows; r += 2)
          for (let c = 0; c < state.cols; c += 2)
            paintCellRaw(c, r, state.primary);
      }
    },
    {
      name: "Heart",
      build: () => {
        state.shape = "circle";
        const cx = (state.cols - 1) / 2, cy = (state.rows - 1) / 2;
        const S = Math.min(state.cols, state.rows) * 0.04;
        for (let r = 0; r < state.rows; r++)
          for (let c = 0; c < state.cols; c++) {
            const x = (c - cx) * S;
            const y = -(r - cy) * S + 0.4;
            const eq = Math.pow(x*x + y*y - 1, 3) - x*x * y*y*y;
            if (eq <= 0) paintCellRaw(c, r, "#ff7a8a");
          }
      }
    },
    {
      name: "Random",
      build: () => {
        for (let r = 0; r < state.rows; r++)
          for (let c = 0; c < state.cols; c++)
            if (Math.random() < 0.35)
              paintCellRaw(c, r, state.swatches[Math.floor(Math.random() * state.swatches.length)]);
      }
    }
  ];

  function buildPresets() {
    const el = $("presetGrid");
    el.innerHTML = "";
    PRESETS.forEach(p => {
      const b = document.createElement("button");
      b.className = "preset";
      b.title = p.name;
      const cnv = document.createElement("canvas");
      cnv.width = 60; cnv.height = 60;
      b.appendChild(cnv);
      // mini render: temporarily build into a snapshot
      const orig = state.grid;
      state.grid = makeGrid(state.cols, state.rows);
      try { p.build(); } catch {}
      const cctx = cnv.getContext("2d");
      cctx.fillStyle = state.bg;
      cctx.fillRect(0, 0, 60, 60);
      const cellSize = Math.min(60 / state.cols, 60 / state.rows);
      for (let r = 0; r < state.rows; r++)
        for (let c = 0; c < state.cols; c++) {
          const cell = state.grid[r][c];
          if (!cell) continue;
          cctx.fillStyle = cell.c;
          cctx.beginPath();
          cctx.arc(c * cellSize + cellSize/2, r * cellSize + cellSize/2, cellSize * 0.4, 0, Math.PI * 2);
          cctx.fill();
        }
      state.grid = orig;
      b.addEventListener("click", () => {
        try { p.build(); } catch (e) { console.error(e); }
        snapshot();
        redraw();
      });
      el.appendChild(b);
    });
  }

  // ---------- Export ----------
  function exportPNG() {
    // render at 2x without grid
    const padding = 18;
    const cellTotal = state.cellPx + state.gap;
    const w = state.cols * cellTotal - state.gap + padding * 2;
    const h = state.rows * cellTotal - state.gap + padding * 2;
    const scale = 2;
    const c = document.createElement("canvas");
    c.width = w * scale; c.height = h * scale;
    const cc = c.getContext("2d");
    cc.scale(scale, scale);
    cc.fillStyle = state.bg;
    cc.fillRect(0, 0, w, h);
    for (let r = 0; r < state.rows; r++)
      for (let cc2 = 0; cc2 < state.cols; cc2++) {
        const cell = state.grid[r][cc2];
        if (!cell) continue;
        const center = cellCenter(cc2, r);
        drawShape(cc, center.x + (cell.sx||0), center.y + (cell.sy||0),
          state.cellPx * (cell.sc||1), cell.s, cell.c, state.fillPct, cell.r||0, state.fxGlow);
      }
    const url = c.toDataURL("image/png");
    download(url, "circle-grid.png");
  }

  function exportSVG() {
    const padding = 18;
    const cellTotal = state.cellPx + state.gap;
    const w = state.cols * cellTotal - state.gap + padding * 2;
    const h = state.rows * cellTotal - state.gap + padding * 2;
    const parts = [];
    parts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
    parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`);
    parts.push(`<rect width="100%" height="100%" fill="${state.bg}"/>`);
    for (let r = 0; r < state.rows; r++)
      for (let c = 0; c < state.cols; c++) {
        const cell = state.grid[r][c];
        if (!cell) continue;
        const center = cellCenter(c, r);
        const cx = center.x + (cell.sx||0), cy = center.y + (cell.sy||0);
        const size = state.cellPx * (cell.sc||1);
        const rad = size * (state.fillPct / 100) / 2;
        const rot = cell.r || 0;
        const transform = rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : "";
        parts.push(svgShape(cell.s, cx, cy, rad, cell.c, transform));
      }
    parts.push(`</svg>`);
    const blob = new Blob([parts.join("")], { type: "image/svg+xml" });
    download(URL.createObjectURL(blob), "circle-grid.svg");
  }

  function svgShape(shape, cx, cy, r, color, transform) {
    switch (shape) {
      case "circle": return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"${transform}/>`;
      case "ring":   return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${Math.max(1, r*0.35)}"${transform}/>`;
      case "square": return `<rect x="${cx-r}" y="${cy-r}" width="${r*2}" height="${r*2}" fill="${color}"${transform}/>`;
      case "diamond": return `<polygon points="${cx},${cy-r} ${cx+r},${cy} ${cx},${cy+r} ${cx-r},${cy}" fill="${color}"${transform}/>`;
      case "hexagon": {
        const pts = [];
        for (let i = 0; i < 6; i++) {
          const a = (Math.PI / 3) * i - Math.PI / 2;
          pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
        }
        return `<polygon points="${pts.join(" ")}" fill="${color}"${transform}/>`;
      }
      case "triangle": {
        const pts = [];
        for (let i = 0; i < 3; i++) {
          const a = (Math.PI * 2 / 3) * i - Math.PI / 2;
          pts.push(`${cx + Math.cos(a) * r},${cy + Math.sin(a) * r}`);
        }
        return `<polygon points="${pts.join(" ")}" fill="${color}"${transform}/>`;
      }
      case "star": {
        const pts = [];
        for (let i = 0; i < 10; i++) {
          const a = (Math.PI / 5) * i - Math.PI / 2;
          const rad = i % 2 === 0 ? r : r * 0.45;
          pts.push(`${cx + Math.cos(a) * rad},${cy + Math.sin(a) * rad}`);
        }
        return `<polygon points="${pts.join(" ")}" fill="${color}"${transform}/>`;
      }
    }
    return "";
  }

  function exportJSON() {
    const data = {
      version: 1,
      cols: state.cols, rows: state.rows,
      cellPx: state.cellPx, gap: state.gap,
      bg: state.bg, shape: state.shape, fillPct: state.fillPct,
      primary: state.primary, secondary: state.secondary,
      swatches: state.swatches,
      grid: state.grid,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    download(URL.createObjectURL(blob), "circle-grid.json");
  }

  function loadJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        state.cols = data.cols || 32;
        state.rows = data.rows || 32;
        state.cellPx = data.cellPx || 22;
        state.gap = data.gap || 2;
        state.bg = data.bg || "#0e1116";
        state.primary = data.primary || state.primary;
        state.secondary = data.secondary || state.secondary;
        state.swatches = data.swatches || state.swatches;
        state.grid = data.grid && data.grid.length ? data.grid : makeGrid(state.cols, state.rows);
        syncUI();
        fitCanvas();
        snapshot();
        redraw();
      } catch (e) {
        alert("Failed to load file: " + e.message);
      }
    };
    reader.readAsText(file);
  }

  function download(url, name) {
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function syncUI() {
    $("cols").value = state.cols;
    $("rows").value = state.rows;
    $("cellPx").value = state.cellPx;
    $("cellPxVal").textContent = state.cellPx;
    $("cellGap").value = state.gap;
    $("cellGapVal").textContent = state.gap;
    $("bgColor").value = state.bg;
    $("brushSize").value = state.brushSize;
    $("brushSizeVal").textContent = state.brushSize;
    $("cellShape").value = state.shape;
    $("cellFill").value = state.fillPct;
    $("cellFillVal").textContent = state.fillPct;
    $("primaryColor").value = state.primary;
    $("secondaryColor").value = state.secondary;
    $("colorMode").value = state.colorMode;
    $("symX").checked = state.symX;
    $("symY").checked = state.symY;
    $("symDiag").checked = state.symDiag;
    $("symRadial").checked = state.symRadial;
    $("radialFolds").value = state.radialFolds;
    $("radialFoldsVal").textContent = state.radialFolds;
    $("fxGlow").value = state.fxGlow;
    $("fxGlowVal").textContent = state.fxGlow;
    $("fxRot").value = state.fxRot;
    $("fxRotVal").textContent = state.fxRot;
    $("fxScatter").value = state.fxScatter;
    $("fxScatterVal").textContent = state.fxScatter;
    $("fxAnim").value = state.fxAnim;
    $("showGrid").checked = state.showGrid;
    $("showGuides").checked = state.showGuides;
    buildPalette();
  }

  // ---------- Events ----------
  function bind() {
    document.querySelectorAll(".tool").forEach(b => {
      b.addEventListener("click", () => selectTool(b.dataset.tool));
    });

    board.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    $("brushSize").addEventListener("input", e => { state.brushSize = +e.target.value; $("brushSizeVal").textContent = state.brushSize; updateStatus(); });
    $("cellShape").addEventListener("change", e => { state.shape = e.target.value; updateStatus(); });
    $("cellFill").addEventListener("input", e => { state.fillPct = +e.target.value; $("cellFillVal").textContent = state.fillPct; redraw(); });

    $("cols").addEventListener("change", e => { resizeGrid(+e.target.value, state.rows); });
    $("rows").addEventListener("change", e => { resizeGrid(state.cols, +e.target.value); });
    $("cellPx").addEventListener("input", e => { state.cellPx = +e.target.value; $("cellPxVal").textContent = state.cellPx; fitCanvas(); redraw(); });
    $("cellGap").addEventListener("input", e => { state.gap = +e.target.value; $("cellGapVal").textContent = state.gap; fitCanvas(); redraw(); });

    $("bgColor").addEventListener("input", e => { state.bg = e.target.value; redraw(); });
    $("showGrid").addEventListener("change", e => { state.showGrid = e.target.checked; redraw(); });
    $("showGuides").addEventListener("change", e => { state.showGuides = e.target.checked; redraw(); });

    $("primaryColor").addEventListener("input", e => { state.primary = e.target.value; });
    $("secondaryColor").addEventListener("input", e => { state.secondary = e.target.value; });
    $("swapColors").addEventListener("click", () => {
      [state.primary, state.secondary] = [state.secondary, state.primary];
      $("primaryColor").value = state.primary;
      $("secondaryColor").value = state.secondary;
    });
    $("colorMode").addEventListener("change", e => { state.colorMode = e.target.value; });

    $("btnAddSwatch").addEventListener("click", () => {
      state.swatches.push(state.primary);
      buildPalette();
    });
    $("btnClearSwatch").addEventListener("click", () => {
      if (confirm("Clear all swatches?")) { state.swatches = []; buildPalette(); }
    });

    $("symX").addEventListener("change", e => state.symX = e.target.checked);
    $("symY").addEventListener("change", e => state.symY = e.target.checked);
    $("symDiag").addEventListener("change", e => state.symDiag = e.target.checked);
    $("symRadial").addEventListener("change", e => state.symRadial = e.target.checked);
    $("radialFolds").addEventListener("input", e => { state.radialFolds = +e.target.value; $("radialFoldsVal").textContent = state.radialFolds; });

    $("fxGlow").addEventListener("input", e => { state.fxGlow = +e.target.value; $("fxGlowVal").textContent = state.fxGlow; redraw(); });
    $("fxRot").addEventListener("input", e => { state.fxRot = +e.target.value; $("fxRotVal").textContent = state.fxRot; });
    $("fxScatter").addEventListener("input", e => { state.fxScatter = +e.target.value; $("fxScatterVal").textContent = state.fxScatter; });
    $("fxAnim").addEventListener("change", e => { state.fxAnim = e.target.value; });

    $("btnClear").addEventListener("click", () => {
      if (confirm("Clear canvas?")) { state.grid = makeGrid(state.cols, state.rows); snapshot(); redraw(); }
    });
    $("btnInvert").addEventListener("click", () => {
      for (let r = 0; r < state.rows; r++)
        for (let c = 0; c < state.cols; c++) {
          if (state.grid[r][c]) state.grid[r][c] = null;
          else paintCellRaw(c, r, getPaintColor(c, r));
        }
      snapshot(); redraw();
    });
    $("btnRand").addEventListener("click", () => {
      for (let r = 0; r < state.rows; r++)
        for (let c = 0; c < state.cols; c++)
          if (Math.random() < 0.35) paintCellRaw(c, r, state.swatches[Math.floor(Math.random() * state.swatches.length)] || state.primary);
      snapshot(); redraw();
    });

    $("btnNew").addEventListener("click", () => {
      if (confirm("Start a new canvas? Unsaved work will be lost.")) {
        state.grid = makeGrid(state.cols, state.rows);
        state.history = []; state.historyIdx = -1;
        snapshot(); redraw();
      }
    });
    $("btnUndo").addEventListener("click", undo);
    $("btnRedo").addEventListener("click", redo);
    $("btnExportPNG").addEventListener("click", exportPNG);
    $("btnExportSVG").addEventListener("click", exportSVG);
    $("btnExportJSON").addEventListener("click", exportJSON);
    $("fileLoad").addEventListener("change", (e) => {
      const f = e.target.files[0];
      if (f) loadJSON(f);
      e.target.value = "";
    });

    $("btnZoomIn").addEventListener("click", () => zoomBy(1.15));
    $("btnZoomOut").addEventListener("click", () => zoomBy(1/1.15));
    $("btnZoomFit").addEventListener("click", () => { state.zoom = 1; applyZoom(); });

    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", (e) => {
      if (e.code === "Space") { state.panning = false; document.body.style.cursor = ""; }
    });
    window.addEventListener("resize", fitCanvas);
  }

  function resizeGrid(cols, rows) {
    cols = clamp(cols, 4, 128); rows = clamp(rows, 4, 128);
    const ng = makeGrid(cols, rows);
    for (let r = 0; r < Math.min(rows, state.rows); r++)
      for (let c = 0; c < Math.min(cols, state.cols); c++)
        ng[r][c] = state.grid[r][c];
    state.cols = cols; state.rows = rows;
    state.grid = ng;
    $("cols").value = cols; $("rows").value = rows;
    fitCanvas(); snapshot(); redraw();
  }

  function zoomBy(factor) {
    state.zoom = clamp(state.zoom * factor, 0.4, 3);
    applyZoom();
  }
  function applyZoom() {
    board.style.transform = `scale(${state.zoom})`;
    board.style.transformOrigin = "center";
    overlay.style.transform = board.style.transform;
    overlay.style.transformOrigin = board.style.transformOrigin;
    $("zoomLabel").textContent = Math.round(state.zoom * 100) + "%";
  }

  function onKey(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT" || e.target.tagName === "TEXTAREA") return;
    const meta = e.ctrlKey || e.metaKey;
    if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if (meta && (e.key.toLowerCase() === "y" || (e.shiftKey && e.key.toLowerCase() === "z"))) { e.preventDefault(); redo(); return; }
    if (meta && e.key.toLowerCase() === "s") { e.preventDefault(); exportJSON(); return; }
    if (e.code === "Space") { state.panning = true; document.body.style.cursor = "grab"; return; }
    switch (e.key.toLowerCase()) {
      case "b": selectTool("paint"); break;
      case "e": selectTool("erase"); break;
      case "g": selectTool("fill"); break;
      case "l": selectTool("line"); break;
      case "r": selectTool("rect"); break;
      case "c": selectTool("circle"); break;
      case "i": selectTool("picker"); break;
      case "m": selectTool("move"); break;
      case "x":
        [state.primary, state.secondary] = [state.secondary, state.primary];
        $("primaryColor").value = state.primary;
        $("secondaryColor").value = state.secondary;
        break;
      case "+": case "=": zoomBy(1.15); break;
      case "-": zoomBy(1/1.15); break;
      case "[": state.brushSize = Math.max(1, state.brushSize - 1); $("brushSize").value = state.brushSize; $("brushSizeVal").textContent = state.brushSize; updateStatus(); break;
      case "]": state.brushSize = Math.min(10, state.brushSize + 1); $("brushSize").value = state.brushSize; $("brushSizeVal").textContent = state.brushSize; updateStatus(); break;
    }
  }

  // ---------- Animation loop ----------
  function tick(t) {
    animT = t / 1000;
    if (state.fxAnim !== "none") redraw();
    requestAnimationFrame(tick);
  }

  // ---------- Init ----------
  function init() {
    state.grid = makeGrid(state.cols, state.rows);
    syncUI();
    bind();
    buildPresets();
    fitCanvas();
    snapshot();
    redraw();
    requestAnimationFrame(tick);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
