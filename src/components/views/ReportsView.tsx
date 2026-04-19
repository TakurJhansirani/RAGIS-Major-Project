import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ReportKPIGrid } from '@/components/reports/ReportKPIGrid';
import { ReportTrendChart } from '@/components/reports/ReportTrendChart';
import { SeverityBreakdownChart } from '@/components/reports/SeverityBreakdownChart';
import { CategoryTable } from '@/components/reports/CategoryTable';
import { ExecutiveSummary } from '@/components/reports/ExecutiveSummary';
import { useIncidents } from '@/hooks/useIncidents';
import {
  type KPIMetric,
  type SeverityBreakdown,
  type CategoryBreakdown,
  type WeeklyTrendPoint,
  type ReportSummary,
  type ReportPeriod,
} from '@/types/report';

const periods: { id: ReportPeriod; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export const ReportsView = () => {
  const { data: incidents = [] } = useIncidents();
  const [period, setPeriod] = useState<ReportPeriod>('weekly');

  const reportData = useMemo(() => {
    const now = new Date();

    const normalizeDate = (value: string | undefined) => {
      if (!value) return new Date(0);
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
    };

    const withCreatedAt = (incidents as any[]).map((incident) => ({
      ...incident,
      _createdAt: normalizeDate(incident.created_at),
      _updatedAt: normalizeDate(incident.updated_at),
    }));

    const sliceByDays = (days: number, offsetDays = 0) => {
      const end = new Date(now.getTime() - offsetDays * 24 * 60 * 60 * 1000);
      const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
      return withCreatedAt.filter((incident) => incident._createdAt >= start && incident._createdAt <= end);
    };

    const selectedDays = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    const current = sliceByDays(selectedDays, 0);
    const previous = sliceByDays(selectedDays, selectedDays);

    const avg = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);

    const getMttr = (items: any[]) => {
      const mins = items.map((incident) => {
        if (incident.status === 'resolved' && incident._updatedAt > incident._createdAt) {
          return Math.max(1, (incident._updatedAt.getTime() - incident._createdAt.getTime()) / 60000);
        }
        const risk = Number(incident.risk_score ?? 0);
        return risk > 0 ? Math.max(5, risk * 3) : 30;
      });
      return Number(avg(mins).toFixed(1));
    };

    const countResolved = (items: any[]) => items.filter((incident) => incident.status === 'resolved').length;
    const countEscalated = (items: any[]) => items.filter((incident) => incident.status === 'escalated').length;
    const countFalsePositive = (items: any[]) => items.filter((incident) => Boolean(incident.is_false_positive)).length;
    const aiAccuracy = (items: any[]) => Number(avg(items.map((incident) => Number(incident.confidence_score ?? 0))).toFixed(1));

    const currentTotal = current.length;
    const previousTotal = previous.length;
    const currentMttr = getMttr(current);
    const previousMttr = getMttr(previous);
    const currentFpRate = currentTotal > 0 ? Number(((countFalsePositive(current) / currentTotal) * 100).toFixed(1)) : 0;
    const previousFpRate = previousTotal > 0 ? Number(((countFalsePositive(previous) / previousTotal) * 100).toFixed(1)) : 0;
    const currentAiAccuracy = aiAccuracy(current);
    const previousAiAccuracy = aiAccuracy(previous);
    const currentEscalations = countEscalated(current);
    const previousEscalations = countEscalated(previous);
    const currentHoursSaved = Number((countFalsePositive(current) * 0.5).toFixed(1));
    const previousHoursSaved = Number((countFalsePositive(previous) * 0.5).toFixed(1));

    const trend = (value: number, previousValue: number): 'up' | 'down' | 'flat' => {
      if (value > previousValue) return 'up';
      if (value < previousValue) return 'down';
      return 'flat';
    };

    const kpiMetrics: KPIMetric[] = [
      { label: 'Total Incidents', value: currentTotal, previousValue: previousTotal, unit: '', trend: trend(currentTotal, previousTotal), trendIsGood: true },
      { label: 'Mean Time to Resolve', value: currentMttr, previousValue: previousMttr, unit: 'min', trend: trend(currentMttr, previousMttr), trendIsGood: true },
      { label: 'False Positive Rate', value: currentFpRate, previousValue: previousFpRate, unit: '%', trend: trend(currentFpRate, previousFpRate), trendIsGood: true },
      { label: 'AI Accuracy', value: currentAiAccuracy, previousValue: previousAiAccuracy, unit: '%', trend: trend(currentAiAccuracy, previousAiAccuracy), trendIsGood: true },
      { label: 'Escalations', value: currentEscalations, previousValue: previousEscalations, unit: '', trend: trend(currentEscalations, previousEscalations), trendIsGood: true },
      { label: 'Analyst Hours Saved', value: currentHoursSaved, previousValue: previousHoursSaved, unit: 'hrs', trend: trend(currentHoursSaved, previousHoursSaved), trendIsGood: true },
    ];

    const severityKeys = ['critical', 'high', 'medium', 'low', 'info'];
    const toLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
    const severityBreakdown: SeverityBreakdown[] = severityKeys.map((severity) => {
      const count = current.filter((incident) => String(incident.severity ?? '').toLowerCase() === severity).length;
      const percentage = currentTotal > 0 ? Number(((count / currentTotal) * 100).toFixed(1)) : 0;
      return { severity: toLabel(severity), count, percentage };
    });

    const categories = new Map<string, any[]>();
    current.forEach((incident) => {
      const category = String(incident.category || 'uncategorized').replace(/-/g, ' ');
      if (!categories.has(category)) categories.set(category, []);
      categories.get(category)!.push(incident);
    });

    const categoryBreakdown: CategoryBreakdown[] = Array.from(categories.entries())
      .map(([category, items]) => {
        const resolved = items.filter((incident) => incident.status === 'resolved').length;
        const avgResponseMin = Number(
          avg(
            items.map((incident) => {
              if (incident._updatedAt > incident._createdAt) {
                return Math.max(1, (incident._updatedAt.getTime() - incident._createdAt.getTime()) / 60000);
              }
              return 30;
            })
          ).toFixed(1)
        );

        return {
          category,
          count: items.length,
          resolved,
          avgResponseMin,
        };
      })
      .sort((a, b) => b.count - a.count);

    const trendData: WeeklyTrendPoint[] =
      period === 'monthly'
        ? Array.from({ length: 4 }).map((_, idx) => {
            const weekOffset = 3 - idx;
            const weekItems = sliceByDays(7, weekOffset * 7);
            return {
              date: `Week ${idx + 1}`,
              incidents: weekItems.length,
              resolved: countResolved(weekItems),
              falsePositives: countFalsePositive(weekItems),
              mttr: getMttr(weekItems),
            };
          })
        : Array.from({ length: 7 }).map((_, idx) => {
            const day = new Date(now);
            day.setDate(now.getDate() - (6 - idx));
            const start = new Date(day);
            start.setHours(0, 0, 0, 0);
            const end = new Date(day);
            end.setHours(23, 59, 59, 999);
            const dayItems = withCreatedAt.filter((incident) => incident._createdAt >= start && incident._createdAt <= end);

            return {
              date: day.toLocaleDateString(undefined, { weekday: 'short' }),
              incidents: dayItems.length,
              resolved: countResolved(dayItems),
              falsePositives: countFalsePositive(dayItems),
              mttr: getMttr(dayItems),
            };
          });

    const topThreats = categoryBreakdown.slice(0, 3).map((row) => `${toLabel(row.category)} activity`);

    const reportSummary: ReportSummary = {
      period,
      dateRange:
        period === 'daily'
          ? now.toLocaleDateString()
          : period === 'weekly'
            ? `${new Date(now.getTime() - 6 * 86400000).toLocaleDateString()} - ${now.toLocaleDateString()}`
            : `${new Date(now.getTime() - 29 * 86400000).toLocaleDateString()} - ${now.toLocaleDateString()}`,
      generatedAt: now.toISOString(),
      totalIncidents: currentTotal,
      resolved: countResolved(current),
      escalated: currentEscalations,
      falsePositives: countFalsePositive(current),
      mttr: Number(currentMttr.toFixed(1)),
      aiAccuracy: currentAiAccuracy,
      analystHoursSaved: currentHoursSaved,
      topThreats,
      executiveSummary:
        currentTotal === 0
          ? 'No incidents were detected in this reporting window. Continue monitoring and validate sensor coverage across integrations.'
          : `Detected ${currentTotal} incidents in this ${period} window, with ${countResolved(current)} resolved and ${currentEscalations} escalated. AI confidence averaged ${currentAiAccuracy}% and estimated analyst time saved was ${currentHoursSaved} hours through false-positive reduction and triage acceleration.`,
    };

    return {
      kpiMetrics,
      severityBreakdown,
      categoryBreakdown,
      trendData,
      reportSummary,
    };
  }, [incidents, period]);

  const trendData = reportData.trendData;
  const trendTitle = period === 'monthly' ? 'Monthly Incident Trend' : period === 'weekly' ? 'Weekly Incident Trend' : 'Daily Incident Trend';

  const handleExport = () => {
    const summary = reportData.reportSummary;
    const severity = reportData.severityBreakdown;
    const categories = reportData.categoryBreakdown;
    const kpis = reportData.kpiMetrics;

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
    <div className="space-y-4 sm:space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Automated Reports
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            AI-generated SOC reports with KPI trends, incident analytics, and actionable insights.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 self-start">
          {periods.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-2 sm:py-1.5 text-xs font-medium transition-all',
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
        <ReportKPIGrid metrics={reportData.kpiMetrics} />

        {/* Executive Summary */}
        <ExecutiveSummary summary={reportData.reportSummary} onExport={handleExport} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <ReportTrendChart data={trendData} title={trendTitle} />
          </div>
          <div>
            <SeverityBreakdownChart data={reportData.severityBreakdown} />
          </div>
        </div>

        {/* Category Table */}
        <CategoryTable data={reportData.categoryBreakdown} />
      </motion.div>
    </div>
  );
};
