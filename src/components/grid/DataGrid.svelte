<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { createGridStore } from '../../stores/gridStore';
  import { calculateVisibleRange, throttle, debounce, exportToCSV, exportToJSON } from '../../utils/gridUtils';
  import type { GridConfig, GridColumn, GridRow, ContextMenuAction, DataSourceParams } from '../../types/grid';
  
  import GridHeader from './GridHeader.svelte';
  import GridRow from './GridRow.svelte';
  import FilterPopup from './FilterPopup.svelte';
  import ContextMenu from './ContextMenu.svelte';

  export let config: GridConfig;

  const dispatch = createEventDispatcher();
  const store = createGridStore(config.columns);

  let containerRef: HTMLElement;
  let scrollContainer: HTMLElement;
  let headerContainer: HTMLElement;
  let bodyContainer: HTMLElement;

  // UI State
  let containerWidth = 0;
  let containerHeight = 0;
  let showFilterPopup = false;
  let filterPopupData: any = null;
  let showContextMenu = false;
  let contextMenuData: any = null;

  // Virtual scrolling
  let visibleStartIndex = 0;
  let visibleEndIndex = 0;
  let offsetY = 0;
  let totalHeight = 0;

  // Grid state
  $: gridState = $store;
  $: visibleRows = gridState.rows || [];
  $: selectedRows = gridState.selectedRows;
  $: hasSelection = selectedRows.size > 0;

  // Configuration
  const rowHeight = config.rowHeight || 36;
  const headerHeight = config.headerHeight || 40;
  const pageSize = config.pageSize || 100;
  const enableVirtualScroll = config.enableVirtualScroll !== false;
  const enableInfiniteScroll = config.enableInfiniteScroll !== false;

  // Columns with proper ordering and frozen handling
  $: orderedColumns = config.columns
    .filter(col => !col.hide)
    .sort((a, b) => {
      const aIndex = gridState.columnOrder.indexOf(a.id);
      const bIndex = gridState.columnOrder.indexOf(b.id);
      return aIndex - bIndex;
    });

  // Calculate total width for proper scrolling
  $: totalWidth = orderedColumns.reduce((sum, col) => {
    return sum + (gridState.columnWidths[col.id] || col.width || 150);
  }, config.showCheckboxes ? 40 : 0);

  // Virtual scrolling calculations
  $: if (enableVirtualScroll && containerHeight > 0) {
    const range = calculateVisibleRange(
      gridState.scrollTop,
      containerHeight - headerHeight,
      rowHeight,
      visibleRows.length,
      5
    );
    visibleStartIndex = range.startIndex;
    visibleEndIndex = range.endIndex;
    offsetY = range.offsetY;
    totalHeight = visibleRows.length * rowHeight;
  } else {
    visibleStartIndex = 0;
    visibleEndIndex = visibleRows.length - 1;
    offsetY = 0;
    totalHeight = visibleRows.length * rowHeight;
  }

  $: visibleRowsSlice = enableVirtualScroll 
    ? visibleRows.slice(visibleStartIndex, visibleEndIndex + 1)
    : visibleRows;

  // Debounced data loading
  const debouncedLoadData = debounce(loadData, 300);

  // Throttled scroll handler
  const throttledScroll = throttle((scrollTop: number, scrollLeft: number) => {
    store.setScrollTop(scrollTop);
    
    // Sync horizontal scroll between header and body
    if (headerContainer && headerContainer.scrollLeft !== scrollLeft) {
      headerContainer.scrollLeft = scrollLeft;
    }
    
    // Infinite scroll check
    if (enableInfiniteScroll && scrollContainer) {
      const { scrollHeight, clientHeight } = scrollContainer;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
      
      if (scrollPercentage > 0.8 && !gridState.loading && visibleRows.length < gridState.totalRows) {
        loadMoreData();
      }
    }
  }, 16);

  async function loadData() {
    if (!config.dataSource) {
      console.warn('No dataSource provided to grid');
      return;
    }

    console.log('Loading initial data...');
    store.setLoading(true);
    
    try {
      const params: DataSourceParams = {
        startRow: 0,
        endRow: pageSize,
        sortModel: gridState.sortState,
        filterModel: gridState.filterState,
      };

      console.log('Calling dataSource with params:', params);
      const result = await config.dataSource(params);
      console.log('Data loaded:', result);
      
      store.setRows(result.rows);
      store.setTotalRows(result.totalRows);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      store.setLoading(false);
    }
  }

  async function loadMoreData() {
    if (!config.dataSource || gridState.loading) return;

    console.log('Loading more data...');
    store.setLoading(true);
    
    try {
      const params: DataSourceParams = {
        startRow: visibleRows.length,
        endRow: visibleRows.length + pageSize,
        sortModel: gridState.sortState,
        filterModel: gridState.filterState,
      };

      const result = await config.dataSource(params);
      
      store.addRows(result.rows);
      store.incrementPage();
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      store.setLoading(false);
    }
  }

  // Event handlers
  function handleScroll(e: Event) {
    const target = e.target as HTMLElement;
    throttledScroll(target.scrollTop, target.scrollLeft);
  }

  function handleHeaderScroll(e: Event) {
    const target = e.target as HTMLElement;
    if (bodyContainer && bodyContainer.scrollLeft !== target.scrollLeft) {
      bodyContainer.scrollLeft = target.scrollLeft;
    }
  }

  function handleSort(event: CustomEvent) {
    const { field, direction } = event.detail;
    const isMultiSort = event.detail.ctrlKey || event.detail.metaKey;
    
    store.addSort(field, direction, isMultiSort);
    debouncedLoadData();
  }

  function handleFilter(event: CustomEvent) {
    const { column } = event.detail;
    const currentFilter = gridState.filterState.find(f => f.field === column.field);
    
    showFilterPopup = true;
    filterPopupData = {
      column,
      currentFilter,
      x: event.detail.x || 0,
      y: event.detail.y || 0,
    };
  }

  function handleApplyFilter(event: CustomEvent) {
    store.addFilter(event.detail);
    showFilterPopup = false;
    debouncedLoadData();
  }

  function handleClearFilter(event: CustomEvent) {
    store.removeFilter(event.detail.field);
    showFilterPopup = false;
    debouncedLoadData();
  }

  function handleResize(event: CustomEvent) {
    const { column, width } = event.detail;
    store.setColumnWidth(column, width);
  }

  function handleRowSelection(event: CustomEvent) {
    const { row, selected } = event.detail;
    if (selected) {
      store.toggleRowSelection(row.id);
    }
  }

  function handleSelectAll() {
    if (hasSelection) {
      store.clearSelection();
    } else {
      const allIds = visibleRows.map(row => row.id);
      store.selectAllRows(allIds);
    }
  }

  function handleContextMenu(event: CustomEvent) {
    const { x, y } = event.detail;
    const selectedRowsArray = visibleRows.filter(row => selectedRows.has(row.id));
    
    const actions: ContextMenuAction[] = [
      {
        id: 'copy',
        label: 'Copy',
        icon: '📋',
        action: () => copySelectedRows(),
      },
      {
        id: 'export-csv',
        label: 'Export to CSV',
        icon: '📊',
        action: () => exportSelectedRows('csv'),
      },
      {
        id: 'export-json',
        label: 'Export to JSON',
        icon: '📄',
        action: () => exportSelectedRows('json'),
      },
      {
        id: 'separator',
        label: '---',
        action: () => {},
        disabled: true,
      },
      {
        id: 'select-all',
        label: hasSelection ? 'Clear Selection' : 'Select All',
        icon: '☑️',
        action: handleSelectAll,
      },
    ];

    showContextMenu = true;
    contextMenuData = { x, y, actions };
  }

  function copySelectedRows() {
    const selectedRowsArray = visibleRows.filter(row => selectedRows.has(row.id));
    const text = selectedRowsArray
      .map(row => orderedColumns.map(col => row[col.field]).join('\t'))
      .join('\n');
    
    navigator.clipboard.writeText(text);
  }

  function exportSelectedRows(format: 'csv' | 'json') {
    const selectedRowsArray = visibleRows.filter(row => selectedRows.has(row.id));
    const dataToExport = selectedRowsArray.length > 0 ? selectedRowsArray : visibleRows;
    
    if (format === 'csv') {
      exportToCSV(dataToExport, orderedColumns);
    } else {
      exportToJSON(dataToExport);
    }
  }

  function handleKeyDown(event: KeyboardEvent) {
    // Handle keyboard navigation
    switch (event.key) {
      case 'Escape':
        store.clearSelection();
        break;
      case 'KeyA':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleSelectAll();
        }
        break;
    }
  }

  // Lifecycle
  onMount(async () => {
    console.log('DataGrid mounted, loading data...');
    // Initial data load
    await loadData();
    
    // Set up resize observer
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        containerWidth = entry.contentRect.width;
        containerHeight = entry.contentRect.height;
      }
    });
    
    if (containerRef) {
      resizeObserver.observe(containerRef);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  });

  // Watch for sort/filter changes and reload data
  $: {
    if (gridState.sortState.length > 0 || gridState.filterState.length > 0) {
      console.log('Sort or filter changed, reloading data...');
      debouncedLoadData();
    }
  }
</script>

<svelte:window on:keydown={handleKeyDown} />

<div class="data-grid" bind:this={containerRef}>
  <div class="grid-header-container">
    <div class="grid-header" bind:this={headerContainer} on:scroll={handleHeaderScroll}>
      <div class="header-content" style="width: {totalWidth}px;">
        <div class="header-row">
          {#if config.showCheckboxes}
            <div class="checkbox-header">
              <input 
                type="checkbox" 
                checked={hasSelection && selectedRows.size === visibleRows.length}
                indeterminate={hasSelection && selectedRows.size < visibleRows.length}
                on:change={handleSelectAll}
              />
            </div>
          {/if}
          
          {#each orderedColumns as column}
            <GridHeader
              {column}
              width={gridState.columnWidths[column.id] || column.width || 150}
              sortState={gridState.sortState}
              filterActive={gridState.filterState.some(f => f.field === column.field)}
              frozen={gridState.frozenLeftColumns.includes(column.id) || gridState.frozenRightColumns.includes(column.id)}
              on:sort={handleSort}
              on:filter={handleFilter}
              on:resize={handleResize}
              on:contextMenu={handleContextMenu}
            />
          {/each}
        </div>
      </div>
    </div>
  </div>

  <div class="grid-body-container">
    <div class="grid-body" bind:this={bodyContainer} on:scroll={handleScroll}>
      {#if gridState.loading && visibleRows.length === 0}
        <div class="initial-loading">
          <div class="spinner"></div>
          <span>Loading data...</span>
        </div>
      {:else if visibleRows.length === 0}
        <div class="no-data">
          <span>No data available</span>
        </div>
      {:else}
        <div class="body-content" style="width: {totalWidth}px;">
          <div class="virtual-spacer" style="height: {totalHeight}px;">
            <div class="visible-rows" style="transform: translateY({offsetY}px);">
              {#each visibleRowsSlice as row, index}
                <GridRow
                  {row}
                  columns={orderedColumns}
                  columnWidths={gridState.columnWidths}
                  selected={selectedRows.has(row.id)}
                  showCheckbox={!!config.showCheckboxes}
                  rowIndex={visibleStartIndex + index}
                  frozenLeftColumns={gridState.frozenLeftColumns}
                  frozenRightColumns={gridState.frozenRightColumns}
                  on:rowClick
                  on:rowDoubleClick
                  on:selectionChange={handleRowSelection}
                  on:cellClick
                  on:cellDoubleClick
                  on:cellContextMenu={handleContextMenu}
                />
              {/each}
            </div>
          </div>
        </div>

        {#if gridState.loading}
          <div class="loading-indicator">
            <div class="spinner"></div>
            <span>Loading more...</span>
          </div>
        {/if}
      {/if}
    </div>
  </div>

  {#if showFilterPopup && filterPopupData}
    <FilterPopup
      column={filterPopupData.column}
      x={filterPopupData.x}
      y={filterPopupData.y}
      currentFilter={filterPopupData.currentFilter}
      on:applyFilter={handleApplyFilter}
      on:clearFilter={handleClearFilter}
      on:close={() => showFilterPopup = false}
    />
  {/if}

  {#if showContextMenu && contextMenuData}
    <ContextMenu
      x={contextMenuData.x}
      y={contextMenuData.y}
      actions={contextMenuData.actions}
      on:action={event => event.detail.action()}
      on:close={() => showContextMenu = false}
    />
  {/if}
</div>

<style>
  .data-grid {
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    overflow: hidden;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .grid-header-container {
    flex-shrink: 0;
    border-bottom: 2px solid #e2e8f0;
  }

  .grid-header {
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .grid-header::-webkit-scrollbar {
    display: none;
  }

  .header-content {
    min-width: 100%;
  }

  .header-row {
    display: flex;
    min-width: fit-content;
  }

  .checkbox-header {
    position: sticky;
    left: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    min-width: 40px;
    padding: 8px;
    background: #f8fafc;
    border-right: 1px solid #e2e8f0;
    box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
  }

  .grid-body-container {
    flex: 1;
    overflow: hidden;
  }

  .grid-body {
    height: 100%;
    overflow: auto;
    position: relative;
  }

  .body-content {
    min-width: 100%;
  }

  .virtual-spacer {
    position: relative;
    width: 100%;
  }

  .visible-rows {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
  }

  .initial-loading, .no-data {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 48px;
    font-size: 16px;
    color: #6b7280;
    flex-direction: column;
  }

  .loading-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.9);
    border-top: 1px solid #e5e7eb;
    font-size: 14px;
    color: #6b7280;
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid #e5e7eb;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Responsive design */
  @media (max-width: 768px) {
    .data-grid {
      font-size: 12px;
    }
    
    .checkbox-header {
      width: 32px;
      min-width: 32px;
      padding: 4px;
    }
  }
</style>