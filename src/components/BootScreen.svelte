<script>
  import { onMount } from 'svelte';

  let { onComplete = () => {} } = $props();

  let phase = $state('boot');     // boot → load → ready → wipe
  let loadPct = $state(0);
  let lines = $state([]);
  let showCursor = $state(true);
  let wiping = $state(false);

  const BOOT_LINES = [
    { text: '> INITIALIZING SYSTEM...', delay: 0 },
    { text: '> LOADING ASCII ENGINE v2.0', delay: 200 },
    { text: '> CHECKING PIXEL BUFFER [OK]', delay: 400 },
    { text: '> MAPPING CHARACTER SET [OK]', delay: 550 },
    { text: '> CALIBRATING RETRO CRT [OK]', delay: 700 },
  ];

  function getCtx() {
    const c = new (window.AudioContext || window.webkitAudioContext)();
    if (c.state === 'suspended') c.resume();
    return c;
  }

  function playBootBeep() {
    try {
      const c = getCtx();
      const t = c.currentTime;
      // Classic BIOS POST beep
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.connect(g); g.connect(c.destination);
      osc.type = 'square';
      osc.frequency.value = 800;
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t);
      osc.stop(t + 0.12);
    } catch {}
  }

  function playTypeTick() {
    try {
      const c = getCtx();
      const t = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.connect(g); g.connect(c.destination);
      osc.type = 'square';
      osc.frequency.value = 1200 + Math.random() * 400;
      g.gain.setValueAtTime(0.03, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.015);
      osc.start(t);
      osc.stop(t + 0.015);
    } catch {}
  }

  function playLoadTick() {
    try {
      const c = getCtx();
      const t = c.currentTime;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.connect(g); g.connect(c.destination);
      osc.type = 'triangle';
      osc.frequency.value = 440 + Math.random() * 200;
      g.gain.setValueAtTime(0.02, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.02);
      osc.start(t);
      osc.stop(t + 0.02);
    } catch {}
  }

  function playReadyChime() {
    try {
      const c = getCtx();
      const t = c.currentTime;
      // 3-note ascending chime
      [523, 659, 784].forEach((freq, i) => {
        const osc = c.createOscillator();
        const g = c.createGain();
        osc.connect(g); g.connect(c.destination);
        osc.type = 'square';
        osc.frequency.value = freq;
        const start = t + i * 0.08;
        g.gain.setValueAtTime(0.05, start);
        g.gain.exponentialRampToValueAtTime(0.001, start + 0.15);
        osc.start(start);
        osc.stop(start + 0.15);
      });
    } catch {}
  }

  onMount(() => {
    playBootBeep();

    // Cursor blink
    const cursorInterval = setInterval(() => { showCursor = !showCursor; }, 400);

    // Typewriter boot lines
    BOOT_LINES.forEach(({ text, delay }, idx) => {
      setTimeout(() => {
        playTypeTick();
        lines = [...lines, text];
      }, delay);
    });

    // Start loading bar after boot lines
    setTimeout(() => {
      phase = 'load';
      let pct = 0;
      const loadInterval = setInterval(() => {
        pct += Math.random() * 12 + 3;
        if (pct >= 100) {
          pct = 100;
          clearInterval(loadInterval);
          setTimeout(() => {
            phase = 'ready';
            playReadyChime();
            // Wipe out after showing READY
            setTimeout(() => {
              wiping = true;
              setTimeout(() => {
                clearInterval(cursorInterval);
                onComplete();
              }, 500);
            }, 600);
          }, 200);
        }
        loadPct = Math.min(100, Math.round(pct));
        playLoadTick();
      }, 60);
    }, 850);

    return () => clearInterval(cursorInterval);
  });

  let barWidth = $derived(loadPct);
  let barStr = $derived(() => {
    const filled = Math.round(loadPct / 100 * 20);
    return '█'.repeat(filled) + '░'.repeat(20 - filled);
  });
</script>

<div class="boot-screen" class:wipe-out={wiping}>
  <div class="boot-inner">
    <!-- ASCII Logo -->
    <pre class="boot-logo">{`
 █████╗ ███████╗ ██████╗██╗██╗    ███████╗██╗  ██╗
██╔══██╗██╔════╝██╔════╝██║██║    ██╔════╝╚██╗██╔╝
███████║███████╗██║     ██║██║    █████╗   ╚███╔╝
██╔══██║╚════██║██║     ██║██║    ██╔══╝   ██╔██╗
██║  ██║███████║╚██████╗██║██║    ██║     ██╔╝ ██╗
╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝╚═╝    ╚═╝     ╚═╝  ╚═╝`}</pre>

    <div class="boot-version">v2.0 — RETRO ENGINE</div>

    <!-- Boot log lines -->
    <div class="boot-log">
      {#each lines as line}
        <div class="boot-line">{line}</div>
      {/each}
    </div>

    <!-- Loading bar -->
    {#if phase === 'load' || phase === 'ready'}
      <div class="boot-bar-wrap">
        <span class="boot-bar-label">LOADING</span>
        <div class="boot-bar">
          <div class="boot-bar-fill" style="width: {barWidth}%"></div>
        </div>
        <span class="boot-bar-pct">{loadPct}%</span>
      </div>
      <div class="boot-bar-ascii">[{barStr()}]</div>
    {/if}

    <!-- READY flash -->
    {#if phase === 'ready'}
      <div class="boot-ready">
        ▸ READY {showCursor ? '█' : ' '}
      </div>
    {/if}

    {#if phase === 'boot' || phase === 'load'}
      <div class="boot-cursor">{showCursor ? '█' : ' '}</div>
    {/if}
  </div>

  <!-- Scanlines on boot screen -->
  <div class="boot-scanlines"></div>
</div>

<style>
  .boot-screen {
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    z-index: 9999;
    background: #0a0a0a;
    display: flex; align-items: center; justify-content: center;
    font-family: 'VT323', monospace;
    color: #ff5454;
    overflow: hidden;
    animation: crt-on 0.3s ease-out;
  }

  @keyframes crt-on {
    0% { opacity: 0; transform: scaleY(0.005) scaleX(0.4); filter: brightness(8); }
    40% { opacity: 1; transform: scaleY(0.005) scaleX(0.4); filter: brightness(4); }
    60% { transform: scaleY(1) scaleX(0.4); filter: brightness(2); }
    80% { transform: scaleY(1) scaleX(1); filter: brightness(1.2); }
    100% { transform: scaleY(1) scaleX(1); filter: brightness(1); }
  }

  .boot-screen.wipe-out {
    animation: wipe-dissolve 0.5s ease-in forwards;
  }

  @keyframes wipe-dissolve {
    0% { opacity: 1; transform: scale(1); filter: brightness(1); }
    30% { filter: brightness(3); }
    60% { opacity: 0.6; transform: scale(1.02); filter: brightness(4); }
    100% { opacity: 0; transform: scaleY(0.005); filter: brightness(8); }
  }

  .boot-inner {
    display: flex; flex-direction: column; align-items: center;
    gap: 8px;
    max-width: 600px;
    width: 100%;
    padding: 0 20px;
  }

  .boot-logo {
    font-size: 10px;
    line-height: 1.15;
    color: #ff5454;
    text-align: center;
    white-space: pre;
    text-shadow: 0 0 10px rgba(255,84,84,0.4);
    animation: logo-glow 1.5s ease-in-out infinite alternate;
  }

  @keyframes logo-glow {
    from { text-shadow: 0 0 6px rgba(255,84,84,0.3); }
    to { text-shadow: 0 0 16px rgba(255,84,84,0.6), 0 0 30px rgba(255,84,84,0.2); }
  }

  .boot-version {
    font-size: 14px;
    color: rgba(255,84,84,0.5);
    letter-spacing: 4px;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .boot-log {
    width: 100%;
    max-width: 400px;
    min-height: 80px;
  }

  .boot-line {
    font-size: 14px;
    color: #c8c8c8;
    line-height: 1.6;
    animation: line-in 0.1s ease-out;
    font-family: 'Share Tech Mono', monospace;
  }

  @keyframes line-in {
    from { opacity: 0; transform: translateX(-4px); }
    to { opacity: 1; transform: translateX(0); }
  }

  .boot-bar-wrap {
    display: flex; align-items: center; gap: 10px;
    width: 100%; max-width: 400px;
    margin-top: 6px;
  }

  .boot-bar-label {
    font-size: 12px;
    color: rgba(255,84,84,0.6);
    letter-spacing: 2px;
    flex-shrink: 0;
    font-family: 'Share Tech Mono', monospace;
  }

  .boot-bar {
    flex: 1;
    height: 8px;
    background: #1c1c1c;
    border: 1px solid #3e3e3e;
    overflow: hidden;
  }

  .boot-bar-fill {
    height: 100%;
    background: #ff5454;
    transition: width 0.05s linear;
    box-shadow: 0 0 6px rgba(255,84,84,0.5);
  }

  .boot-bar-pct {
    font-size: 14px;
    color: #ff5454;
    min-width: 36px;
    text-align: right;
  }

  .boot-bar-ascii {
    font-size: 14px;
    color: rgba(255,84,84,0.4);
    letter-spacing: 1px;
    font-family: 'Share Tech Mono', monospace;
    text-align: center;
    margin-top: 2px;
  }

  .boot-ready {
    font-size: 24px;
    color: #ff5454;
    letter-spacing: 6px;
    text-transform: uppercase;
    margin-top: 12px;
    text-shadow: 0 0 12px rgba(255,84,84,0.6);
    animation: ready-flash 0.3s ease-out;
  }

  @keyframes ready-flash {
    0% { opacity: 0; transform: scale(1.3); filter: brightness(3); }
    50% { opacity: 1; filter: brightness(2); }
    100% { transform: scale(1); filter: brightness(1); }
  }

  .boot-cursor {
    font-size: 16px;
    color: #ff5454;
    margin-top: 4px;
    opacity: 0.7;
  }

  .boot-scanlines {
    position: absolute; top: 0; left: 0; width: 100%; height: 100%;
    pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      transparent, transparent 1px,
      rgba(0,0,0,0.15) 1px, rgba(0,0,0,0.15) 2px
    );
    opacity: 0.4;
  }
</style>
