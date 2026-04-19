import type { IncidentPriority } from '@/types/incident';

export const getIncidentPriority = (riskScore?: number | null): IncidentPriority => {
  const score = Number(riskScore ?? 0);

  if (score >= 90) return 'critical';
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  if (score > 0) return 'low';
  return 'info';
};
