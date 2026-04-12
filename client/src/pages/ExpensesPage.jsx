import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatAmount } from '../utils/currency';
import { exportExpenses } from '../utils/export';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import ExpenseList from '../components/expenses/ExpenseList';
import FilterBar from '../components/expenses/FilterBar';
import toast from 'react-hot-toast';
import './ExpensesPage.css';

const PERIODS = [
  { label: 'All Time', value: '' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year', value: 'year' },
];

export default function ExpensesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const currency = user?.currency || 'INR';

  const [filters, setFilters]   = useState({ period: 'month', category_id: '', start_date: '', end_date: '' });
  const [page, setPage]         = useState(1);
  const [showAdd, setShowAdd]   = useState(false);
  const [exporting, setExporting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', filters, page],
    queryFn: () => api.get('/expenses', { params: { ...filters, page, limit: 20 } }).then(r => r.data),
    keepPreviousData: true,
  });

  const handleExport = async (format) => {
    setExporting(true);
    try {
      await exportExpenses(format, filters);
      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch { toast.error('Export failed'); }
    finally { setExporting(false); }
  };

  const refetch = () => {
    qc.invalidateQueries({ queryKey: ['expenses'] });
    qc.invalidateQueries({ queryKey: ['summary'] });
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  return (
    <div className="expenses-page page-fade">
      <div className="expenses-header">
        <div>
          <h2>Expenses</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
            {data?.total ?? 0} transactions found
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Export Dropdown */}
          <div className="dropdown">
            <button className="btn btn-secondary" disabled={exporting}>
              {exporting ? <span className="spinner" /> : '📤'} Export
            </button>
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={() => handleExport('csv')}>📄 Export CSV</button>
              <button className="dropdown-item" onClick={() => handleExport('excel')}>📊 Export Excel</button>
            </div>
          </div>
          <button id="add-expense-fab" className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + Add Expense
          </button>
        </div>
      </div>

      <FilterBar filters={filters} onChange={f => { setFilters(f); setPage(1); }} />

      <div className="card card-flat" style={{ marginTop: 20 }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <ExpenseList
            expenses={data?.expenses || []}
            currency={currency}
            onDelete={refetch}
          />
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Page {page} of {totalPages}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next →</button>
          </div>
        )}
      </div>

      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} onSuccess={refetch} />}
    </div>
  );
}
