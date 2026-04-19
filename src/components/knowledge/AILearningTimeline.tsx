import { motion } from 'framer-motion';
import { Brain, Zap, Filter, TrendingUp, ArrowRight, Settings2, Search, Sparkles } from 'lucide-react';
import type { AILearningEntry } from '@/types/knowledge';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAILearningHistory } from '@/hooks/useIncidents';

const typeConfig: Record<AILearningEntry['type'], { label: string; icon: typeof Brain; className: string }> = {
  'model-update': { label: 'Model Update', icon: Brain, className: 'bg-primary/10 text-primary border-primary/20' },
  'rule-tuned': { label: 'Rule Tuned', icon: Settings2, className: 'bg-info/10 text-info border-info/20' },
  'fp-correction': { label: 'FP Correction', icon: Filter, className: 'bg-warning/10 text-warning border-warning/20' },
  'pattern-learned': { label: 'Pattern Learned', icon: Sparkles, className: 'bg-success/10 text-success border-success/20' },
  'threshold-adjusted': { label: 'Threshold Adjusted', icon: TrendingUp, className: 'bg-accent/10 text-accent border-accent/20' },
};

const impactStyles = {
  positive: 'text-success',
  neutral: 'text-muted-foreground',
  negative: 'text-destructive',
};

export const AILearningTimeline = () => {
  const [filter, setFilter] = useState<AILearningEntry['type'] | 'all'>('all');
  const { data: historyItems = [] } = useAILearningHistory();

  const aiLearningHistory: AILearningEntry[] = (historyItems as any[]).map((item) => {
    const metricsChange = item.metrics_change && item.metrics_change.metric
      ? {
          metric: String(item.metrics_change.metric),
          before: Number(item.metrics_change.before ?? 0),
          after: Number(item.metrics_change.after ?? 0),
        }
      : undefined;

    const relatedIncidentIds: number[] = Array.isArray(item.related_incident_ids)
      ? item.related_incident_ids
      : Array.isArray(item.related_incidents)
        ? item.related_incidents
        : [];

    return {
      id: `learn-${item.learning_id}`,
      timestamp: item.created_at || item.updated_at || new Date().toISOString(),
      type: item.entry_type || 'pattern-learned',
      title: item.title || 'Knowledge update',
      description: item.description || 'No additional details available.',
      impact: item.impact || 'neutral',
      relatedIncidents: relatedIncidentIds.map((id: number) => `INC-${id}`),
      metricsChange,
    };
  });

  const filtered = filter === 'all'
    ? aiLearningHistory
    : aiLearningHistory.filter((e) => e.type === filter);

  const filterOptions: { label: string; value: AILearningEntry['type'] | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Model Updates', value: 'model-update' },
    { label: 'Rules Tuned', value: 'rule-tuned' },
    { label: 'FP Corrections', value: 'fp-correction' },
    { label: 'Patterns', value: 'pattern-learned' },
    { label: 'Thresholds', value: 'threshold-adjusted' },
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            AI Learning History
          </h2>
          <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
            Self-Learning
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2.5">
        {filterOptions.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[10px] font-medium transition-all',
              filter === f.value
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative max-h-[500px] overflow-y-auto p-4">
        <div className="absolute left-8 top-4 bottom-4 w-px bg-border" />

        <div className="space-y-4">
          {filtered.map((entry, index) => {
            const config = typeConfig[entry.type];
            const Icon = config.icon;
            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.06 }}
                className="relative flex gap-4 pl-4"
              >
                {/* Icon */}
                <div className={cn('relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border', config.className)}>
                  <Icon className="h-4 w-4" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 rounded-lg border border-border bg-secondary/20 p-3.5">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={cn('rounded-md border px-1.5 py-0.5 text-[10px] font-semibold', config.className)}>
                      {config.label}
                    </span>
                    <span className={cn('text-[10px] font-medium uppercase tracking-wider', impactStyles[entry.impact])}>
                      {entry.impact === 'positive' ? '↑ Positive' : entry.impact === 'negative' ? '↓ Negative' : '— Neutral'}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm font-medium text-foreground mb-1">{entry.title}</h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">{entry.description}</p>

                  {/* Metrics Change */}
                  {entry.metricsChange && (
                    <div className="mt-2.5 flex items-center gap-2 rounded-md bg-background/50 border border-border px-3 py-2">
                      <Zap className="h-3 w-3 text-primary shrink-0" />
                      <span className="text-[10px] font-medium text-muted-foreground">{entry.metricsChange.metric}:</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{entry.metricsChange.before}%</span>
                      <ArrowRight className="h-3 w-3 text-muted-foreground" />
                      <span className={cn('text-[10px] font-mono font-bold',
                        entry.metricsChange.after > entry.metricsChange.before ? 'text-success' : 'text-destructive'
                      )}>
                        {entry.metricsChange.after}%
                      </span>
                    </div>
                  )}

                  {/* Related Incidents */}
                  {entry.relatedIncidents.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-[10px] text-muted-foreground">Related:</span>
                      {entry.relatedIncidents.map((id) => (
                        <span key={id} className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-secondary-foreground">
                          {id}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
