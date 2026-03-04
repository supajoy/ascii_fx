// ── Main Render Loop ─────────────────────────────────────────────────
// Orchestrates processSource → getAnimatedSource → renderASCII each frame.

import { get } from 'svelte/store';
import { config } from '../stores/config.js';
import { ui } from '../stores/ui.js';
import { rgbToHsl, hslToRgb } from './color.js';
import { getAnimatedSource, renderStandaloneAnim } from './animation.js';
import { updateTrail, getHoverFactor } from './hover.js';
import { getGooeyFactor } from './gooey.js';
import { updateGlowTrail, getGlowFactor } from './glow.js';
import { getRevealState } from './reveal.js';
import { computeBloom } from './hdr.js';
import { processSource } from './source.js';

// ── Canvas references (for export panel) ────────────────────────────
let canvasRefs = null;
export function getCanvasRefs() { return canvasRefs; }

// ── Mutable render state ────────────────────────────────────────────
let animFrameId = null;
let sourceReady = false;
let sourceElement = null;
let sourceIsVideo = false;
let sourceFileName = '';
let animStartTime = performance.now();
let mouseX = -9999, mouseY = -9999, mouseOnCanvas = false;
let lastCapturedFrame = null;

// Moved groups (lasso tool)
const movedGroups = [];
let activeSelection = null;

// Local mutable state for per-frame effects (avoids writing to store every frame)
let gooeyIntensityLocal = 0;
const glowState = { glowPoints: [], glowLastStamp: 0 };

// ── State accessors / mutators ──────────────────────────────────────
export function getState() {
  return { sourceReady, sourceElement, sourceIsVideo, sourceFileName, animStartTime, lastCapturedFrame, movedGroups, activeSelection, mouseX, mouseY, mouseOnCanvas };
}

export function setSourceReady(ready) { sourceReady = ready; }
export function setSourceElement(el) { sourceElement = el; }
export function setSourceIsVideo(v) { sourceIsVideo = v; }
export function setSourceFileName(n) { sourceFileName = n; }
export function setAnimStartTime(t) { animStartTime = t; }
export function getMouseState() { return { mouseX, mouseY, mouseOnCanvas }; }
export function setMouse(x, y, onCanvas) { mouseX = x; mouseY = y; mouseOnCanvas = onCanvas; }
export function getActiveSelection() { return activeSelection; }
export function setActiveSelection(sel) { activeSelection = sel; }
export function getMovedGroups() { return movedGroups; }
export function getLastCapturedFrame() { return lastCapturedFrame; }

/**
 * Start the main requestAnimationFrame render loop.
 *
 * @param {object} canvases - bag of canvas elements:
 *   { asciiCanvas, sourceCanvas, hdrCanvas, handlesCanvas, guidesCanvas,
 *     tileCanvas, processingCanvas, bloomBufA, bloomBufB }
 * @returns {function} cleanup function that stops the loop
 */
export function startRenderLoop(canvases) {
  const { asciiCanvas, sourceCanvas, hdrCanvas, handlesCanvas, guidesCanvas, tileCanvas, processingCanvas, bloomBufA, bloomBufB } = canvases;
  if (!asciiCanvas || !sourceCanvas || !hdrCanvas || !tileCanvas || !processingCanvas) {
    console.warn('startRenderLoop: missing canvas elements');
    return () => {};
  }
  canvasRefs = canvases;
  const ctx = asciiCanvas.getContext('2d');
  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const hdrCtx = hdrCanvas.getContext('2d');
  const tileCtx = tileCanvas.getContext('2d', { willReadFrequently: true });
  const procCtx = processingCanvas.getContext('2d', { willReadFrequently: true });

  function renderASCII() {
    const cfg = { ...get(config) };

    // ── Standalone animation (no source needed) ──
    if (!sourceReady && !sourceElement && cfg.animEnabled) {
      const sw = window.innerWidth, sh = window.innerHeight;
      if (asciiCanvas.width !== sw || asciiCanvas.height !== sh) {
        asciiCanvas.width = sw; asciiCanvas.height = sh;
      }
      renderStandaloneAnim(ctx, sw, sh, animStartTime, cfg);
      animFrameId = requestAnimationFrame(renderASCII);
      return;
    }
    if (!sourceReady || !sourceElement) { animFrameId = requestAnimationFrame(renderASCII); return; }

    const W = window.innerWidth, H = window.innerHeight;

    // Size canvases to viewport (only ascii + hdr; sourceCanvas is sized by processSource)
    if (asciiCanvas.width !== W || asciiCanvas.height !== H) {
      asciiCanvas.width = W; asciiCanvas.height = H;
      hdrCanvas.width = W; hdrCanvas.height = H;
    }

    const fontSize = cfg.fontSize;
    const cellW = fontSize * 0.6, cellH = fontSize * cfg.lineHeight;
    const cols = Math.ceil(W / cellW), rows = Math.ceil(H / cellH);
    const mCol = mouseOnCanvas ? Math.floor(mouseX/cellW) : -9999;
    const mRow = mouseOnCanvas ? Math.floor(mouseY/cellH) : -9999;
    const hoverR = cfg.hoverRadius, quantize = 2;

    // ── Update hover trail ──
    const uiState = get(ui);
    if (cfg.hoverEnabled && cfg.basicHover && uiState.activeTool !== 'lasso') updateTrail(cellW, cellH, mouseX, mouseY, mouseOnCanvas);

    // ── Process source into tiled canvas ──
    processSource(sourceElement, tileCanvas, tileCtx, sourceCanvas, srcCtx, W, H, cfg);

    // ── Build pixel data at grid resolution ──
    processingCanvas.width = cols; processingCanvas.height = rows;
    procCtx.imageSmoothingEnabled = false;
    procCtx.drawImage(tileCanvas, 0, 0, cols, rows);
    const imageData = procCtx.getImageData(0, 0, cols, rows);
    const pixels = imageData.data;
    const total = cols * rows;

    // ── Luminance array ──
    const luma = new Float32Array(total);
    for (let j = 0; j < total; j++) { const k=j*4; luma[j]=(0.299*pixels[k]+0.587*pixels[k+1]+0.114*pixels[k+2])/255; }

    // ── Edge-detail (gradient magnitude) ──
    const detail = new Float32Array(total);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const idx=y*cols+x, c=luma[idx];
      const l0=x>0?luma[idx-1]:c,r0=x<cols-1?luma[idx+1]:c,t0=y>0?luma[idx-cols]:c,b0=y<rows-1?luma[idx+cols]:c;
      const gx=r0-l0,gy=b0-t0; detail[idx]=Math.min(1,Math.sqrt(gx*gx+gy*gy)*3.5);
    }

    // ── Moved cell set (lasso) ──
    const movedSet = new Set();
    for (const grp of movedGroups) for (const cell of grp.cells) movedSet.add(`${cell.col},${cell.row}`);
    if (activeSelection && activeSelection.cells) for (const cell of activeSelection.cells) movedSet.add(`${cell.col},${cell.row}`);

    // ── Clear and setup canvas ──
    ctx.clearRect(0, 0, W, H);
    ctx.font = `${fontSize}px "Courier New","Consolas",monospace`;
    ctx.textBaseline = 'top';

    const chars = cfg.chars, charLen = chars.length;
    const mix = cfg.mix, brtBoost = cfg.brightnessBoost;

    const frameChars = new Array(total);
    const frameColors = new Array(total);

    // ── Animation offsets ──
    const animOffsets = cfg.animEnabled ? getAnimatedSource(cols, rows, animStartTime, cfg) : null;

    // ── Typewriter reveal state ──
    let reveal = null;
    if (cfg.revealActive) {
      reveal = getRevealState(cols, rows, cfg);
      // When reveal completes, sync back to store
      if (!cfg.revealActive) {
        config.update(c => ({ ...c, revealActive: false }));
      }
    }

    // ── Gooey hover: smooth intensity towards target ──
    // Use local mutable state instead of writing back to store every frame
    if (cfg.gooeyHover && cfg.hoverEnabled) {
      const target = mouseOnCanvas ? 1.0 : 0.0;
      const rate = mouseOnCanvas ? 0.08 : 0.06;
      gooeyIntensityLocal += (target - gooeyIntensityLocal) * rate;
      cfg.gooeyIntensity = gooeyIntensityLocal;
    }
    const gooeyTime = performance.now() / 1000;

    // ── Glow trail: stamp points and expire old ones ──
    // Mutate local arrays instead of writing to store every frame
    if (cfg.glowTrail && cfg.hoverEnabled) {
      updateGlowTrail(glowState, mouseX, mouseY, mouseOnCanvas, cfg.glowStampInterval, cfg.glowDuration);
      cfg.glowPoints = glowState.glowPoints;
      cfg.glowLastStamp = glowState.glowLastStamp;
    }

    // ── Per-cell ASCII rendering ──
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const idx=y*cols+x;
      // Skip cells outside the source image (check alpha at original position)
      if (pixels[idx*4+3] < 5) { frameChars[idx] = ' '; frameColors[idx] = 'rgb(0,0,0)'; continue; }
      let srcIdx = idx;
      if (animOffsets) {
        const ox = animOffsets[idx*2], oy = animOffsets[idx*2+1];
        const sx = Math.max(0, Math.min(cols-1, x + ox));
        const sy = Math.max(0, Math.min(rows-1, y + oy));
        srcIdx = Math.round(sy)*cols + Math.round(sx);
      }
      const i=srcIdx*4;
      const r=pixels[i], g=pixels[i+1], b=pixels[i+2];
      const brightness=luma[srcIdx], det=detail[srcIdx];
      const hoverFactor = (cfg.hoverEnabled && cfg.basicHover && mouseOnCanvas) ? getHoverFactor(x,y,mCol,mRow,hoverR,quantize,mouseOnCanvas) : 0;
      const exposureLift = hoverFactor * cfg.hoverExposure;

      let fr, fg, fb;
      const hdrOn = cfg.hdrEnabled;
      const hdrShadow = hdrOn ? cfg.hdrShadowLift / 200 : 0;
      const hdrInt = hdrOn ? cfg.hdrIntensity / 100 : 1;
      if (cfg.asciiColorOverride) {
        const ac=cfg.asciiColor;
        const brt=Math.min(1,brightness*brtBoost*(hdrOn?hdrInt:1)+exposureLift+(hdrOn?hdrShadow*(1-brightness)*(1-brightness):0));
        fr=Math.min(255,ac.r*brt); fg=Math.min(255,ac.g*brt); fb=Math.min(255,ac.b*brt);
      } else {
        let [h,s,l]=rgbToHsl(r,g,b);
        if (hdrOn) { l = l + hdrShadow * (1 - l) * (1 - l); }
        if(cfg.colored){s=Math.min(1,s*cfg.saturationBoost);l=Math.min(1,l*brtBoost*hdrInt+exposureLift);}
        else{h=1/3;s=1;l=Math.min(1,brightness*brtBoost*hdrInt+exposureLift);}
        [fr,fg,fb]=hslToRgb(h,s,l);
      }
      let adjBrt = brightness;
      if (hdrOn) adjBrt = adjBrt + hdrShadow * (1 - adjBrt) * (1 - adjBrt);
      let fB=Math.min(1,adjBrt*brtBoost*hdrInt+exposureLift);
      const px2=Math.floor(x*cellW), py2=Math.floor(y*cellH);
      const pw=Math.ceil(cellW)+1, ph=Math.ceil(cellH)+1;

      // ── Typewriter Reveal ──
      if (reveal) {
        const vis = reveal.revealMask[idx];
        if (vis < 0.01) { frameChars[idx] = ' '; frameColors[idx] = 'rgb(0,0,0)'; continue; }
        // Ripple brightness boost at wavefront
        fB = Math.min(1, fB + reveal.rippleMask[idx]);
        fr = Math.min(255, fr + reveal.rippleMask[idx] * 255);
        fg = Math.min(255, fg + reveal.rippleMask[idx] * 255);
        fb = Math.min(255, fb + reveal.rippleMask[idx] * 255);
        // Color phase: starts in full ASCII color, fades to monochrome
        const cp = reveal.colorMask[idx];
        if (cp < 1.0) {
          const mono = 0.299 * fr + 0.587 * fg + 0.114 * fb;
          // Reverse: (1-cp) = starts colored, ends mono
          const blend2 = 1 - cp;
          fr = fr + (mono - fr) * blend2;
          fg = fg + (mono - fg) * blend2;
          fb = fb + (mono - fb) * blend2;
        }
        // Apply gradient color overlay
        if (reveal.gradientColors && reveal.gradAmt > 0) {
          const ga = reveal.gradAmt * vis;
          const gR = reveal.gradientColors[idx*3];
          const gG = reveal.gradientColors[idx*3+1];
          const gB = reveal.gradientColors[idx*3+2];
          fr = fr + (gR - fr) * ga;
          fg = fg + (gG - fg) * ga;
          fb = fb + (gB - fb) * ga;
        }
      }

      // ── Effect Intensity ──
      // At 100 every cell gets full dense ASCII (even black areas).
      // At 0 only the brightest highlights keep characters; dark cells become spaces.
      const fxInt = cfg.effectIntensity / 100;
      // Lift brightness so dark areas get visible characters
      const fxB = Math.min(1, fB + fxInt * (1 - fB));
      // Lift detail floor so dark areas still get a range of characters
      const fxDet = Math.min(1, det + fxInt * (1 - det));
      // Lift color so characters on black areas are actually visible
      if (fxInt > 0 && fB < fxInt) {
        const lift = (fxInt - fB) * 0.35;
        fr = Math.min(255, fr + lift * 255);
        fg = Math.min(255, fg + lift * 255);
        fb = Math.min(255, fb + lift * 255);
      }

      const maxCI=Math.max(2,Math.round(fxDet*(charLen-1)));
      let ci=Math.min(Math.floor(fxB*(maxCI+1)),maxCI);
      // At full intensity, guarantee at least char index 1 (not space)
      if (fxInt >= 1 && ci === 0 && charLen > 1) ci = 1;
      let ch=chars[ci];

      // ── Gooey Hover ──
      let gooeyBlend = 0;
      if (cfg.gooeyHover && cfg.hoverEnabled && cfg.gooeyIntensity > 0.01) {
        const gf = getGooeyFactor(x, y, cols, rows, mCol, mRow, cellW, cellH, gooeyTime, cfg, mouseOnCanvas);
        gooeyBlend = gf.blend;
        if (gf.scramble > 0.01) {
          // Scramble character index
          const scrambleOffset = Math.floor(gf.scramble * charLen * brightness);
          ci = Math.floor((ci + scrambleOffset) % charLen);
          ch = chars[ci];
        }
        if (gooeyBlend > 0.01) {
          // Blend towards original photo RGB inside gooey zone
          fr = fr + (r - fr) * gooeyBlend;
          fg = fg + (g - fg) * gooeyBlend;
          fb = fb + (b - fb) * gooeyBlend;
        }
      }

      // ── Glow Trail ──
      let glowAmt = 0;
      if (cfg.glowTrail && cfg.hoverEnabled && cfg.glowPoints.length > 0) {
        const pixX = x * cellW + cellW / 2;
        const pixY = y * cellH + cellH / 2;
        glowAmt = getGlowFactor(pixX, pixY, cellW, cellH, cfg);
        if (glowAmt > 0.01) {
          // Brighten luminance → denser glyph
          const lumaBoost = Math.pow(glowAmt, 1.5) * 0.6;
          fB = Math.min(1, fB + lumaBoost);
          ci = Math.min(Math.floor(fB * (maxCI + 1)), maxCI);
          ch = chars[ci];
          // Screen blend: intensify colors with saturation boost
          const gInt = cfg.glowIntensity;
          const glowR = Math.min(255, r * gInt);
          const glowG = Math.min(255, g * gInt);
          const glowB = Math.min(255, b * gInt);
          // Screen blend: 1 - (1-base)(1-glow)
          const screenR = 255 - (255 - fr) * (255 - glowR * glowAmt) / 255;
          const screenG = 255 - (255 - fg) * (255 - glowG * glowAmt) / 255;
          const screenB = 255 - (255 - fb) * (255 - glowB * glowAmt) / 255;
          fr = Math.min(255, screenR);
          fg = Math.min(255, screenG);
          fb = Math.min(255, screenB);
        }
      }

      frameChars[idx] = ch;
      frameColors[idx] = `rgb(${Math.round(fr)},${Math.round(fg)},${Math.round(fb)})`;

      if (movedSet.has(`${x},${y}`)) continue;

      if (hoverFactor > 0.5) { ctx.fillStyle=`rgb(${Math.round(fr)},${Math.round(fg)},${Math.round(fb)})`; ctx.fillRect(px2,py2,pw,ph); continue; }

      // Gooey: fill pixel block inside zone for photo reveal
      if (gooeyBlend > 0.5) {
        ctx.globalAlpha = mix;
        ctx.fillStyle = `rgb(${Math.round(fr)},${Math.round(fg)},${Math.round(fb)})`;
        ctx.fillRect(px2, py2, pw, ph);
        ctx.globalAlpha = 1.0;
        continue;
      }

      if (ch === ' ') continue;

      ctx.globalAlpha = reveal ? reveal.revealMask[idx] * mix : mix;
      ctx.fillStyle = frameColors[idx];
      ctx.fillText(ch, px2, py2);
      ctx.globalAlpha = 1.0;
    }

    // ── Draw moved groups (lasso selections) ──
    for (const grp of movedGroups) {
      for (const cell of grp.cells) {
        if (cell.char === ' ') continue;
        const px3 = Math.floor((cell.col + grp.offsetCol) * cellW);
        const py3 = Math.floor((cell.row + grp.offsetRow) * cellH);
        ctx.globalAlpha = mix;
        ctx.fillStyle = cell.color;
        ctx.fillText(cell.char, px3, py3);
        ctx.globalAlpha = 1.0;
      }
    }

    if (activeSelection && activeSelection.cells) {
      for (const cell of activeSelection.cells) {
        if (cell.char === ' ') continue;
        const px3 = Math.floor((cell.col + activeSelection.offsetCol) * cellW);
        const py3 = Math.floor((cell.row + activeSelection.offsetRow) * cellH);
        ctx.globalAlpha = mix;
        ctx.fillStyle = cell.color;
        ctx.fillText(cell.char, px3, py3);
        ctx.globalAlpha = 1.0;
      }
    }

    // ── Capture frame data for exports ──
    lastCapturedFrame = { chars: frameChars, colors: frameColors, cols, rows, cellW, cellH };

    // ── HDR bloom overlay ──
    computeBloom(asciiCanvas, hdrCanvas, hdrCtx, bloomBufA, bloomBufB, cfg);

    // ── Apply layer state (visibility/opacity) ──
    sourceCanvas.style.opacity = cfg.sourceVisible ? cfg.sourceOpacity : 0;
    asciiCanvas.style.opacity = cfg.asciiVisible ? cfg.asciiOpacity : 0;
    hdrCanvas.style.opacity = (cfg.asciiVisible && cfg.hdrEnabled) ? cfg.asciiOpacity : 0;

    animFrameId = requestAnimationFrame(renderASCII);
  }

  // Kick off
  animFrameId = requestAnimationFrame(renderASCII);

  // Return cleanup function
  return function stopLoop() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  };
}

