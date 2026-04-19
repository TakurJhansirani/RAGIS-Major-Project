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
  ttd: number; // Time to detect (minutes)
  ttr: number; // Time to resolve (minutes)
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

export const resolvedIncidents: ResolvedIncident[] = [
  {
    id: 'INC-2024-0839',
    title: 'Ransomware Dropper — Finance Server',
    severity: 'critical',
    category: 'Malware',
    resolvedAt: '2024-12-14T18:45:00Z',
    detectedAt: '2024-12-14T14:20:00Z',
    resolvedBy: 'Sarah Chen',
    rootCause: 'Malicious macro in spoofed vendor invoice delivered via compromised email relay. Exploited CVE-2024-21413 in Outlook preview pane.',
    resolution: 'Isolated affected endpoint, removed dropper payload, patched Outlook vulnerability across fleet. Blocked sender domain and IP range at mail gateway.',
    aiAccuracy: 91,
    lessonsLearned: 'Preview pane exploitation requires urgent patching policy. AI correctly identified ransomware family but missed the initial email relay compromise vector.',
    tags: ['ransomware', 'cve-2024-21413', 'macro', 'email'],
    ttd: 8,
    ttr: 265,
  },
  {
    id: 'INC-2024-0835',
    title: 'Credential Stuffing — Customer Portal',
    severity: 'high',
    category: 'Brute Force',
    resolvedAt: '2024-12-13T22:10:00Z',
    detectedAt: '2024-12-13T19:30:00Z',
    resolvedBy: 'Marcus Johnson',
    rootCause: 'Automated credential stuffing using leaked database from third-party breach. Targeted customer SSO portal with 45,000 attempts from botnet.',
    resolution: 'Enabled rate limiting and CAPTCHA on login endpoint. Force-reset compromised accounts (23 successful logins). Implemented IP reputation scoring.',
    aiAccuracy: 88,
    lessonsLearned: 'AI rate of detection improved after adding IP reputation feeds. Need to implement credential breach monitoring for proactive alerts.',
    tags: ['credential-stuffing', 'botnet', 'sso', 'account-takeover'],
    ttd: 12,
    ttr: 160,
  },
  {
    id: 'INC-2024-0828',
    title: 'Insider Threat — Unauthorized Data Access',
    severity: 'high',
    category: 'Insider Threat',
    resolvedAt: '2024-12-12T16:30:00Z',
    detectedAt: '2024-12-12T09:15:00Z',
    resolvedBy: 'Aisha Patel',
    rootCause: 'Departing employee accessed restricted HR database and exported 2,400 employee records via personal cloud storage. Activity outside normal working hours triggered UEBA alert.',
    resolution: 'Revoked all access, secured exported data through legal hold, initiated forensic investigation. Enhanced DLP rules for cloud storage uploads.',
    aiAccuracy: 76,
    lessonsLearned: 'AI initially scored this as medium severity due to internal source IP. UEBA integration improved insider threat detection. Need to weight departing employee status higher in risk scoring.',
    tags: ['insider-threat', 'data-loss', 'ueba', 'hr-data'],
    ttd: 45,
    ttr: 435,
  },
  {
    id: 'INC-2024-0821',
    title: 'DNS Hijacking — Marketing Subdomain',
    severity: 'medium',
    category: 'Unauthorized Access',
    resolvedAt: '2024-12-11T14:00:00Z',
    detectedAt: '2024-12-11T10:20:00Z',
    resolvedBy: 'David Kim',
    rootCause: 'Expired subdomain delegation exploited for DNS hijacking. Attacker set up phishing page on marketing.company.com via dangling CNAME record.',
    resolution: 'Removed dangling CNAME, reclaimed subdomain control, implemented subdomain monitoring. Scanned all DNS records for similar vulnerabilities.',
    aiAccuracy: 82,
    lessonsLearned: 'Dangling DNS records are a blind spot. AI knowledge base updated with subdomain takeover patterns. Certificate transparency monitoring added.',
    tags: ['dns-hijack', 'subdomain-takeover', 'phishing', 'cname'],
    ttd: 22,
    ttr: 220,
  },
  {
    id: 'INC-2024-0815',
    title: 'Cryptominer — Kubernetes Cluster',
    severity: 'medium',
    category: 'Malware',
    resolvedAt: '2024-12-10T20:15:00Z',
    detectedAt: '2024-12-10T11:00:00Z',
    resolvedBy: 'Sarah Chen',
    rootCause: 'Exposed Kubernetes dashboard with default credentials. Attacker deployed XMRig cryptominer pods consuming 40% cluster CPU.',
    resolution: 'Killed malicious pods, rotated all K8s credentials, restricted dashboard access to VPN. Implemented pod security policies and resource quotas.',
    aiAccuracy: 95,
    lessonsLearned: 'AI correctly identified cryptomining behavior from CPU anomaly patterns within 10 minutes. High confidence detection — model performs well on resource abuse patterns.',
    tags: ['cryptominer', 'kubernetes', 'misconfiguration', 'xmrig'],
    ttd: 10,
    ttr: 555,
  },
  {
    id: 'INC-2024-0808',
    title: 'Supply Chain — Compromised NPM Package',
    severity: 'critical',
    category: 'Malware',
    resolvedAt: '2024-12-09T23:50:00Z',
    detectedAt: '2024-12-09T15:30:00Z',
    resolvedBy: 'Marcus Johnson',
    rootCause: 'Typosquatted NPM package "lodash-utils-2" included reverse shell in postinstall script. Developer installed during sprint, triggering outbound connection to C2 server.',
    resolution: 'Removed package, rebuilt affected CI/CD pipelines, audited all dependencies. Implemented SCA tooling and private registry with pre-approval.',
    aiAccuracy: 72,
    lessonsLearned: 'AI struggled with supply chain attack classification — initially categorized as generic malware. Knowledge base updated with software supply chain attack patterns and indicators.',
    tags: ['supply-chain', 'npm', 'typosquatting', 'c2'],
    ttd: 35,
    ttr: 500,
  },
];

export const analystNotes: AnalystNote[] = [
  {
    id: 'NOTE-001',
    incidentId: 'INC-2024-0839',
    author: 'Sarah Chen',
    role: 'Tier 3 Analyst',
    content: 'Ransomware variant matches LockBit 3.0 signature but with modified encryption routine. AI summary was accurate on family identification but missed the Outlook preview pane as initial vector. Recommend adding CVE correlation to RAG pipeline.',
    timestamp: '2024-12-14T19:00:00Z',
    type: 'correction',
    aiRelevant: true,
  },
  {
    id: 'NOTE-002',
    incidentId: 'INC-2024-0835',
    author: 'Marcus Johnson',
    role: 'Tier 2 Analyst',
    content: 'Botnet source IPs overlap with Mirai variant infrastructure from November. AI prioritization was correct — escalation threshold worked well here. Suggest adding credential breach database correlation for proactive detection.',
    timestamp: '2024-12-13T22:30:00Z',
    type: 'observation',
    aiRelevant: true,
  },
  {
    id: 'NOTE-003',
    incidentId: 'INC-2024-0828',
    author: 'Aisha Patel',
    role: 'Tier 3 Analyst',
    content: 'AI under-scored this incident severity because source was internal. Insider threat weighting needs adjustment — departing employees with HR database access should trigger elevated risk scoring automatically.',
    timestamp: '2024-12-12T17:00:00Z',
    type: 'correction',
    aiRelevant: true,
  },
  {
    id: 'NOTE-004',
    incidentId: 'INC-2024-0828',
    author: 'James Rodriguez',
    role: 'SOC Manager',
    content: 'Escalated to legal and HR teams. DLP policy updated to block personal cloud storage uploads from privileged accounts. Quarterly access review process initiated for sensitive databases.',
    timestamp: '2024-12-12T17:30:00Z',
    type: 'escalation',
    aiRelevant: false,
  },
  {
    id: 'NOTE-005',
    incidentId: 'INC-2024-0821',
    author: 'David Kim',
    role: 'Tier 2 Analyst',
    content: 'Subdomain takeover via dangling CNAME is a new pattern for our environment. Recommend weekly automated DNS audit scans. AI should flag domain ownership changes as potential indicators.',
    timestamp: '2024-12-11T14:30:00Z',
    type: 'recommendation',
    aiRelevant: true,
  },
  {
    id: 'NOTE-006',
    incidentId: 'INC-2024-0815',
    author: 'Sarah Chen',
    role: 'Tier 3 Analyst',
    content: 'Excellent AI detection speed on this one — CPU anomaly correctly identified within 10 minutes. Model performs exceptionally well on resource abuse patterns. No corrections needed.',
    timestamp: '2024-12-10T20:30:00Z',
    type: 'observation',
    aiRelevant: true,
  },
  {
    id: 'NOTE-007',
    incidentId: 'INC-2024-0808',
    author: 'Marcus Johnson',
    role: 'Tier 2 Analyst',
    content: 'AI classified this as generic malware instead of supply chain attack. The RAG pipeline needs supply chain-specific training data. Typosquatting indicators should be added to the knowledge base.',
    timestamp: '2024-12-09T23:55:00Z',
    type: 'correction',
    aiRelevant: true,
  },
];

export const aiLearningHistory: AILearningEntry[] = [
  {
    id: 'LEARN-001',
    timestamp: '2024-12-15T06:00:00Z',
    type: 'model-update',
    title: 'RAG Pipeline — Supply Chain Attack Patterns',
    description: 'Added 47 new supply chain attack indicators to vector database including typosquatting, dependency confusion, and compromised CI/CD patterns. Knowledge base now includes 12 real-world supply chain incident reports.',
    impact: 'positive',
    relatedIncidents: ['INC-2024-0808'],
    metricsChange: { metric: 'Supply Chain Detection Rate', before: 68, after: 84 },
  },
  {
    id: 'LEARN-002',
    timestamp: '2024-12-14T20:00:00Z',
    type: 'threshold-adjusted',
    title: 'Insider Threat Risk Scoring Update',
    description: 'Increased risk weight for internal-source incidents involving departing employees and privileged database access. Departing employee flag now adds +25 to base risk score.',
    impact: 'positive',
    relatedIncidents: ['INC-2024-0828'],
    metricsChange: { metric: 'Insider Threat Accuracy', before: 76, after: 89 },
  },
  {
    id: 'LEARN-003',
    timestamp: '2024-12-13T23:00:00Z',
    type: 'fp-correction',
    title: 'False Positive Rule Tuning — PowerShell Scripts',
    description: 'Tuned detection rule for scheduled PowerShell execution to exclude approved IT maintenance scripts. Hash whitelist updated with 15 new approved script signatures.',
    impact: 'positive',
    relatedIncidents: ['INC-2024-0841'],
    metricsChange: { metric: 'False Positive Rate', before: 15.2, after: 12.4 },
  },
  {
    id: 'LEARN-004',
    timestamp: '2024-12-12T12:00:00Z',
    type: 'pattern-learned',
    title: 'DNS Subdomain Takeover Detection Pattern',
    description: 'New detection pattern added for dangling CNAME records and subdomain takeover attempts. Integrates certificate transparency log monitoring for early warning.',
    impact: 'positive',
    relatedIncidents: ['INC-2024-0821'],
  },
  {
    id: 'LEARN-005',
    timestamp: '2024-12-11T08:00:00Z',
    type: 'rule-tuned',
    title: 'Credential Stuffing Detection Enhancement',
    description: 'Added IP reputation feed correlation to brute-force detection rules. Login velocity thresholds adjusted from 50/min to 30/min per source IP after botnet analysis.',
    impact: 'positive',
    relatedIncidents: ['INC-2024-0835'],
    metricsChange: { metric: 'Brute Force Detection Time', before: 18, after: 12 },
  },
  {
    id: 'LEARN-006',
    timestamp: '2024-12-10T15:00:00Z',
    type: 'model-update',
    title: 'Cryptomining Behavior Model Reinforcement',
    description: 'Reinforced CPU anomaly detection model with Kubernetes-specific telemetry. Added container-level resource monitoring patterns from resolved cryptominer incidents.',
    impact: 'positive',
    relatedIncidents: ['INC-2024-0815'],
    metricsChange: { metric: 'Cryptomining Detection Confidence', before: 88, after: 95 },
  },
  {
    id: 'LEARN-007',
    timestamp: '2024-12-09T10:00:00Z',
    type: 'threshold-adjusted',
    title: 'CVE Correlation — Auto-Severity Upgrade',
    description: 'Incidents involving actively exploited CVEs (CISA KEV list) now automatically receive +15 severity score boost. Reduces analyst triage time for known vulnerability exploitation.',
    impact: 'positive',
    relatedIncidents: ['INC-2024-0839'],
    metricsChange: { metric: 'Critical Alert Triage Time', before: 8, after: 5 },
  },
];
