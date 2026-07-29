import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/app';
import { Viewport } from './Viewport';

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="r3f-canvas" />,
}));

describe('Viewport', () => {
  beforeEach(() => {
    useAppStore.setState({ hoveredNodeId: null });
  });

  it('renders a 3D canvas', () => {
    render(<Viewport />);
    expect(screen.getByTestId('r3f-canvas')).toBeInTheDocument();
  });

  it('shows the hovered node name in an overlay', () => {
    useAppStore.setState({ hoveredNodeId: 'central-island' });
    render(<Viewport />);
    expect(screen.getByText('Central Island')).toBeInTheDocument();
  });

  it('toggles measurement mode and shows the distance readout', () => {
    useAppStore.setState({ measurementStart: null, measurementEnd: null });
    render(<Viewport />);

    fireEvent.click(screen.getByRole('button', { name: 'Measure' }));
    expect(useAppStore.getState().measurementMode).toBe(true);

    act(() => useAppStore.getState().addMeasurementPoint({ x: 0, y: 0, z: 0 }));
    expect(screen.getByText('Pick a second point')).toBeInTheDocument();

    act(() => useAppStore.getState().addMeasurementPoint({ x: 3, y: 4, z: 0 }));
    expect(screen.getByText('5.00 m')).toBeInTheDocument();
  });
});
