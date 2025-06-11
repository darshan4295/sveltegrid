<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GridColumn, GridRow } from '../../types/grid';
  import GridCell from './GridCell.svelte';

  export let row: GridRow;
  export let columns: GridColumn[];
  export let columnWidths: { [key: string]: number };
  export let selected = false;
  export let showCheckbox = false;
  export let rowIndex: number;
  export let frozenLeftColumns: string[] = [];
  export let frozenRightColumns: string[] = [];

  const dispatch = createEventDispatcher();

  function handleRowClick(e: MouseEvent) {
    dispatch('rowClick', { row, rowIndex, event: e });
  }

  function handleRowDoubleClick(e: MouseEvent) {
    dispatch('rowDoubleClick', { row, rowIndex, event: e });
  }

  function handleSelectionChange() {
    dispatch('selectionChange', { row, selected: !selected });
  }

  function handleCellClick(event: CustomEvent) {
    dispatch('cellClick', event.detail);
  }

  function handleCellDoubleClick(event: CustomEvent) {
    dispatch('cellDoubleClick', event.detail);
  }

  function handleCellContextMenu(event: CustomEvent) {
    dispatch('cellContextMenu', event.detail);
  }

  function handleKeyDown(event: CustomEvent) {
    dispatch('keyDown', event.detail);
  }

  function getColumnWidth(column: GridColumn): number {
    return columnWidths[column.id] || column.width || 150;
  }

  function isColumnFrozen(columnId: string): 'left' | 'right' | false {
    if (frozenLeftColumns.includes(columnId)) return 'left';
    if (frozenRightColumns.includes(columnId)) return 'right';
    return false;
  }
</script>

<div 
  class="grid-row"
  class:selected
  on:click={handleRowClick}
  on:dblclick={handleRowDoubleClick}
  role="row"
  aria-selected={selected}
>
  {#if showCheckbox}
    <div class="checkbox-cell" class:frozen={true}>
      <input 
        type="checkbox" 
        checked={selected}
        on:change={handleSelectionChange}
        class="row-checkbox"
      />
    </div>
  {/if}

  {#each columns as column, columnIndex}
    <GridCell
      {column}
      {row}
      value={row[column.field]}
      width={getColumnWidth(column)}
      {selected}
      frozen={!!isColumnFrozen(column.id)}
      {rowIndex}
      {columnIndex}
      on:cellClick={handleCellClick}
      on:cellDoubleClick={handleCellDoubleClick}
      on:contextMenu={handleCellContextMenu}
      on:keyDown={handleKeyDown}
    />
  {/each}
</div>

<style>
  .grid-row {
    display: flex;
    position: relative;
    transition: background-color 0.2s;
  }

  .grid-row:hover {
    background: #f9fafb;
  }

  .grid-row.selected {
    background: #eff6ff;
  }

  .checkbox-cell {
    position: sticky;
    left: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    min-width: 40px;
    padding: 8px;
    border-right: 1px solid #e5e7eb;
    border-bottom: 1px solid #e5e7eb;
    background: white;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
    box-sizing: border-box;
  }

  .checkbox-cell.frozen {
    background: #f8fafc;
  }

  .row-checkbox {
    margin: 0;
    cursor: pointer;
  }
</style>