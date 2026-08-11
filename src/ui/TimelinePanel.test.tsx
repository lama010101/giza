import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/app';
import { TimelinePanel } from './TimelinePanel';

describe('TimelinePanel', () => {
  beforeEach(() => {
    useAppStore.setState({ chronologyPeriod: null });
  });

  it('renders the timeline slider and all phase labels', () => {
    render(<TimelinePanel />);
    expect(screen.getByTestId('timeline-slider')).toBeInTheDocument();
    expect(screen.getByText('Old Kingdom')).toBeInTheDocument();
    expect(screen.getByText('Late Period')).toBeInTheDocument();
    expect(screen.getByText('Roman Period')).toBeInTheDocument();
    expect(screen.getByText('Modern')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('updates the store when the slider changes', () => {
    render(<TimelinePanel />);
    const slider = screen.getByTestId('timeline-slider');
    fireEvent.change(slider, { target: { value: '1' } });
    expect(useAppStore.getState().chronologyPeriod).toBe('old-kingdom');
  });

  it('selecting the first position resets to all phases', () => {
    useAppStore.setState({ chronologyPeriod: 'roman' });
    render(<TimelinePanel />);
    const slider = screen.getByTestId('timeline-slider');
    fireEvent.change(slider, { target: { value: '0' } });
    expect(useAppStore.getState().chronologyPeriod).toBeNull();
  });
});
