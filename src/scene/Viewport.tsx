import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';
import { useAppStore } from '@/store/app';
import type { CameraMode, Monument } from '@/store/app';
import { SimulationPanel } from '@/ui/SimulationPanel';
import { LightingPanel } from '@/ui/LightingPanel';
import { LayerPanel } from '@/ui/LayerPanel';
import { OsirisScene } from './OsirisScene';
import { GreatPyramidScene } from './GreatPyramidScene';

const CAMERA_MODES: CameraMode[] = ['orbit', 'walk', 'fly', 'teleport'];
const MONUMENTS: { id: Monument; label: string }[] = [
  { id: 'osiris', label: 'Osiris Shaft' },
  { id: 'great-pyramid', label: 'Great Pyramid' },
];

export function Viewport(): JSX.Element {
  const hoveredNodeId = useAppStore((s) => s.hoveredNodeId);
  const measurementMode = useAppStore((s) => s.measurementMode);
  const measurementStart = useAppStore((s) => s.measurementStart);
  const measurementEnd = useAppStore((s) => s.measurementEnd);
  const setMeasurementMode = useAppStore((s) => s.setMeasurementMode);
  const clearMeasurement = useAppStore((s) => s.clearMeasurement);
  const cameraMode = useAppStore((s) => s.cameraMode);
  const setCameraMode = useAppStore((s) => s.setCameraMode);
  const mode = useAppStore((s) => s.mode);
  const activeMonument = useAppStore((s) => s.activeMonument);
  const setActiveMonument = useAppStore((s) => s.setActiveMonument);

  const hoveredName = hoveredNodeId
    ? activeMonument === 'great-pyramid'
      ? greatPyramidBlockout.nodes.find((n) => n.id === hoveredNodeId)?.name
      : osirisBlockout.nodes.find((n) => n.id === hoveredNodeId)?.name
    : undefined;

  const distance =
    measurementStart && measurementEnd
      ? Math.hypot(
          measurementEnd.x - measurementStart.x,
          measurementEnd.y - measurementStart.y,
          measurementEnd.z - measurementStart.z,
        )
      : null;

  const showCameraControls = mode === 'Research' || cameraMode !== 'orbit';

  return (
    <div className="viewport">
      {activeMonument === 'great-pyramid' ? <GreatPyramidScene /> : <OsirisScene />}
      <div className="monument-selector">
        {MONUMENTS.map((m) => (
          <button
            key={m.id}
            type="button"
            className={activeMonument === m.id ? 'active' : ''}
            aria-pressed={activeMonument === m.id}
            onClick={() => setActiveMonument(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      {hoveredName && <div className="viewport-overlay">{hoveredName}</div>}
      {showCameraControls && (
        <div className="camera-controls">
          {CAMERA_MODES.map((cm) => (
            <button
              key={cm}
              type="button"
              className={cameraMode === cm ? 'active' : ''}
              aria-pressed={cameraMode === cm}
              onClick={() => setCameraMode(cm)}
            >
              {cm}
            </button>
          ))}
          {cameraMode === 'teleport' && (
            <span className="camera-hint">Double-click to teleport</span>
          )}
          {(cameraMode === 'walk' || cameraMode === 'fly') && (
            <span className="camera-hint">Click to lock pointer · WASD to move</span>
          )}
        </div>
      )}
      <div className="measure-tools">
        <button
          type="button"
          className={measurementMode ? 'active' : ''}
          aria-pressed={measurementMode}
          onClick={() => setMeasurementMode(!measurementMode)}
        >
          Measure
        </button>
        {measurementStart && (
          <>
            <span className="measure-readout">
              {distance !== null ? `${distance.toFixed(2)} m` : 'Pick a second point'}
            </span>
            <button type="button" onClick={clearMeasurement}>
              Reset
            </button>
          </>
        )}
      </div>
      <LightingPanel />
      <LayerPanel />
      <SimulationPanel />
    </div>
  );
}
