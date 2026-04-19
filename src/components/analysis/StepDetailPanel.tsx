import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Clock, Shield, ExternalLink, X } from 'lucide-react';
import { SeverityBadge } from '@/components/dashboard/SeverityBadge';
import type { AttackChainStep } from '@/types/attackChain';

interface StepDetailPanelProps {
  step: AttackChainStep | null;
  onClose: () => void;
}

export const StepDetailPanel = ({ step, onClose }: StepDetailPanelProps) => {
  if (!step) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-8">
        <div className="text-center">
          <Shield className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">Click a step in the chain to view details</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SeverityBadge severity={step.severity} />
              <span className="font-mono text-xs text-muted-foreground">{step.mitreId}</span>
            </div>
            <h3 className="text-base font-semibold text-foreground">{step.label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{step.technique}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Confidence */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">AI Confidence</span>
              <span className="text-lg font-bold font-mono text-primary">{step.confidence}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${step.confidence}%` }}
                transition={{ duration: 0.6 }}
                className="h-full rounded-full bg-primary"
              />
            </div>
          </div>

          {/* Detail */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> Analysis
            </h4>
            <p className="text-sm leading-relaxed text-foreground/90 rounded-lg bg-secondary/30 p-3 border border-border">
              {step.detail}
            </p>
          </div>

          {/* Evidence */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Evidence Sources
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {step.evidence.map((e) => (
                <span key={e} className="rounded-md border border-border bg-secondary px-2 py-1 text-[10px] font-mono text-secondary-foreground">
                  {e}
                </span>
              ))}
            </div>
          </div>

          {/* Timestamp */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
            <Clock className="h-3 w-3" />
            <span>{new Date(step.timestamp).toLocaleString()}</span>
            <a
              href={`https://attack.mitre.org/techniques/${step.mitreId.replace('.', '/')}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-primary hover:underline"
            >
              MITRE ATT&CK <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
