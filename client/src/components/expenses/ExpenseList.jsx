import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { formatAmount } from '../../utils/currency';
import toast from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import './ExpenseList.css';

export default function ExpenseList({ expenses, currency, onDelete, compact }) {
  const qc = useQueryClient();

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      toast.success('Expense deleted');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      onDelete?.();
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to delete'),
  });

  if (!expenses.length) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">💸</div>
        <h3>No expenses found</h3>
        <p>Add your first expense using the button above</p>
      </div>
    );
  }

  // Group by date
  const grouped = expenses.reduce((acc, exp) => {
    const key = exp.date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(exp);
    return acc;
  }, {});

  if (compact) {
    // Flat list for dashboard
    return (
      <div className="expense-list">
        {expenses.map(exp => (
          <ExpenseRow key={exp.id} expense={exp} currency={currency} onDelete={() => deleteMut.mutate(exp.id)} loading={deleteMut.isPending} />
        ))}
      </div>
    );
  }

  return (
    <div className="expense-list">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date} className="expense-group">
          <div className="expense-group-header">
            <span className="expense-group-date">
              {format(parseISO(date), 'MMMM d, yyyy')}
            </span>
            <span className="expense-group-total">
              {formatAmount(items.reduce((s, e) => s + e.amount, 0), currency)}
            </span>
          </div>
          {items.map(exp => (
            <ExpenseRow key={exp.id} expense={exp} currency={currency} onDelete={() => deleteMut.mutate(exp.id)} loading={deleteMut.isPending} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ExpenseRow({ expense: e, currency, onDelete, loading }) {
  return (
    <div className="expense-row">
      <div className="exp-cat-icon" style={{ background: `${e.category_color}22`, color: e.category_color }}>
        {e.category_icon}
      </div>
      <div className="exp-info">
        <div className="exp-desc">
          {e.description}
          {e.is_recurring ? <span className="recurring-badge">🔄</span> : null}
        </div>
        <div className="exp-meta">
          <span className="exp-cat-badge" style={{ background: `${e.category_color}22`, color: e.category_color }}>
            {e.category_name}
          </span>
          {e.notes && <span className="exp-notes-dot" title={e.notes}>📝</span>}
        </div>
      </div>
      <div className="exp-amount">
        {formatAmount(e.amount, currency)}
      </div>
      <button
        className="btn btn-ghost btn-icon exp-delete"
        onClick={onDelete}
        disabled={loading}
        title="Delete expense"
        aria-label="Delete expense"
      >
        🗑️
      </button>
    </div>
  );
}
