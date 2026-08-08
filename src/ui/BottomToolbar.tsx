import { useAppStore } from '@/store/app';
import type { SidePanelTab } from '@/store/app';

const TOOLBAR_ITEMS: {
  id: SidePanelTab | 'bookmarks' | 'search' | 'measure';
  label: string;
  icon: string;
}[] = [
  { id: 'scene', label: 'Camera', icon: '📷' },
  { id: 'evidence', label: 'Evidence', icon: '📋' },
  { id: 'hypothesis', label: 'Theory', icon: '💡' },
  { id: 'simulation', label: 'Simulation', icon: '🌊' },
  { id: 'measure', label: 'Measure', icon: '📏' },
  { id: 'bookmarks', label: 'Bookmarks', icon: '🔖' },
  { id: 'search', label: 'Search', icon: '🔍' },
];

export function BottomToolbar(): JSX.Element {
  const sidePanelTab = useAppStore((s) => s.sidePanelTab);
  const setSidePanelTab = useAppStore((s) => s.setSidePanelTab);
  const setEvidencePanelOpen = useAppStore((s) => s.setEvidencePanelOpen);
  const measurementMode = useAppStore((s) => s.measurementMode);
  const setMeasurementMode = useAppStore((s) => s.setMeasurementMode);

  const handleClick = (item: (typeof TOOLBAR_ITEMS)[number]): void => {
    if (item.id === 'measure') {
      setMeasurementMode(!measurementMode);
      return;
    }
    if (item.id === 'search') {
      setSidePanelTab('search');
      setEvidencePanelOpen(true);
      return;
    }
    if (
      item.id === 'scene' ||
      item.id === 'evidence' ||
      item.id === 'simulation' ||
      item.id === 'hypothesis'
    ) {
      setSidePanelTab(item.id);
      setEvidencePanelOpen(true);
    }
  };

  const isActive = (id: string): boolean => {
    if (id === 'measure') return measurementMode;
    if (id === 'search') return sidePanelTab === 'search';
    if (id === 'scene' || id === 'evidence' || id === 'simulation' || id === 'hypothesis')
      return sidePanelTab === id;
    return false;
  };

  return (
    <nav
      className="bottom-toolbar"
      data-testid="bottom-toolbar"
      role="toolbar"
      aria-label="Main tools"
    >
      {TOOLBAR_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`toolbar-btn ${isActive(item.id) ? 'active' : ''}`}
          aria-pressed={isActive(item.id)}
          aria-label={item.label}
          title={item.label}
          onClick={() => handleClick(item)}
        >
          <span className="toolbar-icon" aria-hidden="true">
            {item.icon}
          </span>
          <span className="toolbar-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
