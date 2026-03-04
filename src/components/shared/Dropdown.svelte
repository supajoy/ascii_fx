<script>
  let { value = $bindable(), options = [] } = $props();
</script>

<select bind:value>
  {#each options as opt}
    <option value={opt.value}>{opt.label}</option>
  {/each}
</select>
