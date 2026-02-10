import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ShieldAlert } from 'lucide-react';
import type { SeverityBreakdown } from '@/data/reportData';

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'hsl(var(--severity-critical))',
  High: 'hsl(var(--severity-high))',
  Medium: 'hsl(var(--severity-medium))',
  Low: 'hsl(var(--severity-low))',
  Info: 'hsl(var(--severity-info))',
};

interface Props {
  data: SeverityBreakdown[];
}

export const SeverityBreakdownChart = ({ data }: Props) => {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <ShieldAlert className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Severity Distribution</h3>
      </div>
      <div className="p-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="severity" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3} strokeWidth={0}>
              {data.map((entry) => (
                <Cell key={entry.severity} fill={SEVERITY_COLORS[entry.severity] || 'hsl(var(--muted))'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              formatter={(value: number, name: string) => [`${value} (${data.find(d => d.severity === name)?.percentage}%)`, name]}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
