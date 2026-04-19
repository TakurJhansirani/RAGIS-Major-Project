import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Target, User, Clock, Tag, Lightbulb, Timer, TrendingUp, X, BookOpen } from 'lucide-react';
import { SeverityBadge } from '@/components/dashboard/SeverityBadge';
import type { ResolvedIncident } from '@/types/knowledge';
import { cn } from '@/lib/utils';
import { useAnalystNotes } from '@/hooks/useIncidents';

interface IncidentKnowledgeDetailProps {
  incident: ResolvedIncident | null;
  onClose: () => void;
}

const noteTypeStyles: Record<string, { label: string; className: string }> = {
  observation: { label: 'Observation', className: 'bg-info/10 text-info border-info/20' },
  correction: { label: 'AI Correction', className: 'bg-warning/10 text-warning border-warning/20' },
  recommendation: { label: 'Recommendation', className: 'bg-primary/10 text-primary border-primary/20' },
  escalation: { label: 'Escalation', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export const IncidentKnowledgeDetail = ({ incident, onClose }: IncidentKnowledgeDetailProps) => {
  const incidentNumericId = incident ? incident.id.replace('INC-', '') : undefined;
  const { data: analystNoteItems = [] } = useAnalystNotes(incidentNumericId);

  if (!incident) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8">
        <div className="text-center">
          <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Select a resolved incident to view knowledge details</p>
        </div>
      </div>
    );
  }

  const relatedNotes = (analystNoteItems as any[]).map((item) => ({
    id: `detail-note-${item.note_id}`,
    type: item.note_type || 'observation',
    author: item.author || 'Analyst',
    role: item.role || 'SOC Analyst',
    aiRelevant: Boolean(item.ai_relevant),
    content: item.content || 'No details available.',
    timestamp: item.created_at || item.updated_at || new Date().toISOString(),
  }));

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
              <span className="text-[10px] font-medium text-success uppercase tracking-wider">Resolved</span>
            </div>
            <h2 className="text-lg font-semibold text-foreground">{incident.title}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[600px] overflow-y-auto">
          {/* Metrics Row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border bg-secondary/50 p-3 text-center">
              <Timer className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-lg font-bold text-foreground">{incident.ttr}m</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Time to Resolve</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/50 p-3 text-center">
              <Brain className="mx-auto h-4 w-4 text-primary mb-1" />
              <p className={cn('text-lg font-bold', incident.aiAccuracy >= 85 ? 'text-success' : 'text-warning')}>
                {incident.aiAccuracy}%
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Accuracy</p>
            </div>
            <div className="rounded-lg border border-border bg-secondary/50 p-3 text-center">
              <Target className="mx-auto h-4 w-4 text-muted-foreground mb-1" />
              <p className="text-lg font-bold text-foreground">{incident.ttd}m</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Time to Detect</p>
            </div>
          </div>

          {/* Root Cause */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Target className="h-3 w-3" /> Root Cause
            </h3>
            <p className="text-sm leading-relaxed text-foreground/90 rounded-lg bg-secondary/30 p-3 border border-border">
              {incident.rootCause}
            </p>
          </div>

          {/* Resolution */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" /> Resolution
            </h3>
            <p className="text-sm leading-relaxed text-foreground/90 rounded-lg bg-success/5 p-3 border border-success/15">
              {incident.resolution}
            </p>
          </div>

          {/* Lessons Learned */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-3 w-3 text-warning" /> Lessons Learned
            </h3>
            <p className="text-sm leading-relaxed text-foreground/90 rounded-lg bg-warning/5 p-3 border border-warning/15">
              {incident.lessonsLearned}
            </p>
          </div>

          {/* Tags */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <Tag className="h-3 w-3" /> Tags
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {incident.tags.map((tag) => (
                <span key={tag} className="rounded-md border border-border bg-secondary px-2 py-1 text-[10px] font-mono text-secondary-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Analyst Notes */}
          {relatedNotes.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                <User className="h-3 w-3" /> Analyst Notes ({relatedNotes.length})
              </h3>
              <div className="space-y-2.5">
                {relatedNotes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-border bg-secondary/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('rounded-md border px-1.5 py-0.5 text-[10px] font-semibold', noteTypeStyles[note.type].className)}>
                        {noteTypeStyles[note.type].label}
                      </span>
                      <span className="text-[10px] font-medium text-foreground">{note.author}</span>
                      <span className="text-[10px] text-muted-foreground">• {note.role}</span>
                      {note.aiRelevant && (
                        <Brain className="h-3 w-3 text-primary ml-auto" aria-label="AI-relevant feedback" />
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-foreground/85">{note.content}</p>
                    <p className="mt-1.5 text-[10px] font-mono text-muted-foreground">
                      {new Date(note.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolved By */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
            <User className="h-3 w-3" />
            <span>Resolved by <strong className="text-foreground">{incident.resolvedBy}</strong></span>
            <span className="mx-1">•</span>
            <Clock className="h-3 w-3" />
            <span>{new Date(incident.resolvedAt).toLocaleString()}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
