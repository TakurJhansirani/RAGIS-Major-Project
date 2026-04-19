import { motion } from 'framer-motion';
import { ChevronRight, Shield, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AttackChainStep } from '@/types/attackChain';
import type { Severity } from '@/types/incident';

const severityColor: Record<Severity, string> = {
  critical: 'border-destructive bg-destructive/10 text-destructive',
  high: 'border-[hsl(25,95%,55%)] bg-[hsl(25,95%,55%)]/10 text-[hsl(25,95%,55%)]',
  medium: 'border-warning bg-warning/10 text-warning',
  low: 'border-primary bg-primary/10 text-primary',
  info: 'border-info bg-info/10 text-info',
};

const confidenceColor = (c: number) =>
  c >= 90 ? 'text-success' : c >= 75 ? 'text-warning' : 'text-destructive';

interface AttackChainDiagramProps {
  steps: AttackChainStep[];
  selectedStepId: string | null;
  onSelectStep: (id: string) => void;
}

export const AttackChainDiagram = ({ steps, selectedStepId, onSelectStep }: AttackChainDiagramProps) => {
  return (
    <div className="flex items-start gap-1 overflow-x-auto pb-4 px-1">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-start shrink-0">
          <motion.button
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onSelectStep(step.id)}
            className={cn(
              'relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 w-[160px] transition-all duration-200 cursor-pointer',
              selectedStepId === step.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary/30 scale-105'
                : 'border-border bg-card hover:border-muted-foreground/40'
            )}
          >
            {/* Step number */}
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold',
              severityColor[step.severity]
            )}>
              {i + 1}
            </div>

            {/* Label */}
            <span className="text-xs font-semibold text-foreground text-center leading-tight">
              {step.label}
            </span>

            {/* MITRE ID */}
            <span className="font-mono text-[10px] text-muted-foreground">
              {step.mitreId}
            </span>

            {/* Confidence bar */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">Confidence</span>
                <span className={cn('text-xs font-bold font-mono', confidenceColor(step.confidence))}>
                  {step.confidence}%
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${step.confidence}%` }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 0.5 }}
                  className={cn(
                    'h-full rounded-full',
                    step.confidence >= 90 ? 'bg-success' : step.confidence >= 75 ? 'bg-warning' : 'bg-destructive'
                  )}
                />
              </div>
            </div>
          </motion.button>

          {/* Arrow connector */}
          {i < steps.length - 1 && (
            <div className="flex items-center self-center pt-2 px-1">
              <div className="h-px w-4 bg-border" />
              <ChevronRight className="h-4 w-4 text-muted-foreground -ml-1" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
