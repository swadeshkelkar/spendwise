import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatAmount } from '../utils/currency';
import FilterBar from '../components/expenses/FilterBar';
import PieChartFull from '../components/charts/PieChartFull';
import MonthlyBarChart from '../components/charts/MonthlyBarChart';
import './AnalyticsPage.css';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const currency = user?.currency || 'INR';
  const [filters, setFilters] = useState({ period: 'month' });

  const { data: summary, isLoading } = useQuery({
    queryKey: ['summary', filters],
    queryFn: () => api.get('/expenses/summary', { params: filters }).then(r => r.data),
  });

  const total = summary?.totals?.total || 0;
  const count = summary?.totals?.count || 0;

  return (
    <div className="analytics-page page-fade">
      <div style={{ marginBottom: 20 }}>
        <h2>Analytics</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Visualize your spending patterns</p>
      </div>

      <FilterBar filters={filters} onChange={setFilters} hideSearch />

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : (
        <>
          {/* ── Summary Row ── */}
          <div className="grid-3" style={{ margin: '20px 0' }}>
            <div className="stat-card">
              <span className="stat-label">Total Spend</span>
              <span className="stat-value" style={{ fontSize: '1.6rem', background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {formatAmount(total, currency)}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Transactions</span>
              <span className="stat-value" style={{ fontSize: '1.6rem' }}>{count}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Average per Transaction</span>
              <span className="stat-value" style={{ fontSize: '1.6rem' }}>
                {formatAmount(count > 0 ? total / count : 0, currency)}
              </span>
            </div>
          </div>

          {/* ── Charts ── */}
          <div className="analytics-charts">
            <div className="card card-flat">
              <h3 style={{ marginBottom: 20 }}>Spending by Category</h3>
              {summary?.byCategory?.length ? (
                <PieChartFull data={summary.byCategory} currency={currency} />
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <h3>No data yet</h3>
                  <p>Add some expenses to see your spending breakdown</p>
                </div>
              )}
            </div>

            <div className="card card-flat">
              <h3 style={{ marginBottom: 20 }}>Monthly Trend (Last 12 months)</h3>
              {summary?.monthly?.length ? (
                <MonthlyBarChart data={summary.monthly} currency={currency} />
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📈</div>
                  <h3>No trend data</h3>
                  <p>Your monthly chart will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* ── Category Breakdown Table ── */}
          {summary?.byCategory?.length > 0 && (
            <div className="card card-flat" style={{ marginTop: 24 }}>
              <h3 style={{ marginBottom: 16 }}>Category Breakdown</h3>
              <div className="breakdown-table">
                {summary.byCategory.map(cat => (
                  <div key={cat.name} className="breakdown-row">
                    <div className="breakdown-left">
                      <span className="breakdown-icon">{cat.icon}</span>
                      <div>
                        <div className="breakdown-name">{cat.name}</div>
                        <div className="breakdown-count">{cat.count} transaction{cat.count > 1 ? 's' : ''}</div>
                      </div>
                    </div>
                    <div className="breakdown-right">
                      <div className="breakdown-amount">{formatAmount(cat.total, currency)}</div>
                      <div className="breakdown-pct">{total > 0 ? ((cat.total / total) * 100).toFixed(1) : 0}%</div>
                    </div>
                    <div className="breakdown-bar-wrap">
                      <div
                        className="breakdown-bar-fill"
                        style={{
                          width: `${total > 0 ? (cat.total / total) * 100 : 0}%`,
                          background: cat.color || 'var(--primary)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
