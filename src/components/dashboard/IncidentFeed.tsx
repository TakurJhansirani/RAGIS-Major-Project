import { motion } from 'framer-motion';
import { Clock, Brain, Globe, Target, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getIncidentPriority } from '@/lib/incidentPriority';

const priorityBadgeClass = {
  critical: 'bg-destructive/15 text-destructive',
  high: 'bg-warning/15 text-warning',
  medium: 'bg-muted text-muted-foreground',
  low: 'bg-muted/70 text-muted-foreground',
  info: 'bg-muted/70 text-muted-foreground',
} as const;

const formatPriorityLabel = (priority: keyof typeof priorityBadgeClass) =>
  priority.charAt(0).toUpperCase() + priority.slice(1);

export const IncidentFeed = ({ incidents, onSelectIncident, selectedId }) => {
  const prioritizedIncidents = [...incidents].sort((left, right) => {
    const leftRisk = Number(left.risk_score ?? left.riskScore ?? 0);
    const rightRisk = Number(right.risk_score ?? right.riskScore ?? 0);

    if (rightRisk !== leftRisk) {
      return rightRisk - leftRisk;
    }

    const leftTime = new Date(left.created_at ?? left.timestamp ?? 0).getTime();
    const rightTime = new Date(right.created_at ?? right.timestamp ?? 0).getTime();
    return rightTime - leftTime;
  });

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Live Incident Feed
        </h2>
        <span className="text-xs font-mono text-primary animate-pulse-glow">● LIVE</span>
      </div>

      <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
        {prioritizedIncidents.map((incident, index) => {
          
          // ✅ FIX FIELD MAPPING
          const id = incident.incident_id || incident.id;
          const time = incident.created_at || incident.timestamp;
          const sourceIP = incident.source_ip ?? incident.sourceIP ?? 'Unknown';
          const targetIP = incident.target_ip ?? incident.targetIP ?? 'Unknown';
          const aiSummary = incident.ai_summary ?? incident.aiSummary ?? 'AI analysis unavailable';
          const confidence = incident.confidence_score ?? incident.confidenceScore ?? 0;
          const risk = incident.risk_score ?? incident.riskScore ?? 0;
          const priority = incident.priority ?? getIncidentPriority(risk);
          const isFP = incident.is_false_positive ?? incident.isFalsePositive ?? false;

          return (
            <motion.button
              key={id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => onSelectIncident(incident)}
              className={cn(
                'w-full text-left rounded-lg border p-4 transition-all duration-200',
                selectedId === id
                  ? 'border-primary/50 bg-primary/5 glow-primary'
                  : 'border-border bg-card hover:border-border hover:bg-secondary/50'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium',
                      priorityBadgeClass[priority]
                    )}>
                      <AlertTriangle className="h-3 w-3" />
                      {formatPriorityLabel(priority)}
                    </span>

                    <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                      {incident.status}
                    </span>

                    {isFP && (
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        FP
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-medium text-foreground truncate">
                    {incident.title}
                  </h3>

                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {aiSummary}
                  </p>

                  <div className="mt-2 grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                    <span className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Source: {sourceIP}
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Target: {targetIP}
                    </span>
                  </div>

                  <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="font-mono">{id}</span>

                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {time ? new Date(time).toLocaleTimeString() : "--"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1 shrink-0">
                  <div className="flex items-center gap-1">
                    <Brain className="h-3 w-3 text-primary" />
                    <span className="text-xs font-mono text-primary">
                      {confidence}%
                    </span>
                  </div>

                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-md bg-muted/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground',
                  )}>
                    Risk: {risk}/100
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};