import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatAmount } from '../../utils/currency';

const FALLBACK_COLORS = ['#6C63FF','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899','#8B5CF6','#06B6D4'];

const CustomTooltip = ({ active, payload, currency }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div style={{ background: '#1E1E35', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>{d.icon} {d.name}</div>
        <div style={{ color: '#94A3B8', fontSize: 13 }}>{formatAmount(d.total, currency)}</div>
        <div style={{ color: '#94A3B8', fontSize: 12 }}>{d.count} transaction{d.count > 1 ? 's' : ''}</div>
      </div>
    );
  }
  return null;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {(percent * 100).toFixed(0)}%
    </text>
  );
};

export default function MiniPieChart({ data, currency }) {
  if (!data?.length) {
    return (
      <div className="empty-state" style={{ padding: '30px 20px' }}>
        <div className="empty-state-icon">🥧</div>
        <p>No data yet</p>
      </div>
    );
  }

  const chartData = data.map((d, i) => ({
    ...d,
    fill: d.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={chartData} cx="50%" cy="50%"
          innerRadius={55} outerRadius={90}
          dataKey="total" labelLine={false}
          label={renderCustomLabel}
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} stroke="none" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip currency={currency} />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
