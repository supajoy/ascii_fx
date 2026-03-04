<script>
  let { label, active = $bindable(false), onLabel = 'ON', offLabel = 'OFF' } = $props();
</script>

<button
  class:active-tool={active}
  class:toggled-off={!active}
  onclick={() => active = !active}
  style="width:100%"
>
  {label}: {active ? onLabel : offLabel}
</button>
