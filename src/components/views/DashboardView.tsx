import { useState } from 'react';
import { Shield, AlertTriangle, Clock, TrendingDown, CheckCircle, ArrowUpRight, Users, Activity, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { IncidentFeed } from '@/components/dashboard/IncidentFeed';
import { IncidentDetail } from '@/components/dashboard/IncidentDetail';
import { AlertTrendChart } from '@/components/dashboard/AlertTrendChart';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { useIncidents, useIncidentStats } from '@/hooks/useIncidents';
import {
  buildAlertTrend,
  buildCategoryDistribution,
  buildTimelineEvents,
  computeDashboardMetrics,
} from '@/lib/incidentAnalytics';

export const DashboardView = () => {
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const { data: incidents = [], isError: incidentsError } = useIncidents();
  const { data: stats, isError: statsError } = useIncidentStats();

  const metrics = computeDashboardMetrics(incidents, statsError ? undefined : stats);
  const trendData = buildAlertTrend(incidents);
  const categoryData = buildCategoryDistribution(incidents);
  const timelineEvents = buildTimelineEvents(incidents, 12);

  const previousHalf = timelineEvents.slice(0, Math.floor(timelineEvents.length / 2));
  const latestHalf = timelineEvents.slice(Math.floor(timelineEvents.length / 2));
  const compareWindows = (current: number, previous: number) => {
    if (previous <= 0) {
      return 0;
    }
    return Number((((current - previous) / previous) * 100).toFixed(1));
  };
  const latestCritical = latestHalf.filter((item) => item.severity === 'critical').length;
  const previousCritical = previousHalf.filter((item) => item.severity === 'critical').length;
  const incidentTrend = compareWindows(latestHalf.length, previousHalf.length);
  const criticalTrend = compareWindows(latestCritical, previousCritical);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {incidentsError && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          Backend unreachable - live incident data is currently unavailable.
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          title="Total Incidents"
          value={metrics.totalIncidents.toLocaleString()}
          subtitle="Last 30 days"
          icon={Shield}
          trend={{ value: Math.abs(incidentTrend), isUp: incidentTrend > 0 }}
          delay={0}
        />
        <MetricCard
          title="Critical Alerts"
          value={metrics.criticalAlerts}
          subtitle="Requires immediate action"
          icon={AlertTriangle}
          variant="critical"
          trend={{ value: Math.abs(criticalTrend), isUp: criticalTrend > 0 }}
          delay={0.1}
        />
        <MetricCard
          title="MTTR"
          value={`${metrics.mttr}m`}
          subtitle="Mean Time to Resolve"
          icon={Clock}
          variant="success"
          trend={{ value: 12, isUp: false }}
          delay={0.2}
        />
        <MetricCard
          title="False Positive Rate"
          value={`${metrics.falsePositiveRate}%`}
          subtitle="AI-filtered alerts"
          icon={TrendingDown}
          variant="warning"
          trend={{ value: 3.1, isUp: false }}
          delay={0.3}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
          <CheckCircle className="h-5 w-5 shrink-0 text-success" />
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-bold text-foreground">{metrics.resolvedToday}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">Resolved Today</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
          <ArrowUpRight className="h-5 w-5 shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-bold text-foreground">{metrics.escalated}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">Escalated</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
          <Users className="h-5 w-5 shrink-0 text-info" />
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-bold text-foreground">{metrics.activeAnalysts}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">Active Analysts</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
          <Activity className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-bold text-foreground">{metrics.ingestionRate.toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">Events/min</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <AlertTrendChart data={trendData} />
        </div>
        <div className="lg:col-span-2">
          <CategoryChart data={categoryData} />
        </div>
      </div>

      {/* Incident Feed + Detail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <IncidentFeed
          incidents={incidents}
          onSelectIncident={setSelectedIncident}
          selectedId={selectedIncident?.incident_id ?? selectedIncident?.id}
        />
        {selectedIncident && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSelectedIncident(null)} />
        )}
        <div className={cn(
          'lg:block',
          selectedIncident
            ? 'fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto bg-background p-3 lg:relative lg:inset-auto lg:z-auto lg:p-0 lg:bg-transparent'
            : 'hidden lg:block'
        )}>
          <IncidentDetail
            incident={selectedIncident}
            onClose={() => setSelectedIncident(null)}
          />
        </div>
      </div>
    </div>
  );
};
