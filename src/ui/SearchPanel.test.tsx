import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SearchPanel } from './SearchPanel';
import { useAppStore } from '@/store/app';
import * as unifiedSearch from '@/evidence/unifiedSearch';

describe('SearchPanel (M08-T06)', () => {
  beforeEach(() => {
    act(() => {
      useAppStore.setState({
        sidePanelTab: 'search',
        selectedEvidenceId: null,
        selectedObjectId: null,
        activeLocationId: null,
        activeHypothesisIds: [],
      });
    });
  });

  it('renders search input and filters', () => {
    render(<SearchPanel />);
    expect(screen.getByLabelText('Search query')).toBeDefined();
    expect(screen.getByLabelText('Evidence')).toBeDefined();
    expect(screen.getByLabelText('Objects')).toBeDefined();
  });

  it('displays search results when typing', () => {
    vi.spyOn(unifiedSearch, 'searchAll').mockReturnValue([
      { id: 'EV-000001', type: 'evidence', title: 'Test Evidence', subtitle: 'survey' },
      { id: 'OBJ-0101', type: 'object', title: 'Test Object', subtitle: 'Architecture' },
    ]);
    render(<SearchPanel />);
    const input = screen.getByLabelText('Search query');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(screen.getByText('Test Evidence')).toBeDefined();
    expect(screen.getByText('Test Object')).toBeDefined();
  });

  it('selects evidence and switches tab when evidence result clicked', () => {
    vi.spyOn(unifiedSearch, 'searchAll').mockReturnValue([
      { id: 'EV-000001', type: 'evidence', title: 'Test Evidence', subtitle: 'survey' },
    ]);
    render(<SearchPanel />);
    fireEvent.change(screen.getByLabelText('Search query'), { target: { value: 'test' } });
    fireEvent.click(screen.getByText('Test Evidence'));
    expect(useAppStore.getState().selectedEvidenceId).toBe('EV-000001');
    expect(useAppStore.getState().sidePanelTab).toBe('evidence');
  });

  it('selects theory and switches tab when theory result clicked', () => {
    vi.spyOn(unifiedSearch, 'searchAll').mockReturnValue([
      { id: 'THEORY-GP-001', type: 'theory', title: 'Hydraulic Theory', subtitle: 'Great Pyramid' },
    ]);
    render(<SearchPanel />);
    fireEvent.change(screen.getByLabelText('Search query'), { target: { value: 'hydraulic' } });
    fireEvent.click(screen.getByText('Hydraulic Theory'));
    expect(useAppStore.getState().activeHypothesisIds).toContain('THEORY-GP-001');
    expect(useAppStore.getState().sidePanelTab).toBe('hypothesis');
  });
});
