/**
 * Hypothesis panel per M05.5-T10.
 *
 * Displays per-object hypothesis data: which hypotheses apply to the selected
 * object, their confidence, evidence count, predictions count, linked
 * evidence, and predictions with status. Includes a "Compare" button that
 * triggers the comparison view.
 *
 * Scientific neutrality: the panel presents data for all active hypotheses
 * without declaring any correct.
 */

import { useMemo, useState } from 'react';
import { getEvidenceById, getObjectById } from '@/evidence/repository';
import { getDefaultHypothesisContext, hypothesisEngine } from '@/theories/engineInstance';
import { useAppStore } from '@/store/app';
import type { Evidence } from '@/schemas/evidence';
import type { Hypothesis } from '@/schemas/hypothesis';
import type { PredictionStatus } from '@/schemas/prediction';
import { EVIDENCE_OVERLAY_COLORS } from './colorTokens';

/**
 * Maps a prediction status to a display label.
 */
function statusLabel(status: PredictionStatus): 'pending' | 'confirmed' | 'falsified' {
  switch (status) {
    case 'confirmed':
    case 'partially-confirmed':
      return 'confirmed';
    case 'contradicted':
      return 'falsified';
    default:
      return 'pending';
  }
}

/**
 * Maps a prediction status to a display color token.
 */
function statusColor(status: PredictionStatus): string {
  switch (status) {
    case 'confirmed':
    case 'partially-confirmed':
      return EVIDENCE_OVERLAY_COLORS.green;
    case 'contradicted':
      return EVIDENCE_OVERLAY_COLORS.red;
    default:
      return EVIDENCE_OVERLAY_COLORS.orange;
  }
}

interface HypothesisPanelProps {
  /** Optional object ID to inspect. Falls back to first bookmarked object. */
  objectId?: string;
  /** Called when the Compare button is clicked. */
  onCompare?: (hypothesisIds: string[]) => void;
}

interface ObjectHypothesisData {
  hypothesis: Hypothesis;
  confidence: number;
  evidenceCount: number;
  predictionsCount: number;
  linkedEvidence: Evidence[];
  predictions: Hypothesis['predictions'];
}

export function HypothesisPanel({ objectId, onCompare }: HypothesisPanelProps): JSX.Element {
  const activeHypothesisIds = useAppStore((s) => s.activeHypothesisIds);
  const bookmarkedObjectIds = useAppStore((s) => s.bookmarkedObjectIds);
  const [compareTriggered, setCompareTriggered] = useState(false);

  const resolvedObjectId = objectId ?? bookmarkedObjectIds[0] ?? null;

  const object = useMemo(
    () => (resolvedObjectId ? getObjectById(resolvedObjectId) : undefined),
    [resolvedObjectId],
  );

  const hypothesisData = useMemo<ObjectHypothesisData[]>(() => {
    if (!resolvedObjectId) return [];
    const context = getDefaultHypothesisContext();
    const ids =
      activeHypothesisIds.length > 0 ? activeHypothesisIds : hypothesisEngine.getActiveIds();

    const result: ObjectHypothesisData[] = [];
    for (const id of ids) {
      const hypothesis = hypothesisEngine.getHypothesis(id, context);
      if (!hypothesis.affectedStructures.includes(resolvedObjectId)) continue;

      const evidenceIds = [...hypothesis.supports, ...hypothesis.contradicts];
      const linkedEvidence = evidenceIds
        .map((eid) => getEvidenceById(eid))
        .filter((ev): ev is Evidence => ev !== undefined)
        .filter((ev) => ev.objectIds.includes(resolvedObjectId));

      const confidence = hypothesis.confidenceByObject[resolvedObjectId] ?? hypothesis.confidence;

      result.push({
        hypothesis,
        confidence,
        evidenceCount: linkedEvidence.length,
        predictionsCount: hypothesis.predictions.length,
        linkedEvidence,
        predictions: hypothesis.predictions,
      });
    }
    return result;
  }, [resolvedObjectId, activeHypothesisIds]);

  const handleCompare = (): void => {
    const ids = hypothesisData.map((d) => d.hypothesis.id);
    setCompareTriggered(true);
    onCompare?.(ids);
  };

  if (!resolvedObjectId || !object) {
    return (
      <div className="hypothesis-panel" data-testid="hypothesis-panel">
        <h2>Hypotheses</h2>
        <p className="hypothesis-panel-empty">Select an object to view hypothesis data.</p>
      </div>
    );
  }

  return (
    <div className="hypothesis-panel" data-testid="hypothesis-panel">
      <h2>Hypotheses — {object.name}</h2>

      {hypothesisData.length === 0 ? (
        <p className="hypothesis-panel-empty">No active hypotheses apply to this object.</p>
      ) : (
        <>
          <button
            type="button"
            className="hypothesis-compare-btn"
            onClick={handleCompare}
            aria-label="Compare hypotheses"
          >
            {compareTriggered ? 'Comparison triggered' : 'Compare'}
          </button>

          <ul className="hypothesis-list" data-testid="hypothesis-list">
            {hypothesisData.map((data) => (
              <li
                key={data.hypothesis.id}
                className="hypothesis-item"
                data-testid={`hypothesis-item-${data.hypothesis.id}`}
              >
                <div className="hypothesis-header">
                  <span className="hypothesis-name">{data.hypothesis.name}</span>
                  <span className="hypothesis-confidence">{data.confidence}%</span>
                </div>
                <div className="hypothesis-stats">
                  <span>Evidence: {data.evidenceCount}</span>
                  <span>Predictions: {data.predictionsCount}</span>
                </div>

                {data.linkedEvidence.length > 0 && (
                  <div
                    className="hypothesis-evidence"
                    data-testid={`evidence-${data.hypothesis.id}`}
                  >
                    <strong>Linked evidence:</strong>
                    <ul>
                      {data.linkedEvidence.map((ev) => (
                        <li key={ev.id}>{ev.title}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {data.predictions.length > 0 && (
                  <div
                    className="hypothesis-predictions"
                    data-testid={`predictions-${data.hypothesis.id}`}
                  >
                    <strong>Predictions:</strong>
                    <ul>
                      {data.predictions.map((pred) => {
                        const label = statusLabel(pred.status);
                        const color = statusColor(pred.status);
                        return (
                          <li key={pred.id} className="prediction-item">
                            <span
                              className="prediction-status-dot"
                              style={{ backgroundColor: color }}
                              aria-label={`status ${label}`}
                            />
                            <span className="prediction-description">{pred.description}</span>
                            <span className="prediction-status-label">{label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
