<script>
  import { playClick } from '../../engine/sfx.js';
  let { title, children } = $props();
  let collapsed = $state(false);

  function toggle() {
    collapsed = !collapsed;
    playClick();
  }
</script>

<div class="sidebar-section" class:collapsed>
  <div class="section-header" onclick={toggle}>
    {title}
  </div>
  {#if !collapsed}
    <div class="section-body">
      {@render children()}
    </div>
  {/if}
</div>
