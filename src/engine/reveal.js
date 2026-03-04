// ── Typewriter + Radial Reveal System ────────────────────────────────
// Supports 8 direction modes: left-right, right-left, top-bottom,
// bottom-top, center-out, out-center (edges-in), radial-out, radial-in

function cellHash(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

function easeOutCubic(t) { return 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3); }

/**
 * Compute per-cell reveal masks for the current frame.
 * @param {number} cols - number of ASCII columns
 * @param {number} rows - number of ASCII rows
 * @param {object} cfg  - config snapshot with reveal* properties
 * @returns {{ revealMask: Float32Array, colorMask: Float32Array, rippleMask: Float32Array, gradientColors: Float32Array|null, gradAmt: number }}
 */
export function getRevealState(cols, rows, cfg) {
  const now = performance.now();
  const elapsed = (now - cfg.revealStartTime) / 1000;
  const duration = cfg.revealSpeed / 10; // 35 → 3.5s
  const colorDelay = 0.15;

  const rawProgress = Math.min(1, elapsed / duration);
  const rawColorProgress = Math.min(1, Math.max(0, (elapsed - colorDelay) / duration));
  cfg.revealProgress = easeOutCubic(rawProgress);
  cfg.revealColorProgress = easeOutCubic(rawColorProgress);

  if (rawProgress >= 1 && rawColorProgress >= 1) {
    cfg.revealActive = false;
  }

  const total = cols * rows;
  const revealMask = new Float32Array(total);
  const colorMask = new Float32Array(total);
  const rippleMask = new Float32Array(total);
  // Gradient color per cell (r,g,b)
  const gradientColors = cfg.revealGradient > 0 ? new Float32Array(total * 3) : null;

  const dir = cfg.revealDirection;
  const revealScale = 1.4;
  const scaledP = cfg.revealProgress * revealScale;
  const scaledCP = cfg.revealColorProgress * revealScale;

  // Parse gradient colors
  const hex2rgb = (h) => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
  const gc1 = hex2rgb(cfg.revealColor1);
  const gc2 = hex2rgb(cfg.revealColor2);
  const gc3 = hex2rgb(cfg.revealColor3);
  const gradAmt = cfg.revealGradient / 100;

  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const idx = y * cols + x;
    const nx = x / cols, ny = y / rows;

    // Focal point (0-1 normalized)
    const fx = cfg.revealFocalX / 100;
    const fy = cfg.revealFocalY / 100;
    // Max possible distance from focal point to any corner
    const maxR = Math.sqrt(Math.max(fx, 1-fx)**2 + Math.max(fy, 1-fy)**2) || 0.01;

    // Direction-based distance
    let dist;
    if (dir === 'center-out' || dir === 'radial-out') {
      const dx = nx - fx, dy = ny - fy;
      dist = Math.sqrt(dx*dx + dy*dy) / maxR;
    } else if (dir === 'out-center' || dir === 'radial-in') {
      const dx = nx - fx, dy = ny - fy;
      dist = 1 - Math.sqrt(dx*dx + dy*dy) / maxR;
    } else if (dir === 'left-right') {
      dist = nx;
    } else if (dir === 'right-left') {
      dist = 1 - nx;
    } else if (dir === 'top-bottom') {
      dist = ny;
    } else if (dir === 'bottom-top') {
      dist = 1 - ny;
    } else {
      // Default: radial from center
      dist = Math.sqrt((nx-0.5)*(nx-0.5) + (ny-0.5)*(ny-0.5)) / Math.sqrt(0.5);
    }

    const rnd = cellHash(x, y);
    const threshold = dist + rnd * 0.15 + 0.06;

    const edge = 0.05;
    revealMask[idx] = scaledP > threshold + edge ? 1.0 :
                      scaledP > threshold - edge ? (scaledP - threshold + edge) / (2 * edge) : 0.0;

    // Color phase: now goes from full color → mono (reversed)
    colorMask[idx] = scaledCP > threshold + edge ? 1.0 :
                     scaledCP > threshold - edge ? (scaledCP - threshold + edge) / (2 * edge) : 0.0;

    // Ripple ring at the wavefront
    const waveDist = Math.abs(scaledP - threshold);
    rippleMask[idx] = Math.exp(-waveDist * waveDist * 180) * 0.35;

    // Gradient color: 3-stop gradient based on distance
    if (gradientColors) {
      const gt = Math.min(1, Math.max(0, dist));
      let gr, gg, gb;
      if (gt < 0.5) {
        const t2 = gt * 2;
        gr = gc1[0] + (gc2[0] - gc1[0]) * t2;
        gg = gc1[1] + (gc2[1] - gc1[1]) * t2;
        gb = gc1[2] + (gc2[2] - gc1[2]) * t2;
      } else {
        const t2 = (gt - 0.5) * 2;
        gr = gc2[0] + (gc3[0] - gc2[0]) * t2;
        gg = gc2[1] + (gc3[1] - gc2[1]) * t2;
        gb = gc2[2] + (gc3[2] - gc2[2]) * t2;
      }
      gradientColors[idx*3] = gr;
      gradientColors[idx*3+1] = gg;
      gradientColors[idx*3+2] = gb;
    }
  }

  return { revealMask, colorMask, rippleMask, gradientColors, gradAmt };
}
