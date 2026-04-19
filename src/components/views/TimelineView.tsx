import { AttackTimeline } from '@/components/dashboard/AttackTimeline';
import { AlertTrendChart } from '@/components/dashboard/AlertTrendChart';
import { useIncidents } from '@/hooks/useIncidents';
import { buildAlertTrend, buildTimelineEvents } from '@/lib/incidentAnalytics';
import { WifiOff } from 'lucide-react';

export const TimelineView = () => {
  const { data: incidents = [], isError } = useIncidents();
  const timelineEvents = buildTimelineEvents(incidents, 16);
  const trendData = buildAlertTrend(incidents);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Attack Timeline</h1>
        <p className="text-sm text-muted-foreground">Chronological view of security events and attack progression.</p>
      </div>
      {isError && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
          <WifiOff className="h-3.5 w-3.5 shrink-0" />
          Backend unreachable - timeline data is unavailable.
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AttackTimeline events={timelineEvents} />
        <AlertTrendChart data={trendData} />
      </div>
    </div>
  );
};
