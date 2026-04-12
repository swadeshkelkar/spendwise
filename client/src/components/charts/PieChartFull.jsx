import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatAmount } from '../../utils/currency';

const FALLBACK_COLORS = ['#6C63FF','#3B82F6','#10B981','#F59E0B','#EF4444','#EC4899','#8B5CF6','#06B6D4'];

const CustomTooltip = ({ active, payload, currency }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div style={{ background: '#1E1E35', border: '1px solid rgba(108,99,255,0.3)', borderRadius: 10, padding: '10px 14px', minWidth: 160 }}>
        <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', gap: 6 }}>{d.icon} {d.name}</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{formatAmount(d.total, currency)}</div>
        <div style={{ color: '#94A3B8', fontSize: 12 }}>{d.count} transaction{d.count > 1 ? 's' : ''}</div>
      </div>
    );
  }
  return null;
};

const renderLegend = (props) => {
  const { payload } = props;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', justifyContent: 'center', marginTop: 12 }}>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color, display: 'inline-block' }} />
          <span>{entry.payload.icon} {entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function PieChartFull({ data, currency }) {
  const chartData = data.map((d, i) => ({
    ...d,
    fill: d.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length],
    name: d.name,
  }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <PieChart>
        <Pie
          data={chartData} cx="50%" cy="45%"
          innerRadius={70} outerRadius={120}
          dataKey="total" paddingAngle={2}
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={entry.fill} stroke="none" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip currency={currency} />} />
        <Legend content={renderLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
}
