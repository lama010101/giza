import { useMemo } from 'react';
import { useAppStore } from '@/store/app';
import type { CameraMode, Monument, SidePanelTab } from '@/store/app';
import { getObjectById } from '@/evidence/repository';
import { hypothesisEngine } from '@/theories/engineInstance';
import { buildOsirisSceneGraph } from '@/scene/osirisSceneGraph';
import { buildGreatPyramidSceneGraph } from '@/scene/greatPyramidSceneGraph';
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

function getMonumentHypothesisIds(monument: Monument): string[] {
  const allIds = hypothesisEngine.getPluginIds();
  return allIds.filter((id) =>
    monument === 'osiris' ? id.startsWith('THEORY-OSIRIS') : id.startsWith('THEORY-GP'),
  );
}

function ExploreActions(): JSX.Element {
  const mode = useAppStore((s) => s.mode);
  const activeMonument = useAppStore((s) => s.activeMonument);
  const lod = useAppStore((s) => s.lod);
  const selectedObjectId = useAppStore((s) => s.selectedObjectId);
  const activeHypothesisIds = useAppStore((s) => s.activeHypothesisIds);
  const setActiveHypothesisIds = useAppStore((s) => s.setActiveHypothesisIds);
  const hiddenLayers = useAppStore((s) => s.hiddenLayers);
  const setHiddenLayers = useAppStore((s) => s.setHiddenLayers);
  const setSidePanelTab = useAppStore((s) => s.setSidePanelTab);
  const setEvidencePanelOpen = useAppStore((s) => s.setEvidencePanelOpen);
  const setSelectedEvidenceId = useAppStore((s) => s.setSelectedEvidenceId);

  const graph = useMemo(
    () =>
      activeMonument === 'great-pyramid'
        ? buildGreatPyramidSceneGraph(lod)
        : buildOsirisSceneGraph(),
    [activeMonument, lod],
  );

  const selectedNode = useMemo(() => {
    if (!selectedObjectId) return undefined;
    return graph.getAllVisibleNodes().find((n) => n.metadata.objectId === selectedObjectId);
  }, [graph, selectedObjectId]);

  const selectedLayer = selectedNode?.metadata.layer;
  const layerHidden = selectedLayer ? hiddenLayers.includes(selectedLayer as never) : false;

  const handleInspect = (): void => {
    if (!selectedObjectId) return;
    const obj = getObjectById(selectedObjectId);
    if (obj?.evidence && obj.evidence.length > 0) {
      setSelectedEvidenceId(obj.evidence[0]);
      setSidePanelTab('evidence');
    } else {
      setSidePanelTab('hypothesis');
    }
    setEvidencePanelOpen(true);
  };

  const handleSwitchTheory = (): void => {
    const monumentIds = getMonumentHypothesisIds(activeMonument);
    if (monumentIds.length === 0) return;
    const active = activeHypothesisIds.filter((id) => monumentIds.includes(id));
    const other = activeHypothesisIds.filter((id) => !monumentIds.includes(id));
    let next: string;
    if (active.length === 0) {
      next = monumentIds[0];
    } else {
      const last = active[active.length - 1];
      const idx = monumentIds.indexOf(last);
      next = monumentIds[(idx + 1) % monumentIds.length];
    }
    setActiveHypothesisIds([...other, next]);
  };

  const handleRevealLayer = (): void => {
    if (!selectedLayer) return;
    setHiddenLayers(hiddenLayers.filter((l) => l !== (selectedLayer as never)));
  };

  if (mode !== 'Explore') return <></>;

  return (
    <section className="side-section" data-testid="explore-actions">
      <h3>Explore</h3>
      <div className="side-btn-group">
        <button
          type="button"
          onClick={handleInspect}
          disabled={!selectedObjectId}
          title={selectedObjectId ? `Inspect ${selectedObjectId}` : 'Select an object first'}
        >
          Inspect
        </button>
        <button type="button" onClick={handleSwitchTheory}>
          Switch theory
        </button>
        <button
          type="button"
          onClick={handleRevealLayer}
          disabled={!layerHidden}
          title={selectedLayer ? `Reveal ${selectedLayer}` : 'Select an object first'}
        >
          Reveal layer
        </button>
      </div>
    </section>
  );
}

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
      <ExploreActions />
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
