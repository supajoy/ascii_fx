// ── Image/Video/Webcam Source Processing ─────────────────────────────
// Handles: scale, offset, tile mode, posterize, brightness/contrast

/**
 * Process the source element (image/video/canvas) into the tile canvas
 * for ASCII rendering. Preserves the source's native aspect ratio.
 *
 * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} sourceElement - the source media
 * @param {HTMLCanvasElement} tileCanvas  - offscreen canvas for tile processing
 * @param {CanvasRenderingContext2D} tileCtx - context of tileCanvas
 * @param {HTMLCanvasElement} srcCanvas   - the visible source canvas layer
 * @param {CanvasRenderingContext2D} srcCtx - context of srcCanvas
 * @param {number} W                     - viewport width
 * @param {number} H                     - viewport height
 * @param {object} cfg                   - config snapshot with source* properties
 */
export function processSource(sourceElement, tileCanvas, tileCtx, srcCanvas, srcCtx, W, H, cfg) {
  const tile = Math.max(1, cfg.tileSize), levels = Math.max(2, cfg.posterize), scale = Math.max(0.01, cfg.sourceScale);
  const tw = Math.max(1, Math.floor(W / tile));
  const th = Math.max(1, Math.floor(H / tile));
  tileCanvas.width = tw; tileCanvas.height = th;
  tileCtx.imageSmoothingEnabled = true;

  // Get source's natural dimensions (with fallback for SVGs that report 0)
  let natW = sourceElement.naturalWidth || sourceElement.videoWidth || sourceElement.width;
  let natH = sourceElement.naturalHeight || sourceElement.videoHeight || sourceElement.height;
  if (!natW || !natH) {
    natW = sourceElement.width || 800;
    natH = sourceElement.height || 600;
  }

  if (!natW || !natH) {
    tileCtx.clearRect(0, 0, tw, th);
  } else {
    // "Contain" fit: preserve aspect ratio, fit within tile canvas
    const srcAspect = natW / natH;
    const tileAspect = tw / th;
    let drawW, drawH;
    if (srcAspect > tileAspect) {
      // Source is wider than tile — fit to width
      drawW = tw;
      drawH = tw / srcAspect;
    } else {
      // Source is taller than tile — fit to height
      drawH = th;
      drawW = th * srcAspect;
    }

    // Apply user scale
    drawW *= scale;
    drawH *= scale;

    // Center + user offset
    const sdx = (tw - drawW) / 2 + (cfg.sourceOffsetX / W) * tw;
    const sdy = (th - drawH) / 2 + (cfg.sourceOffsetY / H) * th;

    tileCtx.clearRect(0, 0, tw, th);
    tileCtx.drawImage(sourceElement, sdx, sdy, drawW, drawH);
  }

  // Posterize if levels < 32
  if (levels < 32) {
    const img = tileCtx.getImageData(0, 0, tw, th);
    const d = img.data, step = 255 / (levels - 1);
    for (let i = 0; i < d.length; i += 4) {
      d[i]=Math.round(d[i]/step)*step;
      d[i+1]=Math.round(d[i+1]/step)*step;
      d[i+2]=Math.round(d[i+2]/step)*step;
    }
    tileCtx.putImageData(img, 0, 0);
  }

  // Copy to the visible source canvas at full viewport size
  if (srcCanvas.width !== W || srcCanvas.height !== H) {
    srcCanvas.width = W; srcCanvas.height = H;
  }
  srcCtx.clearRect(0, 0, W, H);
  srcCtx.imageSmoothingEnabled = false;
  srcCtx.drawImage(tileCanvas, 0, 0, W, H);
}
