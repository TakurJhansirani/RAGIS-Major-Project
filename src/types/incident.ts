export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type IncidentPriority = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface IncidentLike {
  id?: string | number;
  incident_id?: string | number;
  title?: string;
  description?: string;
  severity?: Severity;
  status?: string;
  category?: string;
  sourceIP?: string;
  source_ip?: string;
  targetIP?: string;
  target_ip?: string;
  timestamp?: string;
  created_at?: string;
  updated_at?: string;
  aiSummary?: string;
  ai_summary?: string;
  confidenceScore?: number;
  confidence_score?: number;
  riskScore?: number;
  risk_score?: number;
  priority?: IncidentPriority;
  affectedAssets?: string[];
  affected_assets?: string[];
  isFalsePositive?: boolean;
  is_false_positive?: boolean;
  source?: string;
}