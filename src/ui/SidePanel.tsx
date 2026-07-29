import { useState } from 'react';
import { useAppStore } from '@/store/app';
import type { CameraMode, Monument } from '@/store/app';
import { EvidencePanel } from './EvidencePanel';
import { LightingPanel } from './LightingPanel';
import { LayerPanel } from './LayerPanel';
import { SimulationPanel } from './SimulationPanel';
import { HypothesisSelector } from './HypothesisSelector';

type Tab = 'scene' | 'evidence' | 'simulation';

const TABS: { id: Tab; label: string }[] = [
  { id: 'scene', label: 'Scene' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'simulation', label: 'Simulation' },
];

const CAMERA_MODES: CameraMode[] = ['orbit', 'walk', 'fly', 'teleport'];
const MONUMENTS: { id: Monument; label: string }[] = [
  { id: 'osiris', label: 'Osiris Shaft' },
  { id: 'great-pyramid', label: 'Great Pyramid' },
];

function SceneTab(): JSX.Element {
  const activeMonument = useAppStore((s) => s.activeMonument);
  const setActiveMonument = useAppStore((s) => s.setActiveMonument);
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
      <section className="side-section">
        <h3>Monument</h3>
        <div className="side-btn-group">
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
      </section>

      <section className="side-section">
        <h3>Hypotheses</h3>
        <HypothesisSelector />
      </section>

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

      <section className="side-section">
        <LightingPanel />
      </section>
    </div>
  );
}

export function SidePanel(): JSX.Element {
  const [activeTab, setActiveTab] = useState<Tab>('scene');
  const evidencePanelOpen = useAppStore((s) => s.evidencePanelOpen);
  const setEvidencePanelOpen = useAppStore((s) => s.setEvidencePanelOpen);

  if (!evidencePanelOpen) {
    return (
      <button
        type="button"
        className="panel-toggle"
        aria-label="Expand side panel"
        aria-expanded={false}
        onClick={() => setEvidencePanelOpen(true)}
      >
        «
      </button>
    );
  }

  return (
    <>
      <div className="side-panel" data-testid="side-panel">
        <div className="side-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={activeTab === tab.id ? 'active' : ''}
              aria-pressed={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="side-panel-body">
          {activeTab === 'scene' && <SceneTab />}
          {activeTab === 'evidence' && <EvidencePanel />}
          {activeTab === 'simulation' && <SimulationPanel />}
        </div>
      </div>
      <button
        type="button"
        className="panel-toggle"
        aria-label="Collapse side panel"
        aria-expanded={true}
        onClick={() => setEvidencePanelOpen(false)}
      >
        »
      </button>
    </>
  );
}
