import { useState } from 'react';
import { useAppStore, MONUMENT_LAYERS } from '@/store/app';
import { getEvidenceByObject } from '@/evidence/repository';
import { getDefaultHypothesisContext, hypothesisEngine } from '@/theories/engineInstance';
import { useSelectedSceneNode } from './useSelectedSceneNode';

function LayerRevealPopover({ onClose }: { onClose: () => void }): JSX.Element {
  const activeMonument = useAppStore((s) => s.activeMonument);
  const hiddenLayers = useAppStore((s) => s.hiddenLayers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);
  const layers = MONUMENT_LAYERS[activeMonument];

  return (
    <div className="layer-reveal-popover" data-testid="layer-reveal-popover">
      {layers.map((layer) => (
        <label key={layer} className="layer-reveal-option">
          <input
            type="checkbox"
            checked={!hiddenLayers.includes(layer)}
            onChange={() => toggleLayer(layer)}
          />
          {layer}
        </label>
      ))}
      <button type="button" className="layer-reveal-close" onClick={onClose}>
        Done
      </button>
    </div>
  );
}

function useTheorySwitcher() {
  const activeHypothesisIds = useAppStore((s) => s.activeHypothesisIds);
  const setActiveHypothesisIds = useAppStore((s) => s.setActiveHypothesisIds);

  const switchTheory = (): void => {
    const allIds = hypothesisEngine.getPluginIds();
    if (allIds.length === 0) return;
    const currentId = activeHypothesisIds[0];
    const currentIndex = currentId ? allIds.indexOf(currentId) : -1;
    const nextIndex = (currentIndex + 1) % allIds.length;
    setActiveHypothesisIds([allIds[nextIndex]]);
  };

  const currentName = (): string | undefined => {
    if (activeHypothesisIds.length === 0) return undefined;
    const context = getDefaultHypothesisContext();
    return hypothesisEngine.getHypothesis(activeHypothesisIds[0], context).name;
  };

  return { switchTheory, currentName: currentName() };
}

export function ExploreActions(): JSX.Element | null {
  const mode = useAppStore((s) => s.mode);
  const setSelectedEvidenceId = useAppStore((s) => s.setSelectedEvidenceId);
  const setSelectedObjectId = useAppStore((s) => s.setSelectedObjectId);
  const setSidePanelTab = useAppStore((s) => s.setSidePanelTab);
  const setEvidencePanelOpen = useAppStore((s) => s.setEvidencePanelOpen);
  const hiddenLayers = useAppStore((s) => s.hiddenLayers);
  const setHiddenLayers = useAppStore((s) => s.setHiddenLayers);

  const selected = useSelectedSceneNode();
  const { switchTheory, currentName } = useTheorySwitcher();
  const [layersOpen, setLayersOpen] = useState(false);

  if (mode !== 'Explore') return null;

  const objectId = selected?.objectId;

  const handleInspect = (): void => {
    if (!objectId) return;
    const evidence = getEvidenceByObject(objectId);
    if (evidence.length > 0) {
      setSelectedEvidenceId(evidence[0].id);
      setSidePanelTab('evidence');
    } else {
      setSelectedObjectId(objectId);
      setSidePanelTab('hypothesis');
    }
    setEvidencePanelOpen(true);
  };

  const handleRevealAll = (): void => {
    setHiddenLayers([]);
  };

  const allLayersVisible = hiddenLayers.length === 0;

  return (
    <div className="explore-actions" data-testid="explore-actions">
      <button
        type="button"
        onClick={handleInspect}
        disabled={!objectId}
        title={
          objectId
            ? `Inspect ${selected?.node.name ?? objectId}`
            : 'Hover or select an object to inspect'
        }
      >
        Inspect
      </button>
      <button type="button" onClick={switchTheory} title="Cycle active hypothesis">
        Theory: {currentName ?? 'None'}
      </button>
      <div className="layer-reveal-wrapper">
        <button
          type="button"
          onClick={() => setLayersOpen((open) => !open)}
          className={layersOpen ? 'active' : ''}
          aria-expanded={layersOpen}
        >
          Layers
        </button>
        {layersOpen && <LayerRevealPopover onClose={() => setLayersOpen(false)} />}
      </div>
      {!allLayersVisible && (
        <button
          type="button"
          className="explore-reveal-all"
          onClick={handleRevealAll}
          title="Reveal all layers"
        >
          Reveal All
        </button>
      )}
    </div>
  );
}
