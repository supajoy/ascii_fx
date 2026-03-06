<script>
  import { config } from '../../stores/config.js';
  import { ui } from '../../stores/ui.js';
  import { layerOrder } from '../../stores/layers.js';
  import { debouncedCommit } from '../../stores/undo.js';

  let selected = $derived($ui.selectedLayer);
  let order = $derived($layerOrder);
  let hdrOn = $derived($config.hdrEnabled);
  let asciiOp = $derived(Math.round($config.asciiOpacity * 100));
  let sourceOp = $derived(Math.round($config.sourceOpacity * 100));
  let asciiVisible = $derived($config.asciiVisible);
  let sourceVisible = $derived($config.sourceVisible);
  let blendMode = $derived($config.blendMode);

  let dragging = $state(null);
  let dragOver = $state(null);
  let dragPos = $state(null); // 'top' | 'bottom'

  const eyeSvg = `<svg viewBox="0 0 16 12"><path d="M1 6s3-5 7-5 7 5 7 5-3 5-7 5-7-5-7-5z"/><circle cx="8" cy="6" r="2"/></svg>`;

  function selectLayer(layer) {
    ui.update(u => ({ ...u, selectedLayer: layer }));
  }

  function toggleVisibility(layer) {
    if (layer === 'ascii') config.update(c => ({ ...c, asciiVisible: !c.asciiVisible }));
    else if (layer === 'source') config.update(c => ({ ...c, sourceVisible: !c.sourceVisible }));
    debouncedCommit();
  }

  function setOpacity(layer, e) {
    const v = Number(e.target.value) / 100;
    if (layer === 'ascii') config.update(c => ({ ...c, asciiOpacity: v }));
    else if (layer === 'source') config.update(c => ({ ...c, sourceOpacity: v }));
    debouncedCommit();
  }

  function onDragStart(layer) { dragging = layer; }
  function onDragEnd() { dragging = null; dragOver = null; dragPos = null; }
  function onDragOver(layer, e) {
    e.preventDefault();
    dragOver = layer;
    const rect = e.currentTarget.getBoundingClientRect();
    dragPos = (e.clientY - rect.top < rect.height / 2) ? 'top' : 'bottom';
  }
  function onDrop(layer) {
    if (!dragging || dragging === layer) return;
    layerOrder.update(arr => {
      const newArr = arr.filter(l => l !== dragging);
      const idx = newArr.indexOf(layer);
      if (dragPos === 'top') newArr.splice(idx, 0, dragging);
      else newArr.splice(idx + 1, 0, dragging);
      return newArr;
    });
    dragging = null; dragOver = null; dragPos = null;
  }

  function layerLabel(layer) {
    if (layer === 'hdr') return 'HDR Bloom';
    if (layer === 'ascii') return 'ASCII Effect';
    return 'Source';
  }
  function layerMeta(layer) {
    if (layer === 'hdr') return 'screen blend';
    if (layer === 'ascii') return blendMode;
    return 'no source';
  }
  function isVisible(layer) {
    if (layer === 'ascii') return asciiVisible;
    if (layer === 'source') return sourceVisible;
    return true;
  }
</script>

<div class="layers-header">Layers</div>
<div>
  {#each order as layer}
    {#if layer !== 'hdr' || hdrOn}
      <div
        class="layer-row"
        class:selected={selected === layer}
        class:dragging={dragging === layer}
        class:drag-over-top={dragOver === layer && dragPos === 'top'}
        class:drag-over-bottom={dragOver === layer && dragPos === 'bottom'}
        draggable="true"
        onclick={() => selectLayer(layer)}
        ondragstart={() => onDragStart(layer)}
        ondragend={onDragEnd}
        ondragover={(e) => onDragOver(layer, e)}
        ondrop={() => onDrop(layer)}
      >
        <span class="drag-handle" title="Drag to reorder">&#x2817;</span>
        <div
          class="layer-eye"
          class:off={!isVisible(layer)}
          onclick={(e) => { e.stopPropagation(); toggleVisibility(layer); }}
          title="Toggle visibility"
        >
          {@html eyeSvg}
        </div>
        <div class="layer-info">
          <div class="layer-name">{layerLabel(layer)}</div>
          <div class="layer-meta">{layerMeta(layer)}</div>
        </div>
      </div>
      {#if layer === 'ascii'}
        <div class="layer-controls">
          <span class="lc-label">Op</span>
          <input type="range" min={0} max={100} value={asciiOp} oninput={(e) => setOpacity('ascii', e)} />
          <input type="number" class="lc-num" min={0} max={100} value={asciiOp} oninput={(e) => setOpacity('ascii', e)} />
        </div>
      {/if}
      {#if layer === 'source'}
        <div class="layer-controls">
          <span class="lc-label">Op</span>
          <input type="range" min={0} max={100} value={sourceOp} oninput={(e) => setOpacity('source', e)} />
          <input type="number" class="lc-num" min={0} max={100} value={sourceOp} oninput={(e) => setOpacity('source', e)} />
        </div>
      {/if}
    {/if}
  {/each}
</div>

<!-- Layer Properties -->
{#if selected === 'source'}
  <div class="layer-props">
    <div class="layer-props-header">Source Properties</div>
    <div class="props-group">
      <div class="props-row">
        <span class="props-label">Scale</span>
        <input type="range" min={10} max={500} value={Math.round($config.sourceScale * 100)} oninput={(e) => { config.update(c => ({ ...c, sourceScale: Number(e.target.value) / 100 })); debouncedCommit(); }} />
        <input type="number" class="props-num" min={10} max={500} value={Math.round($config.sourceScale * 100)} oninput={(e) => { config.update(c => ({ ...c, sourceScale: Number(e.target.value) / 100 })); debouncedCommit(); }} />
        <span class="props-unit">%</span>
      </div>
      <div class="props-row">
        <span class="props-label">X</span>
        <input type="number" class="props-num wide" value={$config.sourceOffsetX} oninput={(e) => { config.update(c => ({ ...c, sourceOffsetX: Number(e.target.value) })); debouncedCommit(); }} />
        <span class="props-label" style="margin-left:6px">Y</span>
        <input type="number" class="props-num wide" value={$config.sourceOffsetY} oninput={(e) => { config.update(c => ({ ...c, sourceOffsetY: Number(e.target.value) })); debouncedCommit(); }} />
      </div>
      <div class="props-row" style="margin-top:2px">
        <button class="props-btn" onclick={() => window.dispatchEvent(new CustomEvent('source-action', { detail: 'fit' }))}>Fit Frame</button>
        <button class="props-btn" onclick={() => { config.update(c => ({ ...c, sourceOffsetX: 0, sourceOffsetY: 0 })); debouncedCommit(); }}>Center</button>
        <button class="props-btn" onclick={() => { config.update(c => ({ ...c, sourceScale: 0.65, sourceOffsetX: 0, sourceOffsetY: 0 })); debouncedCommit(); }}>Reset</button>
      </div>
    </div>
  </div>
{/if}
