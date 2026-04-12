import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatAmount, formatAmountCompact } from '../utils/currency';
import AddExpenseModal from '../components/expenses/AddExpenseModal';
import ExpenseList from '../components/expenses/ExpenseList';
import MiniPieChart from '../components/charts/MiniPieChart';
import BudgetWidget from '../components/widgets/BudgetWidget';
import './DashboardPage.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const currency = user?.currency || 'INR';

  const { data: summary, refetch: refetchSummary } = useQuery({
    queryKey: ['summary', 'month'],
    queryFn: () => api.get('/expenses/summary?period=month').then(r => r.data),
  });

  const { data: recentData, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses', 'recent'],
    queryFn: () => api.get('/expenses?limit=5&period=month').then(r => r.data),
  });

  const refetch = () => { refetchSummary(); refetchExpenses(); };

  const total  = summary?.totals?.total || 0;
  const count  = summary?.totals?.count || 0;
  const avgDay = count > 0 ? total / new Date().getDate() : 0;
  const topCat = summary?.byCategory?.[0];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="dashboard page-fade">
      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-greeting">{greeting()}, {user?.name?.split(' ')[0]}! 👋</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Here's your spending overview for this month</p>
        </div>
        <button id="add-expense-btn" className="btn btn-primary" onClick={() => setShowAdd(true)}>
          + Add Expense
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        <div className="stat-card">
          <span className="stat-label">This Month</span>
          <span className="stat-value" style={{ background: 'var(--grad-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {formatAmountCompact(total, currency)}
          </span>
          <span className="stat-sub">{count} transactions</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Daily Average</span>
          <span className="stat-value">{formatAmountCompact(avgDay, currency)}</span>
          <span className="stat-sub">per day</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Top Category</span>
          <span className="stat-value" style={{ fontSize: '1.3rem' }}>
            {topCat ? `${topCat.icon} ${topCat.name}` : '—'}
          </span>
          <span className="stat-sub">{topCat ? formatAmount(topCat.total, currency) : 'No data'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Transactions</span>
          <span className="stat-value">{count}</span>
          <span className="stat-sub">this month</span>
        </div>
      </div>

      {/* ── Charts + Recent ── */}
      <div className="dashboard-bottom">
        <div className="dashboard-main">
          <div className="card card-flat">
            <h3 style={{ marginBottom: 20 }}>Recent Expenses</h3>
            <ExpenseList
              expenses={recentData?.expenses || []}
              currency={currency}
              onDelete={refetch}
              compact
            />
            {count > 5 && (
              <a href="/expenses" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--primary)' }}>
                View all {count} expenses →
              </a>
            )}
          </div>
        </div>

        <div className="dashboard-side">
          <div className="card card-flat" style={{ marginBottom: 20 }}>
            <h3 style={{ marginBottom: 4 }}>Spending by Category</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>This month</p>
            <MiniPieChart data={summary?.byCategory || []} currency={currency} />
          </div>

          <BudgetWidget currency={currency} />
        </div>
      </div>

      {showAdd && (
        <AddExpenseModal onClose={() => setShowAdd(false)} onSuccess={refetch} />
      )}
    </div>
  );
}
