import { ModeSelector } from '@/ui/ModeSelector';
import { HypothesisSelector } from '@/ui/HypothesisSelector';
import { EvidencePanel } from '@/ui/EvidencePanel';
import { Viewport } from '@/scene/Viewport';
import { useAppStore } from '@/store/app';

export function AppLayout(): JSX.Element {
  const evidencePanelOpen = useAppStore((s) => s.evidencePanelOpen);
  const setEvidencePanelOpen = useAppStore((s) => s.setEvidencePanelOpen);

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>GIZA</h1>
        <ModeSelector />
        <HypothesisSelector />
      </header>
      <main className="app-main">
        <Viewport />
        {evidencePanelOpen && <EvidencePanel />}
        <button
          type="button"
          className="panel-toggle"
          aria-label={evidencePanelOpen ? 'Collapse evidence panel' : 'Expand evidence panel'}
          aria-expanded={evidencePanelOpen}
          onClick={() => setEvidencePanelOpen(!evidencePanelOpen)}
        >
          {evidencePanelOpen ? '»' : '«'}
        </button>
      </main>
    </div>
  );
}
