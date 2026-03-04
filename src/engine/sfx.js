// ── Minimal SFX via Web Audio API ────────────────────────────────────
// Retro tactile feedback sounds — all synthesized, no external files.

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Short clicky blip — buttons, sliders
export function playClick() {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g); g.connect(c.destination);
  osc.type = 'square';
  osc.frequency.value = 1000;
  g.gain.setValueAtTime(0.06, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.03);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.03);
}

// Two-tone chirp up — toggle ON
export function playToggleOn() {
  const c = getCtx();
  const t = c.currentTime;
  [660, 990].forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g); g.connect(c.destination);
    osc.type = 'square';
    osc.frequency.value = freq;
    const start = t + i * 0.045;
    g.gain.setValueAtTime(0.05, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.05);
    osc.start(start);
    osc.stop(start + 0.05);
  });
}

// Two-tone chirp down — toggle OFF
export function playToggleOff() {
  const c = getCtx();
  const t = c.currentTime;
  [880, 440].forEach((freq, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.connect(g); g.connect(c.destination);
    osc.type = 'square';
    osc.frequency.value = freq;
    const start = t + i * 0.045;
    g.gain.setValueAtTime(0.05, start);
    g.gain.exponentialRampToValueAtTime(0.001, start + 0.05);
    osc.start(start);
    osc.stop(start + 0.05);
  });
}

// Camera shutter noise burst — export actions
export function playShutter() {
  const c = getCtx();
  const len = c.sampleRate * 0.08;
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.12));
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = 'bandpass'; filt.frequency.value = 2200; filt.Q.value = 0.7;
  const g = c.createGain();
  src.connect(filt); filt.connect(g); g.connect(c.destination);
  g.gain.setValueAtTime(0.1, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08);
  src.start(c.currentTime);
}

// Soft tab switch pip
export function playTab() {
  const c = getCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.connect(g); g.connect(c.destination);
  osc.type = 'sine';
  osc.frequency.value = 1400;
  g.gain.setValueAtTime(0.03, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.02);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + 0.02);
}
