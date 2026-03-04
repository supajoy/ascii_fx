<script>
  import { config } from '../../stores/config.js';
  import { debouncedCommit } from '../../stores/undo.js';
  import { playToggleOn, playToggleOff } from '../../engine/sfx.js';

  const ANIM_TYPES = [
    { value: 'default', label: 'Default' },
    { value: 'wave', label: 'Wave' },
    { value: 'breathe', label: 'Breathe' },
    { value: 'rain', label: 'Rain' },
    { value: 'glitch', label: 'Glitch' },
    { value: 'flow', label: 'Flow' },
  ];

  let animOn = $derived($config.animEnabled);
  let animType = $derived($config.animType);
  let speed = $derived($config.animSpeed);
  let amp = $derived($config.animAmplitude);

  function toggleAnim() {
    const willEnable = !animOn;
    config.update(c => ({ ...c, animEnabled: willEnable }));
    debouncedCommit();
    willEnable ? playToggleOn() : playToggleOff();
  }
  function set(key, e) {
    const v = typeof e === 'string' ? e : (e.target?.value ?? e);
    config.update(c => ({ ...c, [key]: isNaN(Number(v)) ? v : Number(v) }));
    debouncedCommit();
  }
</script>

<button class:active-tool={animOn} class:toggled-off={!animOn} onclick={toggleAnim}>
  Animate: {animOn ? 'ON' : 'OFF'}
</button>
<select value={animType} onchange={(e) => set('animType', e.target.value)}>
  {#each ANIM_TYPES as t}
    <option value={t.value}>{t.label}</option>
  {/each}
</select>
<div class="ctrl-row">
  <span class="ctrl-label">Spd</span>
  <input type="range" min={1} max={100} value={speed} oninput={(e) => set('animSpeed', e)} />
  <input type="number" class="ctrl-num" min={1} max={100} value={speed} oninput={(e) => set('animSpeed', e)} />
</div>
<div class="ctrl-row">
  <span class="ctrl-label">Amp</span>
  <input type="range" min={0} max={100} value={amp} oninput={(e) => set('animAmplitude', e)} />
  <input type="number" class="ctrl-num" min={0} max={100} value={amp} oninput={(e) => set('animAmplitude', e)} />
</div>
