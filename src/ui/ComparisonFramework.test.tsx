import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '@/store/app';
import { hypothesisEngine } from '@/theories/engineInstance';
import { ComparisonFramework } from './ComparisonFramework';

describe('ComparisonFramework (M05.5-T11)', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeHypothesisIds: ['THEORY-OSIRIS-001', 'THEORY-OSIRIS-002'],
      activeMonument: 'osiris',
    });
    hypothesisEngine.setActive(['THEORY-OSIRIS-001', 'THEORY-OSIRIS-002']);
  });

  it('renders an empty state when fewer than 2 hypotheses are selected', () => {
    useAppStore.setState({ activeHypothesisIds: ['THEORY-OSIRIS-001'] });
    render(<ComparisonFramework />);
    expect(screen.getByText('Select at least 2 hypotheses to compare.')).toBeInTheDocument();
  });

  it('renders a tabular comparison with hypothesis names as columns', () => {
    render(<ComparisonFramework />);
    expect(screen.getByText(/Hydraulic Functionality Hypothesis/)).toBeInTheDocument();
    expect(screen.getByText(/Mainstream Funerary Hypothesis/)).toBeInTheDocument();
    expect(screen.getByText('Confidence')).toBeInTheDocument();
    expect(screen.getByText('Evidence count')).toBeInTheDocument();
    expect(screen.getByText('Prediction status')).toBeInTheDocument();
    expect(screen.getByText('Key assumptions')).toBeInTheDocument();
  });

  it('switches between tabular and side-by-side visual modes', () => {
    render(<ComparisonFramework />);
    expect(screen.getByTestId('comparison-table')).toBeInTheDocument();
    expect(screen.queryByTestId('comparison-visual')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Side-by-side' }));
    expect(screen.queryByTestId('comparison-table')).not.toBeInTheDocument();
    expect(screen.getByTestId('comparison-visual')).toBeInTheDocument();
    expect(screen.getByTestId('scene-card-THEORY-OSIRIS-001')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tabular' }));
    expect(screen.getByTestId('comparison-table')).toBeInTheDocument();
  });

  it('displays agreement and disagreement scores with conflict count', () => {
    render(<ComparisonFramework />);
    const scores = screen.getByTestId('comparison-scores');
    expect(scores).toHaveTextContent(/Agreement score/);
    expect(scores).toHaveTextContent(/Disagreement score/);
    expect(scores).toHaveTextContent(/Conflicts detected/);
  });

  it('exports comparison as JSON when the Export button is clicked', () => {
    render(<ComparisonFramework />);
    fireEvent.click(screen.getByRole('button', { name: 'Export comparison as JSON' }));
    const exported = screen.getByTestId('comparison-export');
    expect(exported).toBeInTheDocument();
    const parsed = JSON.parse(exported.textContent ?? '{}') as { hypothesisIds: string[] };
    expect(parsed.hypothesisIds).toEqual(['THEORY-OSIRIS-001', 'THEORY-OSIRIS-002']);
  });

  it('highlights differing assumptions in red across hypotheses', () => {
    render(<ComparisonFramework />);
    // The two Osiris hypotheses have different assumptions; differing ones
    // should be rendered with a red color style.
    const table = screen.getByTestId('comparison-table');
    const assumptionCells = table.querySelectorAll('.assumption-list li');
    const redItems = Array.from(assumptionCells).filter(
      (li) => (li as HTMLElement).style.color === 'rgb(239, 68, 68)',
    );
    expect(redItems.length).toBeGreaterThan(0);
  });

  it('supports comparing 3 hypotheses via the hypothesisIds prop', () => {
    render(
      <ComparisonFramework
        hypothesisIds={['THEORY-OSIRIS-001', 'THEORY-OSIRIS-002', 'THEORY-GP-001']}
      />,
    );
    expect(screen.getByText(/Hydraulic Functionality Hypothesis/)).toBeInTheDocument();
    expect(screen.getByText(/Mainstream Funerary Hypothesis/)).toBeInTheDocument();
    // GP-001 is the Great Pyramid hydraulic hypothesis
    expect(screen.getAllByText(/Hydraulic/).length).toBeGreaterThanOrEqual(2);
  });
});
