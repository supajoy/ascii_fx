import { get } from 'svelte/store';
import { config, batchUpdateConfig } from './config.js';

const MAX_SIZE = 50;
let stack = [];
let pointer = -1;
let timer = null;

export function commit() {
  const snap = JSON.parse(JSON.stringify(get(config)));
  stack.length = pointer + 1;
  stack.push(snap);
  if (stack.length > MAX_SIZE) stack.shift();
  pointer = stack.length - 1;
}

export function debouncedCommit() {
  clearTimeout(timer);
  timer = setTimeout(() => commit(), 300);
}

export function undo() {
  if (pointer <= 0) return;
  pointer--;
  restore(stack[pointer]);
}

export function redo() {
  if (pointer >= stack.length - 1) return;
  pointer++;
  restore(stack[pointer]);
}

function restore(snap) {
  batchUpdateConfig(JSON.parse(JSON.stringify(snap)));
}
