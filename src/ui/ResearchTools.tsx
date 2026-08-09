import { useMemo } from 'react';
import { useAppStore, MONUMENT_LAYERS, type SceneLayer, type CrossSectionAxis } from '@/store/app';
import {
  getObjectById,
  getObjectConfidence,
  getEvidenceByObject,
  getSourceById,
} from '@/evidence/repository';
import { buildOsirisSceneGraph } from '@/scene/osirisSceneGraph';
import { buildGreatPyramidSceneGraph } from '@/scene/greatPyramidSceneGraph';
import { getDefaultHypothesisContext, hypothesisEngine } from '@/theories/engineInstance';
import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';
import { exportViewportScreenshot } from './screenshot';

const CROSS_SECTION_AXES: CrossSectionAxis[] = ['x', 'y', 'z'];

function useSelectedNode() {
  const activeMonument = useAppStore((s) => s.activeMonument);
  const lod = useAppStore((s) => s.lod);
  const selectedObjectId = useAppStore((s) => s.selectedObjectId);
  const hoveredNodeId = useAppStore((s) => s.hoveredNodeId);

  const graph = useMemo(
    () =>
      activeMonument === 'great-pyramid'
        ? buildGreatPyramidSceneGraph(lod)
        : buildOsirisSceneGraph(),
    [activeMonument, lod],
  );

  const blockoutMap = useMemo(
    () =>
      new Map(
        (activeMonument === 'great-pyramid'
          ? greatPyramidBlockout.nodes
          : osirisBlockout.nodes
        ).map((n) => [n.id, n]),
      ),
    [activeMonument],
  );

  return useMemo(() => {
    const targetId = selectedObjectId ? null : (hoveredNodeId ?? null);
    if (selectedObjectId) {
      const matches = graph.findByObjectId(selectedObjectId);
      if (matches.length > 0) {
        const node = matches[0];
        const block = blockoutMap.get(node.id);
        return { node, block };
      }
    }
    if (targetId) {
      const node = graph.getNodeWithWorldTransform(targetId);
      if (node) {
        const block = blockoutMap.get(node.id);
        return { node, block };
      }
    }
    return { node: undefined, block: undefined };
  }, [graph, blockoutMap, selectedObjectId, hoveredNodeId]);
}

function formatVector(v: { x: number; y: number; z: number }): string {
  return `${v.x.toFixed(2)}, ${v.y.toFixed(2)}, ${v.z.toFixed(2)}`;
}

function formatBBox(
  min: { x: number; y: number; z: number },
  max: { x: number; y: number; z: number },
): string {
  return `${formatVector(min)} → ${formatVector(max)}`;
}

export function ResearchTools(): JSX.Element {
  const activeMonument = useAppStore((s) => s.activeMonument);
  const activeHypothesisIds = useAppStore((s) => s.activeHypothesisIds);
  const crossSection = useAppStore((s) => s.crossSection);
  const setCrossSection = useAppStore((s) => s.setCrossSection);
  const isolatedLayer = useAppStore((s) => s.isolatedLayer);
  const setIsolatedLayer = useAppStore((s) => s.setIsolatedLayer);

  const { node, block } = useSelectedNode();
  const object = node?.metadata.objectId ? getObjectById(node.metadata.objectId) : undefined;
  const objectConfidence = node?.metadata.objectId
    ? getObjectConfidence(node.metadata.objectId)
    : null;

  const perHypothesisConfidence = useMemo(() => {
    if (!node?.metadata.objectId || activeHypothesisIds.length === 0) return [];
    const context = getDefaultHypothesisContext();
    const byObject = hypothesisEngine.computeConfidenceByObject(
      context,
      getSourceById,
      activeHypothesisIds,
    );
    return activeHypothesisIds.map((id) => {
      const hypothesis = hypothesisEngine.getHypothesis(id, context);
      return {
        id,
        name: hypothesis.name,
        confidence: byObject[id]?.[node.metadata.objectId!] ?? 0,
      };
    });
  }, [node, activeHypothesisIds]);

  const monumentLayers = MONUMENT_LAYERS[activeMonument];

  const handleLayerIsolate = (value: string): void => {
    if (value === '') {
      setIsolatedLayer(null);
    } else {
      setIsolatedLayer(value as SceneLayer);
    }
  };

  const handleScreenshot = (): void => {
    exportViewportScreenshot({ filename: `giza-research-${Date.now()}.png` });
  };

  const handleCrossSectionAxis = (axis: CrossSectionAxis): void => {
    setCrossSection({ ...crossSection, axis });
  };

  const handleCrossSectionOffset = (offset: number): void => {
    setCrossSection({ ...crossSection, offset });
  };

  const toggleCrossSection = (enabled: boolean): void => {
    setCrossSection({ ...crossSection, enabled });
  };

  return (
    <div className="research-tools" data-testid="research-tools">
      <section className="side-section">
        <h3>Cross-Section</h3>
        <label className="research-toggle">
          <input
            type="checkbox"
            checked={crossSection.enabled}
            onChange={(e) => toggleCrossSection(e.target.checked)}
          />
          Enable clipping plane
        </label>
        {crossSection.enabled && (
          <>
            <div
              className="side-btn-group cross-section-axes"
              role="group"
              aria-label="Cross-section axis"
            >
              {CROSS_SECTION_AXES.map((axis) => (
                <button
                  key={axis}
                  type="button"
                  className={crossSection.axis === axis ? 'active' : ''}
                  aria-pressed={crossSection.axis === axis}
                  onClick={() => handleCrossSectionAxis(axis)}
                >
                  {axis.toUpperCase()}
                </button>
              ))}
            </div>
            <label className="research-slider">
              Offset
              <input
                type="range"
                min={-100}
                max={100}
                step={0.5}
                value={crossSection.offset}
                onChange={(e) => handleCrossSectionOffset(parseFloat(e.target.value))}
              />
              <span className="research-value">{crossSection.offset.toFixed(1)} m</span>
            </label>
          </>
        )}
      </section>

      <section className="side-section">
        <h3>Layer Isolation</h3>
        <select
          className="research-select"
          value={isolatedLayer ?? ''}
          onChange={(e) => handleLayerIsolate(e.target.value)}
          aria-label="Isolate layer"
        >
          <option value="">No isolation</option>
          {monumentLayers.map((layer) => (
            <option key={layer} value={layer}>
              {layer}
            </option>
          ))}
        </select>
      </section>

      <section className="side-section" data-testid="metadata-browser">
        <h3>Metadata Browser</h3>
        {node ? (
          <dl className="research-metadata">
            <dt>Node</dt>
            <dd>{node.name}</dd>
            {object && (
              <>
                <dt>Object</dt>
                <dd>{object.name}</dd>
              </>
            )}
            <dt>Layer</dt>
            <dd>{node.metadata.layer ?? '—'}</dd>
            {node.metadata.surveyReference && (
              <>
                <dt>Survey</dt>
                <dd>{node.metadata.surveyReference.id}</dd>
              </>
            )}
            {node.metadata.boundingBox && (
              <>
                <dt>Bounds</dt>
                <dd>{formatBBox(node.metadata.boundingBox.min, node.metadata.boundingBox.max)}</dd>
              </>
            )}
            {node.metadata.objectId && (
              <>
                <dt>Linked Evidence</dt>
                <dd>{getEvidenceByObject(node.metadata.objectId).length} record(s)</dd>
              </>
            )}
          </dl>
        ) : (
          <p className="side-hint">Select or hover a scene object to view metadata.</p>
        )}
      </section>

      <section className="side-section" data-testid="confidence-visualization">
        <h3>Confidence</h3>
        {objectConfidence !== null ? (
          <>
            <div className="research-confidence-row">
              <span>Object confidence</span>
              <span className="research-value">{objectConfidence.toFixed(0)}%</span>
            </div>
            <div className="research-confidence-bar" aria-hidden="true">
              <div
                className="research-confidence-fill"
                style={{ width: `${Math.max(0, Math.min(100, objectConfidence))}%` }}
              />
            </div>
            {perHypothesisConfidence.length > 0 && (
              <ul className="research-hypothesis-confidence">
                {perHypothesisConfidence.map((h) => (
                  <li key={h.id}>
                    <span>{h.name}</span>
                    <span className="research-value">{h.confidence.toFixed(0)}%</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="side-hint">Select or hover a scene object to view confidence.</p>
        )}
      </section>

      <section className="side-section" data-testid="geometry-stats">
        <h3>Geometry Stats</h3>
        {node && block ? (
          <dl className="research-metadata">
            <dt>Dimensions (m)</dt>
            <dd>{`${block.size.x.toFixed(2)} × ${block.size.y.toFixed(2)} × ${block.size.z.toFixed(2)}`}</dd>
            <dt>Position</dt>
            <dd>{formatVector(node.worldTransform.position)}</dd>
            <dt>Volume (approx)</dt>
            <dd>{`${(block.size.x * block.size.y * block.size.z).toFixed(2)} m³`}</dd>
          </dl>
        ) : (
          <p className="side-hint">Select or hover a scene object to view geometry stats.</p>
        )}
      </section>

      <section className="side-section">
        <h3>Screenshot Export</h3>
        <button type="button" className="research-screenshot-btn" onClick={handleScreenshot}>
          Export PNG
        </button>
      </section>
    </div>
  );
}
