import { useState } from 'react';
import { Shield, AlertTriangle, Clock, TrendingDown, CheckCircle, ArrowUpRight, Users, Activity } from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { IncidentFeed } from '@/components/dashboard/IncidentFeed';
import { IncidentDetail } from '@/components/dashboard/IncidentDetail';
import { AlertTrendChart } from '@/components/dashboard/AlertTrendChart';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { dashboardMetrics, incidents } from '@/data/mockData';
import type { Incident } from '@/data/mockData';

export const DashboardView = () => {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard
          title="Total Incidents"
          value={dashboardMetrics.totalIncidents.toLocaleString()}
          subtitle="Last 30 days"
          icon={Shield}
          trend={{ value: 8.2, isUp: true }}
          delay={0}
        />
        <MetricCard
          title="Critical Alerts"
          value={dashboardMetrics.criticalAlerts}
          subtitle="Requires immediate action"
          icon={AlertTriangle}
          variant="critical"
          trend={{ value: 15, isUp: true }}
          delay={0.1}
        />
        <MetricCard
          title="MTTR"
          value={`${dashboardMetrics.mttr}m`}
          subtitle="Mean Time to Resolve"
          icon={Clock}
          variant="success"
          trend={{ value: 12, isUp: false }}
          delay={0.2}
        />
        <MetricCard
          title="False Positive Rate"
          value={`${dashboardMetrics.falsePositiveRate}%`}
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
            <p className="text-base sm:text-lg font-bold text-foreground">{dashboardMetrics.resolvedToday}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">Resolved Today</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
          <ArrowUpRight className="h-5 w-5 shrink-0 text-destructive" />
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-bold text-foreground">{dashboardMetrics.escalated}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">Escalated</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
          <Users className="h-5 w-5 shrink-0 text-info" />
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-bold text-foreground">{dashboardMetrics.activeAnalysts}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">Active Analysts</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 sm:p-4">
          <Activity className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-base sm:text-lg font-bold text-foreground">{dashboardMetrics.ingestionRate.toLocaleString()}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">Events/min</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <AlertTrendChart />
        </div>
        <div className="lg:col-span-2">
          <CategoryChart />
        </div>
      </div>

      {/* Incident Feed + Detail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <IncidentFeed
          incidents={incidents}
          onSelectIncident={setSelectedIncident}
          selectedId={selectedIncident?.id}
        />
        <IncidentDetail
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      </div>
    </div>
  );
};
