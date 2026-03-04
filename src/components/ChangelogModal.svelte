<script>
  import { ui } from '../stores/ui.js';
  import { playToggleOff } from '../engine/sfx.js';

  let open = $derived($ui.changelogOpen);
  let closing = $state(false);

  function close() {
    closing = true;
    playToggleOff();
    setTimeout(() => {
      ui.update(u => ({ ...u, changelogOpen: false }));
      closing = false;
    }, 200);
  }

  const CHANGELOG = [
    {
      version: 'v2.0.0',
      date: 'Mar 5, 2026',
      items: [
        'INTERACT tab with appear animation presets',
        'Hover effect presets (Spotlight, Gooey, Glow Trail)',
        'ASCII-only code export (HTML, React, Framer)',
        'Retro boot screen with 8-bit SFX',
        'Red accent theme',
        'Resolution multiplier for PNG exports',
        'Copy to clipboard for all exports',
        'Changelog modal',
      ]
    },
    {
      version: 'v1.5.0',
      date: 'Mar 4, 2026',
      items: [
        'Migrated to Svelte 5 + Vite',
        'Retro UI (Gameboy/Win95/Fujifilm style)',
        'Synthesized SFX system',
        'Tabbed sidebar layout',
        'HDR bloom post-processing',
        'Gooey + Glow Trail hover effects',
        'Infinite canvas pan/zoom',
        'Undo/redo + presets',
      ]
    },
    {
      version: 'v1.0.0',
      date: 'Mar 3, 2026',
      items: [
        'Real-time ASCII art generator',
        'Image and video support',
        'Multiple character sets',
        '6 animation types',
        'Typewriter reveal',
        'PNG/SVG/HTML/React export',
        'Lasso selection tool',
      ]
    }
  ];
</script>

{#if open || closing}
<div class="help-overlay" class:open={open && !closing} class:closing
  onclick={(e) => { if (e.target === e.currentTarget) close(); }}>
  <div class="help-modal changelog-modal">
    <div class="help-modal-header">
      <h3>CHANGELOG</h3>
      <button class="help-close" onclick={close}>&times;</button>
    </div>
    <div class="changelog-content">
      {#each CHANGELOG as entry}
        <div class="changelog-entry">
          <div class="changelog-version">
            <span class="changelog-v">{entry.version}</span>
            <span class="changelog-date">{entry.date}</span>
          </div>
          <ul class="changelog-items">
            {#each entry.items as item}
              <li>{item}</li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  </div>
</div>
{/if}
