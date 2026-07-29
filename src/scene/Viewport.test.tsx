import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/app';
import { Viewport } from './Viewport';

vi.mock('@react-three/fiber', () => ({
  Canvas: () => <div data-testid="r3f-canvas" />,
}));

describe('Viewport', () => {
  beforeEach(() => {
    useAppStore.setState({
      hoveredNodeId: null,
      cameraMode: 'orbit',
      mode: 'Explore',
      measurementStart: null,
      measurementEnd: null,
    });
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

  it('shows camera controls in Research mode', () => {
    useAppStore.setState({ mode: 'Research' });
    render(<Viewport />);
    expect(screen.getByRole('button', { name: 'orbit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'walk' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'fly' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'teleport' })).toBeInTheDocument();
  });

  it('does not show camera controls in Explore mode with orbit', () => {
    useAppStore.setState({ mode: 'Explore', cameraMode: 'orbit' });
    render(<Viewport />);
    expect(screen.queryByRole('button', { name: 'walk' })).not.toBeInTheDocument();
  });

  it('shows camera controls when camera mode is non-orbit even in Explore', () => {
    useAppStore.setState({ mode: 'Explore', cameraMode: 'walk' });
    render(<Viewport />);
    expect(screen.getByRole('button', { name: 'walk' })).toBeInTheDocument();
  });

  it('switches camera mode on button click', () => {
    useAppStore.setState({ mode: 'Research', cameraMode: 'orbit' });
    render(<Viewport />);

    fireEvent.click(screen.getByRole('button', { name: 'fly' }));
    expect(useAppStore.getState().cameraMode).toBe('fly');
  });

  it('shows teleport hint when teleport mode is selected', () => {
    useAppStore.setState({ mode: 'Research', cameraMode: 'teleport' });
    render(<Viewport />);
    expect(screen.getByText('Double-click to teleport')).toBeInTheDocument();
  });
});
