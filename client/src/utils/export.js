import { saveAs } from 'file-saver';
import api from '../api/axios';

/**
 * Trigger a server-side export download.
 * @param {string} format - 'csv' | 'excel'
 * @param {object} filters - Query filters to pass
 */
export async function exportExpenses(format, filters = {}) {
  const params = new URLSearchParams({ format, ...filters }).toString();
  const response = await api.get(`/expenses/export?${params}`, { responseType: 'blob' });

  const ext = format === 'excel' ? 'xlsx' : 'csv';
  const mime = format === 'excel'
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'text/csv';

  const blob = new Blob([response.data], { type: mime });
  saveAs(blob, `spendwise_expenses.${ext}`);
}
