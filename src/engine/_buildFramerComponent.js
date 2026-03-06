// Builds the Framer code component string at export time.
// Called by generateFramerComponent() in export.js.

export function buildComponentCode(palette, b64, bytesPerCell, cellCount, needsWideX, cols, rows, cellW, cellH, fontSize, mix, hR, bgDefault) {
  const q = JSON.stringify;
  const decode = needsWideX
    ? 'X[i]=(D.charCodeAt(j)<<8)|D.charCodeAt(j+1);Y[i]=D.charCodeAt(j+2);CH[i]=D.charCodeAt(j+3);CI[i]=D.charCodeAt(j+4);'
    : 'X[i]=D.charCodeAt(j);Y[i]=D.charCodeAt(j+1);CH[i]=D.charCodeAt(j+2);CI[i]=D.charCodeAt(j+3);';

  const gW = cols * cellW;
  const gH = rows * cellH;
  const aspect = gH / gW;
  const FONT = q(fontSize + 'px "Courier New","Consolas",monospace');
  const L = [];
  const p = (s) => L.push(s);

  // ── Imports & data decode ──
  p('import { addPropertyControls, ControlType } from "framer"');
  p('import { useRef, useEffect, useState } from "react"');
  p('');
  p('const P=[' + palette.map(c => q(c)).join(',') + ']');
  p('const D=atob(' + q(b64) + ')');
  p('const BPC=' + bytesPerCell + ',NC=' + cellCount);
  p('const X=new Uint16Array(NC),Y=new Uint8Array(NC),CH=new Uint8Array(NC),CI=new Uint8Array(NC)');
  p('for(let i=0,j=0;i<NC;i++,j+=BPC){' + decode + '}');
  p('const COLS=' + cols + ',ROWS=' + rows + ',CW=' + cellW + ',CWH=' + cellH);
  p('const GW=' + gW + ',GH=' + gH + ',ASPECT=' + aspect.toFixed(6));
  p('const FONT=' + FONT);
  p('');

  // ── Component ──
  p('export default function AsciiArt(props) {');
  p('  const {');
  p('    bgColor = ' + q(bgDefault) + ',');
  p('    asciiColor = "",');
  p('    sizing = "fillWidth",');
  p('    manualScale = 100,');
  p('    hoverEnabled = false,');
  p('    hoverRadius = ' + hR + ',');
  p('    revealOnView = false,');
  p('    revealDirection = "center-out",');
  p('    revealSpeed = 35,');
  p('    style,');
  p('  } = props');
  p('');
  p('  const containerRef = useRef(null)');
  p('  const canvasRef = useRef(null)');
  p('  const mouseRef = useRef({ x: -1e4, y: -1e4 })');
  p('  const trailRef = useRef(new Float64Array(360))');
  p('  const trailLen = useRef(0)');
  p('  const visRef = useRef(!revealOnView)');
  p('  const [computedH, setComputedH] = useState(0)');
  p('');

  // ── IntersectionObserver for reveal ──
  p('  useEffect(() => {');
  p('    if (!revealOnView) { visRef.current = true; return }');
  p('    const el = containerRef.current');
  p('    if (!el) return');
  p('    visRef.current = false');
  p('    const io = new IntersectionObserver(([e]) => {');
  p('      if (e.isIntersecting) { visRef.current = true; io.disconnect() }');
  p('    }, { threshold: 0.1 })');
  p('    io.observe(el)');
  p('    return () => io.disconnect()');
  p('  }, [revealOnView])');
  p('');

  // ── Main render effect ──
  p('  useEffect(() => {');
  p('    const cvs = canvasRef.current, box = containerRef.current');
  p('    if (!cvs || !box) return');
  p('    const ctx = cvs.getContext("2d", { alpha: true })');
  p('    if (!ctx) return');
  p('');
  p('    const dpr = window.devicePixelRatio || 1');
  p('    const useCC = asciiColor && asciiColor !== ""');
  p('    let W = 1, H = 1, s = 1, ox = 0, oy = 0, dirty = true');
  p('');

  // ── Pre-render offscreen ──
  p('    const off = document.createElement("canvas")');
  p('    off.width = GW; off.height = GH');
  p('    const offCtx = off.getContext("2d")');
  p('    offCtx.font = FONT');
  p('    offCtx.textBaseline = "top"');
  p('    offCtx.globalAlpha = ' + mix);
  p('    for (let i = 0; i < NC; i++) {');
  p('      offCtx.fillStyle = useCC ? asciiColor : P[CI[i]]');
  p('      offCtx.fillText(String.fromCharCode(CH[i]), X[i] * CW, Y[i] * CWH)');
  p('    }');
  p('    offCtx.globalAlpha = 1');
  p('');

  // ── Resize: width-driven, height auto ──
  p('    function parseDim(v) { return typeof v === "number" ? v : parseFloat(v) || 0 }');
  p('    function resize() {');
  p('      W = box.clientWidth || parseDim(style && style.width) || 300');
  p('      if (W < 2) return');
  p('');
  p('      if (sizing === "fillWidth") {');
  p('        s = W / GW');
  p('      } else if (sizing === "manual") {');
  p('        s = manualScale / 100');
  p('      } else {');
  p('        s = 1');
  p('      }');
  p('');
  p('      H = Math.ceil(GH * s)');
  p('      ox = Math.max(0, (W - GW * s) / 2)');
  p('      oy = 0');
  p('');
  p('      cvs.width = W * dpr; cvs.height = H * dpr');
  p('      cvs.style.width = W + "px"; cvs.style.height = H + "px"');
  p('      setComputedH(H)');
  p('      dirty = true');
  p('    }');
  p('    resize()');
  p('    requestAnimationFrame(resize)');
  p('    const ro = new ResizeObserver(resize)');
  p('    ro.observe(box)');
  p('');

  // ── Reveal precompute ──
  p('    const rp = new Float32Array(NC)');
  p('    const dirs = {');
  p('      "left-right": (nx) => nx,');
  p('      "right-left": (nx) => 1 - nx,');
  p('      "top-bottom": (_, ny) => ny,');
  p('      "bottom-top": (_, ny) => 1 - ny,');
  p('      "center-out": (nx) => Math.abs(nx - .5) * 2,');
  p('      "out-center": (nx) => 1 - Math.abs(nx - .5) * 2,');
  p('      "radial-out": (nx, ny) => { const a=nx-.5,b=ny-.5; return Math.sqrt(a*a+b*b)*2 },');
  p('      "radial-in": (nx, ny) => { const a=nx-.5,b=ny-.5; return 1-Math.sqrt(a*a+b*b)*2 },');
  p('    }');
  p('    const dirFn = dirs[revealDirection] || dirs["center-out"]');
  p('    for (let i = 0; i < NC; i++) rp[i] = dirFn(X[i] / COLS, Y[i] / ROWS)');
  p('    const revDur = 3 * (1 - revealSpeed / 100) + 0.3');
  p('    let revealDone = !revealOnView');
  p('    let revStart = -1');
  p('    const hR2 = hoverRadius * hoverRadius');
  p('    let afId = 0');
  p('');

  // ── Render helpers ──
  p('    function setTransform() {');
  p('      ctx.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr)');
  p('      ctx.scale(s, s)');
  p('      ctx.font = FONT');
  p('      ctx.textBaseline = "top"');
  p('    }');
  p('');

  // ── Frame loop ──
  p('    function frame() {');
  p('      const now = performance.now()');
  p('');

  // Reveal branch
  p('      if (revealOnView && !revealDone) {');
  p('        if (!visRef.current) { afId = requestAnimationFrame(frame); return }');
  p('        if (revStart < 0) revStart = now');
  p('        const prog = Math.min(1, (now - revStart) / 1000 / revDur)');
  p('        if (prog >= 1) revealDone = true');
  p('        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)');
  p('        ctx.clearRect(0, 0, W * dpr, H * dpr)');
  p('        setTransform()');
  p('        for (let i = 0; i < NC; i++) {');
  p('          const vis = (prog - rp[i] * .8) / .2');
  p('          if (vis < .01) continue');
  p('          ctx.globalAlpha = ' + mix + ' * Math.min(1, vis)');
  p('          ctx.fillStyle = useCC ? asciiColor : P[CI[i]]');
  p('          ctx.fillText(String.fromCharCode(CH[i]), X[i] * CW, Y[i] * CWH)');
  p('        }');
  p('        dirty = true');
  p('        afId = requestAnimationFrame(frame); return');
  p('      }');
  p('');

  // Hover logic
  p('      const mx = mouseRef.current.x, my = mouseRef.current.y');
  p('      const lx = (mx - ox) / s, ly = (my - oy) / s');
  p('      const mc = lx / CW | 0, mr = ly / CWH | 0');
  p('      const onCanvas = mx > -9e3');
  p('      const t = trailRef.current, tl = trailLen.current');
  p('      if (hoverEnabled && onCanvas && tl < 360) {');
  p('        t[tl] = mc; t[tl+1] = mr; t[tl+2] = now; trailLen.current = tl + 3');
  p('      }');
  p('      let wIdx = 0');
  p('      for (let i = 0; i < trailLen.current; i += 3) {');
  p('        if (now - t[i+2] < 400) {');
  p('          if (wIdx !== i) { t[wIdx]=t[i]; t[wIdx+1]=t[i+1]; t[wIdx+2]=t[i+2] }');
  p('          wIdx += 3');
  p('        }');
  p('      }');
  p('      trailLen.current = wIdx');
  p('');

  // Static draw
  p('      if ((!hoverEnabled || !onCanvas) && wIdx === 0) {');
  p('        if (dirty) {');
  p('          ctx.setTransform(dpr, 0, 0, dpr, 0, 0)');
  p('          ctx.clearRect(0, 0, W * dpr, H * dpr)');
  p('          ctx.setTransform(dpr, 0, 0, dpr, ox * dpr, oy * dpr)');
  p('          ctx.drawImage(off, 0, 0, GW * s, GH * s)');
  p('          dirty = false');
  p('        }');
  p('        afId = requestAnimationFrame(frame); return');
  p('      }');
  p('');

  // Hover draw
  p('      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)');
  p('      ctx.clearRect(0, 0, W * dpr, H * dpr)');
  p('      setTransform()');
  p('      for (let i = 0; i < NC; i++) {');
  p('        const cx = X[i], cy = Y[i]');
  p('        let hf = 0');
  p('        if (hoverEnabled && onCanvas) {');
  p('          const dx=cx-mc, dy=cy-mr, d2=dx*dx+dy*dy');
  p('          if (d2 < hR2) hf = 1 - d2/hR2');
  p('        }');
  p('        for (let j = 0; j < wIdx; j += 3) {');
  p('          const str=1-(now-t[j+2])/400, dx=cx-t[j], dy=cy-t[j+1], d2=dx*dx+dy*dy');
  p('          const tR2=hR2*str*str');
  p('          if (d2<tR2) { const v=(1-d2/tR2)*str*.6; if(v>hf) hf=v }');
  p('        }');
  p('        ctx.globalAlpha = ' + mix);
  p('        const clr = useCC ? asciiColor : P[CI[i]]');
  p('        if (hf > .5) { ctx.fillStyle = clr; ctx.fillRect(cx*CW, cy*CWH, CW+1, CWH+1) }');
  p('        else { ctx.fillStyle = clr; ctx.fillText(String.fromCharCode(CH[i]), cx*CW, cy*CWH) }');
  p('      }');
  p('      dirty = true');
  p('      afId = requestAnimationFrame(frame)');
  p('    }');
  p('');
  p('    frame()');
  p('    return () => { cancelAnimationFrame(afId); ro.disconnect() }');
  p('  }, [asciiColor, sizing, manualScale, hoverEnabled, hoverRadius, revealOnView, revealDirection, revealSpeed])');
  p('');

  // ── JSX return ──
  // Width comes from Framer's style, height is auto from the canvas content
  p('  const wrapStyle = { ...style }');
  p('  delete wrapStyle.height');
  p('  Object.assign(wrapStyle, { height: computedH || "auto", background: bgColor, overflow: "hidden" })');
  p('');
  p('  return (');
  p('    <div');
  p('      ref={containerRef}');
  p('      style={wrapStyle}');
  p('      onMouseMove={(e) => {');
  p('        const r = canvasRef.current?.getBoundingClientRect()');
  p('        if (r) mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top }');
  p('      }}');
  p('      onMouseLeave={() => { mouseRef.current = { x: -1e4, y: -1e4 } }}');
  p('    >');
  p('      <canvas ref={canvasRef} style={{ display: "block" }} />');
  p('    </div>');
  p('  )');
  p('}');
  p('');

  // ── Property Controls ──
  p('addPropertyControls(AsciiArt, {');
  p('  bgColor: {');
  p('    type: ControlType.Color,');
  p('    title: "Background",');
  p('    defaultValue: ' + q(bgDefault) + ',');
  p('  },');
  p('  asciiColor: {');
  p('    type: ControlType.Color,');
  p('    title: "ASCII Color",');
  p('  },');
  p('  sizing: {');
  p('    type: ControlType.Enum,');
  p('    title: "Sizing",');
  p('    defaultValue: "fillWidth",');
  p('    options: ["fillWidth", "manual", "native"],');
  p('    optionTitles: ["Fill Width", "Manual", "Native"],');
  p('  },');
  p('  manualScale: {');
  p('    type: ControlType.Number,');
  p('    title: "Scale %",');
  p('    defaultValue: 100,');
  p('    min: 10, max: 500, step: 5,');
  p('    hidden: (p) => p.sizing !== "manual",');
  p('  },');
  p('  hoverEnabled: {');
  p('    type: ControlType.Boolean,');
  p('    title: "Hover Effect",');
  p('    defaultValue: false,');
  p('    enabledTitle: "On",');
  p('    disabledTitle: "Off",');
  p('  },');
  p('  hoverRadius: {');
  p('    type: ControlType.Number,');
  p('    title: "Hover Radius",');
  p('    defaultValue: ' + hR + ',');
  p('    min: 1, max: 30, step: 1,');
  p('    hidden: (p) => !p.hoverEnabled,');
  p('  },');
  p('  revealOnView: {');
  p('    type: ControlType.Boolean,');
  p('    title: "Reveal on Scroll",');
  p('    defaultValue: false,');
  p('    enabledTitle: "On",');
  p('    disabledTitle: "Off",');
  p('  },');
  p('  revealDirection: {');
  p('    type: ControlType.Enum,');
  p('    title: "Reveal Dir",');
  p('    defaultValue: "center-out",');
  p('    options: ["left-right","right-left","top-bottom","bottom-top","center-out","out-center","radial-out","radial-in"],');
  p('    optionTitles: ["Left to Right","Right to Left","Top to Bottom","Bottom to Top","Center Out","Out Center","Radial Out","Radial In"],');
  p('    hidden: (p) => !p.revealOnView,');
  p('  },');
  p('  revealSpeed: {');
  p('    type: ControlType.Number,');
  p('    title: "Reveal Speed",');
  p('    defaultValue: 35,');
  p('    min: 0, max: 100, step: 1,');
  p('    hidden: (p) => !p.revealOnView,');
  p('  },');
  p('})');

  return L.join('\n');
}
