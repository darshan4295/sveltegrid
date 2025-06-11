<script lang="ts">
  import DataGrid from './components/grid/DataGrid.svelte';
  import type { GridConfig, GridColumn, DataSourceParams, DataSourceResult } from './types/grid';

  // Sample data generator
  function generateSampleData(count: number) {
    const companies = ['TechCorp', 'DataSys', 'CloudInc', 'WebTech', 'DevCorp', 'InfoSys', 'SoftTech', 'NetCorp'];
    const statuses = ['Active', 'Inactive', 'Pending', 'Suspended'];
    const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'];
    
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      name: `Employee ${i + 1}`,
      email: `employee${i + 1}@example.com`,
      company: companies[Math.floor(Math.random() * companies.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      salary: Math.floor(Math.random() * 100000) + 50000,
      startDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      active: Math.random() > 0.3,
      rating: Math.floor(Math.random() * 5) + 1,
    }));
  }

  // Generate initial data
  const allData = generateSampleData(10000);

  // Grid configuration
  const columns: GridColumn[] = [
    {
      id: 'id',
      field: 'id',
      headerName: 'ID',
      width: 80,
      type: 'number',
      frozen: 'left',
      sortable: true,
      filterable: true,
    },
    {
      id: 'name',
      field: 'name',
      headerName: 'Full Name',
      width: 200,
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      id: 'email',
      field: 'email',
      headerName: 'Email Address',
      width: 250,
      type: 'text',
      sortable: true,
      filterable: true,
    },
    {
      id: 'company',
      field: 'company',
      headerName: 'Company',
      width: 150,
      type: 'select',
      options: ['TechCorp', 'DataSys', 'CloudInc', 'WebTech', 'DevCorp', 'InfoSys', 'SoftTech', 'NetCorp'],
      sortable: true,
      filterable: true,
    },
    {
      id: 'department',
      field: 'department',
      headerName: 'Department',
      width: 150,
      type: 'select',
      options: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'],
      sortable: true,
      filterable: true,
    },
    {
      id: 'salary',
      field: 'salary',
      headerName: 'Salary',
      width: 120,
      type: 'number',
      sortable: true,
      filterable: true,
      cellRenderer: (value) => `$${value.toLocaleString()}`,
    },
    {
      id: 'startDate',
      field: 'startDate',
      headerName: 'Start Date',
      width: 140,
      type: 'date',
      sortable: true,
      filterable: true,
    },
    {
      id: 'status',
      field: 'status',
      headerName: 'Status',
      width: 120,
      type: 'select',
      options: ['Active', 'Inactive', 'Pending', 'Suspended'],
      sortable: true,
      filterable: true,
    },
    {
      id: 'active',
      field: 'active',
      headerName: 'Active',
      width: 80,
      type: 'boolean',
      sortable: true,
      filterable: true,
    },
    {
      id: 'rating',
      field: 'rating',
      headerName: 'Rating',
      width: 100,
      type: 'number',
      sortable: true,
      filterable: true,
      cellRenderer: (value) => '★'.repeat(value) + '☆'.repeat(5 - value),
    },
  ];

  // Mock data source that simulates backend API
  async function dataSource(params: DataSourceParams): Promise<DataSourceResult> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200));
    
    let filteredData = [...allData];
    
    // Apply filters
    params.filterModel.forEach(filter => {
      filteredData = filteredData.filter(row => {
        const value = row[filter.field];
        const filterValue = filter.value;
        
        switch (filter.operator) {
          case 'equals':
            return value === filterValue;
          case 'contains':
            return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
          case 'startsWith':
            return String(value).toLowerCase().startsWith(String(filterValue).toLowerCase());
          case 'endsWith':
            return String(value).toLowerCase().endsWith(String(filterValue).toLowerCase());
          case 'gt':
            return Number(value) > Number(filterValue);
          case 'lt':
            return Number(value) < Number(filterValue);
          case 'gte':
            return Number(value) >= Number(filterValue);
          case 'lte':
            return Number(value) <= Number(filterValue);
          case 'in':
            return Array.isArray(filterValue) ? filterValue.includes(value) : false;
          default:
            return true;
        }
      });
    });
    
    // Apply sorting
    if (params.sortModel.length > 0) {
      filteredData.sort((a, b) => {
        for (const sort of params.sortModel) {
          const aVal = a[sort.field];
          const bVal = b[sort.field];
          
          let comparison = 0;
          if (aVal < bVal) comparison = -1;
          else if (aVal > bVal) comparison = 1;
          
          if (comparison !== 0) {
            return sort.direction === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }
    
    // Apply pagination
    const startRow = params.startRow;
    const endRow = params.endRow;
    const paginatedData = filteredData.slice(startRow, endRow);
    
    return {
      rows: paginatedData,
      totalRows: filteredData.length,
    };
  }

  const gridConfig: GridConfig = {
    columns,
    dataSource,
    rowHeight: 36,
    headerHeight: 40,
    pageSize: 100,
    enableVirtualScroll: true,
    enableInfiniteScroll: true,
    multiSelect: true,
    showCheckboxes: true,
    enableColumnReorder: true,
    enableColumnResize: true,
    enableFiltering: true,
    enableSorting: true,
    enableContextMenu: true,
    theme: 'light',
  };

  // Grid event handlers
  function handleRowClick(event: CustomEvent) {
    console.log('Row clicked:', event.detail);
  }

  function handleRowDoubleClick(event: CustomEvent) {
    console.log('Row double-clicked:', event.detail);
  }

  function handleCellClick(event: CustomEvent) {
    console.log('Cell clicked:', event.detail);
  }

  function handleCellDoubleClick(event: CustomEvent) {
    console.log('Cell double-clicked:', event.detail);
  }
</script>

<main>
  <div class="app-header">
    <h1>Professional Svelte DataGrid</h1>
    <div class="feature-list">
      <span class="feature">🔒 Column Freezing</span>
      <span class="feature">🔍 Advanced Filtering</span>
      <span class="feature">↕️ Multi-Column Sorting</span>
      <span class="feature">♾️ Infinite Scroll</span>
      <span class="feature">✅ Row Selection</span>
      <span class="feature">📊 Export Data</span>
    </div>
  </div>

  <div class="grid-container">
    <DataGrid 
      config={gridConfig}
      on:rowClick={handleRowClick}
      on:rowDoubleClick={handleRowDoubleClick}
      on:cellClick={handleCellClick}
      on:cellDoubleClick={handleCellDoubleClick}
    />
  </div>
</main>

<style>
  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: #f8fafc;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .app-header {
    padding: 24px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .app-header h1 {
    margin: 0 0 16px 0;
    font-size: 32px;
    font-weight: 700;
    color: #1f2937;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .feature-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .feature {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background: #eff6ff;
    color: #1e40af;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
  }

  .grid-container {
    flex: 1;
    margin: 24px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  @media (max-width: 768px) {
    main {
      height: 100vh;
    }
    
    .app-header {
      padding: 16px;
    }
    
    .app-header h1 {
      font-size: 24px;
      margin-bottom: 12px;
    }
    
    .feature-list {
      gap: 8px;
    }
    
    .feature {
      font-size: 12px;
      padding: 4px 8px;
    }
    
    .grid-container {
      margin: 16px;
      border-radius: 8px;
    }
  }
</style>