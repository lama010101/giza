import { useEffect, useMemo } from 'react';
import { getSourceById } from '@/evidence/repository';
import { getDefaultHypothesisContext, hypothesisEngine } from '@/theories/engineInstance';
import { useAppStore } from '@/store/app';

export function HypothesisSelector(): JSX.Element {
  const activeHypothesisIds = useAppStore((s) => s.activeHypothesisIds);
  const setActiveHypothesisIds = useAppStore((s) => s.setActiveHypothesisIds);

  useEffect(() => {
    hypothesisEngine.setActive(activeHypothesisIds);
  }, [activeHypothesisIds]);

  const hypotheses = useMemo(() => {
    const context = getDefaultHypothesisContext();
    return hypothesisEngine.getPluginIds().map((id) => ({
      id,
      name: hypothesisEngine.getHypothesis(id, context).name,
    }));
  }, []);

  const overallConfidence = useMemo(() => {
    const context = getDefaultHypothesisContext();
    const byObject = hypothesisEngine.computeConfidenceByObject(
      context,
      getSourceById,
      hypotheses.map((h) => h.id),
    );
    return hypothesisEngine.computeOverallConfidence(byObject);
  }, [hypotheses]);

  const toggle = (id: string): void => {
    const next = activeHypothesisIds.includes(id)
      ? activeHypothesisIds.filter((activeId) => activeId !== id)
      : [...activeHypothesisIds, id];
    setActiveHypothesisIds(next);
  };

  return (
    <div className="hypothesis-selector">
      {hypotheses.map((h) => (
        <label key={h.id} className="hypothesis-option">
          <input
            type="checkbox"
            checked={activeHypothesisIds.includes(h.id)}
            onChange={() => toggle(h.id)}
          />
          <span>{h.name}</span>
          <span className="hypothesis-confidence">{Math.round(overallConfidence[h.id] ?? 0)}%</span>
        </label>
      ))}
    </div>
  );
}
