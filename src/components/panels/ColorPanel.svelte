<script>
  import { onMount } from 'svelte';
  import { config } from '../../stores/config.js';
  import { ui } from '../../stores/ui.js';
  import { debouncedCommit } from '../../stores/undo.js';

  let mode = $derived($ui.colorMode);

  let svCanvas, hueCanvas, svWrap;
  let svDot, hueDot;
  let currentHue = $state(0);
  let currentSat = $state(0);
  let currentVal = $state(100);
  let draggingSV = false;
  let draggingHue = false;

  function hsbToRgb(h, s, v) {
    s /= 100; v /= 100;
    const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
    let r, g, b;
    if (h < 60)      { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else              { r = c; g = 0; b = x; }
    return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
  }

  function rgbToHsb(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d + 6) % 6;
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h, s: max ? (d / max) * 100 : 0, b: max * 100 };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function drawSV() {
    if (!svCanvas) return;
    const ctx = svCanvas.getContext('2d');
    const w = svCanvas.width = svCanvas.offsetWidth;
    const h = svCanvas.height = svCanvas.offsetHeight;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const s = (x / w) * 100;
        const v = (1 - y / h) * 100;
        const { r, g, b } = hsbToRgb(currentHue, s, v);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }

  function drawHue() {
    if (!hueCanvas) return;
    const ctx = hueCanvas.getContext('2d');
    const w = hueCanvas.width = hueCanvas.offsetWidth;
    const h = hueCanvas.height = hueCanvas.offsetHeight;
    for (let x = 0; x < w; x++) {
      const hue = (x / w) * 360;
      const { r, g, b } = hsbToRgb(hue, 100, 100);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, 0, 1, h);
    }
  }

  function applyColor() {
    const rgb = hsbToRgb(currentHue, currentSat, currentVal);
    config.update(c => ({ ...c, canvasColor: rgb }));
    debouncedCommit();
  }

  function onSVPointer(e) {
    if (!svWrap) return;
    const rect = svWrap.getBoundingClientRect();
    currentSat = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    currentVal = Math.max(0, Math.min(100, (1 - (e.clientY - rect.top) / rect.height) * 100));
    applyColor();
  }

  function onHuePointer(e) {
    if (!hueCanvas) return;
    const rect = hueCanvas.parentElement.getBoundingClientRect();
    currentHue = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
    drawSV();
    applyColor();
  }

  function handleGlobalMove(e) {
    if (draggingSV) onSVPointer(e);
    if (draggingHue) onHuePointer(e);
  }
  function handleGlobalUp() {
    draggingSV = false;
    draggingHue = false;
  }

  function setMode(m) {
    ui.update(u => ({ ...u, colorMode: m }));
  }
  onMount(() => {
    drawSV();
    drawHue();
    const col = $config.canvasColor;
    const hsb = rgbToHsb(col.r, col.g, col.b);
    currentHue = hsb.h;
    currentSat = hsb.s;
    currentVal = hsb.b;

    window.addEventListener('pointermove', handleGlobalMove);
    window.addEventListener('pointerup', handleGlobalUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalMove);
      window.removeEventListener('pointerup', handleGlobalUp);
    };
  });

  let svDotStyle = $derived(`left:${currentSat}%;top:${100 - currentVal}%`);
  let hueDotStyle = $derived(`left:${(currentHue / 360) * 100}%`);
  let currentRgb = $derived(hsbToRgb(currentHue, currentSat, currentVal));
  let hexVal = $derived(rgbToHex(currentRgb.r, currentRgb.g, currentRgb.b));
</script>

<div class="color-panel">
  <div class="cp-header">
    <span>Canvas Color</span>
  </div>

  <div class="cp-picker">
    <div class="sv-wrap" bind:this={svWrap}
      onpointerdown={(e) => { draggingSV = true; onSVPointer(e); }}>
      <canvas bind:this={svCanvas}></canvas>
      <div class="sv-dot" bind:this={svDot} style={svDotStyle}></div>
    </div>
    <div class="hue-wrap"
      onpointerdown={(e) => { draggingHue = true; onHuePointer(e); }}>
      <canvas bind:this={hueCanvas}></canvas>
      <div class="hue-dot" bind:this={hueDot} style={hueDotStyle}></div>
    </div>

    <div class="cp-mode-tabs">
      <button class:active={mode === 'hex'} onclick={() => setMode('hex')}>HEX</button>
      <button class:active={mode === 'rgb'} onclick={() => setMode('rgb')}>RGB</button>
      <button class:active={mode === 'hsb'} onclick={() => setMode('hsb')}>HSB</button>
    </div>
    <div class="cp-fields">
      {#if mode === 'hex'}
        <div class="cp-field-row">
          <label>#</label>
          <input type="text" value={hexVal.slice(1)} onchange={(e) => {
            const hex = '#' + e.target.value.replace('#', '');
            const m = hex.match(/^#([0-9a-f]{6})$/i);
            if (m) {
              const r = parseInt(m[1].slice(0,2), 16);
              const g = parseInt(m[1].slice(2,4), 16);
              const b = parseInt(m[1].slice(4,6), 16);
              const hsb = rgbToHsb(r, g, b);
              currentHue = hsb.h; currentSat = hsb.s; currentVal = hsb.b;
              drawSV(); applyColor();
            }
          }} />
        </div>
      {:else if mode === 'rgb'}
        <div class="cp-field-row">
          <label>R</label>
          <input type="number" min={0} max={255} value={currentRgb.r} oninput={(e) => {
            const hsb = rgbToHsb(Number(e.target.value), currentRgb.g, currentRgb.b);
            currentHue = hsb.h; currentSat = hsb.s; currentVal = hsb.b;
            drawSV(); applyColor();
          }} />
        </div>
        <div class="cp-field-row">
          <label>G</label>
          <input type="number" min={0} max={255} value={currentRgb.g} oninput={(e) => {
            const hsb = rgbToHsb(currentRgb.r, Number(e.target.value), currentRgb.b);
            currentHue = hsb.h; currentSat = hsb.s; currentVal = hsb.b;
            drawSV(); applyColor();
          }} />
        </div>
        <div class="cp-field-row">
          <label>B</label>
          <input type="number" min={0} max={255} value={currentRgb.b} oninput={(e) => {
            const hsb = rgbToHsb(currentRgb.r, currentRgb.g, Number(e.target.value));
            currentHue = hsb.h; currentSat = hsb.s; currentVal = hsb.b;
            drawSV(); applyColor();
          }} />
        </div>
      {:else}
        <div class="cp-field-row">
          <label>H</label>
          <input type="number" min={0} max={360} value={Math.round(currentHue)} oninput={(e) => {
            currentHue = Number(e.target.value);
            drawSV(); applyColor();
          }} />
        </div>
        <div class="cp-field-row">
          <label>S</label>
          <input type="number" min={0} max={100} value={Math.round(currentSat)} oninput={(e) => {
            currentSat = Number(e.target.value); applyColor();
          }} />
        </div>
        <div class="cp-field-row">
          <label>B</label>
          <input type="number" min={0} max={100} value={Math.round(currentVal)} oninput={(e) => {
            currentVal = Number(e.target.value); applyColor();
          }} />
        </div>
      {/if}
    </div>
  </div>
</div>
