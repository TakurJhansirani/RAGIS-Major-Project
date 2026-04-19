import { useEffect, useState } from 'react';
import { Brain, Zap, CheckCircle } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { setBackendFallbackActive } from '@/hooks/useFallbackMode';

interface AIModel {
  id: string;
  name: string;
  description: string;
  accuracy: number;
  latency: string;
  active: boolean;
}

interface AIModelSettingsResponse {
  confidence_threshold?: number;
  auto_triage?: boolean;
  models?: AIModel[];
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const initialModels: AIModel[] = [
  { id: 'ragis-core', name: 'RAGIS Core v3.2', description: 'Primary threat classification and triage model', accuracy: 94.2, latency: '120ms', active: true },
  { id: 'anomaly-det', name: 'Anomaly Detector v2.1', description: 'Behavioral anomaly detection using UEBA signals', accuracy: 89.7, latency: '85ms', active: true },
  { id: 'nlp-summarizer', name: 'NLP Summarizer v1.8', description: 'Incident narrative generation and executive summaries', accuracy: 91.3, latency: '200ms', active: true },
  { id: 'fp-filter', name: 'False Positive Filter v4.0', description: 'Reduces alert fatigue by identifying benign alerts', accuracy: 96.1, latency: '45ms', active: false },
  { id: 'threat-intel', name: 'Threat Intel Enricher v2.5', description: 'IOC enrichment from OSINT and commercial feeds', accuracy: 88.5, latency: '350ms', active: false },
];

export const AIModelSettings = () => {
  const [models, setModels] = useState<AIModel[]>(initialModels);
  const [confidenceThreshold, setConfidenceThreshold] = useState([75]);
  const [autoTriage, setAutoTriage] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadModelSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings/ai-models/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch AI model settings: ${response.status}`);
        }

        const payload = (await response.json()) as AIModelSettingsResponse;
        if (!isMounted) return;

        if (Array.isArray(payload.models) && payload.models.length > 0) {
          setModels(payload.models);
        }

        if (typeof payload.confidence_threshold === 'number') {
          setConfidenceThreshold([payload.confidence_threshold]);
        }

        if (typeof payload.auto_triage === 'boolean') {
          setAutoTriage(payload.auto_triage);
        }

        setBackendFallbackActive('ai-model-settings', false);
      } catch {
        if (!isMounted) return;
        setModels(initialModels);
        setConfidenceThreshold([75]);
        setAutoTriage(true);
        setBackendFallbackActive('ai-model-settings', true);
      }
    };

    loadModelSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleModel = (id: string) => {
    setModels(prev => prev.map(m => {
      if (m.id !== id) return m;
      toast.success(`${m.name} ${!m.active ? 'activated' : 'deactivated'}`);
      return { ...m, active: !m.active };
    }));
  };

  return (
    <div className="space-y-4">
      {/* Global AI Settings */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-4">Global AI Configuration</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Confidence Threshold — {confidenceThreshold[0]}%
            </label>
            <p className="text-[10px] text-muted-foreground mb-3">Minimum AI confidence before auto-classifying alerts</p>
            <Slider value={confidenceThreshold} onValueChange={setConfidenceThreshold} min={50} max={99} step={1} className="w-full" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
              Auto-Triage
            </label>
            <p className="text-[10px] text-muted-foreground mb-3">Automatically triage low-severity alerts meeting confidence threshold</p>
            <div className="flex items-center gap-2">
              <Switch checked={autoTriage} onCheckedChange={setAutoTriage} />
              <span className="text-xs text-foreground">{autoTriage ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Model List */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground mb-1">AI Models</h2>
        <p className="text-xs text-muted-foreground mb-4">Activate or deactivate models used in the analysis pipeline</p>
        <div className="space-y-3">
          {models.map((model) => (
            <div key={model.id} className={cn(
              'flex items-center gap-4 rounded-lg border p-4 transition-colors',
              model.active ? 'border-primary/20 bg-primary/5' : 'border-border bg-secondary/30'
            )}>
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border',
                model.active ? 'border-primary/30 bg-primary/10' : 'border-border bg-card'
              )}>
                <Brain className={cn('h-4 w-4', model.active ? 'text-primary' : 'text-muted-foreground')} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{model.name}</h3>
                  {model.active && <CheckCircle className="h-3 w-3 text-success" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{model.description}</p>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-muted-foreground">
                  <span>Accuracy: <strong className="text-success">{model.accuracy}%</strong></span>
                  <span>Latency: <strong className="text-foreground">{model.latency}</strong></span>
                </div>
              </div>
              <Switch checked={model.active} onCheckedChange={() => toggleModel(model.id)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
