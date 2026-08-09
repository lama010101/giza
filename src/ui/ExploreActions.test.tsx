import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAppStore } from '@/store/app';
import { ExploreActions } from './ExploreActions';

describe('ExploreActions', () => {
  beforeEach(() => {
    useAppStore.setState({
      mode: 'Explore',
      activeMonument: 'great-pyramid',
      activeHypothesisIds: [],
      selectedObjectId: null,
      hoveredNodeId: null,
      evidencePanelOpen: false,
      sidePanelTab: 'scene',
      hiddenLayers: [],
    });
  });

  it('does not render outside Explore mode', () => {
    useAppStore.setState({ mode: 'Research' });
    const { container } = render(<ExploreActions />);
    expect(container).toBeEmptyDOMElement();
  });

  it('disables inspect when no object is selected or hovered', () => {
    render(<ExploreActions />);
    const inspectBtn = screen.getByRole('button', { name: /Inspect/i });
    expect(inspectBtn).toBeDisabled();
  });

  it('inspects a selected object and opens the evidence panel', async () => {
    useAppStore.setState({ selectedObjectId: 'OBJ-0101' });
    render(<ExploreActions />);
    const inspectBtn = screen.getByRole('button', { name: /Inspect/i });
    expect(inspectBtn).not.toBeDisabled();
    await userEvent.click(inspectBtn);
    expect(useAppStore.getState().evidencePanelOpen).toBe(true);
    expect(useAppStore.getState().sidePanelTab).toBe('evidence');
  });

  it('cycles to the next active hypothesis', async () => {
    render(<ExploreActions />);
    const theoryBtn = screen.getByRole('button', { name: /Theory/i });
    await userEvent.click(theoryBtn);
    expect(useAppStore.getState().activeHypothesisIds.length).toBe(1);
  });

  it('toggles a layer reveal popover and updates hidden layers', async () => {
    render(<ExploreActions />);
    const layersBtn = screen.getByRole('button', { name: /Layers/i });
    await userEvent.click(layersBtn);
    expect(screen.getByTestId('layer-reveal-popover')).toBeInTheDocument();

    const checkbox = screen.getByLabelText(/exterior/i);
    await userEvent.click(checkbox);
    expect(useAppStore.getState().hiddenLayers).toContain('exterior');
  });

  it('reveals all layers when reveal all is clicked', async () => {
    useAppStore.setState({ hiddenLayers: ['exterior'] });
    render(<ExploreActions />);
    await userEvent.click(screen.getByRole('button', { name: /Reveal All/i }));
    expect(useAppStore.getState().hiddenLayers).toEqual([]);
  });
});
