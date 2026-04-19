import { useState } from 'react';
import { motion } from 'framer-motion';
import { Database, BookOpen, Brain, MessageSquare } from 'lucide-react';
import { ResolvedIncidentsTable } from '@/components/knowledge/ResolvedIncidentsTable';
import { IncidentKnowledgeDetail } from '@/components/knowledge/IncidentKnowledgeDetail';
import { AILearningTimeline } from '@/components/knowledge/AILearningTimeline';
import { AnalystNotesPanel } from '@/components/knowledge/AnalystNotesPanel';
import type { ResolvedIncident } from '@/types/knowledge';
import { cn } from '@/lib/utils';

type TabId = 'resolved' | 'notes' | 'learning';

const tabs: { id: TabId; label: string; icon: typeof Database }[] = [
  { id: 'resolved', label: 'Resolved Incidents', icon: BookOpen },
  { id: 'notes', label: 'Analyst Notes', icon: MessageSquare },
  { id: 'learning', label: 'AI Learning', icon: Brain },
];

export const KnowledgeBaseView = () => {
  const [activeTab, setActiveTab] = useState<TabId>('resolved');
  const [selectedIncident, setSelectedIncident] = useState<ResolvedIncident | null>(null);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            Knowledge Base
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Self-learning incident repository with analyst feedback and AI improvement history.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
          <Brain className="h-4 w-4 text-primary animate-pulse-glow" />
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">AI Accuracy</p>
            <p className="text-sm font-bold text-success font-mono">84.2%</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {activeTab === 'resolved' && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <div className="xl:col-span-3">
              <ResolvedIncidentsTable
                onSelectIncident={setSelectedIncident}
                selectedId={selectedIncident?.id}
              />
            </div>
            <div className="xl:col-span-2">
              <IncidentKnowledgeDetail
                incident={selectedIncident}
                onClose={() => setSelectedIncident(null)}
              />
            </div>
          </div>
        )}

        {activeTab === 'notes' && <AnalystNotesPanel />}

        {activeTab === 'learning' && <AILearningTimeline />}
      </motion.div>
    </div>
  );
};
