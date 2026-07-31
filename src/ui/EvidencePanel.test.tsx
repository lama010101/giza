import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/app';
import { EvidencePanel } from './EvidencePanel';

describe('EvidencePanel', () => {
  beforeEach(() => {
    useAppStore.setState({
      selectedEvidenceId: null,
      bookmarkedObjectIds: [],
      activeMonument: 'osiris',
    });
  });
  it('renders evidence list and search input', () => {
    render(<EvidencePanel />);
    expect(screen.getByPlaceholderText('Search evidence...')).toBeInTheDocument();
    expect(screen.getByText('Shaft A entrance cross-section and depth')).toBeInTheDocument();
  });

  it('filters evidence by search query', () => {
    render(<EvidencePanel />);
    fireEvent.change(screen.getByPlaceholderText('Search evidence...'), {
      target: { value: 'sarcophagus' },
    });
    expect(screen.getByText('Basalt sarcophagus dimensions')).toBeInTheDocument();
    expect(screen.queryByText('Shaft A entrance cross-section and depth')).not.toBeInTheDocument();
  });

  it('shows evidence details on click', () => {
    render(<EvidencePanel />);
    fireEvent.click(screen.getByText('Shaft A entrance cross-section and depth'));
    expect(screen.getByText(/Entrance opening approximately/i)).toBeInTheDocument();
  });

  it('bookmarks an object and re-selects its evidence via the chip', () => {
    render(<EvidencePanel />);
    fireEvent.click(screen.getByText('Basalt sarcophagus dimensions'));
    fireEvent.click(screen.getByLabelText('Bookmark Basalt Sarcophagus'));

    expect(useAppStore.getState().bookmarkedObjectIds).toContain('OBJ-0008');

    const chip = screen.getByRole('button', { name: 'Basalt Sarcophagus' });
    useAppStore.setState({ selectedEvidenceId: null });
    fireEvent.click(chip);
    expect(useAppStore.getState().selectedEvidenceId).toBe('EV-000008');
  });
});
