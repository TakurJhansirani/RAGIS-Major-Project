import type { Severity } from './mockData';
export type { Severity };

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

export const attackChains: AttackChain[] = [
  {
    id: 'AC-001',
    incidentId: 'INC-2024-0847',
    title: 'Lateral Movement via Pass-the-Hash',
    threat: 'APT29 / Cozy Bear',
    overallConfidence: 94,
    severity: 'critical',
    steps: [
      {
        id: 'step-1',
        label: 'Initial Access',
        technique: 'Spear Phishing (T1566.001)',
        mitreId: 'T1566.001',
        confidence: 91,
        severity: 'high',
        detail: 'Phishing email delivered to CFO with malicious PDF attachment exploiting CVE-2024-1234.',
        evidence: ['Email gateway logs', 'Sandbox detonation report', 'Endpoint telemetry'],
        timestamp: '2024-12-14T09:12:00Z',
      },
      {
        id: 'step-2',
        label: 'Execution',
        technique: 'PowerShell (T1059.001)',
        mitreId: 'T1059.001',
        confidence: 88,
        severity: 'high',
        detail: 'Obfuscated PowerShell dropper executed via macro, downloading Cobalt Strike beacon.',
        evidence: ['EDR process tree', 'Script block logging', 'Network connection to C2'],
        timestamp: '2024-12-14T09:14:00Z',
      },
      {
        id: 'step-3',
        label: 'Credential Access',
        technique: 'LSASS Dump (T1003.001)',
        mitreId: 'T1003.001',
        confidence: 95,
        severity: 'critical',
        detail: 'Mimikatz variant used to dump LSASS memory, extracting NTLM hashes for domain admin account.',
        evidence: ['Sysmon Event ID 10', 'Memory forensics', 'Credential usage anomaly'],
        timestamp: '2024-12-14T10:30:00Z',
      },
      {
        id: 'step-4',
        label: 'Lateral Movement',
        technique: 'Pass-the-Hash (T1550.002)',
        mitreId: 'T1550.002',
        confidence: 97,
        severity: 'critical',
        detail: 'Stolen NTLM hash used to authenticate to Domain Controller DC-01 via SMB.',
        evidence: ['NTLM relay detected', 'Event ID 4624 Type 3', 'Lateral movement alert'],
        timestamp: '2024-12-15T14:32:00Z',
      },
      {
        id: 'step-5',
        label: 'Privilege Escalation',
        technique: 'Domain Admin (T1078.002)',
        mitreId: 'T1078.002',
        confidence: 92,
        severity: 'critical',
        detail: 'Attacker obtained Domain Admin privileges, enabling full AD forest compromise.',
        evidence: ['AD audit logs', 'Group membership change', 'Golden ticket indicators'],
        timestamp: '2024-12-15T14:45:00Z',
      },
    ],
  },
  {
    id: 'AC-002',
    incidentId: 'INC-2024-0844',
    title: 'Database Exfiltration via Compromised Service Account',
    threat: 'Insider Threat / Compromised Credentials',
    overallConfidence: 88,
    severity: 'critical',
    steps: [
      {
        id: 'step-1',
        label: 'Valid Accounts',
        technique: 'Service Account (T1078.003)',
        mitreId: 'T1078.003',
        confidence: 82,
        severity: 'medium',
        detail: 'Service account SVC-ACCT-DB credentials found in exposed .env file on internal GitLab.',
        evidence: ['GitLab commit history', 'Credential scan alert', 'Account usage anomaly'],
        timestamp: '2024-12-13T16:00:00Z',
      },
      {
        id: 'step-2',
        label: 'Discovery',
        technique: 'Network Scanning (T1046)',
        mitreId: 'T1046',
        confidence: 76,
        severity: 'low',
        detail: 'Attacker enumerated database servers using service account network access.',
        evidence: ['Netflow anomaly', 'Port scan signature', 'DNS query spike'],
        timestamp: '2024-12-14T02:15:00Z',
      },
      {
        id: 'step-3',
        label: 'Collection',
        technique: 'Database Query (T1213)',
        mitreId: 'T1213',
        confidence: 90,
        severity: 'high',
        detail: 'Large-scale SELECT queries against PII tables in DB-PROD-01 — 2.3GB exported.',
        evidence: ['DB audit trail', 'Query volume anomaly', 'Data classification alert'],
        timestamp: '2024-12-15T08:30:00Z',
      },
      {
        id: 'step-4',
        label: 'Exfiltration',
        technique: 'Cloud Storage (T1567.002)',
        mitreId: 'T1567.002',
        confidence: 93,
        severity: 'critical',
        detail: 'Data uploaded to unregistered cloud storage via non-standard TLS on port 8443.',
        evidence: ['DLP alert', 'Proxy logs', 'TLS cert mismatch', 'Outbound volume spike'],
        timestamp: '2024-12-15T11:20:00Z',
      },
    ],
  },
  {
    id: 'AC-003',
    incidentId: 'INC-2024-0843',
    title: 'DNS Tunneling C2 Channel',
    threat: 'Cobalt Strike / Unknown APT',
    overallConfidence: 79,
    severity: 'high',
    steps: [
      {
        id: 'step-1',
        label: 'Initial Compromise',
        technique: 'Drive-by Download (T1189)',
        mitreId: 'T1189',
        confidence: 65,
        severity: 'medium',
        detail: 'User visited compromised watering hole site, triggering browser exploit kit.',
        evidence: ['Proxy logs', 'Browser exploit signature', 'Endpoint alert'],
        timestamp: '2024-12-14T15:00:00Z',
      },
      {
        id: 'step-2',
        label: 'Persistence',
        technique: 'Registry Run Key (T1547.001)',
        mitreId: 'T1547.001',
        confidence: 78,
        severity: 'medium',
        detail: 'Beacon installed persistence via HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run.',
        evidence: ['Registry modification event', 'Sysmon Event ID 13', 'File hash match'],
        timestamp: '2024-12-14T15:05:00Z',
      },
      {
        id: 'step-3',
        label: 'C2 Communication',
        technique: 'DNS Tunneling (T1071.004)',
        mitreId: 'T1071.004',
        confidence: 85,
        severity: 'high',
        detail: 'High-frequency DNS TXT queries to xk4d.evil-dns.com encoding C2 commands.',
        evidence: ['DNS query frequency', 'Entropy analysis', 'Domain reputation', 'Beacon interval'],
        timestamp: '2024-12-15T10:05:00Z',
      },
    ],
  },
];
