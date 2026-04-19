import { describe, expect, it, vi } from 'vitest';

import { buildAlertTrend } from './incidentAnalytics';

describe('buildAlertTrend', () => {
  it('returns 24 buckets for the last 24 hours', () => {
    const trend = buildAlertTrend([]);
    expect(trend).toHaveLength(24);
    expect(trend[0]).toHaveProperty('hour');
    expect(trend[0]).toHaveProperty('total');
  });

  it('counts total for info incidents even when severity buckets stay zero', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06T12:30:00Z'));

    const trend = buildAlertTrend([
      {
        incident_id: 1,
        severity: 'info',
        created_at: '2026-04-06T12:10:00Z',
      },
    ]);

    const totalSum = trend.reduce((sum, point) => sum + point.total, 0);
    const severitySum = trend.reduce((sum, point) => sum + point.critical + point.high + point.medium + point.low, 0);

    expect(totalSum).toBe(1);
    expect(severitySum).toBe(0);

    vi.useRealTimers();
  });

  it('anchors to latest incident time for stale datasets', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-06T12:30:00Z'));

    const trend = buildAlertTrend([
      {
        incident_id: 1,
        severity: 'high',
        created_at: '2026-03-20T08:15:00Z',
      },
    ]);

    const totalSum = trend.reduce((sum, point) => sum + point.total, 0);
    expect(totalSum).toBe(1);

    vi.useRealTimers();
  });
});