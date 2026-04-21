import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './AddExpenseModal.css';

export default function AddExpenseModal({ onClose, onSuccess }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    description: '', amount: '', date: today,
    category_id: '', notes: '',
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/expenses', data),
    onSuccess: async (_, sentData) => {
      toast.success('Expense added!');
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
      onSuccess?.();
      onClose();

      // ── Budget alert check ────────────────────────────────────────────────
      try {
        const budgets = await api.get('/expenses/budgets').then(r => r.data);
        const b = budgets.find(b => String(b.category_id) === String(sentData.category_id));
        if (b && b.amount > 0) {
          const spent = b.spent || 0;
          const pct   = (spent / b.amount) * 100;
          const currency = user?.currency || '';
          if (pct >= 100) {
            toast.error(
              `🚨 You've exceeded your ${b.category_name} budget!\n` +
              `${currency} ${spent.toLocaleString()} spent of ${Number(b.amount).toLocaleString()} limit.`,
              { duration: 6000 }
            );
          } else if (pct >= 80) {
            toast(
              `⚠️ ${b.category_name} budget at ${pct.toFixed(0)}%\n` +
              `${currency} ${spent.toLocaleString()} of ${Number(b.amount).toLocaleString()} used.`,
              { icon: '⚠️', duration: 5000, style: { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#FCD34D' } }
            );
          }
        }
      } catch {
        // budget check is best-effort — never block the main flow
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to add expense'),
  });


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.description.trim()) { toast.error('Description is required'); return; }
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) { toast.error('Enter a valid amount'); return; }
    if (!form.category_id) { toast.error('Please select a category'); return; }
    mutation.mutate({ ...form, amount: Number(form.amount) });
  };

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal slide-up">
        <div className="modal-header">
          <h3 className="modal-title">💸 Add Expense</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="expense-form">
          <div className="form-group">
            <label className="form-label">Description *</label>
            <input
              id="exp-description"
              type="text" className="form-input" placeholder="e.g. Lunch at restaurant"
              value={form.description} onChange={e => set('description', e.target.value)}
              required autoFocus
            />
          </div>

          <div className="exp-row">
            <div className="form-group">
              <label className="form-label">Amount *</label>
              <div className="amount-input-wrap">
                <span className="amount-prefix">{user?.currency || 'INR'}</span>
                <input
                  id="exp-amount"
                  type="number" className="form-input" placeholder="0.00"
                  min="0.01" step="0.01"
                  value={form.amount} onChange={e => set('amount', e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input
                id="exp-date"
                type="date" className="form-input"
                value={form.date} onChange={e => set('date', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Category *</label>
            <select id="exp-category" className="form-select" value={form.category_id} onChange={e => set('category_id', e.target.value)} required>
              <option value="">Select a category</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea
              id="exp-notes"
              className="form-textarea" placeholder="Any additional details..."
              value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={2}
            />
          </div>



          <div className="expense-form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button id="exp-submit" type="submit" className="btn btn-primary" disabled={mutation.isPending}>
              {mutation.isPending ? <span className="spinner" /> : '+ Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
