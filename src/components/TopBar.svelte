<script>
  import { ui } from '../stores/ui.js';
  import { config } from '../stores/config.js';
  import { playTab } from '../engine/sfx.js';

  let activeTab = $derived($ui.activeTab);

  function setMode(mode) {
    ui.update(u => ({ ...u, activeTab: mode }));
    config.update(c => ({ ...c, videoMode: mode === 'video', animEnabled: mode === 'video' }));
    playTab();
  }
</script>

<div class="top-bar">
  <div class="top-bar-tabs">
    <button
      class="top-bar-tab tab-image"
      class:active={activeTab === 'image'}
      onclick={() => setMode('image')}
    >IMAGE</button>
    <button
      class="top-bar-tab tab-video"
      class:active={activeTab === 'video'}
      onclick={() => setMode('video')}
    >VIDEO</button>
  </div>
</div>
