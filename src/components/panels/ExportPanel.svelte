<script>
  import { get } from 'svelte/store';
  import { config } from '../../stores/config.js';
  import { getCanvasRefs, getLastCapturedFrame, getState } from '../../engine/renderer.js';
  import {
    getCompositeCanvas, getHDRCompositeCanvas, generateSVG,
    generateEmbed, generateReactComponent, generateVideoEmbed,
    generateStandaloneAnimHTML, generateInteractionHTML,
    generateInteractionReact, generateFramerOverride, generateFramerComponent, downloadFile
  } from '../../engine/export.js';
  import { playShutter } from '../../engine/sfx.js';

  let { isVideo = false } = $props();
  let scale = $state(1);
  let transparentBg = $state(false);
  let feedback = $state('');
  let feedbackTimer;

  function flash(msg) {
    playShutter();
    feedback = msg;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => feedback = '', 1500);
  }

  function getCfg() {
    const cfg = get(config);
    return transparentBg ? { ...cfg, transparentBg: true } : cfg;
  }

  function getRefs() {
    const refs = getCanvasRefs();
    if (!refs) return null;
    return refs;
  }

  // ── PNG ──
  function savePNG() {
    const refs = getRefs();
    const cfg = getCfg();
    if (!refs) return;
    const comp = getCompositeCanvas(refs.asciiCanvas, refs.sourceCanvas, refs.hdrCanvas, cfg, scale);
    comp.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `ascii-fx-${scale}x.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
    flash(`PNG ${scale}x saved`);
  }

  function copyPNG() {
    const refs = getRefs();
    const cfg = getCfg();
    if (!refs) return;
    const comp = getCompositeCanvas(refs.asciiCanvas, refs.sourceCanvas, refs.hdrCanvas, cfg, scale);
    comp.toBlob(async blob => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } catch (e) { console.warn('Clipboard write failed', e); }
    }, 'image/png');
    flash(`PNG ${scale}x copied`);
  }

  // ── SVG ──
  function saveSVG() {
    const refs = getRefs();
    const cfg = getCfg();
    if (!refs) return;
    const svg = generateSVG(refs.tileCanvas, cfg);
    downloadFile('ascii-fx.svg', svg, 'image/svg+xml');
    flash('SVG saved');
  }

  function copySVG() {
    const refs = getRefs();
    const cfg = getCfg();
    if (!refs) return;
    const svg = generateSVG(refs.tileCanvas, cfg);
    navigator.clipboard.writeText(svg);
    flash('SVG copied');
  }

  // ── Embed ──
  function saveEmbed() {
    const frame = getLastCapturedFrame();
    const cfg = getCfg();
    if (!frame) return;
    const html = generateEmbed(frame, cfg);
    downloadFile('ascii-embed.html', html, 'text/html');
    flash('Embed saved');
  }

  function copyEmbed() {
    const frame = getLastCapturedFrame();
    const cfg = getCfg();
    if (!frame) return;
    const html = generateEmbed(frame, cfg);
    navigator.clipboard.writeText(html);
    flash('Embed copied');
  }

  // ── React ──
  function saveReact() {
    const frame = getLastCapturedFrame();
    const cfg = getCfg();
    if (!frame) return;
    const code = generateReactComponent(frame, cfg);
    downloadFile('AsciiArt.jsx', code, 'text/javascript');
    flash('React saved');
  }

  function copyReact() {
    const frame = getLastCapturedFrame();
    const cfg = getCfg();
    if (!frame) return;
    const code = generateReactComponent(frame, cfg);
    navigator.clipboard.writeText(code);
    flash('React copied');
  }

  // ── HDR PNG ──
  function saveHDR() {
    const refs = getRefs();
    const cfg = getCfg();
    if (!refs) return;
    const comp = getHDRCompositeCanvas(refs.asciiCanvas, refs.sourceCanvas, cfg, scale);
    comp.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `ascii-fx-hdr-${scale}x.png`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 'image/png');
    flash(`HDR ${scale}x saved`);
  }

  function copyHDR() {
    const refs = getRefs();
    const cfg = getCfg();
    if (!refs) return;
    const comp = getHDRCompositeCanvas(refs.asciiCanvas, refs.sourceCanvas, cfg, scale);
    comp.toBlob(async blob => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      } catch (e) { console.warn('Clipboard write failed', e); }
    }, 'image/png');
    flash(`HDR ${scale}x copied`);
  }

  // ── Video HTML ──
  function saveVideoHTML() {
    const cfg = getCfg();
    const { sourceElement } = getState();
    if (!sourceElement) {
      const html = generateStandaloneAnimHTML(cfg);
      downloadFile('ascii-anim.html', html, 'text/html');
      flash('Animation saved');
      return;
    }
    const W = window.innerWidth, H = window.innerHeight;
    const cellW = cfg.fontSize * 0.6, cellH = cfg.fontSize * cfg.lineHeight;
    const cols = Math.ceil(W / cellW), rows = Math.ceil(H / cellH);
    const html = generateVideoEmbed(cfg, sourceElement, cols, rows);
    downloadFile('ascii-video.html', html, 'text/html');
    flash('HTML saved');
  }

  function copyVideoHTML() {
    const cfg = getCfg();
    const { sourceElement } = getState();
    if (!sourceElement) {
      const html = generateStandaloneAnimHTML(cfg);
      navigator.clipboard.writeText(html);
      flash('Animation copied');
      return;
    }
    const W = window.innerWidth, H = window.innerHeight;
    const cellW = cfg.fontSize * 0.6, cellH = cfg.fontSize * cfg.lineHeight;
    const cols = Math.ceil(W / cellW), rows = Math.ceil(H / cellH);
    const html = generateVideoEmbed(cfg, sourceElement, cols, rows);
    navigator.clipboard.writeText(html);
    flash('HTML copied');
  }

  // ── Interaction Code Exports ──
  function saveInteractHTML() {
    const frame = getLastCapturedFrame();
    const cfg = getCfg();
    if (!frame) return;
    const html = generateInteractionHTML(frame, cfg);
    downloadFile('ascii-interaction.html', html, 'text/html');
    flash('Interaction HTML saved');
  }

  function copyInteractHTML() {
    const frame = getLastCapturedFrame();
    const cfg = getCfg();
    if (!frame) return;
    const html = generateInteractionHTML(frame, cfg);
    navigator.clipboard.writeText(html);
    flash('Interaction HTML copied');
  }

  function saveInteractReact() {
    const frame = getLastCapturedFrame();
    const cfg = getCfg();
    if (!frame) return;
    const code = generateInteractionReact(frame, cfg);
    downloadFile('AsciiInteraction.jsx', code, 'text/javascript');
    flash('React saved');
  }

  function copyInteractReact() {
    const frame = getLastCapturedFrame();
    const cfg = getCfg();
    if (!frame) return;
    const code = generateInteractionReact(frame, cfg);
    navigator.clipboard.writeText(code);
    flash('React copied');
  }

  async function copyFramerOverride() {
    try {
      const frame = getLastCapturedFrame();
      const cfg = getCfg();
      if (!frame) return;
      const code = generateFramerOverride(frame, cfg);
      await navigator.clipboard.writeText(code);
      flash('Override copied');
    } catch (e) {
      console.warn('Override copy failed', e);
      flash('Copy failed');
    }
  }

  async function copyFramerComponent() {
    try {
      const frame = getLastCapturedFrame();
      const cfg = getCfg();
      if (!frame) return;
      const code = generateFramerComponent(frame, cfg);
      await navigator.clipboard.writeText(code);
      flash('Component copied');
    } catch (e) {
      console.warn('Component copy failed', e);
      flash('Copy failed');
    }
  }
</script>

<div class="export-row">
  <span class="export-label">BG</span>
  <button class="res-btn" class:active={!transparentBg} onclick={() => transparentBg = false}>Solid</button>
  <button class="res-btn" class:active={transparentBg} onclick={() => transparentBg = true}>Transparent</button>
</div>

{#if isVideo}
  <div class="export-row">
    <span class="export-label">HTML</span>
    <button onclick={saveVideoHTML}>Save</button>
    <button onclick={copyVideoHTML}>Copy</button>
  </div>
  <div class="export-row">
    <span class="export-label">Interact</span>
    <button onclick={saveInteractHTML}>Save</button>
    <button onclick={copyInteractHTML}>Copy</button>
  </div>
  <div class="export-row">
    <span class="export-label">React</span>
    <button onclick={saveInteractReact}>Save</button>
    <button onclick={copyInteractReact}>Copy</button>
  </div>
  <div class="export-row">
    <span class="export-label">Framer</span>
    <button onclick={copyFramerOverride}>Override</button>
    <button onclick={copyFramerComponent}>Component</button>
  </div>
{:else}
  <div class="export-res-row">
    <span class="export-label">RES</span>
    {#each [1, 2, 4, 6] as s}
      <button class="res-btn" class:active={scale === s} onclick={() => scale = s}>{s}x</button>
    {/each}
  </div>
  <div class="export-row">
    <span class="export-label">PNG</span>
    <button onclick={savePNG}>Save</button>
    <button onclick={copyPNG}>Copy</button>
  </div>
  <div class="export-row">
    <span class="export-label">SVG</span>
    <button onclick={saveSVG}>Save</button>
    <button onclick={copySVG}>Copy</button>
  </div>
  <div class="export-row">
    <span class="export-label">Embed</span>
    <button onclick={saveEmbed}>Save</button>
    <button onclick={copyEmbed}>Copy</button>
  </div>
  <div class="export-row">
    <span class="export-label">React</span>
    <button onclick={saveReact}>Save</button>
    <button onclick={copyReact}>Copy</button>
  </div>
  <div class="export-row">
    <span class="export-label">Framer</span>
    <button onclick={copyFramerOverride}>Override</button>
    <button onclick={copyFramerComponent}>Component</button>
  </div>
  {#if $config.hdrEnabled}
    <div class="export-row">
      <span class="export-label">HDR</span>
      <button onclick={saveHDR}>Save</button>
      <button onclick={copyHDR}>Copy</button>
    </div>
  {/if}
{/if}

{#if feedback}
  <div class="export-feedback">{feedback}</div>
{/if}
