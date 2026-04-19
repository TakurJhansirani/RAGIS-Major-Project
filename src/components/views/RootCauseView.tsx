import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { GitBranch, Shield, Brain, Target } from 'lucide-react';
import type { AttackChain } from '@/types/attackChain';
import { AttackChainDiagram } from '@/components/analysis/AttackChainDiagram';
import { StepDetailPanel } from '@/components/analysis/StepDetailPanel';
import { SeverityBadge } from '@/components/dashboard/SeverityBadge';
import { cn } from '@/lib/utils';
import { useRecentIncidents } from '@/hooks/useIncidents';

export const RootCauseView = () => {
  const { data: recentIncidents = [] } = useRecentIncidents(12);
  const attackChains = useMemo<AttackChain[]>(() => {
    return (recentIncidents as any[]).map((incident) => {
      const incidentId = String(incident.incident_id ?? incident.id ?? '0');
      const confidence = Number(incident.confidence_score ?? 75);
      const boundedConfidence = Math.max(40, Math.min(99, confidence));
      const severity = incident.severity ?? 'medium';
      const createdAt = incident.created_at ?? new Date().toISOString();

      const steps = [
        {
          id: `step-${incidentId}-1`,
          label: 'Initial Access',
          technique: `Suspicious ${incident.category || 'activity'} vector`,
          mitreId: 'T1078',
          confidence: Math.max(40, boundedConfidence - 8),
          severity,
          detail: incident.description || 'Initial compromise activity detected from incident telemetry.',
          evidence: ['Incident feed', 'Alert correlation', 'SIEM telemetry'],
          timestamp: createdAt,
        },
        {
          id: `step-${incidentId}-2`,
          label: 'Execution',
          technique: 'Malicious execution chain reconstruction',
          mitreId: 'T1059',
          confidence: boundedConfidence,
          severity,
          detail: incident.ai_summary || 'Execution behavior inferred from AI summary and incident metadata.',
          evidence: ['AI summary', 'Host artifacts', 'Process lineage'],
          timestamp: incident.updated_at || createdAt,
        },
        {
          id: `step-${incidentId}-3`,
          label: 'Impact',
          technique: `Target impact against ${incident.target_ip || 'enterprise assets'}`,
          mitreId: 'T1499',
          confidence: Math.min(99, boundedConfidence + 4),
          severity,
          detail: `Risk score ${incident.risk_score ?? 'N/A'} with affected assets: ${(incident.affected_assets || []).join(', ') || 'not provided'}.`,
          evidence: ['Risk score', 'Affected assets', 'Status updates'],
          timestamp: incident.updated_at || createdAt,
        },
      ];

      return {
        id: `AC-${incidentId}`,
        incidentId: `INC-${incidentId}`,
        title: incident.title || 'Untitled Incident',
        threat: String(incident.category || 'Unknown Threat').replace(/-/g, ' '),
        overallConfidence: Math.round(steps.reduce((acc, step) => acc + step.confidence, 0) / steps.length),
        severity,
        steps,
      };
    });
  }, [recentIncidents]);

  const [selectedChainId, setSelectedChainId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  const selectedChain = useMemo(() => {
    if (attackChains.length === 0) return null;
    if (selectedChainId) {
      const matched = attackChains.find((chain) => chain.id === selectedChainId);
      if (matched) return matched;
    }
    return attackChains[0];
  }, [attackChains, selectedChainId]);

  if (!selectedChain) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Root Cause Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            No live incidents available yet to reconstruct attack chains.
          </p>
        </div>
      </div>
    );
  }

  const selectedStep = selectedChain.steps.find((s) => s.id === selectedStepId) ?? null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-primary" />
            Root Cause Analysis
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI-reconstructed attack chains with MITRE ATT&CK mapping and confidence scoring
          </p>
        </div>
      </div>

      {/* Chain Selector */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {attackChains.map((chain) => (
          <motion.button
            key={chain.id}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => {
              setSelectedChainId(chain.id);
              setSelectedStepId(null);
            }}
            className={cn(
              'flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all',
              selectedChain.id === chain.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border-border bg-card hover:border-muted-foreground/30'
            )}
          >
            <div className="flex items-center gap-2 w-full">
              <SeverityBadge severity={chain.severity} />
              <span className="font-mono text-[10px] text-muted-foreground">{chain.id}</span>
              <span className={cn(
                'ml-auto text-xs font-bold font-mono',
                chain.overallConfidence >= 90 ? 'text-success' : chain.overallConfidence >= 75 ? 'text-warning' : 'text-destructive'
              )}>
                {chain.overallConfidence}%
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground">{chain.title}</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Target className="h-3 w-3" />
              {chain.threat}
              <span className="mx-1">•</span>
              {chain.steps.length} steps
            </div>
          </motion.button>
        ))}
      </div>

      {/* Attack Chain Diagram */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Attack Chain — {selectedChain.title}</h2>
          <span className="ml-auto text-xs text-muted-foreground font-mono">{selectedChain.incidentId}</span>
        </div>
        <AttackChainDiagram
          steps={selectedChain.steps}
          selectedStepId={selectedStepId}
          onSelectStep={setSelectedStepId}
        />
      </div>

      {/* Step Detail */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Summary stats */}
        <div className="space-y-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Chain Summary</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-secondary/50 border border-border p-3 text-center">
                <p className="text-lg font-bold text-foreground">{selectedChain.steps.length}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Attack Steps</p>
              </div>
              <div className="rounded-lg bg-secondary/50 border border-border p-3 text-center">
                <p className={cn(
                  'text-lg font-bold font-mono',
                  selectedChain.overallConfidence >= 90 ? 'text-success' : 'text-warning'
                )}>
                  {selectedChain.overallConfidence}%
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Overall Confidence</p>
              </div>
              <div className="rounded-lg bg-secondary/50 border border-border p-3 text-center">
                <p className="text-lg font-bold text-foreground">
                  {Math.round(selectedChain.steps.reduce((a, s) => a + s.confidence, 0) / selectedChain.steps.length)}%
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg Step Confidence</p>
              </div>
              <div className="rounded-lg bg-secondary/50 border border-border p-3 text-center">
                <p className="text-lg font-bold text-destructive">
                  {selectedChain.steps.filter((s) => s.severity === 'critical').length}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Critical Steps</p>
              </div>
            </div>
          </div>

          {/* MITRE Techniques */}
          <div className="rounded-xl border border-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              MITRE ATT&CK Techniques
            </h3>
            <div className="space-y-2">
              {selectedChain.steps.map((step) => (
                <div
                  key={step.id}
                  onClick={() => setSelectedStepId(step.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border border-border p-2.5 cursor-pointer transition-colors',
                    selectedStepId === step.id ? 'bg-primary/5 border-primary/30' : 'hover:bg-secondary/50'
                  )}
                >
                  <SeverityBadge severity={step.severity} />
                  <span className="text-xs font-medium text-foreground flex-1">{step.label}</span>
                  <span className="font-mono text-[10px] text-muted-foreground">{step.mitreId}</span>
                  <span className={cn(
                    'text-xs font-bold font-mono',
                    step.confidence >= 90 ? 'text-success' : step.confidence >= 75 ? 'text-warning' : 'text-destructive'
                  )}>
                    {step.confidence}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step detail panel */}
        <StepDetailPanel step={selectedStep} onClose={() => setSelectedStepId(null)} />
      </div>
    </div>
  );
};
