import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { formatAmount } from '../../utils/currency';
import { useState } from 'react';
import toast from 'react-hot-toast';
import './BudgetWidget.css';

export default function BudgetWidget({ currency }) {
  const qc = useQueryClient();
  const [editId, setEditId] = useState(null);
  const [editAmt, setEditAmt] = useState('');

  const { data: budgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.get('/expenses/budgets').then(r => r.data),
  });

  const saveMut = useMutation({
    mutationFn: (d) => api.post('/expenses/budgets', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); setEditId(null); toast.success('Budget saved'); },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  });

  const delMut = useMutation({
    mutationFn: (cid) => api.delete(`/expenses/budgets/${cid}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Budget removed'); },
  });

  const alerts = budgets?.filter(b => b.spent && b.spent >= b.amount * 0.8) || [];

  return (
    <div className="card card-flat">
      <h3 style={{ marginBottom: 4 }}>Budget Alerts</h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Monthly limits by category</p>

      {alerts.length > 0 && (
        <div className="banner banner-warning" style={{ marginBottom: 12, fontSize: 13 }}>
          ⚠️ {alerts.length} categor{alerts.length > 1 ? 'ies are' : 'y is'} near limit
        </div>
      )}

      {!budgets?.length ? (
        <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 14 }}>
          No budgets set. Visit Settings → Categories to set limits.
        </div>
      ) : (
        <div className="budget-list">
          {budgets.map(b => {
            const pct = b.amount > 0 ? Math.min(100, ((b.spent || 0) / b.amount) * 100) : 0;
            const isWarn = pct >= 80;
            const isOver = pct >= 100;
            return (
              <div key={b.id} className="budget-item">
                <div className="budget-top">
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>{b.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{b.category_name}</span>
                  </div>
                  <div style={{ fontSize: 13, color: isOver ? 'var(--danger)' : isWarn ? 'var(--warning)' : 'var(--text-secondary)' }}>
                    {formatAmount(b.spent || 0, currency)} / {formatAmount(b.amount, currency)}
                  </div>
                </div>
                <div className="budget-bar-track">
                  <div
                    className="budget-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: isOver ? 'var(--danger)' : isWarn ? 'var(--warning)' : `${b.color}`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
