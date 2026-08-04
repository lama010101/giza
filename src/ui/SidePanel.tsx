import { useAppStore } from '@/store/app';
import type { CameraMode, Monument, SidePanelTab } from '@/store/app';
import { EvidencePanel } from './EvidencePanel';
import { HypothesisPanel } from './HypothesisPanel';
import { LayerPanel } from './LayerPanel';
import { SimulationPanel } from './SimulationPanel';

const PRIMARY_TABS: { id: Monument; label: string }[] = [
  { id: 'osiris', label: 'Osiris' },
  { id: 'great-pyramid', label: 'Pyramid' },
];

const SECONDARY_TABS: { id: SidePanelTab; label: string }[] = [
  { id: 'scene', label: 'Scene' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'hypothesis', label: 'Theory' },
];

const CAMERA_MODES: CameraMode[] = ['orbit', 'walk', 'fly', 'teleport'];

function SceneTab(): JSX.Element {
  const cameraMode = useAppStore((s) => s.cameraMode);
  const setCameraMode = useAppStore((s) => s.setCameraMode);
  const mode = useAppStore((s) => s.mode);
  const measurementMode = useAppStore((s) => s.measurementMode);
  const setMeasurementMode = useAppStore((s) => s.setMeasurementMode);
  const measurementStart = useAppStore((s) => s.measurementStart);
  const measurementEnd = useAppStore((s) => s.measurementEnd);
  const clearMeasurement = useAppStore((s) => s.clearMeasurement);

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
    <div className="side-tab-content">
      {showCameraControls && (
        <section className="side-section">
          <h3>Camera</h3>
          <div className="side-btn-group">
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
          </div>
          {cameraMode === 'teleport' && <p className="side-hint">Double-click to teleport</p>}
          {(cameraMode === 'walk' || cameraMode === 'fly') && (
            <p className="side-hint">Click to lock pointer · WASD to move</p>
          )}
        </section>
      )}

      <section className="side-section">
        <h3>Measurement</h3>
        <div className="side-btn-group">
          <button
            type="button"
            className={measurementMode ? 'active' : ''}
            aria-pressed={measurementMode}
            onClick={() => setMeasurementMode(!measurementMode)}
          >
            Measure
          </button>
          {measurementStart && (
            <button type="button" onClick={clearMeasurement}>
              Reset
            </button>
          )}
        </div>
        {measurementStart && (
          <p className="side-hint">
            {distance !== null ? `${distance.toFixed(2)} m` : 'Pick a second point'}
          </p>
        )}
      </section>

      <section className="side-section">
        <LayerPanel />
      </section>
    </div>
  );
}

export function SidePanel(): JSX.Element {
  const evidencePanelOpen = useAppStore((s) => s.evidencePanelOpen);
  const setEvidencePanelOpen = useAppStore((s) => s.setEvidencePanelOpen);
  const activeMonument = useAppStore((s) => s.activeMonument);
  const setActiveMonument = useAppStore((s) => s.setActiveMonument);
  const sidePanelTab = useAppStore((s) => s.sidePanelTab);
  const setSidePanelTab = useAppStore((s) => s.setSidePanelTab);
  const selectedObjectId = useAppStore((s) => s.selectedObjectId);

  if (!evidencePanelOpen) {
    return (
      <button
        type="button"
        className="panel-toggle-collapsed"
        aria-label="Expand side panel"
        aria-expanded={false}
        onClick={() => setEvidencePanelOpen(true)}
      >
        «
      </button>
    );
  }

  return (
    <div className="side-panel" data-testid="side-panel">
      <div className="side-panel-header">
        <div className="side-primary-tabs">
          {PRIMARY_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeMonument === tab.id ? 'active' : ''}
              aria-pressed={activeMonument === tab.id}
              onClick={() => setActiveMonument(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="panel-toggle-open"
          aria-label="Collapse side panel"
          aria-expanded={true}
          onClick={() => setEvidencePanelOpen(false)}
        >
          »
        </button>
      </div>
      <div className="side-secondary-tabs">
        {SECONDARY_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={sidePanelTab === tab.id ? 'active' : ''}
            aria-pressed={sidePanelTab === tab.id}
            onClick={() => setSidePanelTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="side-panel-body">
        {sidePanelTab === 'scene' && <SceneTab />}
        {sidePanelTab === 'evidence' && <EvidencePanel />}
        {sidePanelTab === 'simulation' && <SimulationPanel />}
        {sidePanelTab === 'hypothesis' && (
          <HypothesisPanel objectId={selectedObjectId ?? undefined} />
        )}
      </div>
    </div>
  );
}
