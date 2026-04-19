import type { Severity } from '@/types/incident';

export interface ResolvedIncident {
  id: string;
  title: string;
  severity: Severity;
  category: string;
  resolvedAt: string;
  detectedAt: string;
  resolvedBy: string;
  rootCause: string;
  resolution: string;
  aiAccuracy: number;
  lessonsLearned: string;
  tags: string[];
  ttd: number;
  ttr: number;
}

export interface AnalystNote {
  id: string;
  incidentId: string;
  author: string;
  role: string;
  content: string;
  timestamp: string;
  type: 'observation' | 'correction' | 'recommendation' | 'escalation';
  aiRelevant: boolean;
}

export interface AILearningEntry {
  id: string;
  timestamp: string;
  type: 'model-update' | 'rule-tuned' | 'fp-correction' | 'pattern-learned' | 'threshold-adjusted';
  title: string;
  description: string;
  impact: 'positive' | 'neutral' | 'negative';
  relatedIncidents: string[];
  metricsChange?: { metric: string; before: number; after: number };
}
