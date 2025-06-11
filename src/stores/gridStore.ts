import { writable, derived } from 'svelte/store';
import type { GridState, GridColumn, GridRow, SortState, FilterState } from '../types/grid';

export function createGridStore(initialColumns: GridColumn[]) {
  const initialState: GridState = {
    rows: [],
    selectedRows: new Set(),
    sortState: [],
    filterState: [],
    loading: false,
    totalRows: 0,
    currentPage: 0,
    pageSize: 100,
    scrollTop: 0,
    columnOrder: initialColumns.map(col => col.id),
    columnWidths: {},
    frozenLeftColumns: initialColumns.filter(col => col.frozen === 'left').map(col => col.id),
    frozenRightColumns: initialColumns.filter(col => col.frozen === 'right').map(col => col.id),
  };

  const { subscribe, set, update } = writable(initialState);

  // Derived stores for computed values
  const visibleColumns = derived(
    [writable(initialColumns), { subscribe }],
    ([columns, state]) => columns.filter(col => !col.hide)
  );

  const sortedAndFilteredRows = derived(
    { subscribe },
    (state) => {
      // If we're using server-side data source, return rows as-is
      // since sorting and filtering is handled on the server
      return state.rows;
    }
  );

  return {
    subscribe,
    set,
    update,
    visibleColumns,
    sortedAndFilteredRows,
    
    // Actions
    setRows: (rows: GridRow[]) => update(state => ({ ...state, rows })),
    
    addRows: (rows: GridRow[]) => update(state => ({ 
      ...state, 
      rows: [...state.rows, ...rows] 
    })),
    
    setLoading: (loading: boolean) => update(state => ({ ...state, loading })),
    
    setTotalRows: (totalRows: number) => update(state => ({ ...state, totalRows })),
    
    toggleRowSelection: (rowId: string | number) => update(state => {
      const newSelected = new Set(state.selectedRows);
      if (newSelected.has(rowId)) {
        newSelected.delete(rowId);
      } else {
        newSelected.add(rowId);
      }
      return { ...state, selectedRows: newSelected };
    }),
    
    selectAllRows: (rowIds: (string | number)[]) => update(state => ({
      ...state,
      selectedRows: new Set(rowIds)
    })),
    
    clearSelection: () => update(state => ({
      ...state,
      selectedRows: new Set()
    })),
    
    addSort: (field: string, direction: 'asc' | 'desc', multiSort: boolean = false) => 
      update(state => {
        let newSortState = multiSort ? [...state.sortState] : [];
        const existingIndex = newSortState.findIndex(s => s.field === field);
        
        if (existingIndex >= 0) {
          newSortState[existingIndex] = { field, direction };
        } else {
          newSortState.push({ field, direction });
        }
        
        return { ...state, sortState: newSortState };
      }),
    
    removeSort: (field: string) => update(state => ({
      ...state,
      sortState: state.sortState.filter(s => s.field !== field)
    })),
    
    clearSort: () => update(state => ({ ...state, sortState: [] })),
    
    addFilter: (filter: FilterState) => update(state => {
      const newFilterState = state.filterState.filter(f => f.field !== filter.field);
      newFilterState.push(filter);
      return { ...state, filterState: newFilterState };
    }),
    
    removeFilter: (field: string) => update(state => ({
      ...state,
      filterState: state.filterState.filter(f => f.field !== field)
    })),
    
    clearFilters: () => update(state => ({ ...state, filterState: [] })),
    
    setColumnWidth: (columnId: string, width: number) => update(state => ({
      ...state,
      columnWidths: { ...state.columnWidths, [columnId]: width }
    })),
    
    setColumnOrder: (newOrder: string[]) => update(state => ({
      ...state,
      columnOrder: newOrder
    })),
    
    setScrollTop: (scrollTop: number) => update(state => ({ ...state, scrollTop })),
    
    incrementPage: () => update(state => ({ 
      ...state, 
      currentPage: state.currentPage + 1 
    })),
  };
}