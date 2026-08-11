import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/app';
import { MuseumOverlay } from './MuseumOverlay';

describe('MuseumOverlay', () => {
  beforeEach(() => {
    useAppStore.setState({
      mode: 'Explore',
      museumPaused: false,
      museumPresetName: null,
    });
  });

  it('does not render outside museum mode', () => {
    render(<MuseumOverlay />);
    expect(screen.queryByTestId('museum-overlay')).not.toBeInTheDocument();
  });

  it('renders the overlay and current preset in museum mode', () => {
    useAppStore.setState({
      mode: 'Museum',
      museumPresetName: "King's Chamber",
      activeMonument: 'great-pyramid',
    });
    render(<MuseumOverlay />);
    expect(screen.getByTestId('museum-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('museum-preset-name').textContent).toBe("King's Chamber");
    expect(screen.getByTestId('museum-pause-btn')).toBeInTheDocument();
    expect(screen.getByTestId('museum-exit-btn')).toBeInTheDocument();
  });

  it('toggles pause/resume when the pause button is clicked', () => {
    useAppStore.setState({ mode: 'Museum' });
    render(<MuseumOverlay />);
    const pauseBtn = screen.getByTestId('museum-pause-btn');
    expect(pauseBtn.textContent).toBe('Pause');
    fireEvent.click(pauseBtn);
    expect(useAppStore.getState().museumPaused).toBe(true);
    expect(pauseBtn.textContent).toBe('Resume');
    fireEvent.click(pauseBtn);
    expect(useAppStore.getState().museumPaused).toBe(false);
    expect(pauseBtn.textContent).toBe('Pause');
  });

  it('exits museum mode when the exit button is clicked', () => {
    useAppStore.setState({
      mode: 'Museum',
      museumPaused: true,
    });
    render(<MuseumOverlay />);
    fireEvent.click(screen.getByTestId('museum-exit-btn'));
    expect(useAppStore.getState().mode).toBe('Explore');
    expect(useAppStore.getState().museumPaused).toBe(false);
  });
});
