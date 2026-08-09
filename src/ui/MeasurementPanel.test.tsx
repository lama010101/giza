import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAppStore } from '@/store/app';
import { MeasurementPanel } from './MeasurementPanel';

describe('MeasurementPanel', () => {
  beforeEach(() => {
    useAppStore.setState({
      measurementMode: false,
      measurementType: 'distance',
      measurementPoints: [],
      measurementResult: null,
    });
  });

  it('renders measurement type buttons', () => {
    render(<MeasurementPanel />);
    expect(screen.getByRole('button', { name: /Distance/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Angle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Volume/i })).toBeInTheDocument();
  });

  it('toggles measurement mode when Measure/Stop is clicked', async () => {
    render(<MeasurementPanel />);
    const button = screen.getByRole('button', { name: /Measure/i });
    await userEvent.click(button);
    expect(useAppStore.getState().measurementMode).toBe(true);
    expect(screen.getByRole('button', { name: /Stop/i })).toBeInTheDocument();
  });

  it('switches measurement type', async () => {
    render(<MeasurementPanel />);
    await userEvent.click(screen.getByRole('button', { name: /Angle/i }));
    expect(useAppStore.getState().measurementType).toBe('angle');
  });

  it('displays the formatted result and a reset button', async () => {
    useAppStore.setState({
      measurementMode: true,
      measurementType: 'distance',
      measurementPoints: [
        { x: 0, y: 0, z: 0 },
        { x: 3, y: 4, z: 0 },
      ],
      measurementResult: {
        type: 'distance',
        value: 5,
        unit: 'm',
        start: { x: 0, y: 0, z: 0 },
        end: { x: 3, y: 4, z: 0 },
      },
    });
    render(<MeasurementPanel />);
    expect(screen.getByTestId('measurement-result')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Reset/i }));
    expect(useAppStore.getState().measurementPoints).toHaveLength(0);
    expect(useAppStore.getState().measurementResult).toBeNull();
  });
});
