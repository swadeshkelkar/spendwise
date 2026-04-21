import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './QuickAddBar.css';

export default function QuickAddBar({ onSuccess }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const currency = user?.currency || 'INR';

  const [activeTpl, setActiveTpl] = useState(null);  // the full template object
  const [override, setOverride] = useState({});
  const amountRef = useRef(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get('/templates').then(r => r.data),
  });

  const applyMut = useMutation({
    mutationFn: ({ id, amount, date }) =>
      api.post(`/templates/${id}/apply`, { amount: Number(amount), date }),
    onSuccess: async (_, vars) => {
      toast.success(`${activeTpl?.name || 'Expense'} added ✅`);
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['summary'] });
      qc.invalidateQueries({ queryKey: ['budgets'] });
      onSuccess?.();
      setActiveTpl(null);

      // ── Budget alert check ────────────────────────────────────────────────
      try {
        const tplSnap = activeTpl;
        const budgets = await api.get('/expenses/budgets').then(r => r.data);
        const b = budgets.find(b => String(b.category_id) === String(tplSnap?.category_id));
        if (b && b.amount > 0) {
          const spent = b.spent || 0;
          const pct   = (spent / b.amount) * 100;
          const cur   = currency;
          if (pct >= 100) {
            toast.error(
              `🚨 You've exceeded your ${b.category_name} budget!\n` +
              `${cur} ${spent.toLocaleString()} of ${Number(b.amount).toLocaleString()} limit.`,
              { duration: 6000 }
            );
          } else if (pct >= 80) {
            toast(
              `⚠️ ${b.category_name} budget at ${pct.toFixed(0)}%\n` +
              `${cur} ${spent.toLocaleString()} of ${Number(b.amount).toLocaleString()} used.`,
              { icon: '⚠️', duration: 5000, style: { background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', color: '#FCD34D' } }
            );
          }
        }
      } catch {
        // best-effort
      }
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Failed to add expense'),
  });


  const openModal = (tpl) => {
    setActiveTpl(tpl);
    setOverride({ amount: String(tpl.amount), date: new Date().toISOString().split('T')[0] });
    setTimeout(() => amountRef.current?.select(), 80);
  };

  const closeModal = () => { if (!applyMut.isPending) setActiveTpl(null); };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [applyMut.isPending]);

  const handleApply = () => {
    const amount = Number(override.amount);
    if (!override.amount || isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount');
      amountRef.current?.focus();
      return;
    }
    applyMut.mutate({ id: activeTpl.id, amount, date: override.date });
  };

  // Still loading — render nothing
  if (isLoading) return null;

  // No templates yet — show a hint banner linking to Settings
  if (!templates?.length) {
    return (
      <div className="banner banner-info" style={{ marginTop: 20, marginBottom: 20 }}>
        <span>⚡</span>
        <span>
          <a href="/settings" style={{ color: 'inherit', fontWeight: 700, textDecoration: 'underline' }}>
            Go to Settings
          </a>
          {' '}to create templates for recurring expenses.
        </span>
      </div>
    );
  }

  return (
    <>
      <div className="quick-add-bar">
        <div className="quick-add-label">
          <span className="quick-add-label-icon">⚡</span>
          Quick Add
        </div>

        <div className="quick-add-chips-wrap">
          <div className="quick-add-chips">
            {templates.map(tpl => (
              <button
                key={tpl.id}
                id={`quick-tpl-${tpl.id}`}
                className="quick-chip"
                style={{ '--chip-color': tpl.category_color }}
                onClick={() => openModal(tpl)}
                title={`${tpl.description} · ${currency} ${Number(tpl.amount).toLocaleString()}`}
              >
                <span className="quick-chip-icon">{tpl.category_icon}</span>
                <span className="quick-chip-name">{tpl.name}</span>
                <span className="quick-chip-amount">
                  {currency} {Number(tpl.amount).toLocaleString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Full-screen modal ── */}
      {activeTpl && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal slide-up">
            <div className="modal-header">
              <h3 className="modal-title">
                {activeTpl.category_icon} {activeTpl.name}
              </h3>
              <button className="modal-close" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, marginTop: -12 }}>
              {activeTpl.description}
              <span style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: `${activeTpl.category_color}22`, color: activeTpl.category_color }}>
                {activeTpl.category_name}
              </span>
            </p>

            <div className="expense-form">
              <div className="exp-row">
                <div className="form-group">
                  <label className="form-label">Amount ({currency})</label>
                  <div className="amount-input-wrap">
                    <span className="amount-prefix">{currency}</span>
                    <input
                      ref={amountRef}
                      id="quick-modal-amount"
                      type="number"
                      className="form-input"
                      min="0.01" step="0.01"
                      value={override.amount}
                      onChange={e => setOverride(o => ({ ...o, amount: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleApply(); } }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input
                    id="quick-modal-date"
                    type="date"
                    className="form-input"
                    value={override.date}
                    onChange={e => setOverride(o => ({ ...o, date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="expense-form-actions">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button
                  id="quick-modal-confirm"
                  type="button"
                  className="btn btn-primary"
                  disabled={applyMut.isPending}
                  onClick={handleApply}
                >
                  {applyMut.isPending ? <span className="spinner" /> : '⚡ Add Expense'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
