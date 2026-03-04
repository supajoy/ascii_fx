export function updateGlowTrail(state, mouseX, mouseY, mouseOnCanvas, stampInterval, duration) {
  const now = performance.now();
  if (mouseOnCanvas && (now - state.glowLastStamp) >= stampInterval) {
    state.glowPoints.push({ x: mouseX, y: mouseY, time: now });
    state.glowLastStamp = now;
  }
  const maxAge = (duration + 0.25) * 1000;
  state.glowPoints = state.glowPoints.filter(p => (now - p.time) < maxAge);
}

export function getGlowFactor(px, py, cellW, cellH, cfg) {
  if (cfg.glowPoints.length === 0) return 0;
  const now = performance.now();
  const dur = cfg.glowDuration * 1000;
  const radius = cfg.glowRadiusMult * cfg.fontSize;
  let combined = 0;
  for (let i = 0; i < cfg.glowPoints.length; i++) {
    const p = cfg.glowPoints[i];
    const age = now - p.time;
    const timeF = Math.max(0, 1 - age / dur);
    if (timeF <= 0) continue;
    const dx = px - p.x, dy = py - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const r = radius * timeF;
    if (dist > r) continue;
    const normDist = dist / r;
    const spatial = Math.exp(-normDist * normDist * 3);
    combined += spatial * timeF;
  }
  return Math.min(1, combined);
}
