import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { IncidentDetail } from './IncidentDetail';

const mutateMock = vi.fn();
let simulationMock: any;

vi.mock('@/hooks/useIncidents', () => ({
  useCounterfactualSimulation: () => simulationMock,
}));

const baseIncident: any = {
  id: 'INC-TEST-1',
  incident_id: 101,
  title: 'Test Incident',
  description: 'Counterfactual simulator smoke test',
  severity: 'high',
  status: 'open',
  category: 'phishing',
  sourceIP: '10.0.0.1',
  targetIP: '10.0.0.2',
  timestamp: '2026-04-02T09:00:00Z',
  aiSummary: 'Simulated analysis',
  confidenceScore: 81,
  riskScore: 77,
  affectedAssets: ['ws-01', 'mail-gw-01'],
  isFalsePositive: false,
};

describe('IncidentDetail counterfactual integration', () => {
  beforeEach(() => {
    mutateMock.mockReset();
    simulationMock = {
      mutate: mutateMock,
      isPending: false,
      data: undefined,
      isError: false,
    };
  });

  it('triggers counterfactual simulation with incident ID', () => {
    render(<IncidentDetail incident={baseIncident} onClose={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Run Simulation' }));

    expect(mutateMock).toHaveBeenCalledTimes(1);
    expect(mutateMock).toHaveBeenCalledWith({ incidentId: '101' });
  });

  it('disables simulation when no numeric API incident ID is available', () => {
    const mockOnlyIncident = {
      ...baseIncident,
      incident_id: undefined,
      id: 'INC-TEST-1',
    };

    render(<IncidentDetail incident={mockOnlyIncident} onClose={() => {}} />);

    const runButton = screen.getByRole('button', { name: 'Run Simulation' });
    expect(runButton).toBeDisabled();
    fireEvent.click(runButton);
    expect(mutateMock).not.toHaveBeenCalled();
    expect(screen.getByText(/does not have a valid API incident ID/i)).toBeInTheDocument();
  });

  it('renders recommended action details when simulation data is available', () => {
    simulationMock = {
      mutate: mutateMock,
      isPending: false,
      isError: false,
      data: {
        incident_id: 'INC-TEST-1',
        generated_at: '2026-04-02T09:02:00Z',
        model: 'counterfactual-v1-heuristic',
        current_assessment: {
          severity: 'high',
          risk_score: 77,
          confidence_score: 81,
          estimated_blast_radius_assets: 2,
          estimated_containment_time_min: 40,
        },
        recommended_action: {
          action_id: 'host_isolation',
          action: 'Isolate impacted hosts from east-west traffic',
          best_window: {
            minutes_earlier: 20,
            utility_score: 34.5,
          },
        },
        scenarios: [
          {
            action_id: 'host_isolation',
            action: 'Isolate impacted hosts from east-west traffic',
            best_window: {
              minutes_earlier: 20,
              utility_score: 34.5,
            },
            time_window_estimates: [],
            assumptions: [],
          },
        ],
        methodology: {
          type: 'counterfactual replay approximation',
          description: 'test',
          evaluated_windows_min_earlier: [10, 20, 45],
        },
      },
    };

    render(<IncidentDetail incident={baseIncident} onClose={() => {}} />);

    expect(screen.getByText('Recommended action')).toBeInTheDocument();
    expect(screen.getAllByText('Isolate impacted hosts from east-west traffic')).toHaveLength(1);
    expect(screen.getByText(/Best intervention window: 20 min earlier/)).toBeInTheDocument();
  });
});
