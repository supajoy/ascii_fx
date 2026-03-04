import { writable } from 'svelte/store';

export const layerOrder = writable(['source', 'ascii', 'hdr']);
