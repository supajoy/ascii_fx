<script>
  import { config } from '../../stores/config.js';
  import { debouncedCommit } from '../../stores/undo.js';
  import { playClick, playToggleOff } from '../../engine/sfx.js';

  const APPEAR_PRESETS = [
    { name: 'Typewriter', dir: 'left-right', speed: 35 },
    { name: 'Reverse', dir: 'right-left', speed: 35 },
    { name: 'Curtain', dir: 'center-out', speed: 40, focalX: 50, focalY: 50 },
    { name: 'Collapse', dir: 'out-center', speed: 40, focalX: 50, focalY: 50 },
    { name: 'Radial Burst', dir: 'radial-out', speed: 35, focalX: 50, focalY: 50 },
    { name: 'Vortex', dir: 'radial-in', speed: 35, focalX: 50, focalY: 50 },
    { name: 'Cascade', dir: 'top-bottom', speed: 30 },
    { name: 'Rise', dir: 'bottom-top', speed: 30 },
  ];

  const DIRECTIONS = [
    { value: 'center-out', label: 'Center → Out' },
    { value: 'out-center', label: 'Out → Center' },
    { value: 'radial-out', label: 'Radial → Out' },
    { value: 'radial-in', label: 'Radial → In' },
    { value: 'left-right', label: 'Left → Right' },
    { value: 'right-left', label: 'Right → Left' },
    { value: 'top-bottom', label: 'Top → Bottom' },
    { value: 'bottom-top', label: 'Bottom → Top' },
  ];

  let activePreset = $state(-1);
  let showFineTune = $state(false);

  let revealOn = $derived($config.revealActive);
  let dir = $derived($config.revealDirection);
  let focalX = $derived($config.revealFocalX);
  let focalY = $derived($config.revealFocalY);
  let speed = $derived($config.revealSpeed);
  let grad = $derived($config.revealGradient);
  let c1 = $derived($config.revealColor1);
  let c2 = $derived($config.revealColor2);
  let c3 = $derived($config.revealColor3);

  let showFocal = $derived(
    dir === 'radial-out' || dir === 'radial-in' ||
    dir === 'center-out' || dir === 'out-center'
  );

  function applyPreset(idx) {
    const p = APPEAR_PRESETS[idx];
    activePreset = idx;
    config.update(c => ({
      ...c,
      revealActive: true,
      revealDirection: p.dir,
      revealSpeed: p.speed,
      revealStartTime: performance.now(),
      revealProgress: 0,
      revealColorProgress: 0,
      ...(p.focalX !== undefined ? { revealFocalX: p.focalX, revealFocalY: p.focalY } : {}),
    }));
    debouncedCommit();
    playClick();
  }

  function replay() {
    config.update(c => ({
      ...c,
      revealActive: true,
      revealStartTime: performance.now(),
      revealProgress: 0,
      revealColorProgress: 0,
    }));
    playClick();
  }

  function toggleFineTune() {
    showFineTune = !showFineTune;
    playClick();
  }

  function set(key, e) {
    const v = e.target?.value ?? e;
    config.update(c => ({ ...c, [key]: isNaN(Number(v)) ? v : Number(v) }));
    debouncedCommit();
    activePreset = -1;
  }

  function stopReveal() {
    config.update(c => ({ ...c, revealActive: false }));
    activePreset = -1;
    playToggleOff();
  }
</script>

<div class="appear-section">
  <div class="btn-grid">
    {#each APPEAR_PRESETS as p, i}
      <button
        class:active-tool={activePreset === i}
        onclick={() => applyPreset(i)}
      >{p.name}</button>
    {/each}
  </div>

  <div style="display:flex;gap:4px;margin-top:4px;">
    <button onclick={replay} style="flex:1">Replay</button>
    {#if revealOn}
      <button onclick={stopReveal} style="flex:1">Stop</button>
    {/if}
  </div>

  <button
    class="fine-tune-toggle"
    class:active-tool={showFineTune}
    onclick={toggleFineTune}
    style="width:100%;margin-top:6px;font-size:10px;"
  >Fine Tune {showFineTune ? '▾' : '▸'}</button>

  {#if showFineTune}
    <div class="fine-tune">
      <div class="ctrl-row" style="margin-top:4px;">
        <span class="ctrl-label">Dir</span>
        <select style="flex:1" value={dir} onchange={(e) => set('revealDirection', e.target.value)}>
          {#each DIRECTIONS as d}
            <option value={d.value}>{d.label}</option>
          {/each}
        </select>
      </div>

      {#if showFocal}
        <div class="hover-sub-label" style="margin-top:4px;">Focal Point</div>
        <div class="ctrl-row">
          <span class="ctrl-label">X</span>
          <input type="range" min={0} max={100} value={focalX} oninput={(e) => set('revealFocalX', e)} />
          <input type="number" class="ctrl-num" min={0} max={100} value={focalX} oninput={(e) => set('revealFocalX', e)} />
        </div>
        <div class="ctrl-row">
          <span class="ctrl-label">Y</span>
          <input type="range" min={0} max={100} value={focalY} oninput={(e) => set('revealFocalY', e)} />
          <input type="number" class="ctrl-num" min={0} max={100} value={focalY} oninput={(e) => set('revealFocalY', e)} />
        </div>
      {/if}

      <div class="ctrl-row" style="margin-top:4px;">
        <span class="ctrl-label">Spd</span>
        <input type="range" min={10} max={100} value={speed} oninput={(e) => set('revealSpeed', e)} />
        <input type="number" class="ctrl-num" min={10} max={100} value={speed} oninput={(e) => set('revealSpeed', e)} />
      </div>

      <div class="hover-sub-label" style="margin-top:6px;">Gradient</div>
      <div class="ctrl-row">
        <span class="ctrl-label">C1</span>
        <input type="color" value={c1} onchange={(e) => set('revealColor1', e.target.value)} style="width:32px;height:22px;padding:0;border:1px solid var(--border);background:#000;cursor:pointer;" />
        <input type="color" value={c2} onchange={(e) => set('revealColor2', e.target.value)} style="width:32px;height:22px;padding:0;border:1px solid var(--border);background:#000;cursor:pointer;" />
        <input type="color" value={c3} onchange={(e) => set('revealColor3', e.target.value)} style="width:32px;height:22px;padding:0;border:1px solid var(--border);background:#000;cursor:pointer;" />
      </div>
      <div class="ctrl-row">
        <span class="ctrl-label" style="font-size:9px;">Grad</span>
        <input type="range" min={0} max={100} value={grad} oninput={(e) => set('revealGradient', e)} />
        <input type="number" class="ctrl-num" min={0} max={100} value={grad} oninput={(e) => set('revealGradient', e)} />
      </div>
    </div>
  {/if}
</div>
