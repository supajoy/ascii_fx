<script>
  import { get } from 'svelte/store';
  import { config, batchUpdateConfig } from '../../stores/config.js';
  import { presets, activePresetIdx } from '../../stores/presets.js';
  import { commit } from '../../stores/undo.js';

  let name = $state('');
  let items = $derived($presets);
  let activeIdx = $derived($activePresetIdx);

  function save() {
    if (!name.trim()) return;
    presets.save(name, get(config));
    name = '';
  }

  function load(idx) {
    activePresetIdx.set(idx);
    const preset = items[idx];
    if (preset) {
      batchUpdateConfig(preset.config);
      commit();
    }
  }

  function remove(idx, e) {
    e.stopPropagation();
    presets.remove(idx);
    if (activeIdx === idx) activePresetIdx.set(-1);
  }
</script>

<div class="presets-panel">
  <div class="presets-save-row">
    <input type="text" bind:value={name} placeholder="Preset name..." onkeydown={(e) => { if (e.key === 'Enter') save(); }} />
    <button onclick={save}>Save</button>
  </div>
  <div class="presets-list">
    {#if items.length === 0}
      <div class="presets-empty">No saved presets</div>
    {:else}
      {#each items as preset, i}
        <div class="preset-item" class:active={activeIdx === i} onclick={() => load(i)}>
          <span class="preset-item-name">{preset.name}</span>
          <span class="preset-item-delete" onclick={(e) => remove(i, e)} title="Delete">&times;</span>
        </div>
      {/each}
    {/if}
  </div>
</div>
