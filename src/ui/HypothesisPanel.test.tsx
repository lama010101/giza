import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '@/store/app';
import { hypothesisEngine } from '@/theories/engineInstance';
import { HypothesisPanel } from './HypothesisPanel';

describe('HypothesisPanel (M05.5-T10)', () => {
  beforeEach(() => {
    useAppStore.setState({
      activeHypothesisIds: ['THEORY-OSIRIS-001', 'THEORY-OSIRIS-002'],
      bookmarkedObjectIds: [],
      activeMonument: 'osiris',
    });
    hypothesisEngine.setActive(['THEORY-OSIRIS-001', 'THEORY-OSIRIS-002']);
  });

  it('renders an empty state when no object is selected', () => {
    render(<HypothesisPanel />);
    expect(screen.getByText('Select an object to view hypothesis data.')).toBeInTheDocument();
  });

  it('uses the first bookmarked object when no objectId prop is given', () => {
    useAppStore.setState({ bookmarkedObjectIds: ['OBJ-0006'] });
    render(<HypothesisPanel />);
    expect(screen.getByText(/Hypotheses — Chamber I/)).toBeInTheDocument();
  });

  it('displays hypothesis name, confidence, evidence count, and predictions count', () => {
    render(<HypothesisPanel objectId="OBJ-0006" />);
    expect(screen.getByText(/Hydraulic Functionality Hypothesis/)).toBeInTheDocument();
    expect(screen.getByText(/Mainstream Funerary Hypothesis/)).toBeInTheDocument();
    // Evidence and predictions counts are shown
    expect(screen.getAllByText(/Evidence:/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Predictions:/).length).toBeGreaterThanOrEqual(2);
  });

  it('lists evidence linked to the (object, hypothesis) pair', () => {
    render(<HypothesisPanel objectId="OBJ-0006" />);
    const hydraulicEvidence = screen.getByTestId('evidence-THEORY-OSIRIS-001');
    expect(hydraulicEvidence).toHaveTextContent('Chamber I wall lengths');
    expect(hydraulicEvidence).toHaveTextContent('Level 3 flooded condition');
  });

  it('lists predictions with status labels (pending/confirmed/falsified)', () => {
    render(<HypothesisPanel objectId="OBJ-0006" />);
    const hydraulicPreds = screen.getByTestId('predictions-THEORY-OSIRIS-001');
    expect(hydraulicPreds).toHaveTextContent('pending');

    const mainstreamPreds = screen.getByTestId('predictions-THEORY-OSIRIS-002');
    expect(mainstreamPreds).toHaveTextContent('confirmed');
  });

  it('shows only hypotheses that apply to the selected object', () => {
    // OBJ-0008 is only affected by the mainstream hypothesis, not hydraulic
    render(<HypothesisPanel objectId="OBJ-0008" />);
    expect(screen.getByText(/Mainstream Funerary Hypothesis/)).toBeInTheDocument();
    expect(screen.queryByText(/Hydraulic Functionality Hypothesis/)).not.toBeInTheDocument();
  });

  it('triggers onCompare with applicable hypothesis ids when Compare is clicked', () => {
    const onCompare = vi.fn();
    render(<HypothesisPanel objectId="OBJ-0006" onCompare={onCompare} />);
    fireEvent.click(screen.getByRole('button', { name: 'Compare hypotheses' }));
    expect(onCompare).toHaveBeenCalledWith(['THEORY-OSIRIS-001', 'THEORY-OSIRIS-002']);
    expect(screen.getByText('Comparison triggered')).toBeInTheDocument();
  });

  it('shows a message when no active hypotheses apply to the object', () => {
    useAppStore.setState({ activeHypothesisIds: ['THEORY-OSIRIS-001'] });
    hypothesisEngine.setActive(['THEORY-OSIRIS-001']);
    // OBJ-0008 is not affected by the hydraulic hypothesis
    render(<HypothesisPanel objectId="OBJ-0008" />);
    expect(screen.getByText('No active hypotheses apply to this object.')).toBeInTheDocument();
  });
});
