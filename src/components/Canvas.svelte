<script>
  import { onMount } from 'svelte';
  import { config, CHAR_PRESETS } from '../stores/config.js';
  import { ui } from '../stores/ui.js';
  import { commit, undo, redo } from '../stores/undo.js';
  import {
    startRenderLoop, setSourceReady, setSourceElement, setSourceIsVideo,
    setSourceFileName, setMouse, setAnimStartTime, getState,
    setActiveSelection, getMovedGroups
  } from '../engine/renderer.js';
  import { playClick, playShutter } from '../engine/sfx.js';
  import placeholderUrl from '../assets/placeholder.jpg';

  let sourceCanvas, asciiCanvas, hdrCanvas, handlesCanvas, guidesCanvas;
  let processingCanvas, tileCanvas, bloomBufA, bloomBufB;
  let sourceImg, sourceVideo;
  let fileInput;
  let canvasWrapper;

  let showDropHint = $state(true);
  let zoomLevel = $state(100);
  let showZoom = $state(false);
  let showResetView = $state(false);
  let zoomTimer;

  // VIEW system (pan/zoom)
  let VIEW = {
    x: 0, y: 0, scale: 1, targetScale: 1,
    dragging: false, dragStartX: 0, dragStartY: 0, dragViewX: 0, dragViewY: 0,
  };

  // Lasso state
  let lassoActive = $state(false);
  let lassoRect = $state({ x: 0, y: 0, w: 0, h: 0 });
  let lassoStart = null;

  // Viewfinder data
  let fileName = $derived(getState().sourceFileName || 'NO SOURCE');
  let vfSize = $derived(`${$config.fontSize}px`);
  let vfChars = $derived(
    CHAR_PRESETS.find(p => p.chars === $config.chars)?.name || 'CUSTOM'
  );

  function updateTransform() {
    if (canvasWrapper) {
      canvasWrapper.style.transform = `translate(${VIEW.x}px, ${VIEW.y}px) scale(${VIEW.scale})`;
    }
    const pct = Math.round(VIEW.scale * 100);
    zoomLevel = pct;
    showResetView = VIEW.x !== 0 || VIEW.y !== 0 || VIEW.scale !== 1;
  }

  function resetView() {
    VIEW.x = 0; VIEW.y = 0; VIEW.scale = 1; VIEW.targetScale = 1;
    updateTransform();
    playClick();
  }

  function handleWheel(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 1 / 1.08;
    const newScale = Math.max(0.1, Math.min(10, VIEW.scale * factor));
    const mx = e.clientX, my = e.clientY;
    VIEW.x = mx - (mx - VIEW.x) * (newScale / VIEW.scale);
    VIEW.y = my - (my - VIEW.y) * (newScale / VIEW.scale);
    VIEW.scale = newScale;
    updateTransform();
    showZoom = true;
    clearTimeout(zoomTimer);
    zoomTimer = setTimeout(() => showZoom = false, 800);
  }

  function handlePointerDown(e) {
    const tool = $ui.activeTool;
    if (tool === 'lasso') {
      lassoActive = true;
      lassoStart = { x: e.clientX, y: e.clientY };
      lassoRect = { x: e.clientX, y: e.clientY, w: 0, h: 0 };
      return;
    }
    VIEW.dragging = true;
    VIEW.dragStartX = e.clientX;
    VIEW.dragStartY = e.clientY;
    VIEW.dragViewX = VIEW.x;
    VIEW.dragViewY = VIEW.y;
  }

  function handlePointerMove(e) {
    const rect = (asciiCanvas || sourceCanvas)?.getBoundingClientRect();
    if (rect) {
      const mx = (e.clientX - rect.left) / VIEW.scale;
      const my = (e.clientY - rect.top) / VIEW.scale;
      setMouse(mx, my, true);
    }

    if (lassoActive && lassoStart) {
      const x = Math.min(lassoStart.x, e.clientX);
      const y = Math.min(lassoStart.y, e.clientY);
      const w = Math.abs(e.clientX - lassoStart.x);
      const h = Math.abs(e.clientY - lassoStart.y);
      lassoRect = { x, y, w, h };
      return;
    }

    if (VIEW.dragging) {
      VIEW.x = VIEW.dragViewX + (e.clientX - VIEW.dragStartX);
      VIEW.y = VIEW.dragViewY + (e.clientY - VIEW.dragStartY);
      updateTransform();
    }
  }

  function handlePointerUp() {
    VIEW.dragging = false;
    if (lassoActive) {
      lassoActive = false;
      if (lassoRect.w > 5 && lassoRect.h > 5) {
        const rect = asciiCanvas.getBoundingClientRect();
        const sel = {
          x1: (lassoRect.x - rect.left) / VIEW.scale,
          y1: (lassoRect.y - rect.top) / VIEW.scale,
          x2: (lassoRect.x + lassoRect.w - rect.left) / VIEW.scale,
          y2: (lassoRect.y + lassoRect.h - rect.top) / VIEW.scale,
        };
        setActiveSelection(sel);
      }
    }
  }

  function handlePointerLeave() {
    setMouse(0, 0, false);
  }

  function handleDblClick() {
    fileInput?.click();
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) loadFile(file);
  }

  function handleDragOver(e) {
    e.preventDefault();
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
    e.target.value = '';
  }

  function loadFile(file) {
    const url = URL.createObjectURL(file);
    showDropHint = false;
    playShutter();

    if (file.type.startsWith('video/')) {
      sourceVideo.src = url;
      sourceVideo.onloadeddata = () => {
        setSourceElement(sourceVideo);
        setSourceIsVideo(true);
        setSourceFileName(file.name);
        setSourceReady(true);
        setAnimStartTime(performance.now());
      };
      sourceVideo.load();
      sourceVideo.play();
    } else {
      sourceImg.src = url;
      sourceImg.onload = () => {
        setSourceElement(sourceImg);
        setSourceIsVideo(false);
        setSourceFileName(file.name);
        setSourceReady(true);
        setAnimStartTime(performance.now());
      };
    }
  }

  function handleKeydown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

    if (e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      ui.update(u => ({ ...u, helpOpen: !u.helpOpen }));
    } else if (e.key === 'v' || e.key === 'V') {
      ui.update(u => ({ ...u, activeTool: 'move' }));
    } else if (e.key === 'l' || e.key === 'L') {
      ui.update(u => ({ ...u, activeTool: 'lasso' }));
    } else if (e.key === ' ') {
      e.preventDefault();
      resetView();
    } else if (e.key === 'z' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      undo();
    } else if (e.key === 'y' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      redo();
    } else if (e.key === '[') {
      config.update(c => ({ ...c, fontSize: Math.max(4, c.fontSize - 1) }));
    } else if (e.key === ']') {
      config.update(c => ({ ...c, fontSize: Math.min(32, c.fontSize + 1) }));
    } else if (e.key >= '1' && e.key <= '9') {
      const sizes = [4, 6, 8, 10, 12, 16, 20, 26, 32];
      config.update(c => ({ ...c, fontSize: sizes[parseInt(e.key) - 1] }));
    }
  }

  onMount(() => {
    const canvases = {
      asciiCanvas, sourceCanvas, hdrCanvas, handlesCanvas, guidesCanvas,
      processingCanvas, tileCanvas, bloomBufA, bloomBufB,
    };
    const stop = startRenderLoop(canvases);

    window.addEventListener('keydown', handleKeydown);

    commit();

    // Load placeholder image
    const placeholderImg = new Image();
    placeholderImg.onload = () => {
      setSourceElement(placeholderImg);
      setSourceIsVideo(false);
      setSourceFileName('placeholder.jpg');
      setSourceReady(true);
      setAnimStartTime(performance.now());
      showDropHint = false;
    };
    placeholderImg.src = placeholderUrl;

    const onTriggerUpload = () => fileInput?.click();
    window.addEventListener('trigger-upload', onTriggerUpload);

    const onClearMoves = () => { getMovedGroups().length = 0; setActiveSelection(null); };
    window.addEventListener('clear-moves', onClearMoves);

    return () => {
      stop();
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('trigger-upload', onTriggerUpload);
      window.removeEventListener('clear-moves', onClearMoves);
    };
  });

  let canvasColor = $derived($config.canvasColor);
  let bgStyle = $derived(`background:rgb(${canvasColor.r},${canvasColor.g},${canvasColor.b})`);
</script>

<input type="file" accept="image/*,video/*" style="display:none" bind:this={fileInput} onchange={handleFileChange} />
<img class="hidden-src" bind:this={sourceImg} alt="" />
<video class="hidden-src" bind:this={sourceVideo} muted loop playsinline></video>
<canvas class="hidden-src" bind:this={processingCanvas}></canvas>
<canvas class="hidden-src" bind:this={tileCanvas}></canvas>
<canvas class="hidden-src" bind:this={bloomBufA}></canvas>
<canvas class="hidden-src" bind:this={bloomBufB}></canvas>

<div id="canvas-wrapper" bind:this={canvasWrapper}>
  <div id="bg-layer" style={bgStyle}></div>
  <canvas id="source-canvas" bind:this={sourceCanvas}></canvas>
  <canvas id="ascii-canvas" bind:this={asciiCanvas}></canvas>
  <canvas id="hdr-canvas" bind:this={hdrCanvas}></canvas>
  <canvas id="handles-canvas" bind:this={handlesCanvas}></canvas>
  <canvas id="guides-canvas" bind:this={guidesCanvas}></canvas>
  {#if showDropHint}
    <div class="drop-hint">
      // DROP AN IMAGE OR VIDEO HERE<br/>// OR DOUBLE-CLICK TO UPLOAD
    </div>
  {/if}
</div>

<div id="interaction-layer"
  onpointerdown={handlePointerDown}
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onpointerleave={handlePointerLeave}
  ondblclick={handleDblClick}
  ondrop={handleDrop}
  ondragover={handleDragOver}
  onwheel={handleWheel}
></div>

{#if lassoActive}
  <div class="lasso-marquee active" style="left:{lassoRect.x}px;top:{lassoRect.y}px;width:{lassoRect.w}px;height:{lassoRect.h}px"></div>
{/if}

<!-- Fujifilm-style viewfinder -->
<div class="vf-corner tl"></div>
<div class="vf-corner tr"></div>
<div class="vf-corner bl"></div>
<div class="vf-corner br"></div>
<div class="vf-reticle"></div>
<div class="vf-top-left">ASCII_FX</div>
<div class="vf-top-right">{vfChars}</div>
<div class="vf-bottom-left">ZOOM {zoomLevel}%</div>
<div class="vf-bottom-right">SIZE {vfSize}</div>

<!-- Designed by tag -->
<a class="designed-by" href="https://pinterest.com/joyysoni/" target="_blank" rel="noopener">designed by joy</a>

<!-- Scanline CRT overlay -->
<div class="scanline-overlay"></div>

<div class="zoom-indicator" class:visible={showZoom}>{zoomLevel}%</div>
<button class="reset-view-btn" class:visible={showResetView} onclick={resetView}>RESET VIEW</button>
