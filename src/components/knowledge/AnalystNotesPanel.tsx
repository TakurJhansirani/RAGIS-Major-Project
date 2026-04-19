import { motion } from 'framer-motion';
import { Brain, User, MessageSquare, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAnalystNotes } from '@/hooks/useIncidents';
import type { AnalystNote } from '@/types/knowledge';

const noteTypeStyles: Record<string, { label: string; className: string }> = {
  observation: { label: 'Observation', className: 'bg-info/10 text-info border-info/20' },
  correction: { label: 'AI Correction', className: 'bg-warning/10 text-warning border-warning/20' },
  recommendation: { label: 'Recommendation', className: 'bg-primary/10 text-primary border-primary/20' },
  escalation: { label: 'Escalation', className: 'bg-destructive/10 text-destructive border-destructive/20' },
};

export const AnalystNotesPanel = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const { data: noteItems = [] } = useAnalystNotes();

  const analystNotes: AnalystNote[] = (noteItems as any[]).map((item) => ({
    id: `note-${item.note_id}`,
    incidentId: `INC-${item.incident}`,
    author: item.author || 'Analyst',
    role: item.role || 'SOC Analyst',
    content: item.content || 'No note content available.',
    timestamp: item.created_at || item.updated_at || new Date().toISOString(),
    type: item.note_type || 'observation',
    aiRelevant: Boolean(item.ai_relevant),
  }));

  const filtered = analystNotes
    .filter((n) => {
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          n.content.toLowerCase().includes(q) ||
          n.author.toLowerCase().includes(q) ||
          n.incidentId.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const types = ['all', 'observation', 'correction', 'recommendation', 'escalation'];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Analyst Notes
          </h2>
          <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-mono text-secondary-foreground">
            {filtered.length}
          </span>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes..."
            className="h-8 w-44 rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors"
          />
        </div>
      </div>

      {/* Type Filters */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-border px-4 py-2.5">
        {types.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={cn(
              'rounded-md px-2.5 py-1 text-[10px] font-medium capitalize transition-all',
              typeFilter === t
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent'
            )}
          >
            {t === 'all' ? 'All' : noteTypeStyles[t]?.label || t}
          </button>
        ))}
      </div>

      {/* Notes List */}
      <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
        {filtered.map((note, index) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="rounded-lg border border-border bg-secondary/20 p-3.5"
          >
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={cn('rounded-md border px-1.5 py-0.5 text-[10px] font-semibold', noteTypeStyles[note.type]?.className)}>
                {noteTypeStyles[note.type]?.label}
              </span>
              <span className="rounded border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-mono text-secondary-foreground">
                {note.incidentId}
              </span>
              {note.aiRelevant && (
                <span className="flex items-center gap-1 text-[10px] text-primary font-medium">
                  <Brain className="h-3 w-3" /> AI Relevant
                </span>
              )}
            </div>

            <p className="text-xs leading-relaxed text-foreground/85 mb-2">{note.content}</p>

            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="font-medium text-foreground/70">{note.author}</span>
              <span>• {note.role}</span>
              <span className="ml-auto font-mono">{new Date(note.timestamp).toLocaleString()}</span>
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No notes found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
};
