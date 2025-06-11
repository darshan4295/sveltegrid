<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { clickOutside } from '../../actions/clickOutside';
  import type { ContextMenuAction } from '../../types/grid';

  export let x: number;
  export let y: number;
  export let actions: ContextMenuAction[];

  const dispatch = createEventDispatcher();

  function handleAction(action: ContextMenuAction) {
    if (!action.disabled) {
      dispatch('action', action);
    }
    dispatch('close');
  }

  function close() {
    dispatch('close');
  }

  onMount(() => {
    // Position the menu
    const menu = document.querySelector('.context-menu') as HTMLElement;
    if (menu) {
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      menu.style.left = `${adjustedX}px`;
      menu.style.top = `${adjustedY}px`;
    }
  });
</script>

<div 
  class="context-menu"
  use:clickOutside
  on:clickOutside={close}
  style="left: {x}px; top: {y}px;"
>
  {#each actions as action}
    <button
      class="menu-item"
      class:disabled={action.disabled}
      on:click={() => handleAction(action)}
      disabled={action.disabled}
    >
      {#if action.icon}
        <span class="menu-icon">{action.icon}</span>
      {/if}
      <span class="menu-label">{action.label}</span>
    </button>
  {/each}
</div>

<style>
  .context-menu {
    position: fixed;
    z-index: 1000;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    min-width: 160px;
    padding: 4px 0;
  }

  .menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: none;
    background: none;
    text-align: left;
    font-size: 14px;
    color: #374151;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .menu-item:hover:not(.disabled) {
    background: #f3f4f6;
  }

  .menu-item.disabled {
    color: #9ca3af;
    cursor: not-allowed;
  }

  .menu-icon {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .menu-label {
    flex: 1;
  }
</style>