import { useMemo, useState } from 'react';
import { useAppStore } from '@/store/app';
import { buildOsirisSceneGraph } from '@/scene/osirisSceneGraph';
import { buildGreatPyramidSceneGraph } from '@/scene/greatPyramidSceneGraph';
import type { SceneGraph, SceneNode, SceneNodeWithWorld } from '@/scene/sceneGraph';
import { getAllLocations } from '@/evidence/repository';
import type { Bookmark } from '@/evidence/bookmark';

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

interface BookmarksSectionProps {
  bookmarks: Bookmark[];
  addBookmark: (name: string, notes?: string) => void;
  deleteBookmark: (id: string) => void;
  restoreBookmark: (id: string) => void;
}

function BookmarksSection({
  bookmarks,
  addBookmark,
  deleteBookmark,
  restoreBookmark,
}: BookmarksSectionProps): JSX.Element {
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = (): void => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addBookmark(trimmed, notes.trim());
    setName('');
    setNotes('');
  };

  return (
    <section className="left-panel-section">
      <h3>Bookmarks</h3>
      <div className="bookmark-form">
        <input
          type="text"
          className="bookmark-input"
          placeholder="Bookmark name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Bookmark name"
        />
        <input
          type="text"
          className="bookmark-input"
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          aria-label="Bookmark notes"
        />
        <button type="button" className="bookmark-add-btn" onClick={handleAdd}>
          Save current view
        </button>
      </div>
      {bookmarks.length === 0 ? (
        <p className="left-panel-empty">No bookmarks yet.</p>
      ) : (
        <ul className="left-panel-list">
          {bookmarks.map((bm) => (
            <li key={bm.id} className="bookmark-item">
              <button
                type="button"
                className="left-panel-list-btn"
                onClick={() => restoreBookmark(bm.id)}
                title={bm.notes || undefined}
              >
                {bm.name}
                <span className="bookmark-date">{new Date(bm.createdAt).toLocaleDateString()}</span>
              </button>
              <button
                type="button"
                className="bookmark-delete-btn"
                aria-label={`Delete ${bm.name}`}
                onClick={() => deleteBookmark(bm.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function LeftPanel(): JSX.Element {
  const activeMonument = useAppStore((s) => s.activeMonument);
  const lod = useAppStore((s) => s.lod);
  const bookmarks = useAppStore((s) => s.bookmarks);
  const addBookmark = useAppStore((s) => s.addBookmark);
  const deleteBookmark = useAppStore((s) => s.deleteBookmark);
  const restoreBookmark = useAppStore((s) => s.restoreBookmark);
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

      <BookmarksSection
        bookmarks={bookmarks}
        addBookmark={addBookmark}
        deleteBookmark={deleteBookmark}
        restoreBookmark={restoreBookmark}
      />

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
