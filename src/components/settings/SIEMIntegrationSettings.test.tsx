import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SIEMIntegrationSettings } from './SIEMIntegrationSettings';
import * as useIncidentsHook from '@/hooks/useIncidents';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/hooks/useIncidents', () => ({
  useSyncSplunkIncidents: vi.fn(),
  useSyncElasticsearchIncidents: vi.fn(),
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange, id }: { checked?: boolean; onCheckedChange?: (value: boolean) => void; id?: string }) => (
    <input
      id={id}
      type="checkbox"
      checked={Boolean(checked)}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
    />
  ),
}));

const createMutation = (overrides: Partial<{ mutateAsync: ReturnType<typeof vi.fn>; isPending: boolean }> = {}) => ({
  mutateAsync: vi.fn().mockResolvedValue({ success: true, created_incidents: 3 }),
  isPending: false,
  ...overrides,
});

const renderSettings = async (organization = 'all', organizationLabel = 'All organizations') => {
  render(<SIEMIntegrationSettings organization={organization} organizationLabel={organizationLabel} />);
  await waitFor(() => {
    expect(fetch).toHaveBeenCalled();
  });
};

describe('SIEMIntegrationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        splunk: {
          enabled: true,
          url: 'https://splunk.local:8089',
          ssl_verify: false,
          sync_schedule: '*/60',
          auth: { username: 'admin', password: '' },
        },
        elasticsearch: {
          enabled: true,
          url: 'https://elasticsearch.local:9200',
          ssl_verify: false,
          sync_schedule: '*/15',
          detection_index: '.detections-default',
          auth: { username: 'elastic', password: '' },
        },
      }),
    } as Response));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders the SIEM integration panel', async () => {
    vi.mocked(useIncidentsHook.useSyncSplunkIncidents).mockReturnValue(createMutation() as any);
    vi.mocked(useIncidentsHook.useSyncElasticsearchIncidents).mockReturnValue(createMutation() as any);

    await renderSettings();

    expect(screen.getByText('SIEM & EDR Integrations')).toBeInTheDocument();
    expect(screen.getByText(/sync alerts from Splunk and Elasticsearch/i)).toBeInTheDocument();
  });

  it('shows sync buttons for Splunk and Elastic', async () => {
    vi.mocked(useIncidentsHook.useSyncSplunkIncidents).mockReturnValue(createMutation() as any);
    vi.mocked(useIncidentsHook.useSyncElasticsearchIncidents).mockReturnValue(createMutation() as any);

    await renderSettings();

    expect(screen.getAllByRole('button', { name: /sync now/i })).toHaveLength(2);
  });

  it('passes the selected organization to sync mutations', async () => {
    const user = userEvent.setup();
    const splunkMutateAsync = vi.fn().mockResolvedValue({ success: true, created_incidents: 2 });
    const elasticMutateAsync = vi.fn().mockResolvedValue({ success: true, created_incidents: 5 });

    vi.mocked(useIncidentsHook.useSyncSplunkIncidents).mockReturnValue(
      createMutation({ mutateAsync: splunkMutateAsync }) as any
    );
    vi.mocked(useIncidentsHook.useSyncElasticsearchIncidents).mockReturnValue(
      createMutation({ mutateAsync: elasticMutateAsync }) as any
    );

    await renderSettings('12', 'Operations');

    await user.click(screen.getAllByRole('button', { name: /sync now/i })[0]);

    await waitFor(() => {
      expect(splunkMutateAsync).toHaveBeenCalledWith({ organization: '12' });
    });
  });

  it('shows success toast after syncing Splunk', async () => {
    const user = userEvent.setup();
    const splunkMutateAsync = vi.fn().mockResolvedValue({ success: true, created_incidents: 4 });

    vi.mocked(useIncidentsHook.useSyncSplunkIncidents).mockReturnValue(
      createMutation({ mutateAsync: splunkMutateAsync }) as any
    );
    vi.mocked(useIncidentsHook.useSyncElasticsearchIncidents).mockReturnValue(createMutation() as any);

    await renderSettings();

    await user.click(screen.getAllByRole('button', { name: /sync now/i })[0]);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Splunk Enterprise sync completed'));
    });
  });

  it('disables the sync button while the mutation is pending', async () => {
    vi.mocked(useIncidentsHook.useSyncSplunkIncidents).mockReturnValue(createMutation({ isPending: true }) as any);
    vi.mocked(useIncidentsHook.useSyncElasticsearchIncidents).mockReturnValue(createMutation() as any);

    await renderSettings();

    const buttons = screen.getAllByRole('button', { name: /sync now/i });
    expect(buttons[0]).toBeDisabled();
  });

  it('shows planned badge for unsupported integrations', async () => {
    vi.mocked(useIncidentsHook.useSyncSplunkIncidents).mockReturnValue(createMutation() as any);
    vi.mocked(useIncidentsHook.useSyncElasticsearchIncidents).mockReturnValue(createMutation() as any);

    await renderSettings();

    expect(screen.getAllByText('Planned').length).toBeGreaterThan(0);
  });

  it('shows client-side validation errors and prevents save when URL is invalid', async () => {
    const user = userEvent.setup();
    vi.mocked(useIncidentsHook.useSyncSplunkIncidents).mockReturnValue(createMutation() as any);
    vi.mocked(useIncidentsHook.useSyncElasticsearchIncidents).mockReturnValue(createMutation() as any);

    await renderSettings();

    const splunkUrlInput = screen.getByPlaceholderText('Splunk URL');
    await user.clear(splunkUrlInput);
    await user.type(splunkUrlInput, 'splunk.local:8089');

    await user.click(screen.getByRole('button', { name: /save siem settings/i }));

    expect(await screen.findByText('Splunk URL must start with http:// or https://')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Fix SIEM settings validation errors before saving');
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('restores a SIEM history entry from the recent changes list', async () => {
    const user = userEvent.setup();
    vi.mocked(useIncidentsHook.useSyncSplunkIncidents).mockReturnValue(createMutation() as any);
    vi.mocked(useIncidentsHook.useSyncElasticsearchIncidents).mockReturnValue(createMutation() as any);

    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          splunk: {
            enabled: true,
            url: 'https://splunk.local:8089',
            ssl_verify: false,
            sync_schedule: '*/60',
            auth: { username: 'admin', has_password: true },
          },
          elasticsearch: {
            enabled: true,
            url: 'https://elasticsearch.local:9200',
            ssl_verify: false,
            sync_schedule: '*/15',
            detection_index: '.detections-default',
            auth: { username: 'elastic', has_password: true },
          },
          history: [
            {
              change_id: 17,
              connector: 'splunk',
              changed_at: '2026-04-07T12:00:00Z',
              changed_by: 'analyst',
              config_snapshot: { enabled: true },
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          splunk: {
            enabled: true,
            url: 'https://splunk.local:8089',
            ssl_verify: false,
            sync_schedule: '*/60',
            auth: { username: 'admin', has_password: true },
          },
          elasticsearch: {
            enabled: true,
            url: 'https://elasticsearch.local:9200',
            ssl_verify: false,
            sync_schedule: '*/15',
            detection_index: '.detections-default',
            auth: { username: 'elastic', has_password: true },
          },
          history: [
            {
              change_id: 17,
              connector: 'splunk',
              changed_at: '2026-04-07T12:00:00Z',
              changed_by: 'analyst',
              config_snapshot: { enabled: true },
            },
          ],
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          splunk: {
            enabled: true,
            url: 'https://splunk.local:8089',
            ssl_verify: false,
            sync_schedule: '*/60',
            auth: { username: 'admin', has_password: true },
          },
          elasticsearch: {
            enabled: true,
            url: 'https://elasticsearch.local:9200',
            ssl_verify: false,
            sync_schedule: '*/15',
            detection_index: '.detections-default',
            auth: { username: 'elastic', has_password: true },
          },
          history: [
            {
              change_id: 17,
              connector: 'splunk',
              changed_at: '2026-04-07T12:00:00Z',
              changed_by: 'analyst',
              config_snapshot: { enabled: true },
            },
          ],
        }),
      } as Response);

    render(<SIEMIntegrationSettings organization="all" organizationLabel="All organizations" />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole('button', { name: /restore/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('/settings/siem/restore/'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ connector: 'splunk', change_id: 17 }),
      })
    );
    expect(toast.success).toHaveBeenCalledWith('splunk settings restored from history');
  });

  it('shows server-side field errors inline when save fails validation on API', async () => {
    const user = userEvent.setup();
    vi.mocked(useIncidentsHook.useSyncSplunkIncidents).mockReturnValue(createMutation() as any);
    vi.mocked(useIncidentsHook.useSyncElasticsearchIncidents).mockReturnValue(createMutation() as any);

    const fetchMock = vi.mocked(fetch);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          splunk: {
            enabled: true,
            url: 'https://splunk.local:8089',
            ssl_verify: false,
            sync_schedule: '*/60',
            auth: { username: 'admin', password: '' },
          },
          elasticsearch: {
            enabled: true,
            url: 'https://elasticsearch.local:9200',
            ssl_verify: false,
            sync_schedule: '*/15',
            detection_index: '.detections-default',
            auth: { username: 'elastic', password: '' },
          },
        }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          splunk: {
            url: ['Enter a valid URL.'],
          },
        }),
      } as Response);

    render(<SIEMIntegrationSettings organization="all" organizationLabel="All organizations" />);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    await user.click(screen.getByRole('button', { name: /save siem settings/i }));

    expect(await screen.findByText('Enter a valid URL.')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Please fix the highlighted SIEM configuration fields.');
  });
});
