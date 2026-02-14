import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; isUp: boolean };
  variant?: 'default' | 'critical' | 'success' | 'warning';
  delay?: number;
}

const variantStyles = {
  default: 'border-border',
  critical: 'border-destructive/30 glow-destructive',
  success: 'border-success/30',
  warning: 'border-warning/30',
};

const iconVariantStyles = {
  default: 'bg-primary/10 text-primary',
  critical: 'bg-destructive/10 text-destructive',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
};

export const MetricCard = ({ title, value, subtitle, icon: Icon, trend, variant = 'default', delay = 0 }: MetricCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        'rounded-xl border bg-card p-3 sm:p-5 transition-all duration-300 hover:bg-card/80',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn('flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg shrink-0', iconVariantStyles[variant])}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1">
          <span className={cn('text-xs font-medium', trend.isUp ? 'text-destructive' : 'text-success')}>
            {trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-muted-foreground">vs last 24h</span>
        </div>
      )}
    </motion.div>
  );
};
