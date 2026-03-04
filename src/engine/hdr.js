// ── HDR Bloom Pipeline ───────────────────────────────────────────────
// Uses threshold → blur → screen blend approach.
// cfg needs: hdrEnabled, hdrBloom, hdrBloomRadius, hdrBloomThreshold,
//            hdrIntensity, hdrShadowLift

/**
 * Compute real-time bloom for the live preview.
 * Draws the bloom result into hdrCanvas.
 *
 * @param {HTMLCanvasElement} asciiCanvas  - the rendered ASCII canvas
 * @param {HTMLCanvasElement} hdrCanvas    - the HDR overlay canvas
 * @param {CanvasRenderingContext2D} hdrCtx - context of hdrCanvas
 * @param {HTMLCanvasElement} bloomBufA    - offscreen buffer A
 * @param {HTMLCanvasElement} bloomBufB    - offscreen buffer B
 * @param {object} cfg                    - config snapshot
 */
export function computeBloom(asciiCanvas, hdrCanvas, hdrCtx, bloomBufA, bloomBufB, cfg) {
  if (!cfg.hdrEnabled) {
    hdrCanvas.classList.remove('active');
    return;
  }
  hdrCanvas.classList.add('active');

  const W = window.innerWidth, H = window.innerHeight;
  const dpr = window.devicePixelRatio || 1;
  const scale = 0.25;
  const bw = Math.max(1, Math.ceil(W * scale)), bh = Math.max(1, Math.ceil(H * scale));
  const blurPx = Math.max(1, Math.round(cfg.hdrBloomRadius * scale));

  // Step 1: Draw ascii canvas into small buffer
  bloomBufA.width = bw; bloomBufA.height = bh;
  const ctxA = bloomBufA.getContext('2d');
  ctxA.drawImage(asciiCanvas, 0, 0, bw, bh);

  // Step 2: Threshold – keep only bright pixels
  const img = ctxA.getImageData(0, 0, bw, bh);
  const d = img.data;
  const threshold = cfg.hdrBloomThreshold * 2.55;
  const intBoost = cfg.hdrIntensity / 100;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
    if (lum < threshold) {
      d[i] = d[i+1] = d[i+2] = d[i+3] = 0;
    } else {
      d[i]   = Math.min(255, d[i]   * intBoost);
      d[i+1] = Math.min(255, d[i+1] * intBoost);
      d[i+2] = Math.min(255, d[i+2] * intBoost);
    }
  }
  ctxA.putImageData(img, 0, 0);

  // Step 3: Blur using canvas filter (two-pass for smoother glow)
  bloomBufB.width = bw; bloomBufB.height = bh;
  const ctxB = bloomBufB.getContext('2d');
  ctxB.filter = `blur(${blurPx}px)`;
  ctxB.drawImage(bloomBufA, 0, 0);
  ctxB.filter = 'none';

  // Second blur pass for smoother glow
  ctxA.clearRect(0, 0, bw, bh);
  ctxA.filter = `blur(${blurPx}px)`;
  ctxA.drawImage(bloomBufB, 0, 0);
  ctxA.filter = 'none';

  // Step 4: Draw bloom to HDR canvas at full size
  hdrCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  hdrCtx.clearRect(0, 0, W, H);
  hdrCtx.imageSmoothingEnabled = true;
  hdrCtx.imageSmoothingQuality = 'high';
  hdrCtx.globalAlpha = cfg.hdrBloom / 100;
  hdrCtx.drawImage(bloomBufA, 0, 0, W, H);
  hdrCtx.globalAlpha = 1;
}

/**
 * Compute high-quality bloom for export (full resolution, 3-pass blur).
 *
 * @param {HTMLCanvasElement} srcCanvas2d - the source canvas to bloom from
 * @param {number} outWidth              - output width in pixels
 * @param {number} outHeight             - output height in pixels
 * @param {object} cfg                   - config snapshot
 * @returns {HTMLCanvasElement}           - canvas containing the bloom result
 */
export function computeBloomForExport(srcCanvas2d, outWidth, outHeight, cfg) {
  const scale = 0.5; // higher quality for export
  const bw = Math.max(1, Math.ceil(outWidth * scale));
  const bh = Math.max(1, Math.ceil(outHeight * scale));
  const blurPx = Math.max(1, Math.round(cfg.hdrBloomRadius * scale));

  const bufA = document.createElement('canvas');
  bufA.width = bw; bufA.height = bh;
  const cA = bufA.getContext('2d');
  cA.drawImage(srcCanvas2d, 0, 0, bw, bh);

  const img = cA.getImageData(0, 0, bw, bh);
  const d = img.data;
  const threshold = cfg.hdrBloomThreshold * 2.55;
  const intBoost = cfg.hdrIntensity / 100;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i+1] + 0.114 * d[i+2];
    if (lum < threshold) { d[i] = d[i+1] = d[i+2] = d[i+3] = 0; }
    else {
      d[i]   = Math.min(255, d[i]   * intBoost);
      d[i+1] = Math.min(255, d[i+1] * intBoost);
      d[i+2] = Math.min(255, d[i+2] * intBoost);
    }
  }
  cA.putImageData(img, 0, 0);

  // 3-pass blur for smooth export bloom
  const bufB = document.createElement('canvas');
  bufB.width = bw; bufB.height = bh;
  const cB = bufB.getContext('2d');
  for (let pass = 0; pass < 3; pass++) {
    const from = (pass % 2 === 0) ? bufA : bufB;
    const to   = (pass % 2 === 0) ? cB : cA;
    to.clearRect(0, 0, bw, bh);
    to.filter = `blur(${blurPx}px)`;
    to.drawImage(from, 0, 0);
    to.filter = 'none';
  }

  // Return the final bloom buffer (after 3 passes, result is in bufB)
  const result = document.createElement('canvas');
  result.width = outWidth; result.height = outHeight;
  const rCtx = result.getContext('2d');
  rCtx.imageSmoothingEnabled = true;
  rCtx.imageSmoothingQuality = 'high';
  rCtx.drawImage(bufB, 0, 0, outWidth, outHeight);
  return result;
}
