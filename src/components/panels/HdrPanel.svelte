<script>
  import { config } from '../../stores/config.js';
  import { debouncedCommit } from '../../stores/undo.js';
  import { playToggleOn, playToggleOff } from '../../engine/sfx.js';

  let hdrOn = $derived($config.hdrEnabled);
  let bloom = $derived($config.hdrBloom);
  let radius = $derived($config.hdrBloomRadius);
  let threshold = $derived($config.hdrBloomThreshold);
  let intensity = $derived($config.hdrIntensity);
  let shadow = $derived($config.hdrShadowLift);

  function toggleHdr() {
    const willEnable = !hdrOn;
    config.update(c => ({ ...c, hdrEnabled: willEnable }));
    debouncedCommit();
    willEnable ? playToggleOn() : playToggleOff();
  }
  function set(key, e) {
    config.update(c => ({ ...c, [key]: Number(e.target.value) }));
    debouncedCommit();
  }
</script>

<button class:active-tool={hdrOn} class:toggled-off={!hdrOn} onclick={toggleHdr}>
  HDR: {hdrOn ? 'ON' : 'OFF'}
</button>
{#if hdrOn}
  <div style="display:flex;flex-direction:column;gap:6px">
    <div class="ctrl-row">
      <span class="ctrl-label">Bloom</span>
      <input type="range" min={0} max={100} value={bloom} oninput={(e) => set('hdrBloom', e)} />
      <input type="number" class="ctrl-num" min={0} max={100} value={bloom} oninput={(e) => set('hdrBloom', e)} />
    </div>
    <div class="ctrl-row">
      <span class="ctrl-label">Radius</span>
      <input type="range" min={1} max={30} value={radius} oninput={(e) => set('hdrBloomRadius', e)} />
      <input type="number" class="ctrl-num" min={1} max={30} value={radius} oninput={(e) => set('hdrBloomRadius', e)} />
    </div>
    <div class="ctrl-row">
      <span class="ctrl-label">Thresh</span>
      <input type="range" min={0} max={100} value={threshold} oninput={(e) => set('hdrBloomThreshold', e)} />
      <input type="number" class="ctrl-num" min={0} max={100} value={threshold} oninput={(e) => set('hdrBloomThreshold', e)} />
    </div>
    <div class="ctrl-row">
      <span class="ctrl-label">Intns</span>
      <input type="range" min={50} max={300} value={intensity} oninput={(e) => set('hdrIntensity', e)} />
      <input type="number" class="ctrl-num" min={50} max={300} value={intensity} oninput={(e) => set('hdrIntensity', e)} />
    </div>
    <div class="ctrl-row">
      <span class="ctrl-label">Shadw</span>
      <input type="range" min={0} max={100} value={shadow} oninput={(e) => set('hdrShadowLift', e)} />
      <input type="number" class="ctrl-num" min={0} max={100} value={shadow} oninput={(e) => set('hdrShadowLift', e)} />
    </div>
  </div>
{/if}
