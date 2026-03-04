import { writable } from 'svelte/store';

export const ui = writable({
  activeTab: 'image',     // 'image' | 'video'
  activeTool: 'move',     // 'move' | 'lasso'
  selectedLayer: 'ascii', // 'source' | 'ascii' | 'hdr'
  helpOpen: false,
  helpTab: 'about',       // 'about' | 'shortcuts'
  changelogOpen: false,
  colorMode: 'hex',       // 'hex' | 'rgb' | 'hsb'
});
