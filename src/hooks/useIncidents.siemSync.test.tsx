import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { type ReactNode } from 'react';
import { useSyncElasticsearchIncidents, useSyncSplunkIncidents } from './useIncidents';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    session: { access_token: 'test-token' },
    loading: false,
    signOut: vi.fn(),
  }),
}));

describe('SIEM sync hooks', () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('posts to Splunk endpoint with scoped organization payload and auth header', async () => {
    const invalidateSpy = vi.spyOn(QueryClient.prototype, 'invalidateQueries');
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, created_incidents: 2 }),
    } as Response);

    const { result } = renderHook(() => useSyncSplunkIncidents(), {
      wrapper: createWrapper(),
    });

    const response = await result.current.mutateAsync({ organization: 'org-42' });

    expect(response).toEqual({ success: true, created_incidents: 2 });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/sync/splunk/'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({ organization: 'org-42' }),
      })
    );

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['incidents'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['recent-incidents'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['incident-stats'] });
    });
  });

  it('posts to Elasticsearch endpoint with empty payload when no scope is provided', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, created_incidents: 0 }),
    } as Response);

    const { result } = renderHook(() => useSyncElasticsearchIncidents(), {
      wrapper: createWrapper(),
    });

    const response = await result.current.mutateAsync(undefined);

    expect(response).toEqual({ success: true, created_incidents: 0 });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/sync/elasticsearch/'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({}),
      })
    );
  });

  it('returns offline fallback payload when network request fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network down'));

    const { result } = renderHook(() => useSyncSplunkIncidents(), {
      wrapper: createWrapper(),
    });

    const response = await result.current.mutateAsync({ organization: 'org-7' });

    expect(response).toEqual({
      success: true,
      created_incidents: 0,
      offline: true,
      source: 'splunk',
    });
  });

  it('throws an authentication error for 401 responses', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    const { result } = renderHook(() => useSyncElasticsearchIncidents(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync({ organization: 'org-3' })).rejects.toThrow(
      'Authentication required to sync Elasticsearch incidents'
    );
  });
});
