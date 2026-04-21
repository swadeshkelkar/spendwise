import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { exportExpenses } from '../utils/export';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import ExpenseList from '../components/expenses/ExpenseList';
import FilterBar from '../components/expenses/FilterBar';
import QuickAddBar from '../components/expenses/QuickAddBar';
import toast from 'react-hot-toast';
import './ExpensesPage.css';

const LIMIT_OPTIONS = [10, 20, 50];

/** Returns an array of page numbers + ellipsis strings to render */
function buildPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [];
  const addPage = (n) => pages.push(n);
  const addDots = () => pages.push('…');

  addPage(1);
  if (current <= 4) {
    for (let i = 2; i <= Math.min(5, total - 1); i++) addPage(i);
    addDots();
  } else if (current >= total - 3) {
    addDots();
    for (let i = Math.max(2, total - 4); i <= total - 1; i++) addPage(i);
  } else {
    addDots();
    addPage(current - 1);
    addPage(current);
    addPage(current + 1);
    addDots();
  }
  addPage(total);
  return pages;
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const currency = user?.currency || 'INR';
  const listRef = useRef(null);

  const [filters, setFilters] = useState({ period: 'month', category_id: '', start_date: '', end_date: '' });
  const [page, setPage]       = useState(1);
  const [limit, setLimit]     = useState(20);
  const [showAdd, setShowAdd]     = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const exportRef = useRef(null);

  // Close export dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (exportRef.current && !exportRef.current.contains(e.target)) setShowExport(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['expenses', filters, page, limit],
    queryFn: () => api.get('/expenses', { params: { ...filters, page, limit } }).then(r => r.data),
    keepPreviousData: true,
  });

  const goToPage = useCallback((p) => {
    setPage(p);
    // Scroll list into view smoothly
    setTimeout(() => listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }, []);

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setPage(1);
  };

  const handleFiltersChange = (f) => { setFilters(f); setPage(1); };

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

  const total      = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd   = Math.min(page * limit, total);
  const pageRange  = buildPageRange(page, totalPages);

  return (
    <div className="expenses-page page-fade">
      {/* ── Header ── */}
      <div className="expenses-header">
        <div>
          <h2>Expenses</h2>
          <p className="expenses-sub">
            {total === 0 ? 'No transactions found' : `Showing ${rangeStart}–${rangeEnd} of ${total} transactions`}
          </p>
        </div>
        <div className="expenses-actions">
          {/* Export dropdown */}
          <div className="dropdown" ref={exportRef}>
            <button className="btn btn-secondary" disabled={exporting} onClick={() => setShowExport(v => !v)}>
              {exporting ? <span className="spinner" /> : '📤'} Export
            </button>
            <div className={`dropdown-menu${showExport ? ' open' : ''}`}>
              <button className="dropdown-item" onClick={() => { handleExport('csv');   setShowExport(false); }}>📄 Export CSV</button>
              <button className="dropdown-item" onClick={() => { handleExport('excel'); setShowExport(false); }}>📊 Export Excel</button>
            </div>
          </div>
          <button id="add-expense-fab" className="btn btn-primary" onClick={() => setShowAdd(true)}>
            + Add Expense
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <FilterBar filters={filters} onChange={handleFiltersChange} />

      {/* ── Quick Add bar ── */}
      <QuickAddBar onSuccess={refetch} />

      {/* ── List card ── */}
      <div className="card card-flat expenses-card" ref={listRef}>

        {/* Per-page selector + fetch indicator */}
        <div className="expenses-toolbar">
          <div className="per-page-wrap">
            <span className="per-page-label">Show</span>
            {LIMIT_OPTIONS.map(n => (
              <button
                key={n}
                className={`per-page-btn${limit === n ? ' active' : ''}`}
                onClick={() => handleLimitChange(n)}
              >
                {n}
              </button>
            ))}
            <span className="per-page-label">per page</span>
          </div>
          {isFetching && !isLoading && (
            <span className="fetch-indicator"><span className="spinner" style={{ width: 14, height: 14 }} /></span>
          )}
        </div>

        {/* Expense list */}
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
            <div className="spinner spinner-lg" />
          </div>
        ) : (
          <ExpenseList
            expenses={data?.expenses || []}
            currency={currency}
            onDelete={refetch}
          />
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="pagination">
            {/* Prev */}
            <button
              className="page-btn page-nav"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              aria-label="Previous page"
            >
              ‹
            </button>

            {/* Page numbers */}
            <div className="page-numbers">
              {pageRange.map((p, i) =>
                p === '…'
                  ? <span key={`dots-${i}`} className="page-dots">…</span>
                  : <button
                      key={p}
                      className={`page-btn${p === page ? ' active' : ''}`}
                      onClick={() => goToPage(p)}
                      aria-label={`Page ${p}`}
                      aria-current={p === page ? 'page' : undefined}
                    >
                      {p}
                    </button>
              )}
            </div>

            {/* Next */}
            <button
              className="page-btn page-nav"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        )}

        {/* Page info below pagination */}
        {totalPages > 1 && (
          <p className="pagination-info">Page {page} of {totalPages}</p>
        )}
      </div>

      {showAdd && <AddExpenseModal onClose={() => setShowAdd(false)} onSuccess={refetch} />}
    </div>
  );
}
