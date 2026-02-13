export type NotificationCategory = 'critical' | 'escalation' | 'system' | 'ai-insight';

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  timestamp: Date;
  read: boolean;
  dismissed: boolean;
  incidentId?: string;
}

export const mockNotifications: Notification[] = [
  {
    id: 'n-001',
    title: 'Critical: Ransomware Detected',
    message: 'Ransomware dropper identified on finance-srv-04. Immediate containment recommended.',
    category: 'critical',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    read: false,
    dismissed: false,
    incidentId: 'INC-2024-0847',
  },
  {
    id: 'n-002',
    title: 'Escalation: Lateral Movement',
    message: 'Incident INC-2024-0847 auto-escalated to Tier 3 due to lateral movement detection.',
    category: 'escalation',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    read: false,
    dismissed: false,
    incidentId: 'INC-2024-0847',
  },
  {
    id: 'n-003',
    title: 'AI Insight: Pattern Match',
    message: 'RAG engine matched current phishing campaign to APT29 TTPs with 94% confidence.',
    category: 'ai-insight',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    read: false,
    dismissed: false,
  },
  {
    id: 'n-004',
    title: 'System: Splunk Sync Complete',
    message: 'Successfully ingested 142,850 events from Splunk Enterprise. No anomalies detected.',
    category: 'system',
    timestamp: new Date(Date.now() - 32 * 60 * 1000),
    read: true,
    dismissed: false,
  },
  {
    id: 'n-005',
    title: 'Critical: Data Exfiltration Alert',
    message: 'Unusual outbound data transfer detected from db-primary-02 to external IP 185.220.101.x.',
    category: 'critical',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    read: true,
    dismissed: false,
    incidentId: 'INC-2024-0845',
  },
  {
    id: 'n-006',
    title: 'AI Insight: False Positive Reduction',
    message: 'Model retrained — false positive rate reduced from 14.2% to 12.4% across brute force alerts.',
    category: 'ai-insight',
    timestamp: new Date(Date.now() - 60 * 60 * 1000),
    read: true,
    dismissed: false,
  },
  {
    id: 'n-007',
    title: 'System: CrowdStrike Connection Error',
    message: 'EDR telemetry feed from CrowdStrike Falcon failed. Retry scheduled in 5 minutes.',
    category: 'system',
    timestamp: new Date(Date.now() - 90 * 60 * 1000),
    read: true,
    dismissed: false,
  },
];
