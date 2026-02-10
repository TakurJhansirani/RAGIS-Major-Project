export type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export interface KPIMetric {
  label: string;
  value: number;
  previousValue: number;
  unit: string;
  trend: 'up' | 'down' | 'flat';
  trendIsGood: boolean;
}

export interface SeverityBreakdown {
  severity: string;
  count: number;
  percentage: number;
}

export interface CategoryBreakdown {
  category: string;
  count: number;
  resolved: number;
  avgResponseMin: number;
}

export interface WeeklyTrendPoint {
  date: string;
  incidents: number;
  resolved: number;
  falsePositives: number;
  mttr: number;
}

export interface ReportSummary {
  period: ReportPeriod;
  dateRange: string;
  generatedAt: string;
  totalIncidents: number;
  resolved: number;
  escalated: number;
  falsePositives: number;
  mttr: number;
  aiAccuracy: number;
  analystHoursSaved: number;
  topThreats: string[];
  executiveSummary: string;
}

// KPI data
export const kpiMetrics: Record<ReportPeriod, KPIMetric[]> = {
  daily: [
    { label: 'Total Incidents', value: 47, previousValue: 52, unit: '', trend: 'down', trendIsGood: true },
    { label: 'Mean Time to Resolve', value: 28, previousValue: 34, unit: 'min', trend: 'down', trendIsGood: true },
    { label: 'False Positive Rate', value: 11.2, previousValue: 14.8, unit: '%', trend: 'down', trendIsGood: true },
    { label: 'AI Accuracy', value: 91.4, previousValue: 89.1, unit: '%', trend: 'up', trendIsGood: true },
    { label: 'Escalations', value: 3, previousValue: 5, unit: '', trend: 'down', trendIsGood: true },
    { label: 'Analyst Hours Saved', value: 6.2, previousValue: 5.1, unit: 'hrs', trend: 'up', trendIsGood: true },
  ],
  weekly: [
    { label: 'Total Incidents', value: 312, previousValue: 348, unit: '', trend: 'down', trendIsGood: true },
    { label: 'Mean Time to Resolve', value: 31, previousValue: 38, unit: 'min', trend: 'down', trendIsGood: true },
    { label: 'False Positive Rate', value: 12.4, previousValue: 15.7, unit: '%', trend: 'down', trendIsGood: true },
    { label: 'AI Accuracy', value: 89.7, previousValue: 86.3, unit: '%', trend: 'up', trendIsGood: true },
    { label: 'Escalations', value: 18, previousValue: 24, unit: '', trend: 'down', trendIsGood: true },
    { label: 'Analyst Hours Saved', value: 42.5, previousValue: 35.8, unit: 'hrs', trend: 'up', trendIsGood: true },
  ],
  monthly: [
    { label: 'Total Incidents', value: 1247, previousValue: 1389, unit: '', trend: 'down', trendIsGood: true },
    { label: 'Mean Time to Resolve', value: 34, previousValue: 42, unit: 'min', trend: 'down', trendIsGood: true },
    { label: 'False Positive Rate', value: 13.1, previousValue: 18.4, unit: '%', trend: 'down', trendIsGood: true },
    { label: 'AI Accuracy', value: 87.2, previousValue: 81.5, unit: '%', trend: 'up', trendIsGood: true },
    { label: 'Escalations', value: 67, previousValue: 89, unit: '', trend: 'down', trendIsGood: true },
    { label: 'Analyst Hours Saved', value: 184, previousValue: 142, unit: 'hrs', trend: 'up', trendIsGood: true },
  ],
};

export const severityBreakdowns: Record<ReportPeriod, SeverityBreakdown[]> = {
  daily: [
    { severity: 'Critical', count: 4, percentage: 8.5 },
    { severity: 'High', count: 9, percentage: 19.1 },
    { severity: 'Medium', count: 15, percentage: 31.9 },
    { severity: 'Low', count: 12, percentage: 25.5 },
    { severity: 'Info', count: 7, percentage: 14.9 },
  ],
  weekly: [
    { severity: 'Critical', count: 23, percentage: 7.4 },
    { severity: 'High', count: 58, percentage: 18.6 },
    { severity: 'Medium', count: 102, percentage: 32.7 },
    { severity: 'Low', count: 84, percentage: 26.9 },
    { severity: 'Info', count: 45, percentage: 14.4 },
  ],
  monthly: [
    { severity: 'Critical', count: 87, percentage: 7.0 },
    { severity: 'High', count: 231, percentage: 18.5 },
    { severity: 'Medium', count: 412, percentage: 33.0 },
    { severity: 'Low', count: 337, percentage: 27.0 },
    { severity: 'Info', count: 180, percentage: 14.4 },
  ],
};

export const categoryBreakdowns: Record<ReportPeriod, CategoryBreakdown[]> = {
  daily: [
    { category: 'Malware', count: 12, resolved: 10, avgResponseMin: 22 },
    { category: 'Phishing', count: 10, resolved: 9, avgResponseMin: 18 },
    { category: 'Brute Force', count: 8, resolved: 8, avgResponseMin: 12 },
    { category: 'Unauthorized Access', count: 6, resolved: 4, avgResponseMin: 45 },
    { category: 'Reconnaissance', count: 5, resolved: 5, avgResponseMin: 8 },
    { category: 'Data Exfiltration', count: 4, resolved: 2, avgResponseMin: 65 },
    { category: 'DoS', count: 2, resolved: 2, avgResponseMin: 15 },
  ],
  weekly: [
    { category: 'Malware', count: 84, resolved: 76, avgResponseMin: 25 },
    { category: 'Phishing', count: 68, resolved: 62, avgResponseMin: 20 },
    { category: 'Brute Force', count: 56, resolved: 54, avgResponseMin: 14 },
    { category: 'Unauthorized Access', count: 38, resolved: 30, avgResponseMin: 48 },
    { category: 'Reconnaissance', count: 31, resolved: 31, avgResponseMin: 10 },
    { category: 'Data Exfiltration', count: 22, resolved: 16, avgResponseMin: 72 },
    { category: 'DoS', count: 13, resolved: 12, avgResponseMin: 18 },
  ],
  monthly: [
    { category: 'Malware', count: 349, resolved: 320, avgResponseMin: 28 },
    { category: 'Phishing', count: 274, resolved: 258, avgResponseMin: 22 },
    { category: 'Brute Force', count: 225, resolved: 218, avgResponseMin: 15 },
    { category: 'Unauthorized Access', count: 150, resolved: 124, avgResponseMin: 52 },
    { category: 'Reconnaissance', count: 125, resolved: 122, avgResponseMin: 11 },
    { category: 'Data Exfiltration', count: 75, resolved: 58, avgResponseMin: 78 },
    { category: 'DoS', count: 49, resolved: 45, avgResponseMin: 20 },
  ],
};

export const weeklyTrends: WeeklyTrendPoint[] = [
  { date: 'Mon', incidents: 52, resolved: 48, falsePositives: 7, mttr: 32 },
  { date: 'Tue', incidents: 48, resolved: 45, falsePositives: 5, mttr: 29 },
  { date: 'Wed', incidents: 61, resolved: 55, falsePositives: 9, mttr: 35 },
  { date: 'Thu', incidents: 44, resolved: 42, falsePositives: 4, mttr: 27 },
  { date: 'Fri', incidents: 39, resolved: 38, falsePositives: 6, mttr: 25 },
  { date: 'Sat', incidents: 28, resolved: 27, falsePositives: 3, mttr: 22 },
  { date: 'Sun', incidents: 40, resolved: 37, falsePositives: 5, mttr: 30 },
];

export const monthlyTrends: WeeklyTrendPoint[] = [
  { date: 'Week 1', incidents: 312, resolved: 285, falsePositives: 42, mttr: 38 },
  { date: 'Week 2', incidents: 298, resolved: 278, falsePositives: 35, mttr: 35 },
  { date: 'Week 3', incidents: 325, resolved: 310, falsePositives: 38, mttr: 32 },
  { date: 'Week 4', incidents: 312, resolved: 302, falsePositives: 30, mttr: 28 },
];

export const reportSummaries: Record<ReportPeriod, ReportSummary> = {
  daily: {
    period: 'daily',
    dateRange: 'December 15, 2024',
    generatedAt: '2024-12-15T23:59:00Z',
    totalIncidents: 47,
    resolved: 40,
    escalated: 3,
    falsePositives: 5,
    mttr: 28,
    aiAccuracy: 91.4,
    analystHoursSaved: 6.2,
    topThreats: ['Lateral Movement via Pass-the-Hash', 'Executive Spear-Phishing Campaign', 'DNS Tunneling C2 Communication'],
    executiveSummary: 'Today saw a 9.6% decrease in total incidents compared to yesterday. A critical lateral movement attack targeting the Domain Controller was escalated and contained within 45 minutes. The AI engine successfully identified and filtered 5 false positives, saving approximately 6.2 analyst hours. Overall MTTR improved to 28 minutes, a 17.6% improvement. Recommendation: Review pass-the-hash detection rules and update phishing indicators.',
  },
  weekly: {
    period: 'weekly',
    dateRange: 'December 9–15, 2024',
    generatedAt: '2024-12-15T23:59:00Z',
    totalIncidents: 312,
    resolved: 287,
    escalated: 18,
    falsePositives: 39,
    mttr: 31,
    aiAccuracy: 89.7,
    analystHoursSaved: 42.5,
    topThreats: ['Coordinated Phishing Campaign (APT29 TTPs)', 'Ransomware Dropper on Finance Server', 'Data Exfiltration via Cloud Storage'],
    executiveSummary: 'This week showed a 10.3% reduction in total incidents with MTTR improving by 18.4%. The AI-driven false positive reduction engine eliminated 39 redundant alerts, saving 42.5 analyst hours. Critical escalations dropped from 24 to 18. A coordinated phishing campaign matching APT29 tactics was identified early through RAG-based pattern matching. Key action items: Patch finance server vulnerabilities, strengthen email gateway rules, and review data loss prevention policies.',
  },
  monthly: {
    period: 'monthly',
    dateRange: 'December 2024',
    generatedAt: '2024-12-31T23:59:00Z',
    totalIncidents: 1247,
    resolved: 1145,
    escalated: 67,
    falsePositives: 163,
    mttr: 34,
    aiAccuracy: 87.2,
    analystHoursSaved: 184,
    topThreats: ['Persistent APT29 Campaign', 'Insider Threat — Credential Abuse', 'Ransomware-as-a-Service (RaaS) Attempts'],
    executiveSummary: 'December recorded 1,247 total incidents — a 10.2% decrease from November. The RAGIS AI engine achieved 87.2% accuracy (up from 81.5%) and saved an estimated 184 analyst hours through automated triage and false positive filtering. Critical escalations decreased by 24.7%. The self-learning knowledge base incorporated 12 new analyst corrections, improving detection for insider threats. Strategic recommendations: Invest in endpoint detection enhancement, conduct tabletop exercises for ransomware scenarios, and expand AI training data for novel attack patterns.',
  },
};
