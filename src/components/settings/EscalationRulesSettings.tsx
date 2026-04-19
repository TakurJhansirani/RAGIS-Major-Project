import { useState } from 'react';
import { Bell, Plus, Trash2, ArrowUpRight } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { SeverityBadge } from '@/components/dashboard/SeverityBadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Severity } from '@/types/incident';

interface EscalationRule {
  id: string;
  name: string;
  condition: string;
  severity: Severity;
  action: string;
  notifyChannel: string;
  enabled: boolean;
}

const initialRules: EscalationRule[] = [
  { id: 'r1', name: 'Critical Auto-Escalate', condition: 'Severity = Critical AND Risk Score > 90', severity: 'critical', action: 'Page on-call + create war room', notifyChannel: '#soc-critical', enabled: true },
  { id: 'r2', name: 'High Unacknowledged', condition: 'Severity = High AND unacknowledged > 15min', severity: 'high', action: 'Escalate to Tier 2 analyst', notifyChannel: '#soc-high', enabled: true },
  { id: 'r3', name: 'Data Exfiltration Alert', condition: 'Category = Data Exfiltration', severity: 'critical', action: 'Notify CISO + Legal + freeze account', notifyChannel: '#incident-response', enabled: true },
  { id: 'r4', name: 'Repeat Offender', condition: 'Same source IP > 3 incidents in 24h', severity: 'medium', action: 'Auto-block IP + create investigation', notifyChannel: '#soc-general', enabled: false },
  { id: 'r5', name: 'After-Hours Critical', condition: 'Severity >= High AND time outside 08:00-18:00', severity: 'high', action: 'Page on-call manager', notifyChannel: '#soc-afterhours', enabled: true },
];

export const EscalationRulesSettings = () => {
  const [rules, setRules] = useState(initialRules);

  const toggleRule = (id: string) => {
    setRules(prev => prev.map(r => {
      if (r.id !== id) return r;
      toast.success(`Rule "${r.name}" ${!r.enabled ? 'enabled' : 'disabled'}`);
      return { ...r, enabled: !r.enabled };
    }));
  };

  const deleteRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success(`Rule "${rule?.name}" deleted`);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Escalation Rules</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Automated response and notification policies based on incident conditions</p>
          </div>
          <button
            onClick={() => toast.info('Rule editor coming soon')}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
          >
            <Plus className="h-3 w-3" /> Add Rule
          </button>
        </div>

        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className={cn(
              'rounded-lg border p-4 transition-colors',
              rule.enabled ? 'border-border bg-secondary/30' : 'border-border/50 bg-secondary/10 opacity-60'
            )}>
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{rule.name}</h3>
                    <SeverityBadge severity={rule.severity} />
                  </div>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p><span className="font-semibold text-foreground/70">If:</span> {rule.condition}</p>
                    <p><span className="font-semibold text-foreground/70">Then:</span> {rule.action}</p>
                    <p className="font-mono text-[10px]">
                      <ArrowUpRight className="inline h-3 w-3 mr-0.5" />
                      {rule.notifyChannel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
