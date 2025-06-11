import type { GridColumn, GridRow, FilterState, SortState } from '../types/grid';

export function formatCellValue(value: any, column: GridColumn): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (column.cellRenderer) {
    return column.cellRenderer(value, {});
  }

  switch (column.type) {
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : String(value);
    case 'date':
      return value instanceof Date ? value.toLocaleDateString() : String(value);
    case 'boolean':
      return value ? 'Yes' : 'No';
    default:
      return String(value);
  }
}

export function getColumnWidth(column: GridColumn, customWidth?: number): number {
  if (customWidth) return customWidth;
  if (column.width) return column.width;
  
  // Default widths based on type
  switch (column.type) {
    case 'boolean':
      return 80;
    case 'number':
      return 120;
    case 'date':
      return 140;
    default:
      return 150;
  }
}

export function isColumnResizable(column: GridColumn): boolean {
  return column.resizable !== false;
}

export function isColumnSortable(column: GridColumn): boolean {
  return column.sortable !== false;
}

export function isColumnFilterable(column: GridColumn): boolean {
  return column.filterable !== false;
}

export function exportToCSV(rows: GridRow[], columns: GridColumn[], filename: string = 'grid-export.csv') {
  const headers = columns.map(col => col.headerName).join(',');
  const csvContent = [
    headers,
    ...rows.map(row => 
      columns.map(col => {
        const value = row[col.field];
        const formattedValue = formatCellValue(value, col);
        // Escape commas and quotes in CSV
        return formattedValue.includes(',') || formattedValue.includes('"') 
          ? `"${formattedValue.replace(/"/g, '""')}"` 
          : formattedValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(rows: GridRow[], filename: string = 'grid-export.json') {
  const jsonContent = JSON.stringify(rows, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Virtual scrolling calculations
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  rowHeight: number,
  totalRows: number,
  overscan: number = 5
): { startIndex: number; endIndex: number; offsetY: number } {
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const endIndex = Math.min(totalRows - 1, startIndex + visibleCount + overscan * 2);
  const offsetY = startIndex * rowHeight;

  return { startIndex, endIndex, offsetY };
}