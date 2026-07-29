import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/app';
import { useSimulationStore } from '@/store/simulation';
import { SimulationPanel } from './SimulationPanel';

describe('SimulationPanel', () => {
  beforeEach(() => {
    useAppStore.setState({ activeHypothesisIds: [] });
    useSimulationStore.getState().reset();
  });

  it('returns null when hydraulic hypothesis is not active', () => {
    useAppStore.setState({ activeHypothesisIds: [] });
    const { container } = render(<SimulationPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when hydraulic hypothesis is active', () => {
    useAppStore.setState({ activeHypothesisIds: ['THEORY-OSIRIS-001'] });
    render(<SimulationPanel />);
    expect(screen.getByTestId('sim-panel')).toBeInTheDocument();
    expect(screen.getByText('Hydraulic Simulation')).toBeInTheDocument();
  });

  it('toggles simulation running state', () => {
    useAppStore.setState({ activeHypothesisIds: ['THEORY-OSIRIS-001'] });
    render(<SimulationPanel />);

    const runButton = screen.getByRole('button', { name: 'Run' });
    fireEvent.click(runButton);
    expect(useSimulationStore.getState().running).toBe(true);
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('resets simulation state', () => {
    useAppStore.setState({ activeHypothesisIds: ['THEORY-OSIRIS-001'] });
    useSimulationStore.getState().setRunning(true);
    useSimulationStore.getState().setWaterLevel(2);
    useSimulationStore.getState().setInflowRate(0.3);

    render(<SimulationPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

    expect(useSimulationStore.getState().running).toBe(false);
    expect(useSimulationStore.getState().waterLevel).toBe(0.5);
    expect(useSimulationStore.getState().inflowRate).toBe(0);
  });

  it('updates water level via slider', () => {
    useAppStore.setState({ activeHypothesisIds: ['THEORY-OSIRIS-001'] });
    render(<SimulationPanel />);

    const slider = screen.getByDisplayValue('0.5');
    fireEvent.change(slider, { target: { value: '1.5' } });

    expect(useSimulationStore.getState().waterLevel).toBeCloseTo(1.5, 5);
  });
});
