import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import './FilterBar.css';

const PERIODS = [
  { label: 'All',        value: '' },
  { label: 'This Week',  value: 'week' },
  { label: 'This Month', value: 'month' },
  { label: 'This Year',  value: 'year' },
  { label: 'Custom',     value: 'custom' },
];

export default function FilterBar({ filters, onChange, hideSearch }) {
  const [showCustom, setShowCustom] = useState(filters.period === 'custom');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  });

  const set = (key, value) => onChange({ ...filters, [key]: value });

  const handlePeriod = (val) => {
    if (val === 'custom') {
      setShowCustom(true);
      onChange({ ...filters, period: '', start_date: '', end_date: '' });
    } else {
      setShowCustom(false);
      onChange({ ...filters, period: val, start_date: '', end_date: '' });
    }
  };

  return (
    <div className="filter-bar">
      {/* Period tabs */}
      <div className="tabs filter-tabs">
        {PERIODS.map(p => (
          <button
            key={p.value}
            className={`tab ${(!showCustom && filters.period === p.value) || (showCustom && p.value === 'custom') ? 'active' : ''}`}
            onClick={() => handlePeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="filter-row">
        {/* Category filter */}
        <select
          id="filter-category"
          className="form-select filter-select"
          value={filters.category_id || ''}
          onChange={e => set('category_id', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories?.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>

        {/* Custom date range */}
        {showCustom && (
          <>
            <input
              id="filter-start-date"
              type="date" className="form-input filter-date"
              placeholder="From"
              value={filters.start_date || ''}
              onChange={e => set('start_date', e.target.value)}
            />
            <input
              id="filter-end-date"
              type="date" className="form-input filter-date"
              placeholder="To"
              value={filters.end_date || ''}
              onChange={e => set('end_date', e.target.value)}
            />
          </>
        )}

        {/* Clear */}
        {(filters.category_id || filters.start_date || filters.period) && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => { setShowCustom(false); onChange({ period: '', category_id: '', start_date: '', end_date: '' }); }}
          >
            ✕ Clear
          </button>
        )}
      </div>
    </div>
  );
}
