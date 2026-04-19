import { motion } from 'framer-motion';
import { SeverityBadge } from './SeverityBadge';
import { cn } from '@/lib/utils';
import type { TimelinePoint } from '@/lib/incidentAnalytics';

type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

const dotColors: Record<Severity, string> = {
  critical: 'bg-severity-critical',
  high: 'bg-severity-high',
  medium: 'bg-severity-medium',
  low: 'bg-severity-low',
  info: 'bg-severity-info',
};

interface AttackTimelineProps {
  events: TimelinePoint[];
}

export const AttackTimeline = ({ events }: AttackTimelineProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-5"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-5">
        Attack Timeline — Today
      </h2>
      <div className="relative space-y-0">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

        {events.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            className="relative flex items-start gap-4 pb-5 last:pb-0"
          >
            {/* Dot */}
            <div className={cn('relative z-10 mt-1 h-[15px] w-[15px] rounded-full border-2 border-card', dotColors[event.severity])} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <SeverityBadge severity={event.severity} />
              </div>
              <p className="text-sm font-medium text-foreground">{event.label}</p>
              <p className="text-xs text-muted-foreground">{event.detail}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
