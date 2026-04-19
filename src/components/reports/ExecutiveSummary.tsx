import { motion } from 'framer-motion';
import { FileText, AlertTriangle, Download } from 'lucide-react';
import type { ReportSummary } from '@/types/report';

interface Props {
  summary: ReportSummary;
  onExport: () => void;
}

export const ExecutiveSummary = ({ summary, onExport }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Executive Summary</h3>
          <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-mono text-secondary-foreground">
            {summary.dateRange}
          </span>
        </div>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export Report
        </button>
      </div>

      <div className="p-4 space-y-4">
        <p className="text-sm leading-relaxed text-foreground/85">{summary.executiveSummary}</p>

        <div className="rounded-lg border border-border bg-secondary/20 p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Top Threats</span>
          </div>
          <div className="space-y-1.5">
            {summary.topThreats.map((threat, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded bg-destructive/10 text-[9px] font-bold text-destructive">
                  {i + 1}
                </span>
                {threat}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Resolved', value: summary.resolved, color: 'text-success' },
            { label: 'Escalated', value: summary.escalated, color: 'text-warning' },
            { label: 'False Positives', value: summary.falsePositives, color: 'text-muted-foreground' },
            { label: 'Hours Saved', value: `${summary.analystHoursSaved}h`, color: 'text-primary' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-md border border-border bg-background/50 px-3 py-2 text-center">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
