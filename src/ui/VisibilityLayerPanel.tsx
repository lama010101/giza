import { useAppStore, VISIBILITY_LAYERS } from '@/store/app';
import type { VisibilityLayer } from '@/store/app';

const VISIBILITY_LAYER_LABELS: Record<VisibilityLayer, string> = {
  Geometry: 'Geometry (structure)',
  Modern: 'Modern additions',
  Water: 'Water surfaces',
  Geology: 'Geology / terrain',
  Evidence: 'Evidence hotspots',
  Theory: 'Theory overlays',
  Simulation: 'Simulation effects',
  Annotations: 'Annotations / measurements',
};

export function VisibilityLayerPanel(): JSX.Element {
  const hiddenVisibilityLayers = useAppStore((s) => s.hiddenVisibilityLayers);
  const toggleVisibilityLayer = useAppStore((s) => s.toggleVisibilityLayer);
  const setHiddenVisibilityLayers = useAppStore((s) => s.setHiddenVisibilityLayers);

  const allVisible = hiddenVisibilityLayers.length === 0;

  const handleToggleAll = (): void => {
    if (allVisible) {
      setHiddenVisibilityLayers([...VISIBILITY_LAYERS]);
    } else {
      setHiddenVisibilityLayers([]);
    }
  };

  return (
    <div className="layer-panel" data-testid="visibility-layer-panel">
      <h3>Visibility layers</h3>
      <div className="layer-controls">
        <div className="layer-toggle-all">
          <button type="button" className="layer-all-btn" onClick={handleToggleAll}>
            {allVisible ? 'Hide all' : 'Show all'}
          </button>
        </div>
        {VISIBILITY_LAYERS.map((layer) => (
          <label key={layer} className="layer-option">
            <input
              type="checkbox"
              checked={!hiddenVisibilityLayers.includes(layer)}
              onChange={() => toggleVisibilityLayer(layer)}
            />
            {VISIBILITY_LAYER_LABELS[layer]}
          </label>
        ))}
      </div>
    </div>
  );
}
