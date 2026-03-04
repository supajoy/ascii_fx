<script>
  import { playTab } from '../../engine/sfx.js';
  import Section from './Section.svelte';
  import AnimPanel from '../panels/AnimPanel.svelte';
  import AppearSection from '../panels/AppearSection.svelte';
  import HoverSection from '../panels/HoverSection.svelte';
  import InteractExport from '../panels/InteractExport.svelte';
  import ExportPanel from '../panels/ExportPanel.svelte';
  import { config } from '../../stores/config.js';
  import { debouncedCommit } from '../../stores/undo.js';

  let tab = $state('motion');
  let effectIntensity = $derived($config.effectIntensity);

  function setTab(t) { tab = t; playTab(); }
  function setEffectIntensity(e) {
    config.update(c => ({ ...c, effectIntensity: Number(e.target.value) }));
    debouncedCommit();
  }
</script>

<div id="video-panel" style="display:flex">
  <div class="sidebar-tabs">
    <button class="sidebar-tab" class:active={tab === 'motion'} onclick={() => setTab('motion')}>MOTION</button>
    <button class="sidebar-tab" class:active={tab === 'interact'} onclick={() => setTab('interact')}>INTERACT</button>
    <button class="sidebar-tab" class:active={tab === 'export'} onclick={() => setTab('export')}>OUT</button>
  </div>

  <div class="sidebar-tab-content">
    {#if tab === 'motion'}
      <Section title="Animation">
        <AnimPanel />
      </Section>
      <Section title="Effect Intensity">
        <div class="ctrl-row">
          <span class="ctrl-label">INTNS</span>
          <input type="range" min={0} max={100} value={effectIntensity} oninput={setEffectIntensity} />
          <input type="number" class="ctrl-num" min={0} max={100} value={effectIntensity} oninput={setEffectIntensity} />
        </div>
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
        <ExportPanel isVideo={true} />
      </Section>
    {/if}
  </div>
</div>
