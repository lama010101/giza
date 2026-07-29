import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EvidencePanel } from './EvidencePanel';

describe('EvidencePanel', () => {
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
});
