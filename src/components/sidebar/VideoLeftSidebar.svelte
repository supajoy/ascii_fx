<script>
  import { config } from '../../stores/config.js';
  import { ui } from '../../stores/ui.js';
  import { debouncedCommit } from '../../stores/undo.js';
  import { playTab, playClick } from '../../engine/sfx.js';
  import Section from './Section.svelte';
  import CharPanel from '../panels/CharPanel.svelte';
  import EffectsPanel from '../panels/EffectsPanel.svelte';
  import HdrPanel from '../panels/HdrPanel.svelte';
  import LayersPanel from '../panels/LayersPanel.svelte';
  import LinksSection from './LinksSection.svelte';

  let tab = $state('style');
  let tool = $derived($ui.activeTool);
  let fontSize = $derived($config.fontSize);
  let brightness = $derived(Math.round($config.brightnessBoost * 100));
  let mix = $derived(Math.round($config.mix * 100));
  let lineHeight = $derived(Math.round($config.lineHeight * 100));

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
  function upload() { window.dispatchEvent(new CustomEvent('trigger-upload')); playClick(); }
  function clearMoves() { window.dispatchEvent(new CustomEvent('clear-moves')); playClick(); }
</script>

<div id="video-left-sidebar" style="display:flex">
  <div class="sidebar-tabs">
    <button class="sidebar-tab" class:active={tab === 'style'} onclick={() => setTab('style')}>STYLE</button>
    <button class="sidebar-tab" class:active={tab === 'layers'} onclick={() => setTab('layers')}>LAYERS</button>
  </div>

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
        <div class="ctrl-row">
          <span class="ctrl-label">Size</span>
          <input type="range" min={4} max={32} value={fontSize} oninput={(e) => set('fontSize', e)} />
          <input type="number" class="ctrl-num" min={4} max={32} value={fontSize} oninput={(e) => set('fontSize', e)} />
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
      </Section>
      <Section title="Effects">
        <EffectsPanel />
      </Section>
      <Section title="HDR / Bloom">
        <HdrPanel />
      </Section>
    {:else}
      <LayersPanel />
    {/if}
  </div>

  <LinksSection />
</div>
