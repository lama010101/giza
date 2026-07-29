import { useMemo, useState } from 'react';
import { getAllEvidence, getEvidencePanelData, searchEvidence } from '@/evidence/repository';
import { useAppStore } from '@/store/app';

export function EvidencePanel(): JSX.Element {
  const [query, setQuery] = useState('');
  const { selectedEvidenceId, setSelectedEvidenceId } = useAppStore();

  const evidenceList = useMemo(() => {
    return query ? searchEvidence(query) : getAllEvidence();
  }, [query]);

  const panelData = useMemo(() => {
    return selectedEvidenceId ? getEvidencePanelData(selectedEvidenceId) : undefined;
  }, [selectedEvidenceId]);

  return (
    <div className="evidence-panel">
      <h2>Evidence</h2>
      <input
        type="search"
        placeholder="Search evidence..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul className="evidence-list">
        {evidenceList.map((ev) => (
          <li key={ev.id} className={selectedEvidenceId === ev.id ? 'selected' : ''}>
            <button type="button" onClick={() => setSelectedEvidenceId(ev.id)}>
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
            <strong>Object(s):</strong> {panelData.objects.map((o) => o.name).join(', ') || 'None'}
          </p>
        </div>
      )}
    </div>
  );
}
