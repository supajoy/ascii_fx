const rainChars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホ';

export function getAnimatedSource(cols, rows, animStartTime, cfg) {
  const t = (performance.now() - animStartTime) / 1000;
  const speed = Math.pow(cfg.animSpeed / 50, 1.5);
  const amp = cfg.animAmplitude / 100;
  const total = cols * rows;
  const offsets = new Float32Array(total * 2);
  const type = cfg.animType;

  if (type === 'default') {
    const strength = 2.5 + amp * 6;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      const h1 = Math.sin(x * 127.1 + y * 311.7 + t * 3.0 * speed) * 43758.5453;
      const h2 = Math.sin(x * 269.5 + y * 183.3 + t * 2.3 * speed) * 21037.1289;
      const n1 = (h1 - Math.floor(h1)) - 0.5;
      const n2 = (h2 - Math.floor(h2)) - 0.5;
      const wave = Math.sin(x * 0.15 + y * 0.12 + t * 0.8 * speed) * 0.5 + 0.5;
      offsets[idx*2]     = n1 * strength * (0.4 + wave * 0.6);
      offsets[idx*2 + 1] = n2 * strength * (0.3 + wave * 0.7);
    }
    return offsets;
  } else if (type === 'wave') {
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      offsets[idx*2] = 0;
      offsets[idx*2+1] = Math.sin(x * 0.15 + t * 3 * speed) * amp * 4;
    }
  } else if (type === 'breathe') {
    const pulse = (Math.sin(t * 2 * speed) + 1) * 0.5 * amp;
    for (let i = 0; i < total; i++) {
      const x = i % cols, y = Math.floor(i / cols);
      const cx = cols/2, cy = rows/2;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const maxDist = Math.sqrt(cx*cx + cy*cy);
      const factor = pulse * (dist / maxDist) * 0.5;
      offsets[i*2] = dx * factor * 0.1;
      offsets[i*2+1] = dy * factor * 0.1;
    }
  } else if (type === 'rain') {
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      const colSeed = Math.sin(x * 127.1 + 311.7) * 43758.5453;
      const colHash = colSeed - Math.floor(colSeed);
      const fallSpeed = (0.5 + colHash) * speed * 8;
      const yOff = (t * fallSpeed + colHash * rows) % (rows * 1.5);
      if (Math.abs(y - yOff) < amp * 6) {
        offsets[idx*2] = 0;
        offsets[idx*2+1] = (y - yOff) * 0.3;
      }
    }
  } else if (type === 'glitch') {
    const glitchSeed = Math.floor(t * 6 * speed);
    for (let y = 0; y < rows; y++) {
      const rowHash = Math.sin(y * 43.1 + glitchSeed * 17.3) * 43758.5453;
      const rh = rowHash - Math.floor(rowHash);
      const shift = rh > (1 - amp * 0.3) ? (rh - 0.5) * 20 * amp : 0;
      for (let x = 0; x < cols; x++) {
        const idx = y * cols + x;
        offsets[idx*2] = shift;
        offsets[idx*2+1] = 0;
      }
    }
  } else if (type === 'flow') {
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      offsets[idx*2] = t * speed * 5 * amp + Math.sin(y * 0.2) * amp * 2;
      offsets[idx*2+1] = 0;
    }
  }
  return offsets;
}

export function renderStandaloneAnim(ctx, W, H, animStartTime, cfg) {
  const fontSize = cfg.fontSize;
  const cellW = fontSize * 0.6, cellH = fontSize * cfg.lineHeight;
  const cols = Math.ceil(W / cellW), rows = Math.ceil(H / cellH);
  const t = (performance.now() - animStartTime) / 1000;
  const speed = Math.pow(cfg.animSpeed / 50, 1.5);
  const amp = cfg.animAmplitude / 100;
  const chars = cfg.chars, charLen = chars.length;
  const type = cfg.animType;

  ctx.clearRect(0, 0, W, H);
  ctx.font = `${fontSize}px "Courier New","Consolas",monospace`;
  ctx.textBaseline = 'top';

  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    let ch = ' ', alpha = 0.7, cr = 180, cg = 175, cb = 180;
    if (type === 'default') {
      const brt = 0.3 + Math.sin(x * 0.15 + y * 0.12 + t * 0.8 * speed) * 0.2 + Math.sin(x * 0.08 - y * 0.06 + t * 1.2 * speed) * 0.15;
      const ci = Math.min(Math.floor(Math.max(0, brt) * charLen), charLen - 1);
      ch = chars[ci]; alpha = 0.3 + brt * 0.5;
      cr = 120 + brt * 100; cg = 115 + brt * 95; cb = 125 + brt * 100;
    } else if (type === 'wave') {
      const off = Math.sin(x * 0.15 + t * 3 * speed) * amp * 4;
      const srcY = y + Math.round(off);
      const brt = Math.max(0, Math.min(1, 0.5 + Math.sin(x * 0.2 + srcY * 0.1 + t) * 0.3));
      const ci = Math.min(Math.floor(brt * charLen), charLen - 1);
      ch = chars[ci]; alpha = 0.4 + brt * 0.6;
      cr = 100 + brt * 155; cg = 90 + brt * 140; cb = 110 + brt * 145;
    } else if (type === 'breathe') {
      const pulse = (Math.sin(t * 2 * speed) + 1) * 0.5;
      const cx2 = cols / 2, cy2 = rows / 2;
      const dist = Math.sqrt((x - cx2) * (x - cx2) + (y - cy2) * (y - cy2));
      const maxD = Math.sqrt(cx2 * cx2 + cy2 * cy2);
      const brt = Math.max(0, pulse * (1 - dist / maxD * amp));
      const ci = Math.min(Math.floor(brt * charLen), charLen - 1);
      ch = chars[ci]; alpha = 0.3 + brt * 0.7;
      cr = 80 + brt * 175; cg = 80 + brt * 175; cb = 90 + brt * 165;
    } else if (type === 'rain') {
      const colSeed = Math.sin(x * 127.1 + 311.7) * 43758.5453;
      const colHash = colSeed - Math.floor(colSeed);
      const fallSpeed = (0.5 + colHash) * speed * 8;
      const yOff = (t * fallSpeed + colHash * rows) % (rows * 1.5);
      const dist2 = y - yOff;
      if (dist2 > 0 && dist2 < amp * 12) {
        const brt = 1 - dist2 / (amp * 12);
        ch = rainChars[(Math.floor(t * 12 + x * 7 + y * 3) % rainChars.length)];
        alpha = brt * 0.9;
        cr = 20; cg = Math.floor(120 + brt * 135); cb = 40;
      } else { ch = ' '; alpha = 0; }
    } else if (type === 'glitch') {
      const gs = Math.floor(t * 6 * speed);
      const rh2 = Math.sin(y * 43.1 + gs * 17.3) * 43758.5453;
      const rv = rh2 - Math.floor(rh2);
      if (rv > (1 - amp * 0.3)) {
        const shift = Math.floor((rv - 0.5) * 20 * amp);
        const sx = (x + shift + cols) % cols;
        const brt = 0.5 + Math.sin(sx * 0.3 + y * 0.2) * 0.3;
        const ci = Math.min(Math.floor(brt * charLen), charLen - 1);
        ch = chars[ci]; alpha = 0.8;
        cr = 200 + Math.floor(Math.random() * 55); cg = 50; cb = 50;
      } else {
        const brt = 0.3 + Math.sin(x * 0.15 + y * 0.1) * 0.15;
        const ci = Math.min(Math.floor(brt * charLen), charLen - 1);
        ch = chars[ci]; alpha = 0.35;
        cr = 140; cg = 135; cb = 140;
      }
    } else if (type === 'flow') {
      const flowOff = t * speed * 5 * amp + Math.sin(y * 0.2) * amp * 2;
      const sx = ((x + Math.floor(flowOff)) % cols + cols) % cols;
      const brt = 0.4 + Math.sin(sx * 0.2 + y * 0.15 + t * 0.5) * 0.3;
      const ci = Math.min(Math.floor(brt * charLen), charLen - 1);
      ch = chars[ci]; alpha = 0.4 + brt * 0.5;
      cr = 80 + brt * 140; cg = 100 + brt * 130; cb = 120 + brt * 135;
    }
    if (ch === ' ' || alpha < 0.02) continue;
    ctx.globalAlpha = alpha * cfg.mix;
    ctx.fillStyle = `rgb(${Math.round(cr)},${Math.round(cg)},${Math.round(cb)})`;
    ctx.fillText(ch, x * cellW, y * cellH);
  }
  ctx.globalAlpha = 1;
}
