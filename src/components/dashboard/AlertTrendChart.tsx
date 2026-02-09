import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { alertTrend } from '@/data/mockData';

export const AlertTrendChart = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
        Alert Trend — 24h
      </h2>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={alertTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradCritical" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--severity-critical))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--severity-critical))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradHigh" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--severity-high))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--severity-high))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradMedium" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--severity-medium))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--severity-medium))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'hsl(var(--foreground))',
              }}
            />
            <Area
              type="monotone"
              dataKey="critical"
              stackId="1"
              stroke="hsl(var(--severity-critical))"
              fill="url(#gradCritical)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="high"
              stackId="1"
              stroke="hsl(var(--severity-high))"
              fill="url(#gradHigh)"
              strokeWidth={1.5}
            />
            <Area
              type="monotone"
              dataKey="medium"
              stackId="1"
              stroke="hsl(var(--severity-medium))"
              fill="url(#gradMedium)"
              strokeWidth={1}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
