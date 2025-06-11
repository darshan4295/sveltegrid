<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GridColumn, GridRow } from '../../types/grid';
  import { formatCellValue } from '../../utils/gridUtils';

  export let column: GridColumn;
  export let row: GridRow;
  export let value: any;
  export let width: number;
  export let selected = false;
  export let frozen = false;
  export let rowIndex: number;
  export let columnIndex: number;

  const dispatch = createEventDispatcher();

  $: formattedValue = formatCellValue(value, column);

  function handleClick(e: MouseEvent) {
    dispatch('cellClick', { row, column, value, rowIndex, columnIndex, event: e });
  }

  function handleDoubleClick(e: MouseEvent) {
    dispatch('cellDoubleClick', { row, column, value, rowIndex, columnIndex, event: e });
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    dispatch('contextMenu', { row, column, value, x: e.clientX, y: e.clientY });
  }

  function handleKeyDown(e: KeyboardEvent) {
    dispatch('keyDown', { row, column, value, rowIndex, columnIndex, event: e });
  }
</script>

<div 
  class="grid-cell"
  class:selected
  class:frozen
  class:number={column.type === 'number'}
  class:boolean={column.type === 'boolean'}
  class:date={column.type === 'date'}
  style="width: {width}px; min-width: {column.minWidth || 50}px; max-width: {column.maxWidth || 'none'};"
  on:click={handleClick}
  on:dblclick={handleDoubleClick}
  on:contextmenu={handleContextMenu}
  on:keydown={handleKeyDown}
  tabindex="0"
  role="gridcell"
  aria-selected={selected}
>
  <div class="cell-content" title={formattedValue}>
    {#if column.type === 'boolean'}
      <input 
        type="checkbox" 
        checked={!!value} 
        disabled 
        class="boolean-cell"
      />
    {:else}
      {formattedValue}
    {/if}
  </div>
</div>

<style>
  .grid-cell {
    position: relative;
    display: flex;
    align-items: center;
    padding: 8px 12px;
    border-right: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
    background: white;
    font-size: 14px;
    color: #374151;
    white-space: nowrap;
    overflow: hidden;
    min-height: 36px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .grid-cell:hover {
    background: #f9fafb;
  }

  .grid-cell:focus {
    outline: 2px solid #3b82f6;
    outline-offset: -2px;
    z-index: 1;
  }

  .grid-cell.selected {
    background: #eff6ff;
  }

  .grid-cell.frozen {
    position: sticky;
    z-index: 5;
    background: white;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
  }

  .grid-cell.frozen:hover {
    background: #f9fafb;
  }

  .grid-cell.frozen.selected {
    background: #eff6ff;
  }

  .grid-cell.number {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .grid-cell.date {
    font-variant-numeric: tabular-nums;
  }

  .cell-content {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
  }

  .boolean-cell {
    margin: 0;
    pointer-events: none;
  }
</style>