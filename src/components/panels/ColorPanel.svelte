<script>
  import { onMount } from 'svelte';
  import { config } from '../../stores/config.js';
  import { debouncedCommit } from '../../stores/undo.js';
  import { playClick } from '../../engine/sfx.js';

  let canvasColor = $derived($config.canvasColor);

  let hue = $state(0);
  let sat = $state(0);
  let val = $state(0);
  let open = $state(false);
  let pickerOpen = $state(false);

  let svCanvas = $state(null);
  let hueCanvas = $state(null);
  let svWrap = $state(null);
  let draggingSV = false;
  let draggingHue = false;

  function hsbToRgb(h, s, v) {
    s /= 100; v /= 100;
    const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
    let r, g, b;
    if (h < 60)       { r = c; g = x; b = 0; }
    else if (h < 120)  { r = x; g = c; b = 0; }
    else if (h < 180)  { r = 0; g = c; b = x; }
    else if (h < 240)  { r = 0; g = x; b = c; }
    else if (h < 300)  { r = x; g = 0; b = c; }
    else               { r = c; g = 0; b = x; }
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

  let rgb = $derived(hsbToRgb(hue, sat, val));
  let hexVal = $derived(rgbToHex(rgb.r, rgb.g, rgb.b));
  let svDotStyle = $derived(`left:${sat}%;top:${100 - val}%`);
  let hueDotStyle = $derived(`left:${(hue / 360) * 100}%`);

  function apply() {
    const c = hsbToRgb(hue, sat, val);
    config.update(cfg => ({ ...cfg, canvasColor: c }));
    debouncedCommit();
  }

  function setHex(e) {
    const hex = '#' + e.target.value.replace('#', '');
    const m = hex.match(/^#([0-9a-f]{6})$/i);
    if (m) {
      const r = parseInt(m[1].slice(0, 2), 16), g = parseInt(m[1].slice(2, 4), 16), b = parseInt(m[1].slice(4, 6), 16);
      const hsb = rgbToHsb(r, g, b);
      hue = hsb.h; sat = hsb.s; val = hsb.b;
      apply();
    }
  }

  function setRgbChannel(ch, e) {
    const v = Math.max(0, Math.min(255, Number(e.target.value)));
    const c = { ...rgb };
    c[ch] = v;
    const hsb = rgbToHsb(c.r, c.g, c.b);
    hue = hsb.h; sat = hsb.s; val = hsb.b;
    apply();
  }

  function drawSV() {
    if (!svCanvas) return;
    const ctx = svCanvas.getContext('2d');
    const w = svCanvas.width = svCanvas.offsetWidth;
    const h = svCanvas.height = svCanvas.offsetHeight;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const s = (x / w) * 100, v = (1 - y / h) * 100;
        const { r, g, b } = hsbToRgb(hue, s, v);
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
      const h2 = (x / w) * 360;
      const { r, g, b } = hsbToRgb(h2, 100, 100);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, 0, 1, h);
    }
  }

  function onSVPointer(e) {
    if (!svWrap) return;
    const rect = svWrap.getBoundingClientRect();
    sat = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    val = Math.max(0, Math.min(100, (1 - (e.clientY - rect.top) / rect.height) * 100));
    apply();
  }

  function onHuePointer(e) {
    if (!hueCanvas) return;
    const rect = hueCanvas.parentElement.getBoundingClientRect();
    hue = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
    drawSV(); apply();
  }

  function handleGlobalMove(e) {
    if (draggingSV) onSVPointer(e);
    if (draggingHue) onHuePointer(e);
  }
  function handleGlobalUp() { draggingSV = false; draggingHue = false; }

  function togglePicker() {
    pickerOpen = !pickerOpen;
    if (pickerOpen) {
      open = true;
      requestAnimationFrame(() => { drawSV(); drawHue(); });
    }
  }

  onMount(() => {
    const col = $config.canvasColor;
    const hsb = rgbToHsb(col.r, col.g, col.b);
    hue = hsb.h; sat = hsb.s; val = hsb.b;
    window.addEventListener('pointermove', handleGlobalMove);
    window.addEventListener('pointerup', handleGlobalUp);
    return () => {
      window.removeEventListener('pointermove', handleGlobalMove);
      window.removeEventListener('pointerup', handleGlobalUp);
    };
  });
</script>

<div class="sidebar-section" class:collapsed={!open}>
  <div class="section-header" onclick={() => { open = !open; playClick(); }}>Canvas Color</div>
  <div class="section-body ascii-color-preview">
    <div class="ascii-inline-row">
      <button class="ascii-hex-display" style="background:{hexVal}" onclick={togglePicker} title="Open color picker"></button>
      <span class="ascii-hex-label">#</span>
      <input type="text" class="ascii-hex-input" value={hexVal.slice(1)} onchange={setHex} />
    </div>
  </div>
  {#if open}
    <div class="section-body">
      {#if pickerOpen}
        <div class="ascii-picker-popout">
          <div class="ascii-sv-wrap" bind:this={svWrap}
            onpointerdown={(e) => { draggingSV = true; onSVPointer(e); }}>
            <canvas bind:this={svCanvas}></canvas>
            <div class="sv-dot" style={svDotStyle}></div>
          </div>
          <div class="ascii-hue-wrap"
            onpointerdown={(e) => { draggingHue = true; onHuePointer(e); }}>
            <canvas bind:this={hueCanvas}></canvas>
            <div class="hue-dot" style={hueDotStyle}></div>
          </div>
        </div>
      {/if}

      <div class="ctrl-row">
        <span class="ctrl-label">R</span>
        <input type="range" min={0} max={255} value={rgb.r} oninput={(e) => setRgbChannel('r', e)} />
        <input type="number" class="ctrl-num" min={0} max={255} value={rgb.r} oninput={(e) => setRgbChannel('r', e)} />
      </div>
      <div class="ctrl-row">
        <span class="ctrl-label">G</span>
        <input type="range" min={0} max={255} value={rgb.g} oninput={(e) => setRgbChannel('g', e)} />
        <input type="number" class="ctrl-num" min={0} max={255} value={rgb.g} oninput={(e) => setRgbChannel('g', e)} />
      </div>
      <div class="ctrl-row">
        <span class="ctrl-label">B</span>
        <input type="range" min={0} max={255} value={rgb.b} oninput={(e) => setRgbChannel('b', e)} />
        <input type="number" class="ctrl-num" min={0} max={255} value={rgb.b} oninput={(e) => setRgbChannel('b', e)} />
      </div>
      <div class="ctrl-row">
        <span class="ctrl-label">H</span>
        <input type="range" min={0} max={360} value={Math.round(hue)} oninput={(e) => { hue = Number(e.target.value); drawSV(); apply(); }} />
        <input type="number" class="ctrl-num" min={0} max={360} value={Math.round(hue)} oninput={(e) => { hue = Number(e.target.value); drawSV(); apply(); }} />
      </div>
      <div class="ctrl-row">
        <span class="ctrl-label">S</span>
        <input type="range" min={0} max={100} value={Math.round(sat)} oninput={(e) => { sat = Number(e.target.value); apply(); }} />
        <input type="number" class="ctrl-num" min={0} max={100} value={Math.round(sat)} oninput={(e) => { sat = Number(e.target.value); apply(); }} />
      </div>
      <div class="ctrl-row">
        <span class="ctrl-label">V</span>
        <input type="range" min={0} max={100} value={Math.round(val)} oninput={(e) => { val = Number(e.target.value); apply(); }} />
        <input type="number" class="ctrl-num" min={0} max={100} value={Math.round(val)} oninput={(e) => { val = Number(e.target.value); apply(); }} />
      </div>
    </div>
  {/if}
</div>
