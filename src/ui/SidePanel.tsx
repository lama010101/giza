import { useMemo } from 'react';
import { useAppStore, MONUMENT_LAYERS } from '@/store/app';
import type { CameraMode, Monument, SidePanelTab, SceneLayer } from '@/store/app';
import { getObjectById, getSourceById } from '@/evidence/repository';
import { getDefaultHypothesisContext, hypothesisEngine } from '@/theories/engineInstance';
import { buildOsirisSceneGraph } from '@/scene/osirisSceneGraph';
import { buildGreatPyramidSceneGraph } from '@/scene/greatPyramidSceneGraph';
import { EvidencePanel } from './EvidencePanel';
import { HypothesisPanel } from './HypothesisPanel';
import { LayerPanel } from './LayerPanel';
import { VisibilityLayerPanel } from './VisibilityLayerPanel';
import { SimulationPanel } from './SimulationPanel';
import { SearchPanel } from './SearchPanel';
import {
  calculateDistance,
  calculateHeight,
  calculateAngle,
  calculateTriangleArea,
  calculateBoundingBoxVolume,
} from '@/evidence/measurement';
import type { MeasurementType } from '@/evidence/measurement';

const PRIMARY_TABS: { id: Monument; label: string }[] = [
  { id: 'osiris', label: 'Osiris' },
  { id: 'great-pyramid', label: 'Pyramid' },
];

const SECONDARY_TABS: { id: SidePanelTab; label: string }[] = [
  { id: 'scene', label: 'Scene' },
  { id: 'evidence', label: 'Evidence' },
  { id: 'simulation', label: 'Simulation' },
  { id: 'hypothesis', label: 'Theory' },
  { id: 'search', label: 'Search' },
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

function ResearchSceneTools(): JSX.Element {
  const mode = useAppStore((s) => s.mode);
  const activeMonument = useAppStore((s) => s.activeMonument);
  const lod = useAppStore((s) => s.lod);
  const selectedObjectId = useAppStore((s) => s.selectedObjectId);
  const activeHypothesisIds = useAppStore((s) => s.activeHypothesisIds);
  const hiddenLayers = useAppStore((s) => s.hiddenLayers);
  const setHiddenLayers = useAppStore((s) => s.setHiddenLayers);
  const requestScreenshot = useAppStore((s) => s.requestScreenshot);

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

  const selectedLayer = selectedNode?.metadata.layer as SceneLayer | undefined;
  const selectedObject = selectedObjectId ? getObjectById(selectedObjectId) : undefined;

  const allNodes = useMemo(() => graph.getAllNodes(), [graph]);
  const visibleNodes = useMemo(() => graph.getAllVisibleNodes(), [graph]);
  const nodesWithEvidence = useMemo(
    () => allNodes.filter((n) => (n.metadata.evidenceIds ?? []).length > 0).length,
    [allNodes],
  );

  const confidenceByHypothesis = useMemo(() => {
    if (!selectedObjectId || activeHypothesisIds.length === 0) return [];
    const context = getDefaultHypothesisContext();
    const byObject = hypothesisEngine.computeConfidenceByObject(
      context,
      getSourceById,
      activeHypothesisIds,
    );
    return activeHypothesisIds
      .map((id) => {
        const hypothesis = hypothesisEngine.getHypothesis(id, context);
        const confidence = byObject[id]?.[selectedObjectId];
        return { id, name: hypothesis.name, confidence };
      })
      .filter((h) => h.confidence !== undefined);
  }, [selectedObjectId, activeHypothesisIds]);

  const handleIsolateLayer = (): void => {
    if (!selectedLayer) return;
    const monumentLayers = MONUMENT_LAYERS[activeMonument];
    setHiddenLayers(monumentLayers.filter((l) => l !== selectedLayer));
  };

  const handleResetLayers = (): void => {
    setHiddenLayers([]);
  };

  if (mode !== 'Research') return <></>;

  return (
    <section className="side-section" data-testid="research-tools">
      <h3>Research</h3>

      {selectedNode && (
        <div className="metadata-card" data-testid="metadata-card">
          <h4>Selected object</h4>
          <dl>
            <dt>Name</dt>
            <dd>{selectedObject?.name ?? selectedNode.name}</dd>
            <dt>ID</dt>
            <dd>{selectedObjectId}</dd>
            {selectedObject?.objectClass && (
              <>
                <dt>Class</dt>
                <dd>{selectedObject.objectClass}</dd>
              </>
            )}
            <dt>Layer</dt>
            <dd>{selectedLayer ?? '—'}</dd>
            <dt>Confidence</dt>
            <dd>{selectedNode.metadata.confidence ?? '—'}%</dd>
            <dt>Evidence</dt>
            <dd>{(selectedNode.metadata.evidenceIds ?? []).length}</dd>
            <dt>Sources</dt>
            <dd>{(selectedNode.metadata.sourceIds ?? []).length}</dd>
          </dl>
          <div className="side-btn-group">
            <button
              type="button"
              onClick={handleIsolateLayer}
              disabled={!selectedLayer}
              title={selectedLayer ? `Isolate ${selectedLayer}` : 'Select an object first'}
            >
              Isolate layer
            </button>
            <button type="button" onClick={handleResetLayers}>
              Reset layers
            </button>
            <button type="button" onClick={requestScreenshot}>
              Screenshot
            </button>
          </div>
        </div>
      )}

      {confidenceByHypothesis.length > 0 && (
        <div className="confidence-card" data-testid="confidence-viz">
          <h4>Confidence by theory</h4>
          <dl>
            {confidenceByHypothesis.map((h) => (
              <div key={h.id}>
                <dt title={h.id}>{h.name}</dt>
                <dd>{h.confidence}%</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="stats-card" data-testid="geometry-stats">
        <h4>Scene stats</h4>
        <dl>
          <dt>Total nodes</dt>
          <dd>{allNodes.length}</dd>
          <dt>Visible nodes</dt>
          <dd>{visibleNodes.length}</dd>
          <dt>Nodes with evidence</dt>
          <dd>{nodesWithEvidence}</dd>
          <dt>Hidden layers</dt>
          <dd>{hiddenLayers.length}</dd>
          <dt>Active theories</dt>
          <dd>{activeHypothesisIds.length}</dd>
        </dl>
      </div>
    </section>
  );
}

const MEASUREMENT_TYPES: { id: MeasurementType; label: string }[] = [
  { id: 'distance', label: 'Distance' },
  { id: 'height', label: 'Height' },
  { id: 'angle', label: 'Angle' },
  { id: 'area', label: 'Area' },
  { id: 'volume', label: 'Volume' },
];

function useMeasurementResult() {
  const measurementType = useAppStore((s) => s.measurementType);
  const start = useAppStore((s) => s.measurementStart);
  const end = useAppStore((s) => s.measurementEnd);
  const third = useAppStore((s) => s.measurementThird);

  return useMemo(() => {
    if (!start) return { hint: 'Pick a first point', value: null };
    if (!end) return { hint: 'Pick a second point', value: null };

    switch (measurementType) {
      case 'distance':
        return { hint: null, value: `${calculateDistance(start, end).toFixed(2)} m` };
      case 'height':
        return { hint: null, value: `${calculateHeight(start, end).toFixed(2)} m` };
      case 'volume': {
        const min = {
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
          z: Math.min(start.z, end.z),
        };
        const max = {
          x: Math.max(start.x, end.x),
          y: Math.max(start.y, end.y),
          z: Math.max(start.z, end.z),
        };
        return { hint: null, value: `${calculateBoundingBoxVolume(min, max).toFixed(2)} m³` };
      }
      case 'angle':
        if (!third) return { hint: 'Pick a third point', value: null };
        return { hint: null, value: `${calculateAngle(start, end, third).toFixed(1)}°` };
      case 'area':
        if (!third) return { hint: 'Pick a third point', value: null };
        return { hint: null, value: `${calculateTriangleArea(start, end, third).toFixed(2)} m²` };
      default:
        return { hint: null, value: null };
    }
  }, [measurementType, start, end, third]);
}

function SceneTab(): JSX.Element {
  const cameraMode = useAppStore((s) => s.cameraMode);
  const setCameraMode = useAppStore((s) => s.setCameraMode);
  const mode = useAppStore((s) => s.mode);
  const measurementMode = useAppStore((s) => s.measurementMode);
  const setMeasurementMode = useAppStore((s) => s.setMeasurementMode);
  const measurementType = useAppStore((s) => s.measurementType);
  const setMeasurementType = useAppStore((s) => s.setMeasurementType);
  const measurementStart = useAppStore((s) => s.measurementStart);
  const clearMeasurement = useAppStore((s) => s.clearMeasurement);
  const measurement = useMeasurementResult();

  const showCameraControls = mode === 'Research' || cameraMode !== 'orbit';

  return (
    <div className="side-tab-content">
      <ExploreActions />
      <ResearchSceneTools />
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
            {measurementMode ? 'Stop measuring' : 'Measure'}
          </button>
          {measurementStart && (
            <button type="button" onClick={clearMeasurement}>
              Reset
            </button>
          )}
        </div>
        {measurementMode && (
          <div className="measurement-type-group">
            {MEASUREMENT_TYPES.map((mt) => (
              <button
                key={mt.id}
                type="button"
                className={measurementType === mt.id ? 'active' : ''}
                aria-pressed={measurementType === mt.id}
                onClick={() => setMeasurementType(mt.id)}
              >
                {mt.label}
              </button>
            ))}
          </div>
        )}
        {measurementMode && <p className="side-hint">{measurement.value ?? measurement.hint}</p>}
      </section>

      <section className="side-section">
        <LayerPanel />
      </section>
      <section className="side-section">
        <VisibilityLayerPanel />
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
        {sidePanelTab === 'search' && <SearchPanel />}
      </div>
    </div>
  );
}
