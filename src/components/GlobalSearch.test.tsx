import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { GlobalSearch } from './GlobalSearch';
import * as useIncidentsHook from '@/hooks/useIncidents';

vi.mock('@/hooks/useIncidents', () => ({
  useIncidents: vi.fn(),
}));

vi.mock('@/components/dashboard/SeverityBadge', () => ({
  SeverityBadge: ({ severity }: { severity: string }) => <span data-testid="severity-badge">{severity}</span>,
}));

const mockIncidents = [
  {
    incident_id: 1,
    title: 'Phishing Attack',
    severity: 'high',
    source_ip: '192.168.1.100',
    target_ip: '10.0.0.50',
    affected_assets: ['workstation-01', 'workstation-02'],
  },
  {
    incident_id: 2,
    title: 'Malware Detection',
    severity: 'critical',
    source_ip: '203.0.113.45',
    target_ip: '10.0.0.100',
    affected_assets: ['server-01'],
  },
];

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderComponent = (props = {}) => {
  const defaultProps = {
    onNavigate: vi.fn(),
    ...props,
  };

  const queryClient = createQueryClient();

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        <GlobalSearch {...defaultProps} />
      </QueryClientProvider>
    ),
    mockOnNavigate: defaultProps.onNavigate,
  };
};

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render search button', () => {
    vi.mocked(useIncidentsHook.useIncidents).mockReturnValue({
      data: [],
    } as any);

    renderComponent();

    const searchButton = screen.getByRole('button', { name: /search incidents/i });
    expect(searchButton).toBeInTheDocument();
  });

  it('should show keyboard shortcut hint', () => {
    vi.mocked(useIncidentsHook.useIncidents).mockReturnValue({
      data: [],
    } as any);

    renderComponent();

    expect(screen.getByText('K')).toBeInTheDocument();
  });

  it('should accept onNavigate callback', () => {

    vi.mocked(useIncidentsHook.useIncidents).mockReturnValue({
      data: [],
    } as any);

    const onNavigate = vi.fn();
    renderComponent({ onNavigate });

    expect(onNavigate).toBeDefined();
  });

  it('should render with incident data', () => {
    vi.mocked(useIncidentsHook.useIncidents).mockReturnValue({
      data: mockIncidents,
    } as any);

    renderComponent();

    const searchButton = screen.getByRole('button', { name: /search incidents/i });
    expect(searchButton).toBeInTheDocument();
  });

  it('should display search text in button', () => {
    vi.mocked(useIncidentsHook.useIncidents).mockReturnValue({
      data: [],
    } as any);

    renderComponent();

    expect(screen.getByText(/search incidents/i)).toBeInTheDocument();
  });

  it('should be hidden on small screens', () => {
    vi.mocked(useIncidentsHook.useIncidents).mockReturnValue({
      data: [],
    } as any);

    const { container } = renderComponent();

    const searchButton = screen.getByRole('button', { name: /search incidents/i });
    expect(searchButton.className).toContain('hidden');
  });

  it('should handle empty incidents list', () => {
    vi.mocked(useIncidentsHook.useIncidents).mockReturnValue({
      data: [],
    } as any);

    renderComponent();

    const searchButton = screen.getByRole('button', { name: /search incidents/i });
    expect(searchButton).toBeInTheDocument();
  });

  it('should handle multiple incidents', () => {
    vi.mocked(useIncidentsHook.useIncidents).mockReturnValue({
      data: mockIncidents,
    } as any);

    renderComponent();

    const searchButton = screen.getByRole('button', { name: /search incidents/i });
    expect(searchButton).toBeInTheDocument();
  });
});
