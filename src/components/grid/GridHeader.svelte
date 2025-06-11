<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { GridColumn, SortState } from '../../types/grid';
  import { isColumnSortable, isColumnFilterable, isColumnResizable } from '../../utils/gridUtils';

  export let column: GridColumn;
  export let width: number;
  export let sortState: SortState[] = [];
  export let filterActive = false;
  export let frozen = false;

  const dispatch = createEventDispatcher();

  let resizing = false;
  let startX = 0;
  let startWidth = 0;

  $: currentSort = sortState.find(s => s.field === column.field);
  $: sortIndex = sortState.findIndex(s => s.field === column.field);

  function handleSort() {
    if (!isColumnSortable(column)) return;
    
    let direction: 'asc' | 'desc' = 'asc';
    if (currentSort) {
      direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    }
    
    dispatch('sort', { field: column.field, direction });
  }

  function handleFilter() {
    if (!isColumnFilterable(column)) return;
    dispatch('filter', { column });
  }

  function startResize(e: MouseEvent) {
    if (!isColumnResizable(column)) return;
    
    resizing = true;
    startX = e.clientX;
    startWidth = width;
    
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    e.preventDefault();
  }

  function handleResize(e: MouseEvent) {
    if (!resizing) return;
    
    const diff = e.clientX - startX;
    const newWidth = Math.max(50, startWidth + diff);
    
    dispatch('resize', { column: column.id, width: newWidth });
  }

  function stopResize() {
    resizing = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  }

  function handleContextMenu(e: MouseEvent) {
    e.preventDefault();
    dispatch('contextMenu', { column, x: e.clientX, y: e.clientY });
  }
</script>

<div 
  class="grid-header-cell"
  class:sortable={isColumnSortable(column)}
  class:frozen
  style="width: {width}px; min-width: {column.minWidth || 50}px; max-width: {column.maxWidth || 'none'};"
  on:contextmenu={handleContextMenu}
>
  <div class="header-content" on:click={handleSort}>
    <span class="header-text">
      {column.headerRenderer ? column.headerRenderer(column) : column.headerName}
    </span>
    
    {#if currentSort}
      <span class="sort-indicator" class:asc={currentSort.direction === 'asc'} class:desc={currentSort.direction === 'desc'}>
        {currentSort.direction === 'asc' ? '↑' : '↓'}
        {#if sortState.length > 1}
          <span class="sort-index">{sortIndex + 1}</span>
        {/if}
      </span>
    {/if}
  </div>

  {#if isColumnFilterable(column)}
    <button 
      class="filter-button"
      class:active={filterActive}
      on:click|stopPropagation={handleFilter}
      title="Filter"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
      </svg>
    </button>
  {/if}

  {#if isColumnResizable(column)}
    <div 
      class="resize-handle"
      on:mousedown={startResize}
    ></div>
  {/if}
</div>

<style>
  .grid-header-cell {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #f8fafc;
    border-right: 1px solid #e2e8f0;
    border-bottom: 2px solid #e2e8f0;
    font-weight: 600;
    font-size: 14px;
    color: #374151;
    user-select: none;
    white-space: nowrap;
    overflow: hidden;
    min-height: 40px;
  }

  .grid-header-cell.frozen {
    position: sticky;
    z-index: 10;
    background: #f1f5f9;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
  }

  .grid-header-cell.sortable {
    cursor: pointer;
  }

  .grid-header-cell.sortable:hover {
    background: #f1f5f9;
  }

  .header-content {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
  }

  .header-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sort-indicator {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 12px;
    color: #3b82f6;
  }

  .sort-index {
    font-size: 10px;
    background: #3b82f6;
    color: white;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .filter-button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 4px;
    color: #6b7280;
    transition: all 0.2s;
  }

  .filter-button:hover {
    background: #e5e7eb;
    color: #374151;
  }

  .filter-button.active {
    background: #3b82f6;
    color: white;
  }

  .resize-handle {
    position: absolute;
    right: 0;
    top: 0;
    bottom: 0;
    width: 4px;
    cursor: col-resize;
    background: transparent;
  }

  .resize-handle:hover {
    background: #3b82f6;
  }
</style>