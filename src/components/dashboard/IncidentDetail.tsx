import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Target, Globe, Server, Clock, AlertTriangle, CheckCircle, X, Shield } from 'lucide-react';
import { SeverityBadge } from './SeverityBadge';
import type { Incident } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface IncidentDetailProps {
  incident: Incident | null;
  onClose: () => void;
}

export const IncidentDetail = ({ incident, onClose }: IncidentDetailProps) => {
  if (!incident) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8">
        <div className="text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Select an incident to view AI analysis</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={incident.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <SeverityBadge severity={incident.severity} />
              <span className="font-mono text-xs text-muted-foreground">{incident.id}</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">{incident.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{incident.description}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* AI Summary */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">AI Analysis</h3>
              <span className="ml-auto text-xs font-mono text-primary">{incident.confidenceScore}% confidence</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{incident.aiSummary}</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetaItem icon={Globe} label="Source IP" value={incident.sourceIP} />
            <MetaItem icon={Target} label="Target IP" value={incident.targetIP} />
            <MetaItem icon={Clock} label="Detected" value={new Date(incident.timestamp).toLocaleString()} />
            <MetaItem icon={AlertTriangle} label="Risk Score" value={`${incident.riskScore}/100`} highlight={incident.riskScore > 80} />
          </div>

          {/* Affected Assets */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Affected Assets</h3>
            <div className="flex flex-wrap gap-2">
              {incident.affectedAssets.map((asset) => (
                <span key={asset} className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs font-mono text-secondary-foreground">
                  <Server className="mr-1 inline h-3 w-3" />
                  {asset}
                </span>
              ))}
            </div>
          </div>

          {/* False Positive Indicator */}
          {incident.isFalsePositive && (
            <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 p-3">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm text-success font-medium">Marked as False Positive</span>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

function MetaItem({ icon: Icon, label, value, highlight }: { icon: any; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/50 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      </div>
      <span className={cn('text-sm font-mono font-medium', highlight ? 'text-destructive' : 'text-foreground')}>
        {value}
      </span>
    </div>
  );
}
