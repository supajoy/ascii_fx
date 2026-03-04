<script>
  import { get } from 'svelte/store';
  import { config } from '../../stores/config.js';
  import { getCanvasRefs, getLastCapturedFrame, getState } from '../../engine/renderer.js';
  import {
    getCompositeCanvas, getHDRCompositeCanvas, generateSVG,
    generateEmbed, generateReactComponent, generateVideoEmbed,
    downloadFile
  } from '../../engine/export.js';
  import { playShutter } from '../../engine/sfx.js';

  let { isVideo = false } = $props();
  let scale = $state(1);
  let feedback = $state('');
  let feedbackTimer;

  function flash(msg) {
    playShutter();
    feedback = msg;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => feedback = '', 1500);
  }

  function getRefs() {
    const refs = getCanvasRefs();
    if (!refs) return null;
    return refs;
  }

  // ── PNG ──
  function savePNG() {
    const refs = getRefs();
    const cfg = get(config);
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
    const cfg = get(config);
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
    const cfg = get(config);
    if (!refs) return;
    const svg = generateSVG(refs.tileCanvas, cfg);
    downloadFile('ascii-fx.svg', svg, 'image/svg+xml');
    flash('SVG saved');
  }

  function copySVG() {
    const refs = getRefs();
    const cfg = get(config);
    if (!refs) return;
    const svg = generateSVG(refs.tileCanvas, cfg);
    navigator.clipboard.writeText(svg);
    flash('SVG copied');
  }

  // ── Embed ──
  function saveEmbed() {
    const frame = getLastCapturedFrame();
    const cfg = get(config);
    if (!frame) return;
    const html = generateEmbed(frame, cfg);
    downloadFile('ascii-embed.html', html, 'text/html');
    flash('Embed saved');
  }

  function copyEmbed() {
    const frame = getLastCapturedFrame();
    const cfg = get(config);
    if (!frame) return;
    const html = generateEmbed(frame, cfg);
    navigator.clipboard.writeText(html);
    flash('Embed copied');
  }

  // ── React ──
  function saveReact() {
    const frame = getLastCapturedFrame();
    const cfg = get(config);
    if (!frame) return;
    const code = generateReactComponent(frame, cfg);
    downloadFile('AsciiArt.jsx', code, 'text/javascript');
    flash('React saved');
  }

  function copyReact() {
    const frame = getLastCapturedFrame();
    const cfg = get(config);
    if (!frame) return;
    const code = generateReactComponent(frame, cfg);
    navigator.clipboard.writeText(code);
    flash('React copied');
  }

  // ── HDR PNG ──
  function saveHDR() {
    const refs = getRefs();
    const cfg = get(config);
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
    const cfg = get(config);
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
    const cfg = get(config);
    const { sourceElement, sourceIsVideo } = getState();
    const W = window.innerWidth, H = window.innerHeight;
    const cellW = cfg.fontSize * 0.6, cellH = cfg.fontSize * cfg.lineHeight;
    const cols = Math.ceil(W / cellW), rows = Math.ceil(H / cellH);
    const html = generateVideoEmbed(cfg, sourceElement, cols, rows);
    downloadFile('ascii-video.html', html, 'text/html');
    flash('HTML saved');
  }

  function copyVideoHTML() {
    const cfg = get(config);
    const { sourceElement, sourceIsVideo } = getState();
    const W = window.innerWidth, H = window.innerHeight;
    const cellW = cfg.fontSize * 0.6, cellH = cfg.fontSize * cfg.lineHeight;
    const cols = Math.ceil(W / cellW), rows = Math.ceil(H / cellH);
    const html = generateVideoEmbed(cfg, sourceElement, cols, rows);
    navigator.clipboard.writeText(html);
    flash('HTML copied');
  }
</script>

{#if isVideo}
  <div class="export-row">
    <span class="export-label">HTML</span>
    <button onclick={saveVideoHTML}>Save</button>
    <button onclick={copyVideoHTML}>Copy</button>
  </div>
  <div class="video-export-desc">
    Self-contained HTML with ASCII effect, animation &amp; hover.
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
