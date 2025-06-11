<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { clickOutside } from '../../actions/clickOutside';
  import type { GridColumn, FilterState } from '../../types/grid';

  export let column: GridColumn;
  export let x: number;
  export let y: number;
  export let currentFilter: FilterState | undefined;

  const dispatch = createEventDispatcher();

  let filterValue = currentFilter?.value || '';
  let filterOperator = currentFilter?.operator || getDefaultOperator(column.type || 'text');
  let selectedOptions: string[] = Array.isArray(currentFilter?.value) ? currentFilter.value : [];

  const operators = {
    text: [
      { value: 'contains', label: 'Contains' },
      { value: 'equals', label: 'Equals' },
      { value: 'startsWith', label: 'Starts with' },
      { value: 'endsWith', label: 'Ends with' },
    ],
    number: [
      { value: 'equals', label: 'Equals' },
      { value: 'gt', label: 'Greater than' },
      { value: 'lt', label: 'Less than' },
      { value: 'gte', label: 'Greater than or equal' },
      { value: 'lte', label: 'Less than or equal' },
    ],
    date: [
      { value: 'equals', label: 'Equals' },
      { value: 'gt', label: 'After' },
      { value: 'lt', label: 'Before' },
      { value: 'gte', label: 'On or after' },
      { value: 'lte', label: 'On or before' },
    ],
    select: [
      { value: 'in', label: 'In' },
    ],
  };

  function getDefaultOperator(type: string): string {
    switch (type) {
      case 'text':
        return 'contains';
      case 'number':
      case 'date':
        return 'equals';
      case 'select':
        return 'in';
      default:
        return 'contains';
    }
  }

  function applyFilter() {
    const value = column.type === 'select' ? selectedOptions : filterValue;
    
    if ((Array.isArray(value) && value.length === 0) || (!Array.isArray(value) && !value)) {
      // Clear filter if no value
      dispatch('clearFilter', { field: column.field });
    } else {
      const filter: FilterState = {
        field: column.field,
        type: column.type || 'text',
        operator: filterOperator as any,
        value,
      };
      dispatch('applyFilter', filter);
    }
    
    dispatch('close');
  }

  function clearFilter() {
    dispatch('clearFilter', { field: column.field });
    dispatch('close');
  }

  function close() {
    dispatch('close');
  }

  function handleOptionToggle(option: string) {
    if (selectedOptions.includes(option)) {
      selectedOptions = selectedOptions.filter(o => o !== option);
    } else {
      selectedOptions = [...selectedOptions, option];
    }
  }

  onMount(() => {
    // Position the popup
    const popup = document.querySelector('.filter-popup') as HTMLElement;
    if (popup) {
      const rect = popup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Adjust position if popup goes off-screen
      let adjustedX = x;
      let adjustedY = y;

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 10;
      }

      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 10;
      }

      popup.style.left = `${adjustedX}px`;
      popup.style.top = `${adjustedY}px`;
    }
  });
</script>

<div 
  class="filter-popup"
  use:clickOutside
  on:clickOutside={close}
  style="left: {x}px; top: {y}px;"
>
  <div class="filter-header">
    <h3>Filter: {column.headerName}</h3>
    <button class="close-button" on:click={close}>×</button>
  </div>

  <div class="filter-content">
    {#if column.type === 'select' && column.options}
      <div class="select-filter">
        <label class="filter-label">Select values:</label>
        <div class="options-list">
          {#each column.options as option}
            <label class="option-item">
              <input 
                type="checkbox" 
                checked={selectedOptions.includes(option)}
                on:change={() => handleOptionToggle(option)}
              />
              {option}
            </label>
          {/each}
        </div>
      </div>
    {:else}
      <div class="operator-select">
        <label class="filter-label">Condition:</label>
        <select bind:value={filterOperator} class="select-input">
          {#each operators[column.type || 'text'] as op}
            <option value={op.value}>{op.label}</option>
          {/each}
        </select>
      </div>

      <div class="value-input">
        <label class="filter-label">Value:</label>
        {#if column.type === 'number'}
          <input 
            type="number" 
            bind:value={filterValue} 
            class="text-input"
            placeholder="Enter number"
          />
        {:else if column.type === 'date'}
          <input 
            type="date" 
            bind:value={filterValue} 
            class="text-input"
          />
        {:else}
          <input 
            type="text" 
            bind:value={filterValue} 
            class="text-input"
            placeholder="Enter value"
          />
        {/if}
      </div>
    {/if}
  </div>

  <div class="filter-actions">
    <button class="clear-button" on:click={clearFilter}>Clear</button>
    <button class="apply-button" on:click={applyFilter}>Apply</button>
  </div>
</div>

<style>
  .filter-popup {
    position: fixed;
    z-index: 1000;
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    min-width: 280px;
    max-width: 400px;
  }

  .filter-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid #e5e7eb;
  }

  .filter-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #374151;
  }

  .close-button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #6b7280;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-button:hover {
    color: #374151;
  }

  .filter-content {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .filter-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 4px;
  }

  .select-input, .text-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.2s;
  }

  .select-input:focus, .text-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .options-list {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    padding: 8px;
  }

  .option-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
    cursor: pointer;
    font-size: 14px;
  }

  .option-item input[type="checkbox"] {
    margin: 0;
  }

  .filter-actions {
    display: flex;
    gap: 8px;
    padding: 16px;
    border-top: 1px solid #e5e7eb;
    justify-content: flex-end;
  }

  .clear-button, .apply-button {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .clear-button {
    background: #f3f4f6;
    border: 1px solid #d1d5db;
    color: #374151;
  }

  .clear-button:hover {
    background: #e5e7eb;
  }

  .apply-button {
    background: #3b82f6;
    border: 1px solid #3b82f6;
    color: white;
  }

  .apply-button:hover {
    background: #2563eb;
  }
</style>