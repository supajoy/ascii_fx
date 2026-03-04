const trail = [];
const TRAIL_MAX = 24;
const TRAIL_DECAY = 0.025;
let lastTrailCol = -1, lastTrailRow = -1;

function blockyCircleDist(dx, dy, q) { return Math.floor(Math.sqrt(dx*dx+dy*dy)/q)*q; }

export function updateTrail(cellW, cellH, mouseX, mouseY, mouseOnCanvas) {
  const mCol = mouseOnCanvas ? Math.floor(mouseX / cellW) : -9999;
  const mRow = mouseOnCanvas ? Math.floor(mouseY / cellH) : -9999;
  if (mouseOnCanvas && (mCol !== lastTrailCol || mRow !== lastTrailRow)) {
    trail.unshift({ col: mCol, row: mRow, age: 0 });
    lastTrailCol = mCol; lastTrailRow = mRow;
    if (trail.length > TRAIL_MAX) trail.length = TRAIL_MAX;
  }
  for (let i = trail.length - 1; i >= 0; i--) {
    trail[i].age += TRAIL_DECAY;
    if (trail[i].age >= 1) trail.splice(i, 1);
  }
}

export function getHoverFactor(x, y, mCol, mRow, hoverR, quantize, mouseOnCanvas) {
  let best = 0;
  if (mouseOnCanvas) {
    const d = blockyCircleDist(x-mCol, y-mRow, quantize);
    if (d < hoverR) { const t = d/hoverR; best = 1-t*t; }
  }
  for (let i = 0; i < trail.length; i++) {
    const tp = trail[i], str = 1-tp.age;
    if (str <= 0) continue;
    const tR = hoverR*str, d = blockyCircleDist(x-tp.col, y-tp.row, quantize);
    if (d < tR) { const t = d/tR; const f = (1-t*t)*str; if (f > best) best = f; }
  }
  return best;
}

