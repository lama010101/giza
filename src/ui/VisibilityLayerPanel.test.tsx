import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAppStore } from '@/store/app';
import { VisibilityLayerPanel } from './VisibilityLayerPanel';

describe('VisibilityLayerPanel', () => {
  beforeEach(() => {
    useAppStore.setState({ hiddenVisibilityLayers: [] });
  });

  it('renders all 8 visibility layer toggles', () => {
    render(<VisibilityLayerPanel />);
    expect(screen.getByTestId('visibility-layer-panel')).toBeInTheDocument();
    expect(screen.getAllByRole('checkbox').length).toBe(8);
  });

  it('toggles a visibility layer off and on', async () => {
    const user = userEvent.setup();
    render(<VisibilityLayerPanel />);

    const geometryCheckbox = screen.getByLabelText(/Geometry/i);
    await user.click(geometryCheckbox);

    expect(useAppStore.getState().hiddenVisibilityLayers).toContain('Geometry');

    await user.click(geometryCheckbox);
    expect(useAppStore.getState().hiddenVisibilityLayers).not.toContain('Geometry');
  });

  it('hides all layers with the hide-all button', async () => {
    const user = userEvent.setup();
    render(<VisibilityLayerPanel />);

    await user.click(screen.getByRole('button', { name: /hide all/i }));
    expect(useAppStore.getState().hiddenVisibilityLayers.length).toBe(8);

    await user.click(screen.getByRole('button', { name: /show all/i }));
    expect(useAppStore.getState().hiddenVisibilityLayers).toEqual([]);
  });
});
