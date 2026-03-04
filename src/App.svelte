<script>
  import { ui } from './stores/ui.js';
  import { playToggleOn, playToggleOff } from './engine/sfx.js';
  import Canvas from './components/Canvas.svelte';
  import TopBar from './components/TopBar.svelte';
  import ImageSidebar from './components/sidebar/ImageSidebar.svelte';
  import VideoSidebar from './components/sidebar/VideoSidebar.svelte';
  import LeftSidebar from './components/sidebar/LeftSidebar.svelte';
  import VideoLeftSidebar from './components/sidebar/VideoLeftSidebar.svelte';
  import HelpModal from './components/HelpModal.svelte';
  import ChangelogModal from './components/ChangelogModal.svelte';
  import BootScreen from './components/BootScreen.svelte';

  let activeTab = $derived($ui.activeTab);
  let helpOpen = $derived($ui.helpOpen);
  let changelogOpen = $derived($ui.changelogOpen);
  let booted = $state(false);

  function toggleHelp() {
    const willOpen = !helpOpen;
    ui.update(u => ({ ...u, helpOpen: willOpen }));
    if (willOpen) playToggleOn(); else playToggleOff();
  }

  function toggleChangelog() {
    const willOpen = !changelogOpen;
    ui.update(u => ({ ...u, changelogOpen: willOpen }));
    if (willOpen) playToggleOn(); else playToggleOff();
  }
</script>

{#if !booted}
  <BootScreen onComplete={() => { booted = true; }} />
{/if}

<div class="app-main" class:app-hidden={!booted}>
  <Canvas />
  <TopBar />

  {#if activeTab === 'image'}
    <ImageSidebar />
    <LeftSidebar />
  {:else}
    <VideoSidebar />
    <VideoLeftSidebar />
  {/if}

  <button class="changelog-btn" onclick={toggleChangelog} title="Changelog">changelog</button>
  <button class="help-btn" onclick={toggleHelp} title="Help & Shortcuts [H]">?</button>
  <HelpModal />
  <ChangelogModal />
</div>
