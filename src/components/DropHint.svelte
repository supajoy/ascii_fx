<script>
  let { visible = true } = $props();
</script>

<div class="drop-hint" class:hidden={!visible}>
  // DROP AN IMAGE OR VIDEO HERE<br/>// OR DOUBLE-CLICK TO UPLOAD
</div>
