import { AttackTimeline } from '@/components/dashboard/AttackTimeline';
import { AlertTrendChart } from '@/components/dashboard/AlertTrendChart';

export const TimelineView = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-foreground">Attack Timeline</h1>
        <p className="text-sm text-muted-foreground">Chronological view of security events and attack progression.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <AttackTimeline />
        <AlertTrendChart />
      </div>
    </div>
  );
};
