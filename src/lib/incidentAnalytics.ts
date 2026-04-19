type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

type IncidentRecord = Record<string, any>;

export interface DashboardMetricsComputed {
  totalIncidents: number;
  criticalAlerts: number;
  falsePositiveRate: number;
  mttr: number;
  resolvedToday: number;
  escalated: number;
  activeAnalysts: number;
  ingestionRate: number;
}

export interface TrendPoint {
  hour: string;
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface CategoryPoint {
  name: string;
  value: number;
  fill: string;
}

export interface TimelinePoint {
  timestamp: string;
  label: string;
  severity: Severity;
  detail: string;
}

const SEVERITIES: Severity[] = ['critical', 'high', 'medium', 'low', 'info'];

function clampSeverity(value: string): Severity {
  if (SEVERITIES.includes(value as Severity)) {
    return value as Severity;
  }
  return 'info';
}

function incidentTimestamp(incident: IncidentRecord): string {
  return incident.created_at || incident.timestamp || new Date().toISOString();
}

function incidentUpdatedTimestamp(incident: IncidentRecord): string {
  return incident.updated_at || incident.timestamp || incidentTimestamp(incident);
}

function severityCount(incidents: IncidentRecord[], severity: Severity): number {
  return incidents.filter((item) => clampSeverity(item.severity || 'info') === severity).length;
}

export function computeDashboardMetrics(
  incidents: IncidentRecord[],
  stats?: {
    total_incidents?: number;
    critical_alerts?: number;
    resolved_today?: number;
  }
): DashboardMetricsComputed {
  const totalIncidents = stats?.total_incidents ?? incidents.length;
  const criticalAlerts = stats?.critical_alerts ?? severityCount(incidents, 'critical');

  const falsePositiveCount = incidents.filter((item) => item.is_false_positive || item.isFalsePositive).length;
  const falsePositiveRate = totalIncidents > 0 ? Number(((falsePositiveCount / totalIncidents) * 100).toFixed(1)) : 0;

  const resolvedIncidents = incidents.filter((item) => item.status === 'resolved');
  const mttr = resolvedIncidents.length
    ? Math.max(
        1,
        Math.round(
          resolvedIncidents.reduce((sum, item) => {
            const created = new Date(incidentTimestamp(item)).getTime();
            const updated = new Date(incidentUpdatedTimestamp(item)).getTime();
            const minutes = Math.max(1, (updated - created) / 60000);
            return sum + minutes;
          }, 0) / resolvedIncidents.length
        )
      )
    : 0;

  const today = new Date().toDateString();
  const resolvedToday = stats?.resolved_today ?? resolvedIncidents.filter((item) => {
    return new Date(incidentUpdatedTimestamp(item)).toDateString() === today;
  }).length;

  const escalated = incidents.filter((item) => item.status === 'escalated').length;

  const sourceCount = new Set(incidents.map((item) => item.source || 'manual')).size;
  const investigatingCount = incidents.filter((item) => item.status === 'investigating').length;
  const activeAnalysts = Math.max(1, Math.min(24, sourceCount + Math.ceil(investigatingCount / 3)));

  const now = Date.now();
  const incidentsLast24h = incidents.filter((item) => {
    return now - new Date(incidentTimestamp(item)).getTime() <= 24 * 60 * 60 * 1000;
  }).length;
  const ingestionRate = Math.max(1, Math.round(incidentsLast24h / 24));

  return {
    totalIncidents,
    criticalAlerts,
    falsePositiveRate,
    mttr,
    resolvedToday,
    escalated,
    activeAnalysts,
    ingestionRate,
  };
}

export function buildAlertTrend(incidents: IncidentRecord[]): TrendPoint[] {
  const nowMs = Date.now();
  const incidentTimes = incidents
    .map((incident) => new Date(incidentTimestamp(incident)).getTime())
    .filter((value) => Number.isFinite(value));
  const latestIncidentMs = incidentTimes.length ? Math.max(...incidentTimes) : nowMs;

  // If data is old (for example imported demo incidents), anchor 24h window on latest incident.
  const anchorMs = latestIncidentMs < nowMs - 24 * 60 * 60 * 1000 ? latestIncidentMs : nowMs;
  const anchor = new Date(anchorMs);

  const buckets = Array.from({ length: 24 }, (_, index) => {
    const bucketStart = new Date(anchor.getTime() - (23 - index) * 60 * 60 * 1000);
    const key = `${String(bucketStart.getHours()).padStart(2, '0')}:00`;
    return {
      hour: key,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: 0,
      startMs: bucketStart.getTime(),
      endMs: bucketStart.getTime() + 60 * 60 * 1000,
    };
  });

  incidents.forEach((incident) => {
    const timestampMs = new Date(incidentTimestamp(incident)).getTime();
    const severity = clampSeverity(incident.severity || 'info');
    const bucket = buckets.find((item) => timestampMs >= item.startMs && timestampMs < item.endMs);
    if (!bucket) {
      return;
    }
    bucket.total += 1;
    if (severity === 'critical' || severity === 'high' || severity === 'medium' || severity === 'low') {
      bucket[severity] += 1;
    }
  });

  return buckets.map(({ startMs: _start, endMs: _end, ...display }) => display);
}

export function buildCategoryDistribution(incidents: IncidentRecord[]): CategoryPoint[] {
  const categoryLabel: Record<string, string> = {
    malware: 'Malware',
    phishing: 'Phishing',
    'brute-force': 'Brute Force',
    'unauthorized-access': 'Unauthorized Access',
    reconnaissance: 'Reconnaissance',
    'data-exfiltration': 'Data Exfil',
    'insider-threat': 'Insider Threat',
    dos: 'DoS',
  };

  const palette = [
    'hsl(var(--severity-critical))',
    'hsl(var(--severity-high))',
    'hsl(var(--severity-medium))',
    'hsl(var(--primary))',
    'hsl(var(--severity-info))',
    'hsl(var(--warning))',
    'hsl(var(--muted-foreground))',
    'hsl(var(--success))',
  ];

  const counts: Record<string, number> = {};
  incidents.forEach((incident) => {
    const key = incident.category || 'other';
    counts[key] = (counts[key] || 0) + 1;
  });

  const total = incidents.length || 1;
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  return sorted.map(([category, count], index) => ({
    name: categoryLabel[category] || category,
    value: Number(((count / total) * 100).toFixed(1)),
    fill: palette[index % palette.length],
  }));
}

export function buildTimelineEvents(incidents: IncidentRecord[], limit: number = 10): TimelinePoint[] {
  return [...incidents]
    .sort((a, b) => new Date(incidentTimestamp(a)).getTime() - new Date(incidentTimestamp(b)).getTime())
    .slice(-limit)
    .map((incident) => {
      const severity = clampSeverity(incident.severity || 'info');
      return {
        timestamp: incidentTimestamp(incident),
        label: incident.title || 'Untitled incident',
        severity,
        detail: incident.description || 'No additional context available.',
      };
    });
}
