import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryBreakdown } from '@/data/reportData';

interface Props {
  data: CategoryBreakdown[];
}

export const CategoryTable = ({ data }: Props) => {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border p-4">
        <Layers className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Incidents by Category</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-secondary/30">
              <th className="px-4 py-2.5 text-left font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wider">Count</th>
              <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wider">Resolved</th>
              <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wider">Resolution %</th>
              <th className="px-4 py-2.5 text-right font-semibold text-muted-foreground uppercase tracking-wider">Avg Response</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const resRate = ((row.resolved / row.count) * 100).toFixed(1);
              return (
                <motion.tr
                  key={row.category}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border/50 hover:bg-secondary/20 transition-colors"
                >
                  <td className="px-4 py-2.5 font-medium text-foreground">{row.category}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">{row.count}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-success">{row.resolved}</td>
                  <td className="px-4 py-2.5 text-right">
                    <span className={cn('font-mono font-semibold', Number(resRate) >= 90 ? 'text-success' : Number(resRate) >= 70 ? 'text-warning' : 'text-destructive')}>
                      {resRate}%
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono text-muted-foreground">{row.avgResponseMin}m</td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
