function cellHash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

export function getGooeyFactor(x, y, cols, rows, mCol, mRow, cellW, cellH, time, cfg, mouseOnCanvas) {
  if (!mouseOnCanvas) return { blend: 0, scramble: 0 };
  const nx = x / cols, ny = y / rows;
  const mx = mCol / cols, my = mRow / rows;
  const aspect = (cols * cellW) / (rows * cellH);
  const dx = (nx - mx) * aspect, dy = ny - my;
  let dist = Math.sqrt(dx * dx + dy * dy);
  const noise = cellHash(x, y) * 0.04 + Math.sin(time * 1.5 + x * 0.3 + y * 0.5) * 0.015;
  dist += noise;
  const radiusBase = (cfg.gooeyRadius / 100) * cfg.gooeyIntensity;
  const softnessBase = (cfg.gooeySoftness / 100) * 0.06 * cfg.gooeyIntensity;
  if (radiusBase <= 0.001) return { blend: 0, scramble: 0 };
  const lo = radiusBase - softnessBase, hi = radiusBase + softnessBase;
  let t;
  if (dist <= lo) t = 1;
  else if (dist >= hi) t = 0;
  else { const e = (dist - lo) / (hi - lo); t = 1 - e * e * (3 - 2 * e); }
  const colorFactor = cfg.gooeyColorReveal / 100;
  const blend = t > 0 ? Math.min(1, t / 0.15) * t * colorFactor : 0;
  const scrambleFactor = cfg.gooeyScrambleAmt / 100;
  const scramble = cellHash(x + cfg.gooeyScrambleSeed * 7, y + cfg.gooeyScrambleSeed * 13);
  return { blend, scramble: scramble * t * scrambleFactor };
}
