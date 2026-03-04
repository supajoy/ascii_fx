<script>
  import { ui } from '../stores/ui.js';
  import { playClick, playToggleOff } from '../engine/sfx.js';

  let open = $derived($ui.helpOpen);
  let tab = $derived($ui.helpTab);
  let closing = $state(false);

  function close() {
    closing = true;
    playToggleOff();
    setTimeout(() => {
      ui.update(u => ({ ...u, helpOpen: false }));
      closing = false;
    }, 200);
  }

  function setTab(t) {
    ui.update(u => ({ ...u, helpTab: t }));
    playClick();
  }
</script>

{#if open || closing}
<div class="help-overlay" class:open={open && !closing} class:closing
  onclick={(e) => { if (e.target === e.currentTarget) close(); }}>
  <div class="help-modal">
    <div class="help-modal-header">
      <h3>ASCII_FX</h3>
      <button class="help-close" onclick={close}>&times;</button>
    </div>
    <div class="help-tabs">
      <button class:active={tab === 'about'} onclick={() => setTab('about')}>About</button>
      <button class:active={tab === 'shortcuts'} onclick={() => setTab('shortcuts')}>Keys</button>
    </div>
    <div class="help-content">
      {#if tab === 'about'}
        <h4>About</h4>
        <p>A real-time ASCII art generator that converts images and videos into ASCII characters with customizable effects, animations, and export options.</p>
        <h4>Getting Started</h4>
        <p>Drop an image or video onto the canvas, or double-click to upload. Use the STYLE tab on the right to adjust characters, size, brightness, and effects. The MOTION tab controls animations and hover effects. Export from the OUT tab.</p>
        <h4>Features</h4>
        <p>Multiple character sets, color modes, blend modes, HDR bloom, 6 animation types, 3 hover effects, typewriter reveal, PNG/SVG/HTML/React export, undo/redo, presets, infinite canvas pan/zoom.</p>
      {:else}
        <div class="shortcuts-grid">
          <div class="shortcuts-col">
            <h4>General</h4>
            <div class="shortcut-row"><span class="shortcut-key">H</span><span class="shortcut-desc">Toggle help</span></div>
            <div class="shortcut-row"><span class="shortcut-key">Ctrl+Z</span><span class="shortcut-desc">Undo</span></div>
            <div class="shortcut-row"><span class="shortcut-key">Ctrl+Y</span><span class="shortcut-desc">Redo</span></div>
            <div class="shortcut-row"><span class="shortcut-key">Space</span><span class="shortcut-desc">Reset view</span></div>
            <h4>Tools</h4>
            <div class="shortcut-row"><span class="shortcut-key">V</span><span class="shortcut-desc">Move tool</span></div>
            <div class="shortcut-row"><span class="shortcut-key">L</span><span class="shortcut-desc">Lasso tool</span></div>
          </div>
          <div class="shortcuts-col">
            <h4>Font Size</h4>
            <div class="shortcut-row"><span class="shortcut-key">1-9</span><span class="shortcut-desc">Set size (4-32px)</span></div>
            <div class="shortcut-row"><span class="shortcut-key">[ / ]</span><span class="shortcut-desc">Dec / Inc</span></div>
            <h4>View</h4>
            <div class="shortcut-row"><span class="shortcut-key">Scroll</span><span class="shortcut-desc">Zoom in/out</span></div>
            <div class="shortcut-row"><span class="shortcut-key">Drag</span><span class="shortcut-desc">Pan canvas</span></div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
{/if}
