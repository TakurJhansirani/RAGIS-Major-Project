import { useEffect, useMemo, useState } from 'react';
import { Plug, CheckCircle, XCircle, RefreshCw, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSyncElasticsearchIncidents, useSyncSplunkIncidents } from '@/hooks/useIncidents';
import { useAuth } from '@/contexts/AuthContext';

interface SIEMIntegration {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  eventsIngested?: number;
  syncable?: boolean;
}

interface SIEMIntegrationSettingsProps {
  organization?: string;
  organizationLabel?: string;
}

interface ConnectorSettings {
  enabled: boolean;
  url: string;
  username: string;
  password: string;
  ssl_verify: boolean;
  sync_schedule: string;
  search_query?: string;
  detection_index?: string;
}

type ConnectorName = 'splunk' | 'elasticsearch';
type ConnectorField = keyof ConnectorSettings;
type SIEMFormErrors = Record<string, string>;

interface SIEMSettingsResponse {
  splunk: {
    enabled: boolean;
    url: string;
    ssl_verify: boolean;
    sync_schedule?: string;
    search_query?: string;
    auth?: {
      username?: string;
      has_password?: boolean;
    };
  };
  elasticsearch: {
    enabled: boolean;
    url: string;
    ssl_verify: boolean;
    sync_schedule?: string;
    detection_index?: string;
    auth?: {
      username?: string;
      has_password?: boolean;
    };
  };
  history?: Array<{
    change_id?: number;
    connector: ConnectorName;
    changed_at?: string | null;
    changed_by?: string | null;
    config_snapshot?: Record<string, unknown>;
  }>;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const defaultSettings: { splunk: ConnectorSettings; elasticsearch: ConnectorSettings } = {
  splunk: {
    enabled: false,
    url: 'https://splunk.local:8089',
    username: 'admin',
    password: '',
    ssl_verify: false,
    sync_schedule: '*/60',
    search_query: 'search index=notable earliest=-24h@h | head 200',
  },
  elasticsearch: {
    enabled: false,
    url: 'https://elasticsearch.local:9200',
    username: 'elastic',
    password: '',
    ssl_verify: false,
    sync_schedule: '*/15',
    detection_index: '.detections-default',
  },
};

const initialIntegrations: SIEMIntegration[] = [
  {
    id: 'splunk',
    name: 'Splunk Enterprise',
    description: 'Forward alerts and logs from Splunk via HEC',
    status: 'connected',
    lastSync: '2024-12-15T14:30:00Z',
    eventsIngested: 142850,
    syncable: true,
  },
  {
    id: 'elastic',
    name: 'Elastic SIEM',
    description: 'Bi-directional sync with Elasticsearch indices',
    status: 'connected',
    lastSync: '2024-12-15T14:28:00Z',
    eventsIngested: 98420,
    syncable: true,
  },
  {
    id: 'sentinel',
    name: 'Microsoft Sentinel',
    description: 'Azure Sentinel workspace integration via API',
    status: 'disconnected',
  },
  {
    id: 'crowdstrike',
    name: 'CrowdStrike Falcon',
    description: 'EDR telemetry and detection feeds',
    status: 'error',
    lastSync: '2024-12-15T09:00:00Z',
    eventsIngested: 45200,
  },
  {
    id: 'paloalto',
    name: 'Palo Alto Cortex XSIAM',
    description: 'XDR alerts and network telemetry',
    status: 'disconnected',
  },
];

const statusConfig = {
  connected: { icon: CheckCircle, label: 'Connected', className: 'text-success' },
  disconnected: { icon: XCircle, label: 'Disconnected', className: 'text-muted-foreground' },
  error: { icon: XCircle, label: 'Error', className: 'text-destructive' },
};

export const SIEMIntegrationSettings = ({
  organization,
  organizationLabel = 'All organizations',
}: SIEMIntegrationSettingsProps) => {
  const { session } = useAuth();
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [settings, setSettings] = useState(defaultSettings);
  const [formErrors, setFormErrors] = useState<SIEMFormErrors>({});
  const [formErrorSummary, setFormErrorSummary] = useState<string | null>(null);
  const [recentChanges, setRecentChanges] = useState<NonNullable<SIEMSettingsResponse['history']>>([]);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const syncSplunk = useSyncSplunkIncidents();
  const syncElastic = useSyncElasticsearchIncidents();

  const scope = organization && organization !== 'all' ? organization : undefined;
  const scopeLabel = scope ? organizationLabel : 'all organizations';

  const syncMutations = useMemo(
    () => ({
      splunk: syncSplunk,
      elastic: syncElastic,
    }),
    [syncElastic, syncSplunk]
  );

  const authHeader = session?.access_token
    ? { Authorization: `Bearer ${session.access_token}` }
    : {};

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings/siem/`, {
          headers: {
            'Content-Type': 'application/json',
            ...authHeader,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load SIEM settings');
        }

        const payload = (await response.json()) as SIEMSettingsResponse;
        if (!isMounted) {
          return;
        }

        setSettings({
          splunk: {
            enabled: Boolean(payload.splunk?.enabled),
            url: payload.splunk?.url || defaultSettings.splunk.url,
            username: payload.splunk?.auth?.username || defaultSettings.splunk.username,
            password: '',
            ssl_verify: Boolean(payload.splunk?.ssl_verify),
            sync_schedule: payload.splunk?.sync_schedule || defaultSettings.splunk.sync_schedule,
            search_query: payload.splunk?.search_query || defaultSettings.splunk.search_query,
          },
          elasticsearch: {
            enabled: Boolean(payload.elasticsearch?.enabled),
            url: payload.elasticsearch?.url || defaultSettings.elasticsearch.url,
            username: payload.elasticsearch?.auth?.username || defaultSettings.elasticsearch.username,
            password: '',
            ssl_verify: Boolean(payload.elasticsearch?.ssl_verify),
            sync_schedule: payload.elasticsearch?.sync_schedule || defaultSettings.elasticsearch.sync_schedule,
            detection_index: payload.elasticsearch?.detection_index || defaultSettings.elasticsearch.detection_index,
          },
        });
        setRecentChanges(Array.isArray(payload.history) ? payload.history : []);
      } catch {
        if (isMounted) {
          setSettings(defaultSettings);
          setRecentChanges([]);
          toast.error('Using default SIEM settings (backend settings unavailable)');
        }
      } finally {
        if (isMounted) {
          setIsLoadingSettings(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [session?.access_token]);

  const updateConnectorSetting = (
    connector: ConnectorName,
    field: keyof ConnectorSettings,
    value: string | boolean
  ) => {
    const fieldKey = `${connector}.${String(field)}`;
    const connectorKey = `${connector}.__connector`;
    setSettings((previous) => ({
      ...previous,
      [connector]: {
        ...previous[connector],
        [field]: value,
      },
    }));
    setFormErrors((previous) => {
      const next = { ...previous };
      delete next[fieldKey];
      delete next[connectorKey];
      return next;
    });
    setFormErrorSummary(null);
  };

  const isValidUrl = (value: string) => /^https?:\/\//i.test(value.trim());

  const validateSettings = (nextSettings: typeof defaultSettings) => {
    const nextErrors: SIEMFormErrors = {};

    if (!nextSettings.splunk.url.trim()) {
      nextErrors['splunk.url'] = 'Splunk URL is required';
    } else if (!isValidUrl(nextSettings.splunk.url)) {
      nextErrors['splunk.url'] = 'Splunk URL must start with http:// or https://';
    }

    if (!nextSettings.splunk.sync_schedule.trim()) {
      nextErrors['splunk.sync_schedule'] = 'Splunk sync schedule is required';
    }

    if (!nextSettings.elasticsearch.url.trim()) {
      nextErrors['elasticsearch.url'] = 'Elasticsearch URL is required';
    } else if (!isValidUrl(nextSettings.elasticsearch.url)) {
      nextErrors['elasticsearch.url'] = 'Elasticsearch URL must start with http:// or https://';
    }

    if (!nextSettings.elasticsearch.sync_schedule.trim()) {
      nextErrors['elasticsearch.sync_schedule'] = 'Elasticsearch sync schedule is required';
    }

    return nextErrors;
  };

  const mapApiErrorsToForm = (payload: unknown) => {
    if (!payload || typeof payload !== 'object') {
      return { summary: 'Failed to save SIEM settings', errors: {} as SIEMFormErrors };
    }

    const data = payload as Record<string, unknown>;
    const nextErrors: SIEMFormErrors = {};
    let summary: string | null = null;

    if (Array.isArray(data.non_field_errors) && data.non_field_errors.length > 0) {
      summary = String(data.non_field_errors[0]);
    }

    (['splunk', 'elasticsearch'] as ConnectorName[]).forEach((connector) => {
      const connectorPayload = data[connector];
      if (!connectorPayload || typeof connectorPayload !== 'object') {
        return;
      }

      Object.entries(connectorPayload as Record<string, unknown>).forEach(([field, value]) => {
        const message = Array.isArray(value) ? String(value[0]) : String(value);
        if (field === 'unknown_fields') {
          nextErrors[`${connector}.__connector`] = message;
          return;
        }
        nextErrors[`${connector}.${field}`] = message;
      });
    });

    if (!summary && Object.keys(nextErrors).length > 0) {
      summary = 'Please fix the highlighted SIEM configuration fields.';
    }

    return {
      summary: summary || 'Failed to save SIEM settings',
      errors: nextErrors,
    };
  };

  const fieldError = (connector: ConnectorName, field: ConnectorField | '__connector') =>
    formErrors[`${connector}.${String(field)}`];

  const saveSettings = async () => {
    const clientErrors = validateSettings(settings);
    if (Object.keys(clientErrors).length > 0) {
      setFormErrors(clientErrors);
      setFormErrorSummary('Please fix the highlighted SIEM configuration fields.');
      toast.error('Fix SIEM settings validation errors before saving');
      return;
    }

    setFormErrors({});
    setFormErrorSummary(null);
    setIsSavingSettings(true);
    try {
      const response = await fetch(`${API_BASE_URL}/settings/siem/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          splunk: settings.splunk,
          elasticsearch: settings.elasticsearch,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);
        const mapped = mapApiErrorsToForm(errorPayload);
        setFormErrors(mapped.errors);
        setFormErrorSummary(mapped.summary);
        throw new Error(mapped.summary);
      }

      setSettings((previous) => ({
        splunk: { ...previous.splunk, password: '' },
        elasticsearch: { ...previous.elasticsearch, password: '' },
      }));

      setFormErrors({});
      setFormErrorSummary(null);
      toast.success('SIEM settings saved');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save SIEM settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const restoreHistoryEntry = async (connector: ConnectorName, changeId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/settings/siem/restore/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({ connector, change_id: changeId }),
      });

      if (!response.ok) {
        throw new Error('Failed to restore SIEM settings');
      }

      const payload = (await response.json()) as SIEMSettingsResponse;
      setSettings({
        splunk: {
          enabled: Boolean(payload.splunk?.enabled),
          url: payload.splunk?.url || defaultSettings.splunk.url,
          username: payload.splunk?.auth?.username || defaultSettings.splunk.username,
          password: '',
          ssl_verify: Boolean(payload.splunk?.ssl_verify),
          sync_schedule: payload.splunk?.sync_schedule || defaultSettings.splunk.sync_schedule,
          search_query: payload.splunk?.search_query || defaultSettings.splunk.search_query,
        },
        elasticsearch: {
          enabled: Boolean(payload.elasticsearch?.enabled),
          url: payload.elasticsearch?.url || defaultSettings.elasticsearch.url,
          username: payload.elasticsearch?.auth?.username || defaultSettings.elasticsearch.username,
          password: '',
          ssl_verify: Boolean(payload.elasticsearch?.ssl_verify),
          sync_schedule: payload.elasticsearch?.sync_schedule || defaultSettings.elasticsearch.sync_schedule,
          detection_index: payload.elasticsearch?.detection_index || defaultSettings.elasticsearch.detection_index,
        },
      });
      setRecentChanges(Array.isArray(payload.history) ? payload.history : []);
      toast.success(`${connector} settings restored from history`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to restore SIEM settings');
    }
  };

  const handleSync = async (id: 'splunk' | 'elastic') => {
    const integration = integrations.find((item) => item.id === id);
    const mutation = syncMutations[id];

    if (!integration || !mutation) {
      return;
    }

    try {
      const result = await mutation.mutateAsync(scope ? { organization: scope } : undefined);
      const createdIncidents = Number(result?.created_incidents ?? 0);
      const syncedAt = new Date().toISOString();

      setIntegrations((previous) =>
        previous.map((item) =>
          item.id === id
            ? {
                ...item,
                lastSync: syncedAt,
                eventsIngested: typeof item.eventsIngested === 'number' ? item.eventsIngested + createdIncidents : item.eventsIngested,
              }
            : item
        )
      );

      toast.success(
        result?.offline
          ? `${integration.name} sync completed in offline mode for ${scopeLabel}`
          : `${integration.name} sync completed for ${scopeLabel}`
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to sync ${integration.name}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">SIEM & EDR Integrations</h2>
            <p className="text-xs text-muted-foreground">
              Sync alerts from Splunk and Elasticsearch into {scopeLabel}.
            </p>
          </div>
          <Badge variant="outline" className="border-border text-muted-foreground">
            Manual sync
          </Badge>
        </div>

        <div className="space-y-3">
          {integrations.map((intg) => {
            const StatusIcon = statusConfig[intg.status].icon;
            const canSync = Boolean(intg.syncable);
            const isSyncing = intg.id === 'splunk' ? syncSplunk.isPending : intg.id === 'elastic' ? syncElastic.isPending : false;

            return (
              <div key={intg.id} className="flex flex-col gap-4 rounded-lg border border-border bg-secondary/30 p-4 lg:flex-row lg:items-center">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card">
                  <Plug className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{intg.name}</h3>
                    <StatusIcon className={cn('h-3.5 w-3.5', statusConfig[intg.status].className)} />
                    <span className={cn('text-[10px] font-medium uppercase tracking-wider', statusConfig[intg.status].className)}>
                      {statusConfig[intg.status].label}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{intg.description}</p>
                  {intg.lastSync && (
                    <p className="text-[10px] font-mono text-muted-foreground mt-1">
                      Last sync: {new Date(intg.lastSync).toLocaleString()}
                      {intg.eventsIngested && ` • ${intg.eventsIngested.toLocaleString()} events`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {canSync ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleSync(intg.id as 'splunk' | 'elastic')}
                      disabled={isSyncing}
                    >
                      <RefreshCw className={cn('h-3.5 w-3.5', isSyncing && 'animate-spin')} />
                      Sync now
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Planned
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-1">Connector Configuration</h2>
            <p className="text-xs text-muted-foreground">
              Configure runtime connector credentials and schedules for Splunk and Elasticsearch.
            </p>
          </div>
          <Badge variant="outline" className="border-border text-muted-foreground">
            Runtime settings
          </Badge>
        </div>

        {isLoadingSettings ? (
          <p className="text-xs text-muted-foreground">Loading settings...</p>
        ) : (
          <div className="space-y-5">
            {formErrorSummary && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {formErrorSummary}
              </div>
            )}
            <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Splunk</h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor="splunk-enabled" className="text-xs text-muted-foreground">Enabled</Label>
                  <Switch
                    id="splunk-enabled"
                    checked={settings.splunk.enabled}
                    onCheckedChange={(checked) => updateConnectorSetting('splunk', 'enabled', checked)}
                  />
                </div>
              </div>
              {fieldError('splunk', '__connector') && (
                <p className="text-xs text-destructive">{fieldError('splunk', '__connector')}</p>
              )}
              <Input
                placeholder="Splunk URL"
                value={settings.splunk.url}
                onChange={(event) => updateConnectorSetting('splunk', 'url', event.target.value)}
              />
              {fieldError('splunk', 'url') && <p className="text-xs text-destructive">{fieldError('splunk', 'url')}</p>}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  placeholder="Username"
                  value={settings.splunk.username}
                  onChange={(event) => updateConnectorSetting('splunk', 'username', event.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={settings.splunk.password}
                  onChange={(event) => updateConnectorSetting('splunk', 'password', event.target.value)}
                />
                <p className="text-[10px] text-muted-foreground md:col-span-2">
                  Leave password blank to keep the existing stored secret.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  placeholder="Sync schedule (cron, e.g. */60)"
                  value={settings.splunk.sync_schedule}
                  onChange={(event) => updateConnectorSetting('splunk', 'sync_schedule', event.target.value)}
                />
                {fieldError('splunk', 'sync_schedule') && (
                  <p className="text-xs text-destructive md:col-span-2">{fieldError('splunk', 'sync_schedule')}</p>
                )}
                <div className="flex items-center gap-2 rounded-md border border-border px-3">
                  <Label htmlFor="splunk-ssl" className="text-xs text-muted-foreground">SSL verify</Label>
                  <Switch
                    id="splunk-ssl"
                    checked={settings.splunk.ssl_verify}
                    onCheckedChange={(checked) => updateConnectorSetting('splunk', 'ssl_verify', checked)}
                  />
                </div>
              </div>
              <Input
                placeholder="Splunk search query"
                value={settings.splunk.search_query || ''}
                onChange={(event) => updateConnectorSetting('splunk', 'search_query', event.target.value)}
              />
            </div>

            <div className="rounded-lg border border-border bg-secondary/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Elasticsearch</h3>
                <div className="flex items-center gap-2">
                  <Label htmlFor="elastic-enabled" className="text-xs text-muted-foreground">Enabled</Label>
                  <Switch
                    id="elastic-enabled"
                    checked={settings.elasticsearch.enabled}
                    onCheckedChange={(checked) => updateConnectorSetting('elasticsearch', 'enabled', checked)}
                  />
                </div>
              </div>
              {fieldError('elasticsearch', '__connector') && (
                <p className="text-xs text-destructive">{fieldError('elasticsearch', '__connector')}</p>
              )}
              <Input
                placeholder="Elasticsearch URL"
                value={settings.elasticsearch.url}
                onChange={(event) => updateConnectorSetting('elasticsearch', 'url', event.target.value)}
              />
              {fieldError('elasticsearch', 'url') && <p className="text-xs text-destructive">{fieldError('elasticsearch', 'url')}</p>}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  placeholder="Username"
                  value={settings.elasticsearch.username}
                  onChange={(event) => updateConnectorSetting('elasticsearch', 'username', event.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={settings.elasticsearch.password}
                  onChange={(event) => updateConnectorSetting('elasticsearch', 'password', event.target.value)}
                />
                <p className="text-[10px] text-muted-foreground md:col-span-2">
                  Leave password blank to keep the existing stored secret.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Input
                  placeholder="Detection index"
                  value={settings.elasticsearch.detection_index || ''}
                  onChange={(event) => updateConnectorSetting('elasticsearch', 'detection_index', event.target.value)}
                />
                <Input
                  placeholder="Sync schedule (cron, e.g. */15)"
                  value={settings.elasticsearch.sync_schedule}
                  onChange={(event) => updateConnectorSetting('elasticsearch', 'sync_schedule', event.target.value)}
                />
                {fieldError('elasticsearch', 'sync_schedule') && (
                  <p className="text-xs text-destructive md:col-span-2">{fieldError('elasticsearch', 'sync_schedule')}</p>
                )}
              </div>
              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                <Label htmlFor="elastic-ssl" className="text-xs text-muted-foreground">SSL verify</Label>
                <Switch
                  id="elastic-ssl"
                  checked={settings.elasticsearch.ssl_verify}
                  onCheckedChange={(checked) => updateConnectorSetting('elasticsearch', 'ssl_verify', checked)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" onClick={saveSettings} disabled={isSavingSettings}>
                {isSavingSettings ? 'Saving...' : 'Save SIEM settings'}
              </Button>
            </div>

            <div className="rounded-lg border border-border bg-secondary/20 p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-foreground">Recent changes</h3>
                <p className="text-xs text-muted-foreground">Latest SIEM connector updates for this workspace.</p>
              </div>
              {recentChanges.length === 0 ? (
                <p className="text-xs text-muted-foreground">No recent SIEM changes recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {recentChanges.map((entry, index) => (
                    <div key={`${entry.connector}-${entry.changed_at || index}`} className="rounded-md border border-border bg-card px-3 py-2 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-foreground capitalize">{entry.connector}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{entry.changed_at ? new Date(entry.changed_at).toLocaleString() : 'Unknown time'}</span>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-[10px]"
                            onClick={() => restoreHistoryEntry(entry.connector, Number(entry.change_id ?? index + 1))}
                          >
                            <RotateCcw className="mr-1 h-3.5 w-3.5" />
                            Restore
                          </Button>
                        </div>
                      </div>
                      <div className="mt-1 text-muted-foreground">
                        Updated by {entry.changed_by || 'system'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
