<script>
  import Section from './Section.svelte';
  import ColorPanel from '../panels/ColorPanel.svelte';
  import HdrPanel from '../panels/HdrPanel.svelte';
  import LayersPanel from '../panels/LayersPanel.svelte';
  import PresetsPanel from '../panels/PresetsPanel.svelte';
  import LinksSection from './LinksSection.svelte';
</script>

<div class="panel left-sidebar" id="left-sidebar">
  <div class="sidebar-tab-content">
    <ColorPanel />

    <Section title="HDR / Bloom">
      <HdrPanel />
    </Section>

    <Section title="Layers">
      <LayersPanel />
    </Section>

    <Section title="Presets">
      <PresetsPanel />
    </Section>
  </div>

  <LinksSection />
</div>
