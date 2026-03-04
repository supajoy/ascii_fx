<script>
  import { get } from 'svelte/store';
  import { config } from '../../stores/config.js';
  import { getLastCapturedFrame } from '../../engine/renderer.js';
  import { generateInteractionHTML, generateInteractionReact, generateFramerOverride, downloadFile } from '../../engine/export.js';
  import { playShutter } from '../../engine/sfx.js';

  function flashBtn(e) {
    playShutter();
    const btn = e.currentTarget;
    btn.classList.add('export-success');
    setTimeout(() => btn.classList.remove('export-success'), 500);
  }

  function exportHTML(e) {
    const frame = getLastCapturedFrame();
    const cfg = get(config);
    if (!frame) return;
    const html = generateInteractionHTML(frame, cfg);
    downloadFile('ascii-interaction.html', html, 'text/html');
    flashBtn(e);
  }

  function exportReact(e) {
    const frame = getLastCapturedFrame();
    const cfg = get(config);
    if (!frame) return;
    const code = generateInteractionReact(frame, cfg);
    downloadFile('AsciiInteraction.jsx', code, 'text/javascript');
    flashBtn(e);
  }

  function exportFramer(e) {
    const frame = getLastCapturedFrame();
    const cfg = get(config);
    if (!frame) return;
    const code = generateFramerOverride(frame, cfg);
    downloadFile('AsciiOverride.tsx', code, 'text/typescript');
    flashBtn(e);
  }

  function copyCode(e) {
    const frame = getLastCapturedFrame();
    const cfg = get(config);
    if (!frame) return;
    const html = generateInteractionHTML(frame, cfg);
    navigator.clipboard.writeText(html);
    flashBtn(e);
  }
</script>

<div class="interact-export-desc">
  ASCII-only export with hover &amp; animation. No source image.
</div>
<div class="btn-grid" style="margin-top:4px;">
  <button onclick={exportHTML}>HTML</button>
  <button onclick={exportReact}>React</button>
  <button onclick={exportFramer}>Framer</button>
  <button onclick={copyCode}>Copy</button>
</div>
