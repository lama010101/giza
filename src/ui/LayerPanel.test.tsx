import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/app';
import { LayerPanel } from './LayerPanel';

describe('LayerPanel', () => {
  beforeEach(() => {
    useAppStore.setState({ hiddenLayers: [] });
  });

  it('renders the layer panel with checkboxes visible', () => {
    render(<LayerPanel />);
    expect(screen.getByTestId('layer-panel')).toBeInTheDocument();
    expect(screen.getByText('Shafts')).toBeInTheDocument();
    expect(screen.getByText('Level 1 (Chamber A)')).toBeInTheDocument();
    expect(screen.getByText('Level 2 (Chamber B)')).toBeInTheDocument();
    expect(screen.getByText('Level 3 (Chamber I)')).toBeInTheDocument();
    expect(screen.getByText('Monument')).toBeInTheDocument();
  });

  it('toggles layer visibility on checkbox click', () => {
    render(<LayerPanel />);

    const shaftsCheckbox = screen.getByLabelText('Shafts');
    expect(shaftsCheckbox).toBeChecked();

    fireEvent.click(shaftsCheckbox);
    expect(useAppStore.getState().hiddenLayers).toContain('shafts');
    expect(shaftsCheckbox).not.toBeChecked();
  });
});
