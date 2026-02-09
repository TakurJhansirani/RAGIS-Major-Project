export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'escalated';
export type IncidentCategory = 'malware' | 'phishing' | 'brute-force' | 'data-exfiltration' | 'insider-threat' | 'dos' | 'unauthorized-access' | 'reconnaissance';

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: IncidentStatus;
  category: IncidentCategory;
  sourceIP: string;
  targetIP: string;
  timestamp: string;
  aiSummary: string;
  confidenceScore: number;
  riskScore: number;
  affectedAssets: string[];
  isFalsePositive: boolean;
}

export interface TimelineEvent {
  timestamp: string;
  label: string;
  severity: Severity;
  detail: string;
}

export interface DashboardMetrics {
  totalIncidents: number;
  criticalAlerts: number;
  falsePositiveRate: number;
  mttr: number; // Mean Time To Resolve in minutes
  resolvedToday: number;
  escalated: number;
  activeAnalysts: number;
  ingestionRate: number;
}

export const dashboardMetrics: DashboardMetrics = {
  totalIncidents: 1247,
  criticalAlerts: 23,
  falsePositiveRate: 12.4,
  mttr: 34,
  resolvedToday: 89,
  escalated: 7,
  activeAnalysts: 12,
  ingestionRate: 3420,
};

export const incidents: Incident[] = [
  {
    id: 'INC-2024-0847',
    title: 'Lateral Movement Detected — Domain Controller',
    description: 'Suspicious lateral movement detected from workstation WS-0142 to Domain Controller DC-01 using pass-the-hash technique.',
    severity: 'critical',
    status: 'escalated',
    category: 'unauthorized-access',
    sourceIP: '10.0.14.52',
    targetIP: '10.0.1.5',
    timestamp: '2024-12-15T14:32:00Z',
    aiSummary: 'High-confidence lateral movement using NTLM relay attack from compromised workstation. The attacker leveraged stolen credentials from a prior phishing campaign (INC-2024-0831). Immediate containment recommended.',
    confidenceScore: 94,
    riskScore: 97,
    affectedAssets: ['DC-01', 'WS-0142', 'AD-Forest'],
    isFalsePositive: false,
  },
  {
    id: 'INC-2024-0846',
    title: 'Phishing Campaign — Executive Targeting',
    description: 'Coordinated spear-phishing campaign targeting C-suite executives with spoofed vendor invoices.',
    severity: 'high',
    status: 'investigating',
    category: 'phishing',
    sourceIP: '185.220.101.34',
    targetIP: '10.0.2.15',
    timestamp: '2024-12-15T13:15:00Z',
    aiSummary: 'Spear-phishing campaign using compromised vendor domain. 3 executives received emails with malicious PDF attachments. One attachment opened by CFO — endpoint quarantined. Similar TTPs match APT29 patterns from knowledge base.',
    confidenceScore: 87,
    riskScore: 85,
    affectedAssets: ['EXEC-WS-03', 'Mail-GW-01'],
    isFalsePositive: false,
  },
  {
    id: 'INC-2024-0845',
    title: 'Brute Force Attack — SSH Service',
    description: 'Multiple failed SSH login attempts detected from external IP targeting production servers.',
    severity: 'medium',
    status: 'open',
    category: 'brute-force',
    sourceIP: '91.234.56.78',
    targetIP: '10.0.5.20',
    timestamp: '2024-12-15T12:45:00Z',
    aiSummary: 'Automated brute-force attack against SSH on PROD-WEB-02. 2,847 attempts in 15 minutes from known Tor exit node. No successful authentications. IP previously flagged in 3 prior incidents. Auto-block recommended.',
    confidenceScore: 92,
    riskScore: 45,
    affectedAssets: ['PROD-WEB-02'],
    isFalsePositive: false,
  },
  {
    id: 'INC-2024-0844',
    title: 'Data Exfiltration — Unusual Outbound Traffic',
    description: 'Anomalous data transfer detected to external cloud storage from internal database server.',
    severity: 'critical',
    status: 'investigating',
    category: 'data-exfiltration',
    sourceIP: '10.0.3.100',
    targetIP: '104.21.45.67',
    timestamp: '2024-12-15T11:20:00Z',
    aiSummary: 'Database server DB-PROD-01 transferred 2.3GB to unregistered cloud storage endpoint. Traffic encrypted via non-standard TLS configuration. Correlates with service account compromise detected yesterday. Potential PII exposure — privacy team notified.',
    confidenceScore: 88,
    riskScore: 95,
    affectedAssets: ['DB-PROD-01', 'SVC-ACCT-DB'],
    isFalsePositive: false,
  },
  {
    id: 'INC-2024-0843',
    title: 'DNS Tunneling — C2 Communication',
    description: 'DNS query patterns consistent with command-and-control communication detected.',
    severity: 'high',
    status: 'open',
    category: 'malware',
    sourceIP: '10.0.8.33',
    targetIP: '8.8.8.8',
    timestamp: '2024-12-15T10:05:00Z',
    aiSummary: 'Workstation WS-0098 generating high-frequency DNS queries to suspicious domain (xk4d.evil-dns.com). Pattern matches known DNS tunneling for C2. Likely Cobalt Strike beacon based on query interval analysis.',
    confidenceScore: 79,
    riskScore: 82,
    affectedAssets: ['WS-0098'],
    isFalsePositive: false,
  },
  {
    id: 'INC-2024-0842',
    title: 'Port Scan — Network Reconnaissance',
    description: 'Systematic port scanning detected across internal subnet from guest network segment.',
    severity: 'low',
    status: 'resolved',
    category: 'reconnaissance',
    sourceIP: '192.168.50.12',
    targetIP: '10.0.0.0/16',
    timestamp: '2024-12-15T09:30:00Z',
    aiSummary: 'Guest WiFi device conducting SYN scan across production subnet. 1,200 ports scanned in 5 minutes. Likely automated tool (Nmap signature detected). Network segmentation prevented access to sensitive assets. Guest isolated.',
    confidenceScore: 95,
    riskScore: 25,
    affectedAssets: ['Guest-VLAN'],
    isFalsePositive: false,
  },
  {
    id: 'INC-2024-0841',
    title: 'Windows Defender Alert — Benign Update Script',
    description: 'Antivirus flagged scheduled PowerShell update script as suspicious.',
    severity: 'info',
    status: 'resolved',
    category: 'malware',
    sourceIP: '10.0.2.50',
    targetIP: 'N/A',
    timestamp: '2024-12-15T08:00:00Z',
    aiSummary: 'False positive. Scheduled IT maintenance script triggered generic "suspicious PowerShell execution" rule. Script hash matches approved change ticket CHG-4521. Marked as false positive and rule tuned.',
    confidenceScore: 98,
    riskScore: 5,
    affectedAssets: ['WS-IT-05'],
    isFalsePositive: true,
  },
];

export const timelineEvents: TimelineEvent[] = [
  { timestamp: '2024-12-15T08:00:00Z', label: 'FP: Defender alert', severity: 'info', detail: 'Benign PowerShell script flagged' },
  { timestamp: '2024-12-15T09:30:00Z', label: 'Port scan detected', severity: 'low', detail: 'Guest network reconnaissance' },
  { timestamp: '2024-12-15T10:05:00Z', label: 'DNS tunneling', severity: 'high', detail: 'C2 communication suspected' },
  { timestamp: '2024-12-15T11:20:00Z', label: 'Data exfiltration', severity: 'critical', detail: '2.3GB transferred externally' },
  { timestamp: '2024-12-15T12:45:00Z', label: 'SSH brute force', severity: 'medium', detail: '2,847 attempts from Tor node' },
  { timestamp: '2024-12-15T13:15:00Z', label: 'Phishing campaign', severity: 'high', detail: 'Executive spear-phishing' },
  { timestamp: '2024-12-15T14:32:00Z', label: 'Lateral movement', severity: 'critical', detail: 'Domain Controller targeted' },
];

export const alertTrend = [
  { hour: '00:00', critical: 1, high: 3, medium: 8, low: 12 },
  { hour: '02:00', critical: 0, high: 2, medium: 5, low: 9 },
  { hour: '04:00', critical: 0, high: 1, medium: 4, low: 7 },
  { hour: '06:00', critical: 1, high: 4, medium: 9, low: 15 },
  { hour: '08:00', critical: 2, high: 6, medium: 14, low: 22 },
  { hour: '10:00', critical: 3, high: 8, medium: 18, low: 28 },
  { hour: '12:00', critical: 2, high: 7, medium: 15, low: 25 },
  { hour: '14:00', critical: 4, high: 9, medium: 12, low: 20 },
  { hour: '16:00', critical: 3, high: 6, medium: 10, low: 18 },
  { hour: '18:00', critical: 1, high: 5, medium: 8, low: 14 },
  { hour: '20:00', critical: 1, high: 3, medium: 6, low: 11 },
  { hour: '22:00', critical: 0, high: 2, medium: 5, low: 8 },
];

export const categoryDistribution = [
  { name: 'Malware', value: 28, fill: 'hsl(var(--severity-critical))' },
  { name: 'Phishing', value: 22, fill: 'hsl(var(--severity-high))' },
  { name: 'Brute Force', value: 18, fill: 'hsl(var(--severity-medium))' },
  { name: 'Unauthorized Access', value: 12, fill: 'hsl(var(--primary))' },
  { name: 'Reconnaissance', value: 10, fill: 'hsl(var(--severity-info))' },
  { name: 'Data Exfil', value: 6, fill: 'hsl(var(--warning))' },
  { name: 'Other', value: 4, fill: 'hsl(var(--muted-foreground))' },
];
