import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { format, parseISO } from 'date-fns';
import { formatAmountCompact } from '../../utils/currency';

const CustomTooltip = ({ active, payload, label, currency }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: '#1E1E35', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10, padding: '10px 14px' }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: '#94A3B8', fontSize: 13 }}>{label}</div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{formatAmountCompact(payload[0].value, currency)}</div>
      </div>
    );
  }
  return null;
};

export default function MonthlyBarChart({ data, currency }) {
  const chartData = data.map(d => ({
    month: format(parseISO(`${d.month}-01`), 'MMM yy'),
    total: d.total,
  }));

  const maxVal = Math.max(...chartData.map(d => d.total));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fill: '#94A3B8', fontSize: 12 }}
          axisLine={false} tickLine={false}
        />
        <YAxis
          tickFormatter={v => formatAmountCompact(v, currency)}
          tick={{ fill: '#94A3B8', fontSize: 11 }}
          axisLine={false} tickLine={false} width={60}
        />
        <Tooltip content={<CustomTooltip currency={currency} />} cursor={{ fill: 'rgba(108,99,255,0.06)' }} />
        <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={50}>
          {chartData.map((entry, i) => (
            <Cell
              key={i}
              fill={entry.total === maxVal ? 'url(#barGrad)' : 'rgba(108,99,255,0.5)'}
            />
          ))}
        </Bar>
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6C63FF" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
