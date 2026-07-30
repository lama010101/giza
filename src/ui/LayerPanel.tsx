import { useAppStore, MONUMENT_LAYERS } from '@/store/app';
import type { SceneLayer } from '@/store/app';

const LAYER_LABELS: Record<SceneLayer, string> = {
  shafts: 'Shafts',
  'level-1': 'Level 1 (Chamber A)',
  'level-2': 'Level 2 (Chamber B)',
  'level-3': 'Level 3 (Chamber I)',
  monument: 'Monument',
  exterior: 'Exterior',
  passages: 'Passages',
  subterranean: 'Subterranean',
  gallery: 'Grand Gallery',
  'kings-complex': "King's Complex",
  'queens-complex': "Queen's Complex",
  relieving: 'Relieving Chambers',
};

export function LayerPanel(): JSX.Element {
  const activeMonument = useAppStore((s) => s.activeMonument);
  const hiddenLayers = useAppStore((s) => s.hiddenLayers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);
  const setHiddenLayers = useAppStore((s) => s.setHiddenLayers);

  const monumentLayers = MONUMENT_LAYERS[activeMonument];
  const allVisible = monumentLayers.every((l) => !hiddenLayers.includes(l));

  const handleToggleAll = (): void => {
    if (allVisible) {
      setHiddenLayers([...monumentLayers]);
    } else {
      setHiddenLayers(hiddenLayers.filter((l) => !monumentLayers.includes(l)));
    }
  };

  return (
    <div className="layer-panel" data-testid="layer-panel">
      <h3>Layers</h3>
      <div className="layer-controls">
        <div className="layer-toggle-all">
          <button type="button" className="layer-all-btn" onClick={handleToggleAll}>
            {allVisible ? 'Hide All' : 'Show All'}
          </button>
        </div>
        {monumentLayers.map((layer) => (
          <label key={layer} className="layer-option">
            <input
              type="checkbox"
              checked={!hiddenLayers.includes(layer)}
              onChange={() => toggleLayer(layer)}
            />
            {LAYER_LABELS[layer]}
          </label>
        ))}
      </div>
    </div>
  );
}
