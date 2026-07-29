import { render, screen } from '@testing-library/react';
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
});
