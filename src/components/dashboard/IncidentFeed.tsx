import { motion } from 'framer-motion';
import { Clock, ExternalLink, Brain } from 'lucide-react';
import { SeverityBadge } from './SeverityBadge';
import type { Incident } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface IncidentFeedProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  selectedId?: string;
}

const statusStyles: Record<string, string> = {
  open: 'text-warning',
  investigating: 'text-info',
  resolved: 'text-success',
  escalated: 'text-destructive',
};

export const IncidentFeed = ({ incidents, onSelectIncident, selectedId }: IncidentFeedProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Live Incident Feed</h2>
        <span className="text-xs font-mono text-primary animate-pulse-glow">● LIVE</span>
      </div>
      
      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {incidents.map((incident, index) => (
          <motion.button
            key={incident.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            onClick={() => onSelectIncident(incident)}
            className={cn(
              'w-full text-left rounded-lg border p-4 transition-all duration-200',
              selectedId === incident.id
                ? 'border-primary/50 bg-primary/5 glow-primary'
                : 'border-border bg-card hover:border-border hover:bg-secondary/50'
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <SeverityBadge severity={incident.severity} />
                  <span className={cn('text-[10px] font-medium uppercase tracking-wider', statusStyles[incident.status])}>
                    {incident.status}
                  </span>
                  {incident.isFalsePositive && (
                    <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">FP</span>
                  )}
                </div>
                <h3 className="text-sm font-medium text-foreground truncate">{incident.title}</h3>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-mono">{incident.id}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(incident.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="flex items-center gap-1">
                  <Brain className="h-3 w-3 text-primary" />
                  <span className="text-xs font-mono text-primary">{incident.confidenceScore}%</span>
                </div>
                <span className="text-[10px] text-muted-foreground">Risk: {incident.riskScore}</span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
