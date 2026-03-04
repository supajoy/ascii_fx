<script>
  import { config } from '../../stores/config.js';
  import { debouncedCommit } from '../../stores/undo.js';
  import { playToggleOn, playToggleOff, playClick } from '../../engine/sfx.js';

  const HOVER_PRESETS = [
    { name: 'Spotlight', mode: 'basic', config: { basicHover: true, gooeyHover: false, glowTrail: false, hoverRadius: 8, hoverExposure: 0.35 } },
    { name: 'Wide Beam', mode: 'basic', config: { basicHover: true, gooeyHover: false, glowTrail: false, hoverRadius: 20, hoverExposure: 0.5 } },
    { name: 'Pinpoint', mode: 'basic', config: { basicHover: true, gooeyHover: false, glowTrail: false, hoverRadius: 4, hoverExposure: 0.8 } },
    { name: 'Gooey', mode: 'gooey', config: { basicHover: false, gooeyHover: true, glowTrail: false, gooeyRadius: 8, gooeySoftness: 50, gooeyScrambleAmt: 100, gooeyColorReveal: 100 } },
    { name: 'Soft Goo', mode: 'gooey', config: { basicHover: false, gooeyHover: true, glowTrail: false, gooeyRadius: 12, gooeySoftness: 80, gooeyScrambleAmt: 40, gooeyColorReveal: 60 } },
    { name: 'Glow Trail', mode: 'glow', config: { basicHover: false, gooeyHover: false, glowTrail: true, glowRadiusMult: 8, glowDuration: 1.0, glowIntensity: 2.5, glowStampInterval: 25 } },
    { name: 'Comet', mode: 'glow', config: { basicHover: false, gooeyHover: false, glowTrail: true, glowRadiusMult: 12, glowDuration: 2.0, glowIntensity: 3.0, glowStampInterval: 15 } },
    { name: 'Spark', mode: 'glow', config: { basicHover: false, gooeyHover: false, glowTrail: true, glowRadiusMult: 4, glowDuration: 0.4, glowIntensity: 4.0, glowStampInterval: 40 } },
  ];

  let activePreset = $state(-1);
  let showFineTune = $state(false);

  let hoverOn = $derived($config.hoverEnabled);
  let basicOn = $derived($config.basicHover);
  let gooeyOn = $derived($config.gooeyHover);
  let glowOn = $derived($config.glowTrail);

  // Basic
  let hoverRad = $derived($config.hoverRadius);
  let hoverExp = $derived(Math.round($config.hoverExposure * 100));

  // Gooey
  let gooeyRad = $derived($config.gooeyRadius);
  let gooeySoft = $derived($config.gooeySoftness);
  let gooeyScr = $derived($config.gooeyScrambleAmt);
  let gooeyClr = $derived($config.gooeyColorReveal);

  // Glow
  let glowRad = $derived($config.glowRadiusMult);
  let glowDur = $derived(Math.round($config.glowDuration * 100));
  let glowInt = $derived(Math.round($config.glowIntensity * 100));
  let glowRate = $derived($config.glowStampInterval);

  // Which mode is active for fine-tune display
  let activeMode = $derived(basicOn ? 'basic' : gooeyOn ? 'gooey' : glowOn ? 'glow' : 'none');

  function toggleHover() {
    const willEnable = !hoverOn;
    config.update(c => ({ ...c, hoverEnabled: willEnable }));
    debouncedCommit();
    willEnable ? playToggleOn() : playToggleOff();
  }

  function applyPreset(idx) {
    const p = HOVER_PRESETS[idx];
    activePreset = idx;
    config.update(c => ({ ...c, hoverEnabled: true, ...p.config }));
    debouncedCommit();
    playClick();
  }

  function toggleFineTune() {
    showFineTune = !showFineTune;
    playClick();
  }

  function set(key, e) {
    config.update(c => ({ ...c, [key]: Number(e.target.value) }));
    debouncedCommit();
    activePreset = -1;
  }

  function setFloat(key, e, div = 100) {
    config.update(c => ({ ...c, [key]: Number(e.target.value) / div }));
    debouncedCommit();
    activePreset = -1;
  }
</script>

<button class:active-tool={hoverOn} class:toggled-off={!hoverOn} onclick={toggleHover} style="width:100%">
  Hover: {hoverOn ? 'ON' : 'OFF'}
</button>

<div class="hover-controls-wrap" class:disabled={!hoverOn}>
  <div class="btn-grid" style="margin-top:4px;">
    {#each HOVER_PRESETS as p, i}
      <button
        class:active-tool={activePreset === i}
        onclick={() => applyPreset(i)}
      >{p.name}</button>
    {/each}
  </div>

  <button
    class="fine-tune-toggle"
    class:active-tool={showFineTune}
    onclick={toggleFineTune}
    style="width:100%;margin-top:6px;font-size:10px;"
  >Fine Tune {showFineTune ? '▾' : '▸'}</button>

  {#if showFineTune}
    <div class="fine-tune">
      {#if activeMode === 'basic'}
        <div class="hover-sub-label" style="margin-top:4px;">Basic Hover</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Rad</span>
          <input type="range" min={2} max={30} value={hoverRad} oninput={(e) => set('hoverRadius', e)} />
          <input type="number" class="ctrl-num" min={2} max={30} value={hoverRad} oninput={(e) => set('hoverRadius', e)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Exp</span>
          <input type="range" min={0} max={100} value={hoverExp} oninput={(e) => setFloat('hoverExposure', e)} />
          <input type="number" class="ctrl-num" min={0} max={100} value={hoverExp} oninput={(e) => setFloat('hoverExposure', e)} />
        </div>

      {:else if activeMode === 'gooey'}
        <div class="hover-sub-label" style="margin-top:4px;">Gooey Hover</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Size</span>
          <input type="range" min={1} max={20} value={gooeyRad} oninput={(e) => set('gooeyRadius', e)} />
          <input type="number" class="ctrl-num" min={1} max={20} value={gooeyRad} oninput={(e) => set('gooeyRadius', e)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Soft</span>
          <input type="range" min={0} max={100} value={gooeySoft} oninput={(e) => set('gooeySoftness', e)} />
          <input type="number" class="ctrl-num" min={0} max={100} value={gooeySoft} oninput={(e) => set('gooeySoftness', e)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Scr</span>
          <input type="range" min={0} max={100} value={gooeyScr} oninput={(e) => set('gooeyScrambleAmt', e)} />
          <input type="number" class="ctrl-num" min={0} max={100} value={gooeyScr} oninput={(e) => set('gooeyScrambleAmt', e)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Clr</span>
          <input type="range" min={0} max={100} value={gooeyClr} oninput={(e) => set('gooeyColorReveal', e)} />
          <input type="number" class="ctrl-num" min={0} max={100} value={gooeyClr} oninput={(e) => set('gooeyColorReveal', e)} />
        </div>

      {:else if activeMode === 'glow'}
        <div class="hover-sub-label" style="margin-top:4px;">Glow Trail</div>
        <div class="ctrl-row">
          <span class="ctrl-label">Rad</span>
          <input type="range" min={1} max={30} value={glowRad} oninput={(e) => set('glowRadiusMult', e)} />
          <input type="number" class="ctrl-num" min={1} max={30} value={glowRad} oninput={(e) => set('glowRadiusMult', e)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Dur</span>
          <input type="range" min={10} max={300} value={glowDur} oninput={(e) => setFloat('glowDuration', e)} />
          <input type="number" class="ctrl-num" min={10} max={300} value={glowDur} oninput={(e) => setFloat('glowDuration', e)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Int</span>
          <input type="range" min={10} max={500} value={glowInt} oninput={(e) => setFloat('glowIntensity', e)} />
          <input type="number" class="ctrl-num" min={10} max={500} value={glowInt} oninput={(e) => setFloat('glowIntensity', e)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Rate</span>
          <input type="range" min={5} max={100} value={glowRate} oninput={(e) => set('glowStampInterval', e)} />
          <input type="number" class="ctrl-num" min={5} max={100} value={glowRate} oninput={(e) => set('glowStampInterval', e)} />
        </div>

      {:else}
        <div class="hover-sub-label" style="margin-top:4px;opacity:0.5;">Select a preset above</div>
      {/if}
    </div>
  {/if}
</div>
