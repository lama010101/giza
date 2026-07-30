import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { hypothesisEngine } from '@/theories/engineInstance';
import { useAppStore } from '@/store/app';
import { HypothesisSelector } from './HypothesisSelector';

describe('HypothesisSelector', () => {
  beforeEach(() => {
    useAppStore.setState({ activeHypothesisIds: [], activeMonument: 'osiris' });
    hypothesisEngine.setActive([]);
  });

  it('renders all registered hypotheses with confidence values', () => {
    render(<HypothesisSelector />);
    expect(screen.getByText(/Hydraulic Functionality Hypothesis/)).toBeInTheDocument();
    expect(screen.getAllByText(/Mainstream Funerary Hypothesis/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/%$/).length).toBeGreaterThanOrEqual(4);
  });

  it('activates a hypothesis in the store and engine on toggle', () => {
    render(<HypothesisSelector />);
    fireEvent.click(screen.getByText(/Hydraulic Functionality Hypothesis/));
    expect(useAppStore.getState().activeHypothesisIds).toContain('THEORY-OSIRIS-001');
    expect(hypothesisEngine.isActive('THEORY-OSIRIS-001')).toBe(true);
  });

  it('deactivates a hypothesis on second toggle', () => {
    useAppStore.setState({ activeHypothesisIds: ['THEORY-OSIRIS-001'] });
    render(<HypothesisSelector />);
    fireEvent.click(screen.getByText(/Hydraulic Functionality Hypothesis/));
    expect(useAppStore.getState().activeHypothesisIds).not.toContain('THEORY-OSIRIS-001');
    expect(hypothesisEngine.isActive('THEORY-OSIRIS-001')).toBe(false);
  });
});
