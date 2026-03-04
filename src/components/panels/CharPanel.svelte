<script>
  import { config, CHAR_PRESETS } from '../../stores/config.js';
  import { debouncedCommit } from '../../stores/undo.js';

  let customChars = $state('');
  let presetIdx = $state(0);

  function onPresetChange(e) {
    const val = e.target.value;
    if (val === 'custom') {
      presetIdx = 'custom';
    } else {
      presetIdx = Number(val);
      config.update(c => ({ ...c, chars: CHAR_PRESETS[presetIdx].chars }));
      debouncedCommit();
    }
  }

  function onCustomInput(e) {
    customChars = e.target.value;
    if (customChars.length > 0) {
      config.update(c => ({ ...c, chars: customChars }));
      debouncedCommit();
    }
  }
</script>

<select value={presetIdx} onchange={onPresetChange}>
  {#each CHAR_PRESETS as preset, i}
    <option value={i}>{preset.name}</option>
  {/each}
  <option value="custom">Custom</option>
</select>
{#if presetIdx === 'custom'}
  <input type="text" value={customChars} oninput={onCustomInput} placeholder="Type custom characters..." />
{/if}
