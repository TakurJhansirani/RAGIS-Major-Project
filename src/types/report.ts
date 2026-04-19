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
