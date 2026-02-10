import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReportKPIGrid } from '@/components/reports/ReportKPIGrid';
import { ReportTrendChart } from '@/components/reports/ReportTrendChart';
import { SeverityBreakdownChart } from '@/components/reports/SeverityBreakdownChart';
import { CategoryTable } from '@/components/reports/CategoryTable';
import { ExecutiveSummary } from '@/components/reports/ExecutiveSummary';
import {
  kpiMetrics,
  severityBreakdowns,
  categoryBreakdowns,
  weeklyTrends,
  monthlyTrends,
  reportSummaries,
  type ReportPeriod,
} from '@/data/reportData';

const periods: { id: ReportPeriod; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export const ReportsView = () => {
  const [period, setPeriod] = useState<ReportPeriod>('weekly');

  const trendData = period === 'monthly' ? monthlyTrends : weeklyTrends;
  const trendTitle = period === 'monthly' ? 'Monthly Incident Trend' : period === 'weekly' ? 'Weekly Incident Trend' : 'Daily Incident Trend';

  const handleExport = () => {
    const summary = reportSummaries[period];
    const severity = severityBreakdowns[period];
    const categories = categoryBreakdowns[period];
    const kpis = kpiMetrics[period];

    const lines = [
      `RAGIS SOC Report — ${summary.dateRange}`,
      `Generated: ${new Date(summary.generatedAt).toLocaleString()}`,
      `Period: ${period.toUpperCase()}`,
      '',
      '═══ EXECUTIVE SUMMARY ═══',
      summary.executiveSummary,
      '',
      '═══ TOP THREATS ═══',
      ...summary.topThreats.map((t, i) => `  ${i + 1}. ${t}`),
      '',
      '═══ KEY PERFORMANCE INDICATORS ═══',
      ...kpis.map((k) => `  ${k.label}: ${k.value}${k.unit} (prev: ${k.previousValue}${k.unit})`),
      '',
      '═══ SEVERITY BREAKDOWN ═══',
      ...severity.map((s) => `  ${s.severity}: ${s.count} (${s.percentage}%)`),
      '',
      '═══ CATEGORY BREAKDOWN ═══',
      '  Category | Count | Resolved | Resolution% | Avg Response',
      ...categories.map((c) => `  ${c.category} | ${c.count} | ${c.resolved} | ${((c.resolved / c.count) * 100).toFixed(1)}% | ${c.avgResponseMin}m`),
      '',
      '═══ SUMMARY STATS ═══',
      `  Total Incidents: ${summary.totalIncidents}`,
      `  Resolved: ${summary.resolved}`,
      `  Escalated: ${summary.escalated}`,
      `  False Positives: ${summary.falsePositives}`,
      `  MTTR: ${summary.mttr} min`,
      `  AI Accuracy: ${summary.aiAccuracy}%`,
      `  Analyst Hours Saved: ${summary.analystHoursSaved}`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RAGIS_SOC_Report_${period}_${summary.dateRange.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Automated Reports
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            AI-generated SOC reports with KPI trends, incident analytics, and actionable insights.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                period === p.id
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground border border-transparent'
              )}
            >
              <Calendar className="h-3 w-3" />
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <motion.div
        key={period}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-5"
      >
        {/* KPIs */}
        <ReportKPIGrid metrics={kpiMetrics[period]} />

        {/* Executive Summary */}
        <ExecutiveSummary summary={reportSummaries[period]} onExport={handleExport} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ReportTrendChart data={trendData} title={trendTitle} />
          </div>
          <div>
            <SeverityBreakdownChart data={severityBreakdowns[period]} />
          </div>
        </div>

        {/* Category Table */}
        <CategoryTable data={categoryBreakdowns[period]} />
      </motion.div>
    </div>
  );
};
