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
  const [newCat, setNewCat]   = useState({ name: '', icon: '📦', color: '#6C63FF' });
  const [catError, setCatError] = useState('');

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

  const PRESET_ICONS = ['🍔','✈️','📄','📈','💳','🍻','🛒','🏥','🎮','📚','🏠','🚗','💪','🎵','💡','🐾'];
  const PRESET_COLORS = ['#6C63FF','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899','#8B5CF6','#06B6D4'];

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

        {/* ── Danger Zone ── */}
        <div className="card card-flat settings-section settings-full" style={{ borderColor: 'rgba(239,68,68,0.2)' }}>
          <h3 className="settings-section-title" style={{ color: 'var(--danger)' }}>⚠️ Account</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontWeight: 600 }}>Sign out</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sign out from all sessions</div>
            </div>
            <button
              className="btn btn-danger"
              onClick={async () => { await logout(); window.location.href = '/login'; }}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
