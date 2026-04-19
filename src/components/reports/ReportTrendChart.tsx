import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { WeeklyTrendPoint } from '@/types/report';

interface ReportTrendChartProps {
  data: WeeklyTrendPoint[];
  title: string;
}

export const ReportTrendChart = ({ data, title }: ReportTrendChartProps) => {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      </div>
      <div className="p-4 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '11px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Area type="monotone" dataKey="incidents" name="Incidents" stroke="hsl(var(--primary))" fill="url(#incGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="resolved" name="Resolved" stroke="hsl(var(--success))" fill="url(#resGrad)" strokeWidth={2} />
            <Area type="monotone" dataKey="falsePositives" name="False Positives" stroke="hsl(var(--warning))" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
