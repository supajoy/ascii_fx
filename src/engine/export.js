// ── Export: Video Embed, Embed, React JSX, SVG, Composite PNG ────────
// Produces self-contained HTML, SVG, React JSX, and composite PNG canvases.

import { rgbToHsl, hslToRgb } from './color.js';
import { computeBloomForExport } from './hdr.js';

export function generateVideoEmbed(cfg, sourceElement, cols, rows) {
  const W = window.innerWidth, H = window.innerHeight;
  const fontSize = cfg.fontSize;
  const cellW = fontSize * 0.6, cellH = fontSize * cfg.lineHeight;

  // Capture source image as base64 at grid resolution
  const capCanvas = document.createElement('canvas');
  capCanvas.width = cols; capCanvas.height = rows;
  const capCtx = capCanvas.getContext('2d');
  capCtx.imageSmoothingEnabled = false;
  if (sourceElement) capCtx.drawImage(sourceElement, 0, 0, cols, rows);
  const imgData = capCanvas.toDataURL('image/png');

  const embedCfg = {
    chars: cfg.chars,
    fontSize: cfg.fontSize,
    lineHeight: cfg.lineHeight,
    brightnessBoost: cfg.brightnessBoost,
    saturationBoost: cfg.saturationBoost,
    colored: cfg.colored,
    mix: cfg.mix,
    animEnabled: cfg.animEnabled,
    animType: cfg.animType,
    animSpeed: cfg.animSpeed,
    animAmplitude: cfg.animAmplitude,
    hoverEnabled: cfg.hoverEnabled,
    hoverRadius: cfg.hoverRadius,
    hoverExposure: cfg.hoverExposure,
    asciiColorOverride: cfg.asciiColorOverride,
    asciiColor: cfg.asciiColor,
    canvasColor: cfg.canvasColor,
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>ASCII FX Export</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:rgb(${embedCfg.canvasColor.r},${embedCfg.canvasColor.g},${embedCfg.canvasColor.b});overflow:hidden;width:100vw;height:100vh}
canvas{position:absolute;top:0;left:0;width:100vw;height:100vh}
</style>
</head>
<body>
<canvas id="c"></canvas>
<img id="src" style="display:none" src="${imgData}"/>
<` + `script>
(function(){
const CFG=${JSON.stringify(embedCfg).replace(/</g,'\\u003c')};
const canvas=document.getElementById('c');
const ctx=canvas.getContext('2d');
const srcImg=document.getElementById('src');
let W,H,cols,rows,cellW,cellH;
let mouseX=-9999,mouseY=-9999;
const trail=[];
const startTime=performance.now();

function resize(){
  W=window.innerWidth;H=window.innerHeight;
  canvas.width=W;canvas.height=H;
  cellW=CFG.fontSize*0.6;cellH=CFG.fontSize*CFG.lineHeight;
  cols=Math.ceil(W/cellW);rows=Math.ceil(H/cellH);
}
resize();
window.addEventListener('resize',resize);

document.addEventListener('mousemove',function(e){mouseX=e.clientX;mouseY=e.clientY;});
document.addEventListener('mouseleave',function(){mouseX=-9999;mouseY=-9999;});

function rgbToHsl(r,g,b){r/=255;g/=255;b/=255;const mx=Math.max(r,g,b),mn=Math.min(r,g,b);let h,s,l=(mx+mn)/2;if(mx===mn){h=s=0}else{const d=mx-mn;s=l>0.5?d/(2-mx-mn):d/(mx+mn);switch(mx){case r:h=(g-b)/d+(g<b?6:0);break;case g:h=(b-r)/d+2;break;case b:h=(r-g)/d+4;break}h/=6}return[h,s,l]}
function hslToRgb(h,s,l){let r,g,b;if(s===0){r=g=b=l}else{function hue2rgb(p,q,t){if(t<0)t+=1;if(t>1)t-=1;if(t<1/6)return p+(q-p)*6*t;if(t<1/2)return q;if(t<2/3)return p+(q-p)*(2/3-t)*6;return p}const q=l<0.5?l*(1+s):l+s-l*s;const p=2*l-q;r=hue2rgb(p,q,h+1/3);g=hue2rgb(p,q,h);b=hue2rgb(p,q,h-1/3)}return[r*255,g*255,b*255]}

function getAnimOff(cols,rows){
  const t=(performance.now()-startTime)/1000;
  const speed=CFG.animSpeed/50,amp=CFG.animAmplitude/100;
  const total=cols*rows;
  const off=new Float32Array(total*2);
  const type=CFG.animType;
  if(type==='default'){const str=2.5+amp*6;for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*cols+x;const h1=Math.sin(x*127.1+y*311.7+t*3*speed)*43758.5453;const h2=Math.sin(x*269.5+y*183.3+t*2.3*speed)*21037.1289;const n1=(h1-Math.floor(h1))-0.5;const n2=(h2-Math.floor(h2))-0.5;const w=Math.sin(x*0.15+y*0.12+t*0.8*speed)*0.5+0.5;off[i*2]=n1*str*(0.4+w*0.6);off[i*2+1]=n2*str*(0.3+w*0.7);}return off;}
  if(type==='wave'){for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*cols+x;off[i*2]=0;off[i*2+1]=Math.sin(x*0.15+t*3*speed)*amp*4;}}
  else if(type==='breathe'){const pulse=(Math.sin(t*2*speed)+1)*0.5*amp;for(let i=0;i<total;i++){const x=i%cols,y=Math.floor(i/cols);const cx=cols/2,cy=rows/2;const dx=x-cx,dy=y-cy;const dist=Math.sqrt(dx*dx+dy*dy);const maxD=Math.sqrt(cx*cx+cy*cy);const f=pulse*(dist/maxD)*0.5;off[i*2]=dx*f*0.1;off[i*2+1]=dy*f*0.1;}}
  else if(type==='rain'){for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*cols+x;const cs=Math.sin(x*127.1+311.7)*43758.5453;const ch=cs-Math.floor(cs);const fs=(0.5+ch)*speed*8;const yO=(t*fs+ch*rows)%(rows*1.5);if(Math.abs(y-yO)<amp*6){off[i*2]=0;off[i*2+1]=(y-yO)*0.3;}}}
  else if(type==='glitch'){const gs=Math.floor(t*6*speed);for(let y=0;y<rows;y++){const rh=Math.sin(y*43.1+gs*17.3)*43758.5453;const r=rh-Math.floor(rh);const sh=r>(1-amp*0.3)?(r-0.5)*20*amp:0;for(let x=0;x<cols;x++){const i=y*cols+x;off[i*2]=sh;off[i*2+1]=0;}}}
  else if(type==='flow'){for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const i=y*cols+x;off[i*2]=t*speed*5*amp+Math.sin(y*0.2)*amp*2;off[i*2+1]=0;}}
  return off;
}

const proc=document.createElement('canvas');
const pctx=proc.getContext('2d');
function render(){
  proc.width=cols;proc.height=rows;
  pctx.imageSmoothingEnabled=false;
  pctx.drawImage(srcImg,0,0,cols,rows);
  const imgD=pctx.getImageData(0,0,cols,rows);
  const px=imgD.data;
  const total=cols*rows;
  const luma=new Float32Array(total);
  for(let j=0;j<total;j++){const k=j*4;luma[j]=(0.299*px[k]+0.587*px[k+1]+0.114*px[k+2])/255;}
  const det=new Float32Array(total);
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const idx=y*cols+x,c=luma[idx];const l0=x>0?luma[idx-1]:c,r0=x<cols-1?luma[idx+1]:c,t0=y>0?luma[idx-cols]:c,b0=y<rows-1?luma[idx+cols]:c;const gx=r0-l0,gy=b0-t0;det[idx]=Math.min(1,Math.sqrt(gx*gx+gy*gy)*3.5);}

  const animOff=CFG.animEnabled?getAnimOff(cols,rows):null;
  const mCol=Math.floor(mouseX/cellW),mRow=Math.floor(mouseY/cellH);

  // Trail
  if(CFG.hoverEnabled&&mouseX>0){
    trail.push({col:mCol,row:mRow,t:performance.now()});
    const now=performance.now();
    while(trail.length&&now-trail[0].t>400)trail.shift();
  }

  ctx.clearRect(0,0,W,H);
  ctx.font=CFG.fontSize+'px "Courier New","Consolas",monospace';
  ctx.textBaseline='top';
  const chars=CFG.chars,charLen=chars.length;
  const brt=CFG.brightnessBoost;

  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
    const idx=y*cols+x;
    let si=idx;
    if(animOff){const ox=animOff[idx*2],oy=animOff[idx*2+1];const sx=Math.max(0,Math.min(cols-1,x+ox));const sy=Math.max(0,Math.min(rows-1,y+oy));si=Math.round(sy)*cols+Math.round(sx);}
    const i=si*4;
    const r=px[i],g=px[i+1],b=px[i+2];
    const brightness=luma[si],d=det[si];

    let hf=0;
    if(CFG.hoverEnabled){
      const dx=x-mCol,dy=y-mRow,dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<CFG.hoverRadius)hf=1-(dist/CFG.hoverRadius)*(dist/CFG.hoverRadius);
      for(let ti=0;ti<trail.length;ti++){const tp=trail[ti];const str=1-(performance.now()-tp.t)/400;const dd=Math.sqrt((x-tp.col)*(x-tp.col)+(y-tp.row)*(y-tp.row));const tR=CFG.hoverRadius*str;if(dd<tR){const v=1-(dd/tR)*(dd/tR);hf=Math.max(hf,v*str*0.6);}}
    }
    const eLift=hf*CFG.hoverExposure;
    let fr,fg,fb;
    if(CFG.asciiColorOverride){const ac=CFG.asciiColor;fr=Math.min(255,ac.r+eLift*255);fg=Math.min(255,ac.g+eLift*255);fb=Math.min(255,ac.b+eLift*255);}
    else{let[h,s,l]=rgbToHsl(r,g,b);if(CFG.colored){s=Math.min(1,s*CFG.saturationBoost);l=Math.min(1,l*brt+eLift);}else{h=1/3;s=1;l=Math.min(1,brightness*brt+eLift);}[fr,fg,fb]=hslToRgb(h,s,l);}
    const fB=Math.min(1,brightness*brt+eLift);
    const ppx=Math.floor(x*cellW),ppy=Math.floor(y*cellH);
    const pw=Math.ceil(cellW)+1,ph=Math.ceil(cellH)+1;
    if(hf>0.5){ctx.fillStyle='rgb('+Math.round(fr)+','+Math.round(fg)+','+Math.round(fb)+')';ctx.fillRect(ppx,ppy,pw,ph);continue;}
    const maxCI=Math.max(2,Math.round(d*(charLen-1)));
    const ci=Math.min(Math.floor(fB*(maxCI+1)),maxCI);
    const ch=chars[ci];
    if(ch===' ')continue;
    ctx.globalAlpha=CFG.mix;
    ctx.fillStyle='rgb('+Math.round(fr)+','+Math.round(fg)+','+Math.round(fb)+')';
    ctx.fillText(ch,ppx,ppy);
    ctx.globalAlpha=1;
  }
  requestAnimationFrame(render);
}
srcImg.onload=function(){render()};
if(srcImg.complete)render();
})();
<` + `/script>
</body>
</html>`;
}

export function generateEmbed(lastCapturedFrame, cfg) {
  if (!lastCapturedFrame) return '';
  const f = lastCapturedFrame;
  const fr = { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
  const fontSize = cfg.fontSize;
  const cellW = f.cellW, cellH = f.cellH;

  const col1 = Math.max(0, Math.floor(fr.x / cellW));
  const row1 = Math.max(0, Math.floor(fr.y / cellH));
  const col2 = Math.min(f.cols, Math.ceil((fr.x + fr.w) / cellW));
  const row2 = Math.min(f.rows, Math.ceil((fr.y + fr.h) / cellH));

  const bgHex = `rgb(${cfg.canvasColor.r},${cfg.canvasColor.g},${cfg.canvasColor.b})`;

  let rows = '';
  for (let y = row1; y < row2; y++) {
    let row = '';
    for (let x = col1; x < col2; x++) {
      const idx = y * f.cols + x;
      const ch = f.chars[idx];
      const color = f.colors[idx];
      if (ch === ' ') { row += ' '; continue; }
      const esc = ch.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      row += `<span style="color:${color}">${esc}</span>`;
    }
    rows += row + '\n';
  }

  return `<!-- ASCII Effect Embed -->\n<div style="background:${bgHex};padding:0;margin:0;overflow:hidden;display:inline-block;line-height:${cfg.lineHeight};font-size:${fontSize}px">\n<pre style="margin:0;padding:0;font-family:'Courier New',Consolas,monospace;line-height:${cfg.lineHeight};letter-spacing:0">${rows}</pre>\n</div>`;
}

export function generateReactComponent(lastCapturedFrame, cfg) {
  if (!lastCapturedFrame) return '';
  const f = lastCapturedFrame;
  const fr = { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
  const fontSize = cfg.fontSize;
  const cellW = f.cellW, cellH = f.cellH;

  const col1 = Math.max(0, Math.floor(fr.x / cellW));
  const row1 = Math.max(0, Math.floor(fr.y / cellH));
  const col2 = Math.min(f.cols, Math.ceil((fr.x + fr.w) / cellW));
  const row2 = Math.min(f.rows, Math.ceil((fr.y + fr.h) / cellH));

  const bgColor = `rgb(${cfg.canvasColor.r},${cfg.canvasColor.g},${cfg.canvasColor.b})`;

  // Build row data as a compact array
  const rowData = [];
  for (let y = row1; y < row2; y++) {
    const spans = [];
    let runStart = col1, runColor = null, runChars = '';

    for (let x = col1; x <= col2; x++) {
      const idx = y * f.cols + x;
      const ch = x < col2 ? f.chars[idx] : null;
      const color = x < col2 ? f.colors[idx] : null;

      if (color !== runColor || x === col2) {
        if (runChars.length > 0) {
          const escaped = runChars.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/{/g, '&#123;').replace(/}/g, '&#125;');
          if (runChars.trim() === '') {
            spans.push(runChars);
          } else {
            spans.push({ color: runColor, text: escaped });
          }
        }
        runColor = color;
        runChars = ch || '';
      } else {
        runChars += ch;
      }
    }
    rowData.push(spans);
  }

  // Generate JSX rows
  let jsxRows = '';
  rowData.forEach((spans, ri) => {
    let line = '';
    spans.forEach((span, si) => {
      if (typeof span === 'string') {
        line += span;
      } else {
        line += `<span style={{color:'${span.color}'}}>${span.text}</span>`;
      }
    });
    jsxRows += `        ${line}${ri < rowData.length - 1 ? '\\n' : ''}\n`;
  });

  return `import React from 'react';

const AsciiArt = ({ style, className }) => {
  return (
    <div
      className={className}
      style={{
        background: '${bgColor}',
        display: 'inline-block',
        overflow: 'hidden',
        ...style,
      }}
    >
      <pre
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "'Courier New', Consolas, monospace",
          fontSize: '${fontSize}px',
          lineHeight: ${cfg.lineHeight},
          letterSpacing: 0,
        }}
      >
${jsxRows}      </pre>
    </div>
  );
};

export default AsciiArt;
`;
}

export function generateSVG(tileCanvas, cfg) {
  const W = window.innerWidth, H = window.innerHeight;
  const fr = { x:0, y:0, w:W, h:H };
  const fontSize = cfg.fontSize;
  const cellW = fontSize * 0.6, cellH = fontSize * cfg.lineHeight;
  const cols = Math.ceil(W / cellW), rows = Math.ceil(H / cellH);
  const svgProc = document.createElement('canvas');
  svgProc.width = cols; svgProc.height = rows;
  const svgProcCtx = svgProc.getContext('2d', { willReadFrequently: true });
  svgProcCtx.imageSmoothingEnabled = false;
  svgProcCtx.drawImage(tileCanvas, 0, 0, cols, rows);
  const imageData = svgProcCtx.getImageData(0, 0, cols, rows);
  const pixels = imageData.data;
  const total = cols * rows;
  const luma = new Float32Array(total);
  for (let j=0;j<total;j++){const k=j*4;luma[j]=(0.299*pixels[k]+0.587*pixels[k+1]+0.114*pixels[k+2])/255;}
  const detail = new Float32Array(total);
  for (let y=0;y<rows;y++) for (let x=0;x<cols;x++){
    const idx=y*cols+x,c=luma[idx],l0=x>0?luma[idx-1]:c,r0=x<cols-1?luma[idx+1]:c,t0=y>0?luma[idx-cols]:c,b0=y<rows-1?luma[idx+cols]:c;
    const gx=r0-l0,gy=b0-t0;detail[idx]=Math.min(1,Math.sqrt(gx*gx+gy*gy)*3.5);
  }
  const chars=cfg.chars,charLen=chars.length,mix=cfg.mix,brtBoost=cfg.brightnessBoost;
  const esc=(s)=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const ox=fr.x,oy=fr.y,outW=fr.w,outH=fr.h;
  let svgContent = '';
  {const cc=cfg.canvasColor; svgContent+=`  <rect width="${outW}" height="${outH}" fill="rgb(${cc.r},${cc.g},${cc.b})"/>\n`;}

  // Source canvas reference for SVG embedding
  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = Math.max(1, Math.floor(W / cfg.tileSize));
  srcCanvas.height = Math.max(1, Math.floor(H / cfg.tileSize));
  const srcCtx = srcCanvas.getContext('2d');
  srcCtx.drawImage(tileCanvas, 0, 0);

  if (cfg.sourceVisible&&srcCanvas.width>0){svgContent+=`  <image href="${srcCanvas.toDataURL('image/png')}" x="${-ox}" y="${-oy}" width="${W}" height="${H}" opacity="${cfg.sourceOpacity}" style="image-rendering:pixelated"/>\n`;}
  const blendCSS=cfg.blendMode==='normal'?'':`mix-blend-mode:${cfg.blendMode};`;
  const asciiOpCSS=cfg.asciiOpacity<1?`opacity:${cfg.asciiOpacity};`:'';
  const groupStyle=(blendCSS||asciiOpCSS)?` style="${blendCSS}${asciiOpCSS}"`:'';
  if (cfg.asciiVisible) {
    svgContent+=`  <g font-family="'Courier New','Consolas',monospace" font-size="${fontSize}"${groupStyle}>\n`;
    for (let y=0;y<rows;y++) for (let x=0;x<cols;x++){
      const idx=y*cols+x,i=idx*4,r=pixels[i],g=pixels[i+1],b=pixels[i+2],brightness=luma[idx],det=detail[idx];
      let cr,cg,cb;
      if(cfg.asciiColorOverride){const ac=cfg.asciiColor;cr=ac.r;cg=ac.g;cb=ac.b;}
      else{let[h,s,l]=rgbToHsl(r,g,b);if(cfg.colored){s=Math.min(1,s*cfg.saturationBoost);l=Math.min(1,l*brtBoost);}else{h=1/3;s=1;l=Math.min(1,brightness*brtBoost);}[cr,cg,cb]=hslToRgb(h,s,l);}
      const fB=Math.min(1,brightness*brtBoost);
      const px=Math.floor(x*cellW)-ox,py=Math.floor(y*cellH)-oy;
      if(px+cellW<0||px>outW||py+cellH<0||py>outH) continue;
      const maxCI=Math.max(2,Math.round(det*(charLen-1)));
      const ci=Math.min(Math.floor(fB*(maxCI+1)),maxCI);
      const ch=chars[ci]; if(ch===' ')continue;
      const opacity=mix<1?` opacity="${mix.toFixed(2)}"`:'';
      svgContent+=`    <text x="${px}" y="${py+fontSize*0.85}" fill="rgb(${cr},${cg},${cb})"${opacity}>${esc(ch)}</text>\n`;
    }
    svgContent+=`  </g>\n`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${outW}" height="${outH}" viewBox="0 0 ${outW} ${outH}">\n${svgContent}</svg>`;
}

export function getCompositeCanvas(asciiCanvas, srcCanvas, hdrCanvas, cfg, scale = 1) {
  const dpr = scale, W = window.innerWidth, H = window.innerHeight;
  const fr = { x:0, y:0, w:W, h:H };
  const comp = document.createElement('canvas');
  comp.width = fr.w*dpr; comp.height = fr.h*dpr;
  const c = comp.getContext('2d');
  c.scale(dpr, dpr); c.imageSmoothingEnabled = false;
  { const cc=cfg.canvasColor; c.fillStyle=`rgb(${cc.r},${cc.g},${cc.b})`; c.fillRect(0,0,W,H); }
  if (cfg.sourceVisible) { c.globalAlpha=cfg.sourceOpacity; c.drawImage(srcCanvas,0,0,W,H); c.globalAlpha=1; }
  c.globalCompositeOperation = cfg.blendMode;
  if (cfg.asciiVisible) { c.globalAlpha=cfg.asciiOpacity; c.drawImage(asciiCanvas,0,0,W,H); c.globalAlpha=1; }
  c.globalCompositeOperation = 'source-over';
  // Include HDR bloom if enabled
  if (cfg.hdrEnabled && cfg.asciiVisible) {
    c.globalCompositeOperation = 'screen';
    c.globalAlpha = (cfg.hdrBloom / 100) * cfg.asciiOpacity;
    c.drawImage(hdrCanvas, 0, 0, W, H);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }
  return comp;
}

export function getHDRCompositeCanvas(asciiCanvas, srcCanvas, cfg, scale = 1) {
  const dpr = scale, W = window.innerWidth, H = window.innerHeight;
  const comp = document.createElement('canvas');
  const outW = W * dpr, outH = H * dpr;
  comp.width = outW; comp.height = outH;
  const c = comp.getContext('2d');
  c.scale(dpr, dpr); c.imageSmoothingEnabled = false;

  // Background
  { const cc = cfg.canvasColor; c.fillStyle = `rgb(${cc.r},${cc.g},${cc.b})`; c.fillRect(0, 0, W, H); }

  // Source layer
  if (cfg.sourceVisible) {
    c.globalAlpha = cfg.sourceOpacity;
    c.drawImage(srcCanvas, 0, 0, W, H);
    c.globalAlpha = 1;
  }

  // ASCII layer
  c.globalCompositeOperation = cfg.blendMode;
  if (cfg.asciiVisible) {
    c.globalAlpha = cfg.asciiOpacity;
    c.drawImage(asciiCanvas, 0, 0, W, H);
    c.globalAlpha = 1;
  }
  c.globalCompositeOperation = 'source-over';

  // High-quality HDR bloom
  if (cfg.asciiVisible) {
    const bloomSrc = computeBloomForExport(asciiCanvas, outW, outH, cfg);
    c.setTransform(1, 0, 0, 1, 0, 0); // reset for pixel-perfect bloom
    c.globalCompositeOperation = 'screen';
    c.globalAlpha = (cfg.hdrBloom / 100) * cfg.asciiOpacity;
    c.drawImage(bloomSrc, 0, 0, outW, outH);
    c.globalAlpha = 1;
    c.globalCompositeOperation = 'source-over';
  }

  return comp;
}

// ── Utility ─────────────────────────────────────────────────────────
export function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Interaction Exports (ASCII-only, no source image) ───────────────

export function generateInteractionHTML(frame, cfg) {
  if (!frame) return '';
  const { chars: frameChars, colors: frameColors, cols, rows, cellW, cellH } = frame;

  const gridData = [];
  for (let y = 0; y < rows; y++) {
    const rowChars = [];
    const rowColors = [];
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      rowChars.push(frameChars[idx] || ' ');
      rowColors.push(frameColors[idx] || 'rgb(0,0,0)');
    }
    gridData.push({ c: rowChars.join(''), k: rowColors });
  }

  const embedCfg = {
    fontSize: cfg.fontSize,
    lineHeight: cfg.lineHeight,
    cellW, cellH, cols, rows,
    mix: cfg.mix,
    hoverEnabled: cfg.hoverEnabled,
    basicHover: cfg.basicHover,
    hoverRadius: cfg.hoverRadius,
    hoverExposure: cfg.hoverExposure,
    revealActive: cfg.revealActive,
    revealDirection: cfg.revealDirection,
    revealSpeed: cfg.revealSpeed,
    canvasColor: cfg.canvasColor,
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>ASCII Interaction</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:rgb(${cfg.canvasColor.r},${cfg.canvasColor.g},${cfg.canvasColor.b});overflow:hidden;width:100vw;height:100vh;cursor:crosshair}
canvas{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
</style>
</head>
<body>
<canvas id="c"></canvas>
<` + `script>
(function(){
const CFG=${JSON.stringify(embedCfg).replace(/</g,'\\u003c')};
const GRID=${JSON.stringify(gridData).replace(/</g,'\\u003c')};
const canvas=document.getElementById('c');
const ctx=canvas.getContext('2d');
const W=CFG.cols*CFG.cellW,H=CFG.rows*CFG.cellH;
canvas.width=W;canvas.height=H;
let mouseX=-9999,mouseY=-9999;
const trail=[];
const revealStart=performance.now();
let revealDone=!CFG.revealActive;

canvas.addEventListener('mousemove',function(e){const r=canvas.getBoundingClientRect();mouseX=e.clientX-r.left;mouseY=e.clientY-r.top;});
canvas.addEventListener('mouseleave',function(){mouseX=-9999;mouseY=-9999;});

function render(){
  ctx.clearRect(0,0,W,H);
  ctx.font=CFG.fontSize+'px "Courier New","Consolas",monospace';
  ctx.textBaseline='top';
  const cols=CFG.cols,rows=CFG.rows,cellW=CFG.cellW,cellH=CFG.cellH;
  const mCol=Math.floor(mouseX/cellW),mRow=Math.floor(mouseY/cellH);
  const now=performance.now();

  let revealProg=1;
  if(!revealDone){
    const elapsed=(now-revealStart)/1000;
    const dur=3*(1-CFG.revealSpeed/100)+0.3;
    revealProg=Math.min(1,elapsed/dur);
    if(revealProg>=1)revealDone=true;
  }

  if(CFG.hoverEnabled&&mouseX>0){
    trail.push({col:mCol,row:mRow,t:now});
    while(trail.length&&now-trail[0].t>400)trail.shift();
  }

  for(let y=0;y<rows;y++){
    const row=GRID[y];
    if(!row)continue;
    for(let x=0;x<cols;x++){
      const ch=row.c[x];
      const color=row.k[x];
      if(!revealDone){
        let cellProg=0;
        const nx=x/cols,ny=y/rows;
        const dir=CFG.revealDirection;
        if(dir==='left-right')cellProg=nx;
        else if(dir==='right-left')cellProg=1-nx;
        else if(dir==='top-bottom')cellProg=ny;
        else if(dir==='bottom-top')cellProg=1-ny;
        else if(dir==='center-out')cellProg=Math.abs(nx-0.5)*2;
        else if(dir==='out-center')cellProg=1-Math.abs(nx-0.5)*2;
        else if(dir==='radial-out'){const dx=nx-0.5,dy=ny-0.5;cellProg=Math.sqrt(dx*dx+dy*dy)*2;}
        else if(dir==='radial-in'){const dx=nx-0.5,dy=ny-0.5;cellProg=1-Math.sqrt(dx*dx+dy*dy)*2;}
        const vis=Math.max(0,Math.min(1,(revealProg-cellProg*0.8)/0.2));
        if(vis<0.01)continue;
        ctx.globalAlpha=vis*CFG.mix;
      }else{
        ctx.globalAlpha=CFG.mix;
      }

      let hf=0;
      if(CFG.hoverEnabled&&CFG.basicHover){
        const dx=x-mCol,dy=y-mRow,dist=Math.sqrt(dx*dx+dy*dy);
        if(dist<CFG.hoverRadius)hf=1-(dist/CFG.hoverRadius)*(dist/CFG.hoverRadius);
        for(let ti=0;ti<trail.length;ti++){
          const tp=trail[ti],str=1-(now-tp.t)/400;
          const dd=Math.sqrt((x-tp.col)*(x-tp.col)+(y-tp.row)*(y-tp.row));
          const tR=CFG.hoverRadius*str;
          if(dd<tR){const v=1-(dd/tR)*(dd/tR);hf=Math.max(hf,v*str*0.6);}
        }
      }

      const px=Math.floor(x*cellW),py=Math.floor(y*cellH);
      if(hf>0.5){
        ctx.fillStyle=color;
        ctx.fillRect(px,py,Math.ceil(cellW)+1,Math.ceil(cellH)+1);
        ctx.globalAlpha=1;
        continue;
      }
      if(ch===' '){ctx.globalAlpha=1;continue;}
      ctx.fillStyle=color;
      ctx.fillText(ch,px,py);
      ctx.globalAlpha=1;
    }
  }
  requestAnimationFrame(render);
}
render();
})();
<` + `/script>
</body>
</html>`;
}

export function generateInteractionReact(frame, cfg) {
  if (!frame) return '';
  const { chars: frameChars, colors: frameColors, cols, rows, cellW, cellH } = frame;

  const gridData = [];
  for (let y = 0; y < rows; y++) {
    const rowChars = [];
    const rowColors = [];
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      rowChars.push(frameChars[idx] || ' ');
      rowColors.push(frameColors[idx] || 'rgb(0,0,0)');
    }
    gridData.push({ c: rowChars.join(''), k: rowColors });
  }

  return `import React, { useRef, useEffect, useCallback } from 'react';

const GRID = ${JSON.stringify(gridData).replace(/</g,'\\u003c')};
const CFG = {
  fontSize: ${cfg.fontSize},
  lineHeight: ${cfg.lineHeight},
  cellW: ${cellW},
  cellH: ${cellH},
  cols: ${cols},
  rows: ${rows},
  mix: ${cfg.mix},
  hoverEnabled: ${cfg.hoverEnabled},
  basicHover: ${cfg.basicHover},
  hoverRadius: ${cfg.hoverRadius},
  hoverExposure: ${cfg.hoverExposure},
  revealActive: ${cfg.revealActive},
  revealDirection: '${cfg.revealDirection.replace(/[^a-z-]/gi,'')}',
  revealSpeed: ${cfg.revealSpeed},
  bgColor: 'rgb(${cfg.canvasColor.r},${cfg.canvasColor.g},${cfg.canvasColor.b})',
};

export default function AsciiInteraction({ style, className }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const trailRef = useRef([]);

  const onMouseMove = useCallback((e) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (r) mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
  }, []);

  const onMouseLeave = useCallback(() => {
    mouseRef.current = { x: -9999, y: -9999 };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = CFG.cols * CFG.cellW;
    const H = CFG.rows * CFG.cellH;
    canvas.width = W;
    canvas.height = H;
    const revealStart = performance.now();
    let revealDone = !CFG.revealActive;
    let animId;

    function render() {
      ctx.clearRect(0, 0, W, H);
      ctx.font = CFG.fontSize + 'px "Courier New","Consolas",monospace';
      ctx.textBaseline = 'top';
      const { x: mouseX, y: mouseY } = mouseRef.current;
      const mCol = Math.floor(mouseX / CFG.cellW);
      const mRow = Math.floor(mouseY / CFG.cellH);
      const now = performance.now();
      const trail = trailRef.current;

      let revealProg = 1;
      if (!revealDone) {
        const elapsed = (now - revealStart) / 1000;
        const dur = 3 * (1 - CFG.revealSpeed / 100) + 0.3;
        revealProg = Math.min(1, elapsed / dur);
        if (revealProg >= 1) revealDone = true;
      }

      if (CFG.hoverEnabled && mouseX > 0) {
        trail.push({ col: mCol, row: mRow, t: now });
        while (trail.length && now - trail[0].t > 400) trail.shift();
      }

      for (let y = 0; y < CFG.rows; y++) {
        const row = GRID[y];
        if (!row) continue;
        for (let x = 0; x < CFG.cols; x++) {
          const ch = row.c[x];
          const color = row.k[x];
          if (!revealDone) {
            let cellProg = 0;
            const nx = x / CFG.cols, ny = y / CFG.rows;
            const dir = CFG.revealDirection;
            if (dir === 'left-right') cellProg = nx;
            else if (dir === 'right-left') cellProg = 1 - nx;
            else if (dir === 'top-bottom') cellProg = ny;
            else if (dir === 'bottom-top') cellProg = 1 - ny;
            else if (dir === 'center-out') cellProg = Math.abs(nx - 0.5) * 2;
            else if (dir === 'out-center') cellProg = 1 - Math.abs(nx - 0.5) * 2;
            else if (dir === 'radial-out') { const dx = nx - 0.5, dy = ny - 0.5; cellProg = Math.sqrt(dx*dx+dy*dy)*2; }
            else if (dir === 'radial-in') { const dx = nx - 0.5, dy = ny - 0.5; cellProg = 1 - Math.sqrt(dx*dx+dy*dy)*2; }
            const vis = Math.max(0, Math.min(1, (revealProg - cellProg * 0.8) / 0.2));
            if (vis < 0.01) continue;
            ctx.globalAlpha = vis * CFG.mix;
          } else {
            ctx.globalAlpha = CFG.mix;
          }

          let hf = 0;
          if (CFG.hoverEnabled && CFG.basicHover) {
            const dx = x - mCol, dy = y - mRow;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < CFG.hoverRadius) hf = 1 - (dist/CFG.hoverRadius)*(dist/CFG.hoverRadius);
            for (let ti = 0; ti < trail.length; ti++) {
              const tp = trail[ti], str = 1 - (now - tp.t) / 400;
              const dd = Math.sqrt((x-tp.col)*(x-tp.col) + (y-tp.row)*(y-tp.row));
              const tR = CFG.hoverRadius * str;
              if (dd < tR) { const v = 1 - (dd/tR)*(dd/tR); hf = Math.max(hf, v*str*0.6); }
            }
          }

          const px = Math.floor(x * CFG.cellW);
          const py = Math.floor(y * CFG.cellH);
          if (hf > 0.5) {
            ctx.fillStyle = color;
            ctx.fillRect(px, py, Math.ceil(CFG.cellW)+1, Math.ceil(CFG.cellH)+1);
            ctx.globalAlpha = 1;
            continue;
          }
          if (ch === ' ') { ctx.globalAlpha = 1; continue; }
          ctx.fillStyle = color;
          ctx.fillText(ch, px, py);
          ctx.globalAlpha = 1;
        }
      }
      animId = requestAnimationFrame(render);
    }
    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className={className} style={{ background: CFG.bgColor, display: 'inline-block', ...style }}>
      <canvas
        ref={canvasRef}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ display: 'block', cursor: 'crosshair' }}
      />
    </div>
  );
}
`;
}

export function generateFramerOverride(frame, cfg) {
  if (!frame) return '';
  const { chars: frameChars, colors: frameColors, cols, rows, cellW, cellH } = frame;

  const gridData = [];
  for (let y = 0; y < rows; y++) {
    const rowChars = [];
    const rowColors = [];
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      rowChars.push(frameChars[idx] || ' ');
      rowColors.push(frameColors[idx] || 'rgb(0,0,0)');
    }
    gridData.push({ c: rowChars.join(''), k: rowColors });
  }

  return `import type { ComponentType } from "react"
import { useRef, useEffect, useCallback } from "react"

const GRID = ${JSON.stringify(gridData).replace(/</g,'\\u003c')};
const CFG = {
  fontSize: ${cfg.fontSize},
  cellW: ${cellW},
  cellH: ${cellH},
  cols: ${cols},
  rows: ${rows},
  mix: ${cfg.mix},
  hoverEnabled: ${cfg.hoverEnabled},
  basicHover: ${cfg.basicHover},
  hoverRadius: ${cfg.hoverRadius},
  hoverExposure: ${cfg.hoverExposure},
  revealActive: ${cfg.revealActive},
  revealDirection: "${cfg.revealDirection}",
  revealSpeed: ${cfg.revealSpeed},
  bgColor: "rgb(${cfg.canvasColor.r},${cfg.canvasColor.g},${cfg.canvasColor.b})",
};

export function withASCIIInteraction(Component: ComponentType): ComponentType {
  return (props: any) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -9999, y: -9999 });
    const trailRef = useRef<any[]>([]);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
      const r = canvasRef.current?.getBoundingClientRect();
      if (r) mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    }, []);

    const onMouseLeave = useCallback(() => {
      mouseRef.current = { x: -9999, y: -9999 };
    }, []);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const W = CFG.cols * CFG.cellW;
      const H = CFG.rows * CFG.cellH;
      canvas.width = W;
      canvas.height = H;
      const revealStart = performance.now();
      let revealDone = !CFG.revealActive;
      let animId: number;

      function render() {
        ctx!.clearRect(0, 0, W, H);
        ctx!.font = CFG.fontSize + 'px "Courier New","Consolas",monospace';
        ctx!.textBaseline = "top";
        const { x: mx, y: my } = mouseRef.current;
        const mCol = Math.floor(mx / CFG.cellW);
        const mRow = Math.floor(my / CFG.cellH);
        const now = performance.now();
        const trail = trailRef.current;

        let revealProg = 1;
        if (!revealDone) {
          const elapsed = (now - revealStart) / 1000;
          const dur = 3 * (1 - CFG.revealSpeed / 100) + 0.3;
          revealProg = Math.min(1, elapsed / dur);
          if (revealProg >= 1) revealDone = true;
        }

        if (CFG.hoverEnabled && mx > 0) {
          trail.push({ col: mCol, row: mRow, t: now });
          while (trail.length && now - trail[0].t > 400) trail.shift();
        }

        for (let y = 0; y < CFG.rows; y++) {
          const row = GRID[y];
          if (!row) continue;
          for (let x = 0; x < CFG.cols; x++) {
            const ch = row.c[x];
            const color = row.k[x];
            if (!revealDone) {
              let cellProg = 0;
              const nx = x / CFG.cols, ny = y / CFG.rows;
              const dir = CFG.revealDirection;
              if (dir === "left-right") cellProg = nx;
              else if (dir === "right-left") cellProg = 1 - nx;
              else if (dir === "top-bottom") cellProg = ny;
              else if (dir === "bottom-top") cellProg = 1 - ny;
              else if (dir === "center-out") cellProg = Math.abs(nx - 0.5) * 2;
              else if (dir === "out-center") cellProg = 1 - Math.abs(nx - 0.5) * 2;
              else if (dir === "radial-out") { const dx = nx - 0.5, dy = ny - 0.5; cellProg = Math.sqrt(dx*dx+dy*dy)*2; }
              else if (dir === "radial-in") { const dx = nx - 0.5, dy = ny - 0.5; cellProg = 1 - Math.sqrt(dx*dx+dy*dy)*2; }
              const vis = Math.max(0, Math.min(1, (revealProg - cellProg * 0.8) / 0.2));
              if (vis < 0.01) continue;
              ctx!.globalAlpha = vis * CFG.mix;
            } else {
              ctx!.globalAlpha = CFG.mix;
            }

            let hf = 0;
            if (CFG.hoverEnabled && CFG.basicHover) {
              const dx = x - mCol, dy = y - mRow;
              const dist = Math.sqrt(dx*dx + dy*dy);
              if (dist < CFG.hoverRadius) hf = 1 - (dist/CFG.hoverRadius)*(dist/CFG.hoverRadius);
              for (let ti = 0; ti < trail.length; ti++) {
                const tp = trail[ti], str = 1 - (now - tp.t) / 400;
                const dd = Math.sqrt((x-tp.col)*(x-tp.col) + (y-tp.row)*(y-tp.row));
                const tR = CFG.hoverRadius * str;
                if (dd < tR) { const v = 1 - (dd/tR)*(dd/tR); hf = Math.max(hf, v*str*0.6); }
              }
            }

            const px = Math.floor(x * CFG.cellW);
            const py = Math.floor(y * CFG.cellH);
            if (hf > 0.5) {
              ctx!.fillStyle = color;
              ctx!.fillRect(px, py, Math.ceil(CFG.cellW)+1, Math.ceil(CFG.cellH)+1);
              ctx!.globalAlpha = 1;
              continue;
            }
            if (ch === " ") { ctx!.globalAlpha = 1; continue; }
            ctx!.fillStyle = color;
            ctx!.fillText(ch, px, py);
            ctx!.globalAlpha = 1;
          }
        }
        animId = requestAnimationFrame(render);
      }
      render();
      return () => cancelAnimationFrame(animId);
    }, []);

    return (
      <div
        style={{
          position: "relative",
          background: CFG.bgColor,
          display: "inline-block",
          overflow: "hidden",
        }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
      >
        <Component {...props} />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            cursor: "crosshair",
          }}
        />
      </div>
    );
  };
}
`;}

