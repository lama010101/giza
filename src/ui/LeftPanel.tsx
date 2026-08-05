import { useMemo } from 'react';
import { useAppStore } from '@/store/app';
import { buildOsirisSceneGraph } from '@/scene/osirisSceneGraph';
import { buildGreatPyramidSceneGraph } from '@/scene/greatPyramidSceneGraph';
import type { SceneGraph, SceneNode, SceneNodeWithWorld } from '@/scene/sceneGraph';
import { getAllObjects, getAllLocations, getObjectById } from '@/evidence/repository';

interface TreeNodeProps {
  graph: SceneGraph;
  node: SceneNode;
  depth: number;
  onSelect: (node: SceneNodeWithWorld) => void;
}

function TreeNode({ graph, node, depth, onSelect }: TreeNodeProps): JSX.Element {
  const children = useMemo(() => graph.getChildren(node.id), [graph, node.id]);
  const hasObject = !!node.metadata.objectId;

  const handleClick = (): void => {
    const worldNode = graph.getNodeWithWorldTransform(node.id);
    if (worldNode) onSelect(worldNode);
  };

  return (
    <li className="left-panel-tree-node">
      <button
        type="button"
        className={`left-panel-tree-btn ${hasObject ? 'selectable' : 'group'}`}
        style={{ paddingLeft: `${0.75 + depth * 0.75}rem` }}
        onClick={handleClick}
        disabled={!hasObject}
      >
        {node.name}
      </button>
      {children.length > 0 && (
        <ul className="left-panel-tree">
          {children.map((child) => (
            <TreeNode
              key={child.id}
              graph={graph}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function LeftPanel(): JSX.Element {
  const activeMonument = useAppStore((s) => s.activeMonument);
  const lod = useAppStore((s) => s.lod);
  const bookmarkedObjectIds = useAppStore((s) => s.bookmarkedObjectIds);
  const selectedObjectId = useAppStore((s) => s.selectedObjectId);
  const setSelectedObjectId = useAppStore((s) => s.setSelectedObjectId);
  const setSelectedEvidenceId = useAppStore((s) => s.setSelectedEvidenceId);
  const setCameraTarget = useAppStore((s) => s.setCameraTarget);
  const setSidePanelTab = useAppStore((s) => s.setSidePanelTab);
  const setEvidencePanelOpen = useAppStore((s) => s.setEvidencePanelOpen);
  const setActiveLocationId = useAppStore((s) => s.setActiveLocationId);
  const activeLocationId = useAppStore((s) => s.activeLocationId);

  const graph = useMemo(
    () =>
      activeMonument === 'great-pyramid'
        ? buildGreatPyramidSceneGraph(lod)
        : buildOsirisSceneGraph(),
    [activeMonument, lod],
  );
  const rootNodes = useMemo(() => graph.getRootNodes(), [graph]);

  const objectsById = useMemo(() => new Map(getAllObjects().map((o) => [o.id, o])), []);
  const locations = useMemo(() => getAllLocations(), []);

  const focusNode = (node: SceneNodeWithWorld): void => {
    const pos = node.worldTransform.position;
    setCameraTarget({ x: pos.x, y: pos.y, z: pos.z });
    if (node.metadata.objectId) {
      setSelectedObjectId(node.metadata.objectId);
      if (node.metadata.evidenceIds && node.metadata.evidenceIds.length > 0) {
        setSelectedEvidenceId(node.metadata.evidenceIds[0]);
        setSidePanelTab('evidence');
      } else {
        setSelectedEvidenceId(null);
        setSidePanelTab('hypothesis');
      }
      setEvidencePanelOpen(true);
    }
  };

  const focusObject = (objectId: string): void => {
    const obj = getObjectById(objectId);
    if (!obj) return;
    const matches = graph.findByObjectId(objectId);
    if (matches.length > 0) {
      const pos = matches[0].worldTransform.position;
      setCameraTarget({ x: pos.x, y: pos.y, z: pos.z });
    }
    setSelectedObjectId(objectId);
    if (obj.evidence && obj.evidence.length > 0) {
      setSelectedEvidenceId(obj.evidence[0]);
      setSidePanelTab('evidence');
    } else {
      setSelectedEvidenceId(null);
      setSidePanelTab('hypothesis');
    }
    setEvidencePanelOpen(true);
  };

  const navigateToLocation = (locationId: string, location: { name: string }): void => {
    setActiveLocationId(locationId);
    // Center camera on the first node whose name matches the location, if any.
    const nodes = graph.getAllVisibleNodes();
    const match = nodes.find(
      (n) => location.name && n.name.toLowerCase().includes(location.name.toLowerCase()),
    );
    if (match) {
      const pos = match.worldTransform.position;
      setCameraTarget({ x: pos.x, y: pos.y, z: pos.z });
    }
  };

  return (
    <aside className="left-panel" data-testid="left-panel" aria-label="Scene explorer">
      <div className="left-panel-header">
        <h2>Explorer</h2>
      </div>

      <section className="left-panel-section">
        <h3>Scene Hierarchy</h3>
        <ul className="left-panel-tree">
          {rootNodes.map((node) => (
            <TreeNode key={node.id} graph={graph} node={node} depth={0} onSelect={focusNode} />
          ))}
        </ul>
      </section>

      <section className="left-panel-section">
        <h3>Bookmarks</h3>
        {bookmarkedObjectIds.length === 0 ? (
          <p className="left-panel-empty">No bookmarks yet.</p>
        ) : (
          <ul className="left-panel-list">
            {bookmarkedObjectIds.map((id) => {
              const obj = objectsById.get(id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    className={`left-panel-list-btn ${selectedObjectId === id ? 'active' : ''}`}
                    onClick={() => focusObject(id)}
                  >
                    {obj?.name ?? id}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="left-panel-section">
        <h3>Navigation</h3>
        <ul className="left-panel-list">
          {locations.map((loc) => (
            <li key={loc.id}>
              <button
                type="button"
                className={`left-panel-list-btn ${activeLocationId === loc.id ? 'active' : ''}`}
                onClick={() => navigateToLocation(loc.id, loc)}
              >
                {loc.name}
              </button>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
