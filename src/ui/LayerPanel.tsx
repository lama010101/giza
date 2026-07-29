import { useAppStore, SCENE_LAYERS } from '@/store/app';
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
  const hiddenLayers = useAppStore((s) => s.hiddenLayers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);

  return (
    <div className="layer-panel" data-testid="layer-panel">
      <h3>Layers</h3>
      <div className="layer-controls">
        {SCENE_LAYERS.map((layer) => (
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
