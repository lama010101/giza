import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BottomToolbar } from './BottomToolbar';
import { useAppStore } from '@/store/app';

describe('BottomToolbar (M07-T01)', () => {
  it('renders all toolbar buttons', () => {
    render(<BottomToolbar />);
    expect(screen.getByLabelText('Camera')).toBeDefined();
    expect(screen.getByLabelText('Evidence')).toBeDefined();
    expect(screen.getByLabelText('Simulation')).toBeDefined();
    expect(screen.getByLabelText('Measure')).toBeDefined();
    expect(screen.getByLabelText('Bookmarks')).toBeDefined();
    expect(screen.getByLabelText('Search')).toBeDefined();
  });

  it('has toolbar role for accessibility', () => {
    render(<BottomToolbar />);
    expect(screen.getByRole('toolbar')).toBeDefined();
  });

  it('toggles measurement mode when Measure is clicked', () => {
    render(<BottomToolbar />);
    const measureBtn = screen.getByLabelText('Measure');
    expect(useAppStore.getState().measurementMode).toBe(false);
    fireEvent.click(measureBtn);
    expect(useAppStore.getState().measurementMode).toBe(true);
    fireEvent.click(measureBtn);
    expect(useAppStore.getState().measurementMode).toBe(false);
  });

  it('switches side panel tab when Evidence is clicked', () => {
    render(<BottomToolbar />);
    const evidenceBtn = screen.getByLabelText('Evidence');
    fireEvent.click(evidenceBtn);
    expect(useAppStore.getState().sidePanelTab).toBe('evidence');
    expect(useAppStore.getState().evidencePanelOpen).toBe(true);
  });

  it('switches side panel tab when Simulation is clicked', () => {
    render(<BottomToolbar />);
    const simBtn = screen.getByLabelText('Simulation');
    fireEvent.click(simBtn);
    expect(useAppStore.getState().sidePanelTab).toBe('simulation');
  });

  it('marks active button with aria-pressed', () => {
    render(<BottomToolbar />);
    const evidenceBtn = screen.getByLabelText('Evidence');
    fireEvent.click(evidenceBtn);
    expect(evidenceBtn.getAttribute('aria-pressed')).toBe('true');
  });

  it('switches side panel tab to search when Search is clicked', () => {
    render(<BottomToolbar />);
    const searchBtn = screen.getByLabelText('Search');
    fireEvent.click(searchBtn);
    expect(useAppStore.getState().sidePanelTab).toBe('search');
    expect(useAppStore.getState().evidencePanelOpen).toBe(true);
  });
});
