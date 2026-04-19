import { cn } from '@/lib/utils';
import type { Severity } from '@/types/incident';

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

const severityConfig: Record<Severity, { label: string; className: string }> = {
  critical: { label: 'CRITICAL', className: 'bg-severity-critical/15 text-severity-critical border-severity-critical/30' },
  high: { label: 'HIGH', className: 'bg-severity-high/15 text-severity-high border-severity-high/30' },
  medium: { label: 'MEDIUM', className: 'bg-severity-medium/15 text-severity-medium border-severity-medium/30' },
  low: { label: 'LOW', className: 'bg-severity-low/15 text-severity-low border-severity-low/30' },
  info: { label: 'INFO', className: 'bg-severity-info/15 text-severity-info border-severity-info/30' },
};

export const SeverityBadge = ({ severity, className }: SeverityBadgeProps) => {
  const config = severityConfig[severity];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-bold tracking-wider',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
};
