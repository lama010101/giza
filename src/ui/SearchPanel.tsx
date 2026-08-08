import { useMemo, useState } from 'react';
import { getEvidenceByFilters } from '@/evidence/repository';
import { searchAll, type SearchResult, type SearchResultType } from '@/evidence/unifiedSearch';
import { useAppStore } from '@/store/app';
import { testId } from '@/utils/testId';

const ALL_TYPES: { type: SearchResultType; label: string }[] = [
  { type: 'evidence', label: 'Evidence' },
  { type: 'location', label: 'Locations' },
  { type: 'source', label: 'Sources' },
  { type: 'object', label: 'Objects' },
  { type: 'theory', label: 'Theories' },
];

export function SearchPanel(): JSX.Element {
  const [query, setQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<SearchResultType[]>(
    ALL_TYPES.map((t) => t.type),
  );

  const setSelectedEvidenceId = useAppStore((s) => s.setSelectedEvidenceId);
  const setSelectedObjectId = useAppStore((s) => s.setSelectedObjectId);
  const setActiveLocationId = useAppStore((s) => s.setActiveLocationId);
  const setCameraTarget = useAppStore((s) => s.setCameraTarget);
  const setActiveHypothesisIds = useAppStore((s) => s.setActiveHypothesisIds);
  const setSidePanelTab = useAppStore((s) => s.setSidePanelTab);

  const results = useMemo(
    () => searchAll(query).filter((r) => selectedTypes.includes(r.type)),
    [query, selectedTypes],
  );

  const toggleType = (type: SearchResultType): void => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleSelect = (result: SearchResult): void => {
    if (result.type === 'evidence') {
      setSelectedEvidenceId(result.id);
      setSidePanelTab('evidence');
      return;
    }

    if (result.type === 'object') {
      setSelectedObjectId(result.id);
      setSidePanelTab('scene');
      if (result.position) {
        setCameraTarget(result.position);
      }
      return;
    }

    if (result.type === 'location') {
      setActiveLocationId(result.id);
      setSelectedObjectId(null);
      if (result.position) {
        setCameraTarget(result.position);
      }
      return;
    }

    if (result.type === 'theory') {
      setActiveHypothesisIds([result.id]);
      setSidePanelTab('hypothesis');
      return;
    }

    if (result.type === 'source') {
      const evidence = getEvidenceByFilters({ sourceId: result.id });
      if (evidence.length > 0) {
        setSelectedEvidenceId(evidence[0].id);
        setSidePanelTab('evidence');
      }
    }
  };

  return (
    <section className="side-section" {...testId('search-panel')}>
      <h3>Search</h3>
      <input
        type="search"
        placeholder="Search evidence, locations, sources, objects, theories..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
        aria-label="Search query"
      />
      <div className="search-filters" role="group" aria-label="Search filters">
        {ALL_TYPES.map(({ type, label }) => (
          <label key={type} className="search-filter">
            <input
              type="checkbox"
              checked={selectedTypes.includes(type)}
              onChange={() => toggleType(type)}
            />
            {label}
          </label>
        ))}
      </div>
      <ul className="search-results" {...testId('search-results')}>
        {results.map((result) => (
          <li key={`${result.type}-${result.id}`}>
            <button type="button" className="search-result" onClick={() => handleSelect(result)}>
              <span className="search-result-type">{result.type}</span>
              <span className="search-result-title">{result.title}</span>
              <span className="search-result-subtitle">{result.subtitle}</span>
            </button>
          </li>
        ))}
      </ul>
      {query && results.length === 0 && <p className="search-empty">No results found.</p>}
    </section>
  );
}
