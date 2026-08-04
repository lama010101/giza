import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/app';
import { AppLayout } from './AppLayout';

vi.mock('@/scene/Viewport', () => ({
  Viewport: () => <div data-testid="viewport" />,
}));

vi.mock('@/ui/SidePanel', () => ({
  SidePanel: () => <div data-testid="side-panel" />,
}));

vi.mock('@/ui/ModeSelector', () => ({
  ModeSelector: () => <div data-testid="mode-selector" />,
}));

vi.mock('@/ui/LeftPanel', () => ({
  LeftPanel: () => <div data-testid="left-panel" />,
}));

describe('AppLayout', () => {
  beforeEach(() => {
    useAppStore.setState({ evidencePanelOpen: true });
  });

  it('renders header, left panel, viewport, and side panel', () => {
    render(<AppLayout />);
    expect(screen.getByText('GIZA')).toBeInTheDocument();
    expect(screen.getByTestId('mode-selector')).toBeInTheDocument();
    expect(screen.getByTestId('left-panel')).toBeInTheDocument();
    expect(screen.getByTestId('viewport')).toBeInTheDocument();
    expect(screen.getByTestId('side-panel')).toBeInTheDocument();
  });
});
