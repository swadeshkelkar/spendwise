import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { CURRENCIES } from '../utils/currency';
import toast from 'react-hot-toast';
import './SettingsPage.css';

export default function SettingsPage() {
  const { user, updateCurrency, logout } = useAuth();
  const qc = useQueryClient();
  const [newCat, setNewCat] = useState({ name: '', icon: '📦', color: '#6C63FF' });
  const [catError, setCatError] = useState('');

  // ── Template state ──────────────────────────────────────────────────────────
  const [newTpl, setNewTpl] = useState({ name: '', description: '', amount: '', category_id: '', notes: '' });
  const [tplError, setTplError] = useState('');

  // ── Budget state ─────────────────────────────────────────────────────────
  const [newBudget, setNewBudget] = useState({ category_id: '', amount: '' });
  const [budgetError, setBudgetError] = useState('');

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  });

  const addCatMut = useMutation({
    mutationFn: (data) => api.post('/categories', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category added!');
      setNewCat({ name: '', icon: '📦', color: '#6C63FF' });
      setCatError('');
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to add category';
      setCatError(msg);
      toast.error(msg);
    },
  });

  const delCatMut = useMutation({
    mutationFn: (id) => api.delete(`/categories/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); toast.success('Category deleted'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Cannot delete category'),
  });

  const handleAddCategory = (e) => {
    e.preventDefault();
    setCatError('');
    if (!newCat.name.trim()) { setCatError('Category name is required'); return; }
    addCatMut.mutate(newCat);
  };

  // ── Template queries & mutations ────────────────────────────────────────────
  const { data: templates, isLoading: tplLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get('/templates').then(r => r.data),
  });

  const addTplMut = useMutation({
    mutationFn: (data) => api.post('/templates', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template saved!');
      setNewTpl({ name: '', description: '', amount: '', category_id: '', notes: '' });
      setTplError('');
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to save template';
      setTplError(msg);
      toast.error(msg);
    },
  });

  const delTplMut = useMutation({
    mutationFn: (id) => api.delete(`/templates/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['templates'] }); toast.success('Template deleted'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Cannot delete template'),
  });

  const handleAddTemplate = (e) => {
    e.preventDefault();
    setTplError('');
    if (!newTpl.name.trim())        { setTplError('Template name is required'); return; }
    if (!newTpl.description.trim()) { setTplError('Description is required'); return; }
    if (!newTpl.amount || isNaN(newTpl.amount) || Number(newTpl.amount) <= 0) { setTplError('Enter a valid amount'); return; }
    if (!newTpl.category_id)        { setTplError('Category is required'); return; }
    addTplMut.mutate({ ...newTpl, amount: Number(newTpl.amount) });
  };

  // ── Budget queries & mutations ────────────────────────────────────────────
  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: ['budgets'],
    queryFn: () => api.get('/expenses/budgets').then(r => r.data),
  });

  const saveBudgetMut = useMutation({
    mutationFn: (data) => api.post('/expenses/budgets', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget saved!');
      setNewBudget({ category_id: '', amount: '' });
      setBudgetError('');
    },
    onError: (err) => {
      const msg = err.response?.data?.error || 'Failed to save budget';
      setBudgetError(msg);
      toast.error(msg);
    },
  });

  const delBudgetMut = useMutation({
    mutationFn: (categoryId) => api.delete(`/expenses/budgets/${categoryId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['budgets'] }); toast.success('Budget removed'); },
    onError: (err) => toast.error(err.response?.data?.error || 'Cannot remove budget'),
  });

  const handleSaveBudget = (e) => {
    e.preventDefault();
    setBudgetError('');
    if (!newBudget.category_id) { setBudgetError('Please select a category'); return; }
    if (!newBudget.amount || isNaN(newBudget.amount) || Number(newBudget.amount) <= 0) { setBudgetError('Enter a valid amount'); return; }
    saveBudgetMut.mutate({ category_id: newBudget.category_id, amount: Number(newBudget.amount) });
  };

  const getBudgetStatus = (spent, limit) => {
    const pct = limit > 0 ? (spent / limit) * 100 : 0;
    if (pct >= 100) return { pct: Math.min(pct, 100), color: 'var(--danger)',  label: 'Over budget' };
    if (pct >= 80)  return { pct,                     color: 'var(--warning)', label: `${pct.toFixed(0)}% used` };
    return              { pct,                     color: 'var(--accent)',  label: `${pct.toFixed(0)}% used` };
  };

  const PRESET_ICONS = ['🍔', '✈️', '📄', '📈', '💳', '🍻', '🛒', '🏥', '🎮', '📚', '🏠', '🚗', '💪', '🎵', '💡', '🐾'];
  const PRESET_COLORS = ['#6C63FF', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#06B6D4'];

  return (
    <div className="settings-page page-fade">
      <div style={{ marginBottom: 28 }}>
        <h2>Settings</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage your account preferences</p>
      </div>

      <div className="settings-grid">
        {/* ── Profile ── */}
        <div className="card card-flat settings-section">
          <h3 className="settings-section-title">👤 Profile</h3>
          <div className="profile-info">
            <div className="profile-avatar">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt={user?.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : user?.name?.slice(0, 2).toUpperCase()
              }
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{user?.email}</div>
              <div className="badge" style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--accent)', marginTop: 6, fontSize: 11 }}>
                ✅ Verified
              </div>
            </div>
          </div>
        </div>

        {/* ── Currency ── */}
        <div className="card card-flat settings-section">
          <h3 className="settings-section-title">💱 Currency</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
            Choose your preferred currency. All amounts will display in this currency.
          </p>
          <select
            id="currency-select"
            className="form-select"
            value={user?.currency || 'INR'}
            onChange={async (e) => {
              await updateCurrency(e.target.value);
              toast.success('Currency updated!');
            }}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>
                {c.symbol} {c.code} — {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* ── Categories ── */}
        <div className="card card-flat settings-section settings-full">
          <h3 className="settings-section-title">🗂️ Categories</h3>

          {/* Add new */}
          <form onSubmit={handleAddCategory} className="add-cat-form">
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label">Category Name</label>
              <input
                id="new-cat-name"
                type="text" className={`form-input ${catError ? 'error' : ''}`}
                placeholder="e.g. Subscriptions"
                value={newCat.name}
                maxLength={30}
                onChange={e => { setNewCat(p => ({ ...p, name: e.target.value })); setCatError(''); }}
              />
              {catError && <p className="form-error">{catError}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Icon</label>
              <select className="form-select" value={newCat.icon} onChange={e => setNewCat(p => ({ ...p, icon: e.target.value }))}>
                {PRESET_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Color</label>
              <div className="color-picker">
                {PRESET_COLORS.map(col => (
                  <button
                    key={col} type="button"
                    className={`color-dot ${newCat.color === col ? 'selected' : ''}`}
                    style={{ background: col }}
                    onClick={() => setNewCat(p => ({ ...p, color: col }))}
                  />
                ))}
              </div>
            </div>

            <button id="add-cat-btn" type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}
              disabled={addCatMut.isPending}>
              {addCatMut.isPending ? <span className="spinner" /> : '+ Add'}
            </button>
          </form>

          {/* List */}
          {catsLoading ? (
            <div className="spinner" style={{ margin: '20px auto' }} />
          ) : (
            <div className="cat-list">
              {categories?.map(cat => (
                <div key={cat.id} className="cat-item">
                  <div className="cat-left">
                    <span style={{ fontSize: '1.3rem' }}>{cat.icon}</span>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                    <span className="cat-name">{cat.name}</span>
                    {cat.is_default === 1 && (
                      <span className="badge" style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--primary)', fontSize: 10 }}>Default</span>
                    )}
                  </div>
                  {cat.is_default === 0 && (
                    <button
                      className="btn btn-ghost btn-sm btn-icon"
                      style={{ color: 'var(--danger)' }}
                      onClick={() => delCatMut.mutate(cat.id)}
                      disabled={delCatMut.isPending}
                      title="Delete category"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Expense Templates ── */}
        <div className="card card-flat settings-section settings-full">
          <h3 className="settings-section-title">⚡ Expense Templates</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
            Save recurring expenses as templates for one-click logging from the Expenses page.
          </p>

          {/* Add form */}
          <form onSubmit={handleAddTemplate} className="add-tpl-form">
            <div className="form-group" style={{ flex: '1 1 160px' }}>
              <label className="form-label">Template Name</label>
              <input
                id="tpl-name"
                type="text" className={`form-input ${tplError && !newTpl.name ? 'error' : ''}`}
                placeholder="e.g. Netflix"
                value={newTpl.name} maxLength={40}
                onChange={e => { setNewTpl(p => ({ ...p, name: e.target.value })); setTplError(''); }}
              />
            </div>

            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label className="form-label">Default Description</label>
              <input
                id="tpl-description"
                type="text" className="form-input"
                placeholder="e.g. Monthly Netflix subscription"
                value={newTpl.description} maxLength={80}
                onChange={e => setNewTpl(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="form-group" style={{ flex: '0 1 130px' }}>
              <label className="form-label">Default Amount</label>
              <input
                id="tpl-amount"
                type="number" className="form-input"
                placeholder="0.00" min="0.01" step="0.01"
                value={newTpl.amount}
                onChange={e => setNewTpl(p => ({ ...p, amount: e.target.value }))}
              />
            </div>

            <div className="form-group" style={{ flex: '0 1 160px' }}>
              <label className="form-label">Category</label>
              <select
                id="tpl-category"
                className="form-select"
                value={newTpl.category_id}
                onChange={e => setNewTpl(p => ({ ...p, category_id: e.target.value }))}
              >
                <option value="">Select…</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>

            <div style={{ alignSelf: 'flex-end', paddingBottom: 0 }}>
              {tplError && <p className="form-error" style={{ marginBottom: 6 }}>{tplError}</p>}
              <button id="add-tpl-btn" type="submit" className="btn btn-primary" disabled={addTplMut.isPending}>
                {addTplMut.isPending ? <span className="spinner" /> : '+ Save Template'}
              </button>
            </div>
          </form>

          {/* Template list */}
          {tplLoading ? (
            <div className="spinner" style={{ margin: '20px auto' }} />
          ) : templates?.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              No templates yet. Add one above!
            </p>
          ) : (
            <div className="cat-list">
              {templates?.map(tpl => (
                <div key={tpl.id} className="cat-item">
                  <div className="cat-left">
                    <span style={{ fontSize: '1.2rem' }}>{tpl.category_icon}</span>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: tpl.category_color, flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div className="cat-name">{tpl.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tpl.description} · {user?.currency || 'INR'} {Number(tpl.amount).toLocaleString()}
                      </div>
                    </div>
                    <span className="badge" style={{ background: 'rgba(108,99,255,0.1)', color: 'var(--primary)', fontSize: 10, marginLeft: 4 }}>
                      {tpl.category_name}
                    </span>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm btn-icon"
                    style={{ color: 'var(--danger)', flexShrink: 0 }}
                    onClick={() => delTplMut.mutate(tpl.id)}
                    disabled={delTplMut.isPending}
                    title="Delete template"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Monthly Budgets ── */}
        <div className="card card-flat settings-section settings-full">
          <h3 className="settings-section-title">💰 Monthly Budgets</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20 }}>
            Set a monthly spending limit per category. You’ll be alerted when you’re getting close.
          </p>

          {/* Add / Edit form */}
          <form onSubmit={handleSaveBudget} className="add-tpl-form">
            <div className="form-group" style={{ flex: '1 1 180px' }}>
              <label className="form-label">Category</label>
              <select
                id="budget-category"
                className="form-select"
                value={newBudget.category_id}
                onChange={e => setNewBudget(p => ({ ...p, category_id: e.target.value }))}
              >
                <option value="">Select category…</option>
                {categories?.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: '0 1 160px' }}>
              <label className="form-label">Monthly Limit ({user?.currency || 'INR'})</label>
              <input
                id="budget-amount"
                type="number" className="form-input"
                placeholder="e.g. 5000" min="1" step="1"
                value={newBudget.amount}
                onChange={e => setNewBudget(p => ({ ...p, amount: e.target.value }))}
              />
            </div>

            <div style={{ alignSelf: 'flex-end' }}>
              {budgetError && <p className="form-error" style={{ marginBottom: 6 }}>{budgetError}</p>}
              <button id="save-budget-btn" type="submit" className="btn btn-primary" disabled={saveBudgetMut.isPending}>
                {saveBudgetMut.isPending ? <span className="spinner" /> : '💾 Save Budget'}
              </button>
            </div>
          </form>

          {/* Budget list */}
          {budgetsLoading ? (
            <div className="spinner" style={{ margin: '20px auto' }} />
          ) : !budgets?.length ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              No budgets set yet. Add one above!
            </p>
          ) : (
            <div className="budget-list">
              {budgets.map(b => {
                const spent = b.spent || 0;
                const { pct, color, label } = getBudgetStatus(spent, b.amount);
                return (
                  <div key={b.id} className="budget-item">
                    <div className="budget-item-top">
                      <div className="cat-left">
                        <span style={{ fontSize: '1.2rem' }}>{b.icon}</span>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
                        <span className="cat-name">{b.category_name}</span>
                        {pct >= 100 && (
                          <span className="badge" style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--danger)', fontSize: 10 }}>Over budget</span>
                        )}
                        {pct >= 80 && pct < 100 && (
                          <span className="badge" style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--warning)', fontSize: 10 }}>Near limit</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {user?.currency} {spent.toLocaleString()} / {Number(b.amount).toLocaleString()}
                        </span>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          style={{ color: 'var(--primary)' }}
                          onClick={() => setNewBudget({ category_id: String(b.category_id), amount: String(b.amount) })}
                          title="Edit budget"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn btn-ghost btn-sm btn-icon"
                          style={{ color: 'var(--danger)' }}
                          onClick={() => delBudgetMut.mutate(b.category_id)}
                          disabled={delBudgetMut.isPending}
                          title="Remove budget"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div className="budget-bar-track">
                      <div
                        className="budget-bar-fill"
                        style={{ width: `${pct}%`, background: color }}
                        title={label}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Danger Zone ── */}
        <div className="card card-flat settings-section settings-full" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <h3 className="settings-section-title" style={{ color: 'var(--danger)' }}>⚠️ Account</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600 }}>Sign Out</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sign out from all sessions</div>
            </div>
            <button
              className="btn btn-danger"
              onClick={async () => { await logout(); window.location.href = '/login'; }}
            >
              🚪 Sign Out
            </button>
          </div>
          <div style={{ height: '1px', background: 'var(--border)', margin: '16px 0' }} />
          {/* // button for deleting account completely */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600 }}>Delete Account</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Delete your account completely</div>
            </div>
            <button
              className="btn btn-danger"
              onClick={async () => {
                if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
                await api.delete('/auth/account');
                toast.success('Account deleted successfully');
                logout();
                window.location.href = '/login';
              }}
            >
              ❌ Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
