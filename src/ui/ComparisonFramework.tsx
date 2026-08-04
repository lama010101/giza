/**
 * Comparison framework per M05.5-T11.
 *
 * Renders a tabular comparison of 2-3 hypotheses side-by-side with columns
 * for hypothesis name, confidence, evidence count, prediction status, and
 * key assumptions. Supports switching between tabular and visual (side-by-side
 * scene) modes, highlights differences between hypotheses (color-coded), and
 * exports the comparison as JSON.
 *
 * Uses the Zustand store for selected hypotheses. Scientific neutrality is
 * preserved: differences are highlighted, but no hypothesis is declared
 * correct.
 */

import { useMemo, useState } from 'react';
import { getDefaultHypothesisContext, hypothesisEngine } from '@/theories/engineInstance';
import { comparePredictions, exportComparisonAsJson } from '@/theories/predictionComparison';
import { useAppStore } from '@/store/app';
import type { Hypothesis } from '@/schemas/hypothesis';
import type { PredictionStatus } from '@/schemas/prediction';
import { EVIDENCE_OVERLAY_COLORS, SOFT_BLUE, STONE } from './colorTokens';

type ViewMode = 'tabular' | 'visual';

interface HypothesisSummary {
  hypothesis: Hypothesis;
  confidence: number;
  evidenceCount: number;
  predictionStatusCounts: Record<PredictionStatus, number>;
  keyAssumptions: string[];
}

/**
 * Summarizes a hypothesis for comparison display.
 */
function summarizeHypothesis(hypothesis: Hypothesis): HypothesisSummary {
  const evidenceCount = hypothesis.supports.length + hypothesis.contradicts.length;
  const predictionStatusCounts: Record<PredictionStatus, number> = {
    untested: 0,
    confirmed: 0,
    'partially-confirmed': 0,
    contradicted: 0,
    inconclusive: 0,
  };
  for (const pred of hypothesis.predictions) {
    predictionStatusCounts[pred.status] += 1;
  }
  return {
    hypothesis,
    confidence: hypothesis.confidence,
    evidenceCount,
    predictionStatusCounts,
    keyAssumptions: hypothesis.scientificAssumptions,
  };
}

/**
 * Formats the prediction status summary as a compact string.
 */
function formatPredictionStatus(counts: Record<PredictionStatus, number>): string {
  const parts: string[] = [];
  if (counts.confirmed > 0) parts.push(`${counts.confirmed} confirmed`);
  if (counts['partially-confirmed'] > 0) parts.push(`${counts['partially-confirmed']} partial`);
  if (counts.contradicted > 0) parts.push(`${counts.contradicted} falsified`);
  if (counts.untested > 0) parts.push(`${counts.untested} pending`);
  if (counts.inconclusive > 0) parts.push(`${counts.inconclusive} inconclusive`);
  return parts.length > 0 ? parts.join(', ') : 'none';
}

interface ComparisonFrameworkProps {
  /** Optional override for hypothesis IDs to compare. Defaults to active store hypotheses. */
  hypothesisIds?: string[];
}

export function ComparisonFramework({ hypothesisIds }: ComparisonFrameworkProps): JSX.Element {
  const activeHypothesisIds = useAppStore((s) => s.activeHypothesisIds);
  const [viewMode, setViewMode] = useState<ViewMode>('tabular');
  const [exportedJson, setExportedJson] = useState<string | null>(null);

  const ids = hypothesisIds ?? activeHypothesisIds;

  const summaries = useMemo<HypothesisSummary[]>(() => {
    const context = getDefaultHypothesisContext();
    return ids.slice(0, 3).map((id) => {
      const hypothesis = hypothesisEngine.getHypothesis(id, context);
      return summarizeHypothesis(hypothesis);
    });
  }, [ids]);

  const hypotheses = useMemo<Hypothesis[]>(() => {
    const context = getDefaultHypothesisContext();
    return ids.slice(0, 3).map((id) => hypothesisEngine.getHypothesis(id, context));
  }, [ids]);

  const comparison = useMemo(() => {
    if (hypotheses.length < 2) return null;
    return comparePredictions(hypotheses);
  }, [hypotheses]);

  // Determine which assumptions differ across hypotheses
  const differingAssumptions = useMemo<Set<string>>(() => {
    if (summaries.length < 2) return new Set();
    const allAssumptions = new Set<string>();
    for (const s of summaries) {
      for (const a of s.keyAssumptions) allAssumptions.add(a);
    }
    const differing = new Set<string>();
    for (const assumption of allAssumptions) {
      const present = summaries.filter((s) => s.keyAssumptions.includes(assumption)).length;
      if (present !== summaries.length) differing.add(assumption);
    }
    return differing;
  }, [summaries]);

  // Determine which confidence values differ
  const confidenceDiffers = useMemo(() => {
    if (summaries.length < 2) return false;
    const values = summaries.map((s) => s.confidence);
    return new Set(values).size > 1;
  }, [summaries]);

  const handleExport = (): void => {
    if (!comparison) return;
    setExportedJson(exportComparisonAsJson(comparison));
  };

  if (ids.length < 2) {
    return (
      <div className="comparison-framework" data-testid="comparison-framework">
        <h2>Comparison</h2>
        <p className="comparison-empty">Select at least 2 hypotheses to compare.</p>
      </div>
    );
  }

  return (
    <div className="comparison-framework" data-testid="comparison-framework">
      <h2>Hypothesis Comparison</h2>

      <div className="comparison-mode-toggle">
        <button
          type="button"
          className={viewMode === 'tabular' ? 'active' : ''}
          aria-pressed={viewMode === 'tabular'}
          onClick={() => setViewMode('tabular')}
        >
          Tabular
        </button>
        <button
          type="button"
          className={viewMode === 'visual' ? 'active' : ''}
          aria-pressed={viewMode === 'visual'}
          onClick={() => setViewMode('visual')}
        >
          Side-by-side
        </button>
        <button
          type="button"
          className="comparison-export-btn"
          onClick={handleExport}
          disabled={!comparison}
          aria-label="Export comparison as JSON"
        >
          Export JSON
        </button>
      </div>

      {viewMode === 'tabular' && (
        <table className="comparison-table" data-testid="comparison-table">
          <thead>
            <tr>
              <th>Attribute</th>
              {summaries.map((s) => (
                <th key={s.hypothesis.id}>{s.hypothesis.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Confidence</td>
              {summaries.map((s) => (
                <td
                  key={s.hypothesis.id}
                  style={
                    confidenceDiffers
                      ? { color: EVIDENCE_OVERLAY_COLORS.orange, fontWeight: 'bold' }
                      : undefined
                  }
                >
                  {s.confidence}%
                </td>
              ))}
            </tr>
            <tr>
              <td>Evidence count</td>
              {summaries.map((s) => (
                <td key={s.hypothesis.id}>{s.evidenceCount}</td>
              ))}
            </tr>
            <tr>
              <td>Prediction status</td>
              {summaries.map((s) => (
                <td key={s.hypothesis.id}>{formatPredictionStatus(s.predictionStatusCounts)}</td>
              ))}
            </tr>
            <tr>
              <td>Key assumptions</td>
              {summaries.map((s) => (
                <td key={s.hypothesis.id}>
                  <ul className="assumption-list">
                    {s.keyAssumptions.map((a, idx) => (
                      <li
                        key={idx}
                        style={
                          differingAssumptions.has(a)
                            ? { color: EVIDENCE_OVERLAY_COLORS.red }
                            : undefined
                        }
                      >
                        {a}
                      </li>
                    ))}
                  </ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      )}

      {viewMode === 'visual' && (
        <div className="comparison-visual" data-testid="comparison-visual">
          {summaries.map((s) => (
            <div
              key={s.hypothesis.id}
              className="comparison-scene-card"
              data-testid={`scene-card-${s.hypothesis.id}`}
              style={{
                borderLeft: `4px solid ${SOFT_BLUE[500]}`,
                backgroundColor: STONE[850],
              }}
            >
              <h3>{s.hypothesis.name}</h3>
              <p>
                <strong>Confidence:</strong> {s.confidence}%
              </p>
              <p>
                <strong>Evidence:</strong> {s.evidenceCount}
              </p>
              <p>
                <strong>Predictions:</strong> {formatPredictionStatus(s.predictionStatusCounts)}
              </p>
              <div className="comparison-assumptions">
                <strong>Assumptions:</strong>
                <ul>
                  {s.keyAssumptions.map((a, idx) => (
                    <li
                      key={idx}
                      style={
                        differingAssumptions.has(a)
                          ? { color: EVIDENCE_OVERLAY_COLORS.red }
                          : undefined
                      }
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}

      {comparison && (
        <div className="comparison-scores" data-testid="comparison-scores">
          <p>
            <strong>Agreement score:</strong> {(comparison.agreementScore * 100).toFixed(0)}%
          </p>
          <p>
            <strong>Disagreement score:</strong> {(comparison.disagreementScore * 100).toFixed(0)}%
          </p>
          <p>
            <strong>Conflicts detected:</strong> {comparison.conflicts.length}
          </p>
        </div>
      )}

      {exportedJson && (
        <pre className="comparison-export" data-testid="comparison-export">
          {exportedJson}
        </pre>
      )}
    </div>
  );
}
