import { writable } from 'svelte/store';

const PRESETS_KEY = 'ascii-effect-presets';

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function createPresetsStore() {
  const { subscribe, set, update } = writable(loadFromStorage());

  return {
    subscribe,
    save(name, configSnap) {
      update(presets => {
        const snap = { ...configSnap };
        delete snap.sourceOffsetX;
        delete snap.sourceOffsetY;
        delete snap.sourceScale;
        const next = [...presets, { name: name.trim(), config: snap }];
        localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
        return next;
      });
    },
    remove(idx) {
      update(presets => {
        const next = presets.filter((_, i) => i !== idx);
        localStorage.setItem(PRESETS_KEY, JSON.stringify(next));
        return next;
      });
    },
    reload() {
      set(loadFromStorage());
    }
  };
}

export const presets = createPresetsStore();
export const activePresetIdx = writable(-1);
