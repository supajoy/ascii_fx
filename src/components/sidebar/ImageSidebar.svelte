<script>
  import { onMount } from 'svelte';
  import { config } from '../../stores/config.js';
  import { ui } from '../../stores/ui.js';
  import { debouncedCommit } from '../../stores/undo.js';
  import { playClick, playTab } from '../../engine/sfx.js';
  import Section from './Section.svelte';
  import CharPanel from '../panels/CharPanel.svelte';
  import EffectsPanel from '../panels/EffectsPanel.svelte';
  import AnimPanel from '../panels/AnimPanel.svelte';
  import AppearSection from '../panels/AppearSection.svelte';
  import HoverSection from '../panels/HoverSection.svelte';
  import InteractExport from '../panels/InteractExport.svelte';
  import ExportPanel from '../panels/ExportPanel.svelte';

  let tab = $state('style');

  let fontSize = $derived($config.fontSize);
  let brightness = $derived(Math.round($config.brightnessBoost * 100));
  let mix = $derived(Math.round($config.mix * 100));
  let lineHeight = $derived(Math.round($config.lineHeight * 100));
  let effectIntensity = $derived($config.effectIntensity);
  let saturation = $derived(Math.round($config.saturationBoost * 100));
  let srcScale = $derived(Math.round($config.sourceScale * 100));
  let asciiOverride = $derived($config.asciiColorOverride);
  let tool = $derived($ui.activeTool);

  // ASCII color HSB state
  let asciiHue = $state(0);
  let asciiSat = $state(0);
  let asciiVal = $state(100);
  let pickerOpen = $state(false);
  let asciiColorOpen = $state(false);
  let asciiSvCanvas = $state(null);
  let asciiHueCanvas = $state(null);
  let asciiSvWrap = $state(null);
  let draggingAsciiSV = false;
  let draggingAsciiHue = false;

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

  let asciiRgb = $derived(hsbToRgb(asciiHue, asciiSat, asciiVal));
  let asciiHexVal = $derived(rgbToHex(asciiRgb.r, asciiRgb.g, asciiRgb.b));

  function applyAsciiColor() {
    const rgb = hsbToRgb(asciiHue, asciiSat, asciiVal);
    config.update(c => ({ ...c, asciiColor: rgb }));
    debouncedCommit();
  }
  function toggleAsciiOverride() {
    config.update(c => ({ ...c, asciiColorOverride: !c.asciiColorOverride }));
    debouncedCommit();
  }
  function setAsciiHex(e) {
    const hex = '#' + e.target.value.replace('#', '');
    const m = hex.match(/^#([0-9a-f]{6})$/i);
    if (m) {
      const r = parseInt(m[1].slice(0, 2), 16), g = parseInt(m[1].slice(2, 4), 16), b = parseInt(m[1].slice(4, 6), 16);
      const hsb = rgbToHsb(r, g, b);
      asciiHue = hsb.h; asciiSat = hsb.s; asciiVal = hsb.b;
      applyAsciiColor();
    }
  }
  function setAsciiRgbChannel(ch, e) {
    const val = Math.max(0, Math.min(255, Number(e.target.value)));
    const rgb = { ...asciiRgb };
    rgb[ch] = val;
    const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
    asciiHue = hsb.h; asciiSat = hsb.s; asciiVal = hsb.b;
    applyAsciiColor();
  }

  function drawAsciiSV() {
    if (!asciiSvCanvas) return;
    const ctx = asciiSvCanvas.getContext('2d');
    const w = asciiSvCanvas.width = asciiSvCanvas.offsetWidth;
    const h = asciiSvCanvas.height = asciiSvCanvas.offsetHeight;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const s = (x / w) * 100, v = (1 - y / h) * 100;
        const { r, g, b } = hsbToRgb(asciiHue, s, v);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  function drawAsciiHue() {
    if (!asciiHueCanvas) return;
    const ctx = asciiHueCanvas.getContext('2d');
    const w = asciiHueCanvas.width = asciiHueCanvas.offsetWidth;
    const h = asciiHueCanvas.height = asciiHueCanvas.offsetHeight;
    for (let x = 0; x < w; x++) {
      const hue = (x / w) * 360;
      const { r, g, b } = hsbToRgb(hue, 100, 100);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, 0, 1, h);
    }
  }
  function onAsciiSVPointer(e) {
    if (!asciiSvWrap) return;
    const rect = asciiSvWrap.getBoundingClientRect();
    asciiSat = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    asciiVal = Math.max(0, Math.min(100, (1 - (e.clientY - rect.top) / rect.height) * 100));
    applyAsciiColor();
  }
  function onAsciiHuePointer(e) {
    if (!asciiHueCanvas) return;
    const rect = asciiHueCanvas.parentElement.getBoundingClientRect();
    asciiHue = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360));
    drawAsciiSV();
    applyAsciiColor();
  }
  function handleAsciiPickerGlobalMove(e) {
    if (draggingAsciiSV) onAsciiSVPointer(e);
    if (draggingAsciiHue) onAsciiHuePointer(e);
  }
  function handleAsciiPickerGlobalUp() {
    draggingAsciiSV = false;
    draggingAsciiHue = false;
  }
  function togglePicker() {
    pickerOpen = !pickerOpen;
    if (pickerOpen) {
      // Auto-enable override and expand section
      if (!$config.asciiColorOverride) {
        config.update(c => ({ ...c, asciiColorOverride: true }));
        debouncedCommit();
      }
      asciiColorOpen = true;
      requestAnimationFrame(() => { drawAsciiSV(); drawAsciiHue(); });
    }
  }

  function setTab(t) { tab = t; playTab(); }
  function setTool(t) { ui.update(u => ({ ...u, activeTool: t })); playClick(); }
  function set(key, e) {
    config.update(c => ({ ...c, [key]: Number(e.target.value) }));
    debouncedCommit();
  }
  function setFloat(key, e, div = 100) {
    config.update(c => ({ ...c, [key]: Number(e.target.value) / div }));
    debouncedCommit();
  }
  function sizeUp() { config.update(c => ({ ...c, fontSize: Math.min(32, c.fontSize + 1) })); debouncedCommit(); playClick(); }
  function sizeDown() { config.update(c => ({ ...c, fontSize: Math.max(4, c.fontSize - 1) })); debouncedCommit(); playClick(); }
  function upload() { window.dispatchEvent(new CustomEvent('trigger-upload')); playClick(); }
  function clearMoves() { window.dispatchEvent(new CustomEvent('clear-moves')); playClick(); }

  onMount(() => {
    const col = $config.asciiColor;
    const hsb = rgbToHsb(col.r, col.g, col.b);
    asciiHue = hsb.h; asciiSat = hsb.s; asciiVal = hsb.b;
    window.addEventListener('pointermove', handleAsciiPickerGlobalMove);
    window.addEventListener('pointerup', handleAsciiPickerGlobalUp);
    return () => {
      window.removeEventListener('pointermove', handleAsciiPickerGlobalMove);
      window.removeEventListener('pointerup', handleAsciiPickerGlobalUp);
    };
  });

  let asciiSvDotStyle = $derived(`left:${asciiSat}%;top:${100 - asciiVal}%`);
  let asciiHueDotStyle = $derived(`left:${(asciiHue / 360) * 100}%`);
</script>

<div class="panel sidebar" id="sidebar">
  <!-- Tab bar -->
  <div class="sidebar-tabs">
    <button class="sidebar-tab" class:active={tab === 'style'} onclick={() => setTab('style')}>STYLE</button>
    <button class="sidebar-tab" class:active={tab === 'interact'} onclick={() => setTab('interact')}>INTERACT</button>
    <button class="sidebar-tab" class:active={tab === 'export'} onclick={() => setTab('export')}>OUT</button>
  </div>

  <!-- Tab content -->
  <div class="sidebar-tab-content">
    {#if tab === 'style'}
      <Section title="Tools">
        <div class="btn-grid">
          <button onclick={upload}>Upload</button>
          <button class:active-tool={tool === 'move'} onclick={() => setTool('move')}>Move</button>
          <button class:active-tool={tool === 'lasso'} onclick={() => setTool('lasso')}>Lasso</button>
          <button onclick={clearMoves}>Clear</button>
        </div>
      </Section>

      <Section title="Characters">
        <CharPanel />
      </Section>

      <Section title="Adjust">
        <div class="size-row">
          <button onclick={sizeDown}>A&minus;</button>
          <span class="size-label">{fontSize}px</span>
          <button onclick={sizeUp}>A+</button>
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">BRT</span>
          <input type="range" min={0} max={200} value={brightness} oninput={(e) => setFloat('brightnessBoost', e)} />
          <input type="number" class="ctrl-num" min={0} max={200} value={brightness} oninput={(e) => setFloat('brightnessBoost', e)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">MIX</span>
          <input type="range" min={0} max={100} value={mix} oninput={(e) => setFloat('mix', e)} />
          <input type="number" class="ctrl-num" min={0} max={100} value={mix} oninput={(e) => setFloat('mix', e)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">LnH</span>
          <input type="range" min={50} max={200} value={lineHeight} oninput={(e) => setFloat('lineHeight', e)} />
          <input type="number" class="ctrl-num" min={50} max={200} value={lineHeight} oninput={(e) => setFloat('lineHeight', e)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">INTNS</span>
          <input type="range" min={0} max={100} value={effectIntensity} oninput={(e) => set('effectIntensity', e)} />
          <input type="number" class="ctrl-num" min={0} max={100} value={effectIntensity} oninput={(e) => set('effectIntensity', e)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">SAT</span>
          <input type="range" min={0} max={300} value={saturation} oninput={(e) => setFloat('saturationBoost', e)} />
          <input type="number" class="ctrl-num" min={0} max={300} value={saturation} oninput={(e) => setFloat('saturationBoost', e)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">SRC</span>
          <input type="range" min={1} max={200} value={srcScale} oninput={(e) => setFloat('sourceScale', e)} />
          <input type="number" class="ctrl-num" min={1} max={200} value={srcScale} oninput={(e) => setFloat('sourceScale', e)} />
        </div>

      </Section>

      <div class="sidebar-section" class:collapsed={!asciiColorOpen}>
        <div class="section-header" onclick={() => { asciiColorOpen = !asciiColorOpen; playClick(); }}>ASCII Color</div>
        <div class="section-body ascii-color-preview">
          <div class="ascii-inline-row">
            <label class="ascii-toggle">
              <input type="checkbox" checked={asciiOverride} onchange={toggleAsciiOverride} />
              <span>Override</span>
            </label>
            <button class="ascii-hex-display" style="background:{asciiHexVal}" onclick={togglePicker} title="Open color picker"></button>
            <span class="ascii-hex-label">#</span>
            <input type="text" class="ascii-hex-input" value={asciiHexVal.slice(1)} disabled={!asciiOverride} onchange={setAsciiHex} />
          </div>
        </div>
        {#if asciiColorOpen}
          <div class="section-body">
            {#if pickerOpen && asciiOverride}
              <div class="ascii-picker-popout">
                <div class="ascii-sv-wrap" bind:this={asciiSvWrap}
                  onpointerdown={(e) => { draggingAsciiSV = true; onAsciiSVPointer(e); }}>
                  <canvas bind:this={asciiSvCanvas}></canvas>
                  <div class="sv-dot" style={asciiSvDotStyle}></div>
                </div>
                <div class="ascii-hue-wrap"
                  onpointerdown={(e) => { draggingAsciiHue = true; onAsciiHuePointer(e); }}>
                  <canvas bind:this={asciiHueCanvas}></canvas>
                  <div class="hue-dot" style={asciiHueDotStyle}></div>
                </div>
              </div>
            {/if}

            <div class="ctrl-row" class:disabled={!asciiOverride}>
              <span class="ctrl-label">R</span>
              <input type="range" min={0} max={255} value={asciiRgb.r} disabled={!asciiOverride} oninput={(e) => setAsciiRgbChannel('r', e)} />
              <input type="number" class="ctrl-num" min={0} max={255} value={asciiRgb.r} disabled={!asciiOverride} oninput={(e) => setAsciiRgbChannel('r', e)} />
            </div>
            <div class="ctrl-row" class:disabled={!asciiOverride}>
              <span class="ctrl-label">G</span>
              <input type="range" min={0} max={255} value={asciiRgb.g} disabled={!asciiOverride} oninput={(e) => setAsciiRgbChannel('g', e)} />
              <input type="number" class="ctrl-num" min={0} max={255} value={asciiRgb.g} disabled={!asciiOverride} oninput={(e) => setAsciiRgbChannel('g', e)} />
            </div>
            <div class="ctrl-row" class:disabled={!asciiOverride}>
              <span class="ctrl-label">B</span>
              <input type="range" min={0} max={255} value={asciiRgb.b} disabled={!asciiOverride} oninput={(e) => setAsciiRgbChannel('b', e)} />
              <input type="number" class="ctrl-num" min={0} max={255} value={asciiRgb.b} disabled={!asciiOverride} oninput={(e) => setAsciiRgbChannel('b', e)} />
            </div>
            <div class="ctrl-row" class:disabled={!asciiOverride}>
              <span class="ctrl-label">H</span>
              <input type="range" min={0} max={360} value={Math.round(asciiHue)} disabled={!asciiOverride} oninput={(e) => { asciiHue = Number(e.target.value); drawAsciiSV(); applyAsciiColor(); }} />
              <input type="number" class="ctrl-num" min={0} max={360} value={Math.round(asciiHue)} disabled={!asciiOverride} oninput={(e) => { asciiHue = Number(e.target.value); drawAsciiSV(); applyAsciiColor(); }} />
            </div>
            <div class="ctrl-row" class:disabled={!asciiOverride}>
              <span class="ctrl-label">S</span>
              <input type="range" min={0} max={100} value={Math.round(asciiSat)} disabled={!asciiOverride} oninput={(e) => { asciiSat = Number(e.target.value); applyAsciiColor(); }} />
              <input type="number" class="ctrl-num" min={0} max={100} value={Math.round(asciiSat)} disabled={!asciiOverride} oninput={(e) => { asciiSat = Number(e.target.value); applyAsciiColor(); }} />
            </div>
            <div class="ctrl-row" class:disabled={!asciiOverride}>
              <span class="ctrl-label">V</span>
              <input type="range" min={0} max={100} value={Math.round(asciiVal)} disabled={!asciiOverride} oninput={(e) => { asciiVal = Number(e.target.value); applyAsciiColor(); }} />
              <input type="number" class="ctrl-num" min={0} max={100} value={Math.round(asciiVal)} disabled={!asciiOverride} oninput={(e) => { asciiVal = Number(e.target.value); applyAsciiColor(); }} />
            </div>
          </div>
        {/if}
      </div>

      <Section title="Animation">
        <AnimPanel />
      </Section>

      <Section title="Effects">
        <EffectsPanel />
      </Section>

    {:else if tab === 'interact'}
      <Section title="Appear Animation">
        <AppearSection />
      </Section>

      <Section title="Hover Effect">
        <HoverSection />
      </Section>

      <Section title="Code Export">
        <InteractExport />
      </Section>

    {:else if tab === 'export'}
      <Section title="Export">
        <ExportPanel />
      </Section>

    {/if}
  </div>
</div>
