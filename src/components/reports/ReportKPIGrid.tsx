import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KPIMetric } from '@/data/reportData';

interface ReportKPIGridProps {
  metrics: KPIMetric[];
}

export const ReportKPIGrid = ({ metrics }: ReportKPIGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {metrics.map((m, i) => {
        const delta = m.value - m.previousValue;
        const deltaPercent = m.previousValue !== 0 ? ((delta / m.previousValue) * 100).toFixed(1) : '0';
        const isGood = (m.trend === 'up' && m.trendIsGood) || (m.trend === 'down' && m.trendIsGood);

        return (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-lg border border-border bg-card p-3.5"
          >
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">{m.label}</p>
            <p className="text-xl font-bold font-mono text-foreground">
              {m.value}{m.unit && <span className="text-xs text-muted-foreground ml-0.5">{m.unit}</span>}
            </p>
            <div className={cn('flex items-center gap-1 mt-1.5 text-[10px] font-medium',
              isGood ? 'text-success' : m.trend === 'flat' ? 'text-muted-foreground' : 'text-destructive'
            )}>
              {m.trend === 'up' ? <TrendingUp className="h-3 w-3" /> : m.trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
              <span>{Math.abs(Number(deltaPercent))}% vs prior</span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};
