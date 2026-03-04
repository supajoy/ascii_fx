<script>
  import { debouncedCommit } from '../../stores/undo.js';

  let { label, value = $bindable(), min = 0, max = 100, step = 1 } = $props();

  function onInput(e) {
    value = Number(e.target.value);
    debouncedCommit();
  }
</script>

<div class="ctrl-row">
  <span class="ctrl-label">{label}</span>
  <input type="range" {min} {max} {step} value={value} oninput={onInput} />
  <input type="number" class="ctrl-num" {min} {max} {step} value={value} oninput={onInput} />
</div>
