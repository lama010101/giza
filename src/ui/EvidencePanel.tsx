import { useEffect, useMemo, useRef, useState } from 'react';
import {
  getAllEvidence,
  getEvidenceByObject,
  getEvidencePanelData,
  getObjectById,
  searchEvidence,
} from '@/evidence/repository';
import { useAppStore, MONUMENT_KEY } from '@/store/app';
import { getEvidenceTimelinePhases } from '@/scene/chronologyLayers';
import { localToWorld } from '@/scene/coordinateSystem';
import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';

const OSIRIS_OBJECT_IDS = new Set(
  osirisBlockout.nodes.filter((n) => n.objectId).map((n) => n.objectId!),
);
const GP_OBJECT_IDS = new Set(
  greatPyramidBlockout.nodes.filter((n) => n.objectId).map((n) => n.objectId!),
);

function isEvidenceForMonument(
  ev: { objectIds: string[] },
  monument: 'osiris' | 'great-pyramid',
): boolean {
  const ids = monument === 'osiris' ? OSIRIS_OBJECT_IDS : GP_OBJECT_IDS;
  return ev.objectIds.some((oid) => ids.has(oid));
}

function findBlockoutPosition(objectId: string): {
  monument: 'osiris' | 'great-pyramid';
  position: { x: number; y: number; z: number };
} | null {
  const osirisNode = osirisBlockout.nodes.find((n) => n.objectId === objectId);
  if (osirisNode) {
    return {
      monument: 'osiris',
      position: localToWorld(osirisNode.position, MONUMENT_KEY.osiris),
    };
  }
  const gpNode = greatPyramidBlockout.nodes.find((n) => n.objectId === objectId);
  if (gpNode) {
    return {
      monument: 'great-pyramid',
      position: localToWorld(gpNode.position, MONUMENT_KEY['great-pyramid']),
    };
  }
  return null;
}

export function EvidencePanel(): JSX.Element {
  const [query, setQuery] = useState('');
  const activeMonument = useAppStore((s) => s.activeMonument);
  const selectedEvidenceId = useAppStore((s) => s.selectedEvidenceId);
  const setSelectedEvidenceId = useAppStore((s) => s.setSelectedEvidenceId);
  const bookmarkedObjectIds = useAppStore((s) => s.bookmarkedObjectIds);
  const toggleBookmarkedObject = useAppStore((s) => s.toggleBookmarkedObject);
  const chronologyPeriod = useAppStore((s) => s.chronologyPeriod);
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const evidenceList = useMemo(() => {
    const all = query ? searchEvidence(query) : getAllEvidence();
    return all
      .filter((ev) => isEvidenceForMonument(ev, activeMonument))
      .filter(
        (ev) =>
          chronologyPeriod === null || getEvidenceTimelinePhases(ev).includes(chronologyPeriod),
      );
  }, [query, activeMonument, chronologyPeriod]);

  const panelData = useMemo(() => {
    return selectedEvidenceId ? getEvidencePanelData(selectedEvidenceId) : undefined;
  }, [selectedEvidenceId]);

  useEffect(() => {
    if (!selectedEvidenceId) return;
    const item = itemRefs.current.get(selectedEvidenceId);
    const list = listRef.current;
    if (!item || !list) return;
    const listRect = list.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const offset = itemRect.top - listRect.top + itemRect.height / 2 - listRect.height / 2;
    if (typeof list.scrollTo === 'function') {
      list.scrollTo({ top: list.scrollTop + offset, behavior: 'smooth' });
    }
  }, [selectedEvidenceId]);

  const handleEvidenceClick = (evidenceId: string): void => {
    if (useAppStore.getState().selectedEvidenceId === evidenceId) {
      setSelectedEvidenceId(null);
      return;
    }
    setSelectedEvidenceId(evidenceId);
    const data = getEvidencePanelData(evidenceId);
    if (!data || data.objects.length === 0) return;

    const firstObject = data.objects[0];
    const blockout = findBlockoutPosition(firstObject.id);
    if (!blockout) return;

    const { setActiveMonument, setCameraTarget } = useAppStore.getState();
    const { activeMonument } = useAppStore.getState();

    if (activeMonument !== blockout.monument) {
      setActiveMonument(blockout.monument);
    }
    setCameraTarget(blockout.position);
  };

  return (
    <div className="evidence-panel">
      <h2>Evidence</h2>
      <input
        type="search"
        placeholder="Search evidence..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {bookmarkedObjectIds.length > 0 && (
        <div className="bookmark-list">
          {bookmarkedObjectIds.map((objectId) => {
            const obj = getObjectById(objectId);
            return (
              <span key={objectId} className="bookmark-chip-wrapper">
                <button
                  type="button"
                  className="bookmark-chip"
                  onClick={() => {
                    const ev = getEvidenceByObject(objectId)[0];
                    if (ev) handleEvidenceClick(ev.id);
                  }}
                >
                  {obj?.name ?? objectId}
                </button>
                <button
                  type="button"
                  className="bookmark-chip-remove"
                  aria-label={`Remove ${obj?.name ?? objectId} from bookmarks`}
                  onClick={() => toggleBookmarkedObject(objectId)}
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}
      <ul className="evidence-list" ref={listRef}>
        {evidenceList.map((ev) => {
          const isExpanded = selectedEvidenceId === ev.id;
          const data = isExpanded ? panelData : undefined;
          return (
            <li
              key={ev.id}
              className={isExpanded ? 'selected expanded' : ''}
              ref={(el) => {
                if (el) itemRefs.current.set(ev.id, el);
                else itemRefs.current.delete(ev.id);
              }}
            >
              <button
                type="button"
                className="evidence-title"
                aria-expanded={isExpanded}
                onClick={() => handleEvidenceClick(ev.id)}
              >
                <span className="evidence-toggle-icon">{isExpanded ? '▾' : '▸'}</span>
                {ev.title}
              </button>
              {data && (
                <div className="evidence-detail">
                  <p>{data.evidence.description}</p>
                  <p>
                    <strong>Confidence:</strong> {data.evidence.confidence}%
                  </p>
                  <p>
                    <strong>Source(s):</strong>{' '}
                    {data.sources.map((s) => s.title).join(', ') || 'Unknown'}
                  </p>
                  <p>
                    <strong>Object(s):</strong>{' '}
                    {data.objects.length === 0
                      ? 'None'
                      : data.objects.map((o) => (
                          <span key={o.id} className="object-bookmark">
                            {o.name}
                            <button
                              type="button"
                              aria-label={`Bookmark ${o.name}`}
                              aria-pressed={bookmarkedObjectIds.includes(o.id)}
                              onClick={() => toggleBookmarkedObject(o.id)}
                            >
                              {bookmarkedObjectIds.includes(o.id) ? '★' : '☆'}
                            </button>
                          </span>
                        ))}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
