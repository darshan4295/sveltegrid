export interface GridColumn {
  id: string;
  field: string;
  headerName: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  resizable?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'date' | 'boolean' | 'select';
  options?: string[]; // For select type
  frozen?: 'left' | 'right' | false;
  hide?: boolean;
  cellRenderer?: (value: any, row: any) => string;
  headerRenderer?: (column: GridColumn) => string;
  pinned?: boolean;
}

export interface GridRow {
  id: string | number;
  [key: string]: any;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  field: string;
  type: 'text' | 'number' | 'date' | 'select';
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'lt' | 'gte' | 'lte' | 'in';
  value: any;
}

export interface GridState {
  rows: GridRow[];
  selectedRows: Set<string | number>;
  sortState: SortState[];
  filterState: FilterState[];
  loading: boolean;
  totalRows: number;
  currentPage: number;
  pageSize: number;
  scrollTop: number;
  columnOrder: string[];
  columnWidths: { [key: string]: number };
  frozenLeftColumns: string[];
  frozenRightColumns: string[];
}

export interface GridConfig {
  columns: GridColumn[];
  dataSource: (params: DataSourceParams) => Promise<DataSourceResult>;
  rowHeight?: number;
  headerHeight?: number;
  enableVirtualScroll?: boolean;
  enableInfiniteScroll?: boolean;
  pageSize?: number;
  multiSelect?: boolean;
  showCheckboxes?: boolean;
  enableColumnReorder?: boolean;
  enableColumnResize?: boolean;
  enableFiltering?: boolean;
  enableSorting?: boolean;
  enableContextMenu?: boolean;
  theme?: 'light' | 'dark';
}

export interface DataSourceParams {
  startRow: number;
  endRow: number;
  sortModel: SortState[];
  filterModel: FilterState[];
}

export interface DataSourceResult {
  rows: GridRow[];
  totalRows: number;
}

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: string;
  action: (selectedRows: GridRow[]) => void;
  disabled?: boolean;
}