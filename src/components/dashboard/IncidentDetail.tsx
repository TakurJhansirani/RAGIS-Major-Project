import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Target, Globe, Server, Clock, AlertTriangle, CheckCircle, X, Shield, Sparkles, Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCounterfactualSimulation } from '@/hooks/useIncidents';
import type { IncidentLike } from '@/types/incident';
import { getIncidentPriority } from '@/lib/incidentPriority';

const formatPriorityLabel = (priority: string) => priority.charAt(0).toUpperCase() + priority.slice(1);

interface IncidentDetailProps {
  incident: (IncidentLike & Record<string, any>) | null;
  onClose: () => void;
}

export const IncidentDetail = ({ incident, onClose }: IncidentDetailProps) => {
  const simulation = useCounterfactualSimulation();

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

  const incidentId = incident.incident_id ?? incident.id;
  const apiIncidentId = (() => {
    const candidate = incident.incident_id ?? incident.id;
    if (candidate === undefined || candidate === null || candidate === '') {
      return null;
    }

    if (typeof candidate === 'number') {
      return candidate;
    }

    const numeric = Number(candidate);
    return Number.isFinite(numeric) ? numeric : null;
  })();
  const confidenceScore = incident.confidence_score ?? incident.confidenceScore ?? 0;
  const sourceIP = incident.source_ip ?? incident.sourceIP ?? 'Unknown';
  const targetIP = incident.target_ip ?? incident.targetIP ?? 'Unknown';
  const detectedAt = incident.created_at ?? incident.timestamp;
  const riskScore = incident.risk_score ?? incident.riskScore ?? 0;
  const priority = incident.priority ?? getIncidentPriority(riskScore);
  const aiSummary = incident.ai_summary ?? incident.aiSummary ?? 'AI summary unavailable.';
  const affectedAssets = incident.affected_assets ?? incident.affectedAssets ?? [];
  const isFalsePositive = incident.is_false_positive ?? incident.isFalsePositive ?? false;
  const recommendedAction = simulation.data?.recommended_action;
  const scenarioPreviews = (() => {
    const scenarios = simulation.data?.scenarios ?? [];

    if (!recommendedAction) {
      return scenarios.slice(0, 2);
    }

    // Avoid showing the same top scenario twice (as recommended action and list item).
    let skippedRecommended = false;
    const alternatives = scenarios.filter((scenario) => {
      if (!skippedRecommended && scenario.action_id === recommendedAction.action_id) {
        skippedRecommended = true;
        return false;
      }
      return true;
    });

    return alternatives.slice(0, 2);
  })();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={incidentId}
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
              <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-secondary-foreground">
                {formatPriorityLabel(priority)}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{incidentId}</span>
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
              <span className="ml-auto text-xs font-mono text-primary">{confidenceScore}% confidence</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{aiSummary}</p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            <MetaItem icon={Globe} label="Source IP" value={sourceIP} />
            <MetaItem icon={Target} label="Target IP" value={targetIP} />
            <MetaItem icon={Clock} label="Detected" value={new Date(detectedAt).toLocaleString()} />
            <MetaItem icon={AlertTriangle} label="Risk Score" value={`${riskScore}/100`} highlight={riskScore > 80} />
          </div>

          {/* Affected Assets */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Affected Assets</h3>
            <div className="flex flex-wrap gap-2">
              {affectedAssets.map((asset: string) => (
                <span key={asset} className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs font-mono text-secondary-foreground">
                  <Server className="mr-1 inline h-3 w-3" />
                  {asset}
                </span>
              ))}
            </div>
          </div>

          {/* Counterfactual Simulator */}
          <div className="rounded-lg border border-primary/20 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Counterfactual Simulator
                </h3>
              </div>
              <button
                onClick={() => {
                  if (apiIncidentId === null) {
                    return;
                  }
                  simulation.mutate({ incidentId: String(apiIncidentId) });
                }}
                disabled={simulation.isPending || apiIncidentId === null}
                className="rounded-md border border-primary/40 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {simulation.isPending ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Simulating...
                  </span>
                ) : 'Run Simulation'}
              </button>
            </div>

            {apiIncidentId === null && (
              <p className="text-xs text-muted-foreground">
                Simulation unavailable for this record because it does not have a valid API incident ID.
              </p>
            )}

            {!simulation.data && (
              <p className="text-xs text-muted-foreground">
                Estimate which response action, applied earlier, would likely reduce blast radius and containment time.
              </p>
            )}

            {simulation.isError && (
              <p className="text-xs text-destructive">Simulation failed. Please retry.</p>
            )}

            {recommendedAction && (
              <div className="rounded-md border border-border bg-secondary/40 p-3 space-y-2">
                <p className="text-xs text-muted-foreground">Recommended action</p>
                <p className="text-sm font-medium text-foreground">{recommendedAction.action}</p>
                <p className="text-xs text-muted-foreground">
                  Best intervention window: {recommendedAction.best_window.minutes_earlier} min earlier
                  {' · '}
                  Utility: {recommendedAction.best_window.utility_score}
                </p>
              </div>
            )}

            {scenarioPreviews.length ? (
              <div className="space-y-2">
                {scenarioPreviews.map((scenario) => {
                  const best = scenario.best_window;
                  return (
                    <div key={scenario.action_id} className="rounded-md border border-border bg-secondary/30 p-3">
                      <p className="text-sm font-medium text-foreground">{scenario.action}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Best at {best.minutes_earlier} min earlier with utility {best.utility_score}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {/* False Positive Indicator */}
          {isFalsePositive && (
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

function MetaItem({ icon: Icon, label, value, highlight }: { icon: LucideIcon; label: string; value: string; highlight?: boolean }) {
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
