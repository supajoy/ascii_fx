<script>
  import { config } from '../../stores/config.js';
  import { debouncedCommit } from '../../stores/undo.js';

  const BLEND_OPTIONS = [
    { value: 'normal', label: 'Normal' },
    { value: 'overlay', label: 'Overlay' },
    { value: 'screen', label: 'Screen' },
    { value: 'multiply', label: 'Multiply' },
    { value: 'soft-light', label: 'Soft Light' },
    { value: 'hard-light', label: 'Hard Light' },
    { value: 'color-dodge', label: 'Color Dodge' },
    { value: 'color-burn', label: 'Color Burn' },
    { value: 'lighten', label: 'Lighten' },
    { value: 'darken', label: 'Darken' },
    { value: 'difference', label: 'Difference' },
    { value: 'exclusion', label: 'Exclusion' },
    { value: 'luminosity', label: 'Luminosity' },
    { value: 'color', label: 'Color' },
  ];

  let tile = $derived($config.tileSize);
  let posterize = $derived($config.posterize);
  let blend = $derived($config.blendMode);

  function setTile(v) { config.update(c => ({ ...c, tileSize: v })); debouncedCommit(); }
  function setPosterize(v) { config.update(c => ({ ...c, posterize: v })); debouncedCommit(); }
  function setBlend(e) { config.update(c => ({ ...c, blendMode: e.target.value })); debouncedCommit(); }
</script>

<div class="ctrl-row">
  <span class="ctrl-label">Tile</span>
  <input type="range" min={1} max={40} value={tile} oninput={(e) => setTile(Number(e.target.value))} />
  <input type="number" class="ctrl-num" min={1} max={40} value={tile} oninput={(e) => setTile(Number(e.target.value))} />
</div>
<div class="ctrl-row">
  <span class="ctrl-label">Post</span>
  <input type="range" min={2} max={32} value={posterize} oninput={(e) => setPosterize(Number(e.target.value))} />
  <input type="number" class="ctrl-num" min={2} max={32} value={posterize} oninput={(e) => setPosterize(Number(e.target.value))} />
</div>
<div class="ctrl-row">
  <span class="ctrl-label">Blend</span>
  <select style="flex:1" value={blend} onchange={setBlend}>
    {#each BLEND_OPTIONS as opt}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>
</div>
