<script>
  import { playTab } from '../../engine/sfx.js';
  import Section from './Section.svelte';
  import ColorPanel from '../panels/ColorPanel.svelte';
  import HdrPanel from '../panels/HdrPanel.svelte';
  import PresetsPanel from '../panels/PresetsPanel.svelte';
  import LayersPanel from '../panels/LayersPanel.svelte';
  import LinksSection from './LinksSection.svelte';

  let tab = $state('color');

  function setTab(t) { tab = t; playTab(); }
</script>

<div class="panel left-sidebar" id="left-sidebar">
  <!-- Tab bar -->
  <div class="sidebar-tabs">
    <button class="sidebar-tab" class:active={tab === 'color'} onclick={() => setTab('color')}>COLOR</button>
    <button class="sidebar-tab" class:active={tab === 'layers'} onclick={() => setTab('layers')}>LAYERS</button>
  </div>

  <!-- Tab content -->
  <div class="sidebar-tab-content">
    {#if tab === 'color'}
      <ColorPanel />
      <div class="slant-divider"></div>
      <Section title="HDR / Bloom">
        <HdrPanel />
      </Section>
    {:else}
      <LayersPanel />
      <div class="slant-divider"></div>
      <PresetsPanel />
    {/if}
  </div>

  <LinksSection />
</div>
