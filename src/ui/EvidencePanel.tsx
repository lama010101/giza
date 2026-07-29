import { useMemo, useState } from 'react';
import {
  getAllEvidence,
  getEvidenceByObject,
  getEvidencePanelData,
  getObjectById,
  searchEvidence,
} from '@/evidence/repository';
import { useAppStore } from '@/store/app';
import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';

function findBlockoutPosition(objectId: string): {
  monument: 'osiris' | 'great-pyramid';
  position: { x: number; y: number; z: number };
} | null {
  const osirisNode = osirisBlockout.nodes.find((n) => n.objectId === objectId);
  if (osirisNode) return { monument: 'osiris', position: osirisNode.position };
  const gpNode = greatPyramidBlockout.nodes.find((n) => n.objectId === objectId);
  if (gpNode) return { monument: 'great-pyramid', position: gpNode.position };
  return null;
}

export function EvidencePanel(): JSX.Element {
  const [query, setQuery] = useState('');
  const selectedEvidenceId = useAppStore((s) => s.selectedEvidenceId);
  const setSelectedEvidenceId = useAppStore((s) => s.setSelectedEvidenceId);
  const bookmarkedObjectIds = useAppStore((s) => s.bookmarkedObjectIds);
  const toggleBookmarkedObject = useAppStore((s) => s.toggleBookmarkedObject);

  const evidenceList = useMemo(() => {
    return query ? searchEvidence(query) : getAllEvidence();
  }, [query]);

  const panelData = useMemo(() => {
    return selectedEvidenceId ? getEvidencePanelData(selectedEvidenceId) : undefined;
  }, [selectedEvidenceId]);

  const handleEvidenceClick = (evidenceId: string): void => {
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
              <button
                key={objectId}
                type="button"
                className="bookmark-chip"
                onClick={() => {
                  const ev = getEvidenceByObject(objectId)[0];
                  if (ev) handleEvidenceClick(ev.id);
                }}
              >
                {obj?.name ?? objectId}
              </button>
            );
          })}
        </div>
      )}
      <ul className="evidence-list">
        {evidenceList.map((ev) => (
          <li key={ev.id} className={selectedEvidenceId === ev.id ? 'selected' : ''}>
            <button type="button" onClick={() => handleEvidenceClick(ev.id)}>
              {ev.title}
            </button>
          </li>
        ))}
      </ul>
      {panelData && (
        <div className="evidence-detail">
          <h3>{panelData.evidence.title}</h3>
          <p>{panelData.evidence.description}</p>
          <p>
            <strong>Confidence:</strong> {panelData.evidence.confidence}%
          </p>
          <p>
            <strong>Source(s):</strong>{' '}
            {panelData.sources.map((s) => s.title).join(', ') || 'Unknown'}
          </p>
          <p>
            <strong>Object(s):</strong>{' '}
            {panelData.objects.length === 0
              ? 'None'
              : panelData.objects.map((o) => (
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
    </div>
  );
}
