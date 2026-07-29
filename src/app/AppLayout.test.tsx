import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/app';
import { AppLayout } from './AppLayout';

vi.mock('@/scene/Viewport', () => ({
  Viewport: () => <div data-testid="viewport" />,
}));

vi.mock('@/ui/EvidencePanel', () => ({
  EvidencePanel: () => <div data-testid="evidence-panel" />,
}));

vi.mock('@/ui/ModeSelector', () => ({
  ModeSelector: () => <div data-testid="mode-selector" />,
}));

describe('AppLayout', () => {
  beforeEach(() => {
    useAppStore.setState({ evidencePanelOpen: true });
  });

  it('renders header, viewport, and evidence panel', () => {
    render(<AppLayout />);
    expect(screen.getByText('GIZA')).toBeInTheDocument();
    expect(screen.getByTestId('mode-selector')).toBeInTheDocument();
    expect(screen.getByTestId('viewport')).toBeInTheDocument();
    expect(screen.getByTestId('evidence-panel')).toBeInTheDocument();
  });

  it('collapses and expands the evidence panel via the toggle', () => {
    render(<AppLayout />);

    fireEvent.click(screen.getByLabelText('Collapse evidence panel'));
    expect(screen.queryByTestId('evidence-panel')).not.toBeInTheDocument();
    expect(useAppStore.getState().evidencePanelOpen).toBe(false);

    fireEvent.click(screen.getByLabelText('Expand evidence panel'));
    expect(screen.getByTestId('evidence-panel')).toBeInTheDocument();
    expect(useAppStore.getState().evidencePanelOpen).toBe(true);
  });
});
