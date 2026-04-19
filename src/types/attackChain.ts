import type { Severity } from '@/types/incident';

export interface AttackChainStep {
  id: string;
  label: string;
  technique: string;
  mitreId: string;
  confidence: number;
  severity: Severity;
  detail: string;
  evidence: string[];
  timestamp: string;
}

export interface AttackChain {
  id: string;
  incidentId: string;
  title: string;
  threat: string;
  overallConfidence: number;
  severity: Severity;
  steps: AttackChainStep[];
}
