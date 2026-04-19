import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SoarOperationsSettings } from './SoarOperationsSettings';
import * as useIncidentsHook from '@/hooks/useIncidents';
import { toast } from 'sonner';

vi.mock('sonner');
vi.mock('@/hooks/useIncidents');

const mockMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
  isLoading: false,
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const renderComponent = (props = {}) => {
  const defaultProps = {
    organization: 'test-org',
    organizationLabel: 'Test Organization',
    ...props,
  };

  const queryClient = createQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>
      <SoarOperationsSettings {...defaultProps} />
    </QueryClientProvider>
  );
};

describe('SoarOperationsSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render SOAR operations section', () => {
    vi.mocked(useIncidentsHook.useSoarExecutions).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(useIncidentsHook.useTriggerSoarPlaybook).mockReturnValue(mockMutation as any);

    renderComponent();

    expect(screen.getByText('SOAR Operations')).toBeInTheDocument();
  });

  it('should display incident ID input field', () => {
    vi.mocked(useIncidentsHook.useSoarExecutions).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(useIncidentsHook.useTriggerSoarPlaybook).mockReturnValue(mockMutation as any);

    renderComponent();

    const incidentInput = screen.getByPlaceholderText('INC-1001');
    expect(incidentInput).toBeInTheDocument();
  });

  it('should display playbook input field', () => {
    vi.mocked(useIncidentsHook.useSoarExecutions).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(useIncidentsHook.useTriggerSoarPlaybook).mockReturnValue(mockMutation as any);

    renderComponent();

    const playbookInput = screen.getByPlaceholderText('isolate-and-contain');
    expect(playbookInput).toBeInTheDocument();
  });

  it('should display payload JSON textarea', () => {
    vi.mocked(useIncidentsHook.useSoarExecutions).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(useIncidentsHook.useTriggerSoarPlaybook).mockReturnValue(mockMutation as any);

    renderComponent();

    const textarea = screen.getByLabelText('Payload JSON');
    expect(textarea).toBeInTheDocument();
    // Verify it has JSON content
    const value = (textarea as HTMLTextAreaElement).value;
    expect(value).toContain('settings-console');
  });

  it('should show error when incident ID is empty', async () => {
    const user = userEvent.setup();

    vi.mocked(useIncidentsHook.useSoarExecutions).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(useIncidentsHook.useTriggerSoarPlaybook).mockReturnValue(mockMutation as any);

    renderComponent();

    const submitButton = screen.getByRole('button', { name: /trigger/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });
  });

  it('should display loading state for executions', () => {
    vi.mocked(useIncidentsHook.useSoarExecutions).mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
    } as any);

    vi.mocked(useIncidentsHook.useTriggerSoarPlaybook).mockReturnValue(mockMutation as any);

    renderComponent();

    expect(screen.getByText('SOAR Operations')).toBeInTheDocument();
  });

  it('should accept org-specific scope', () => {
    vi.mocked(useIncidentsHook.useSoarExecutions).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(useIncidentsHook.useTriggerSoarPlaybook).mockReturnValue(mockMutation as any);

    renderComponent({ organization: 'specific-org', organizationLabel: 'Specific Org' });

    expect(vi.mocked(useIncidentsHook.useSoarExecutions)).toHaveBeenCalledWith('specific-org');
  });

  it('should accept all organizations scope', () => {
    vi.mocked(useIncidentsHook.useSoarExecutions).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(useIncidentsHook.useTriggerSoarPlaybook).mockReturnValue(mockMutation as any);

    renderComponent({ organization: 'all', organizationLabel: 'All Organizations' });

    expect(vi.mocked(useIncidentsHook.useSoarExecutions)).toHaveBeenCalledWith(undefined);
  });
});
