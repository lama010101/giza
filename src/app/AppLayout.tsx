import { ModeSelector } from '@/ui/ModeSelector';
import { TimelinePanel } from '@/ui/TimelinePanel';
import { SidePanel } from '@/ui/SidePanel';
import { LeftPanel } from '@/ui/LeftPanel';
import { LightingPanel } from '@/ui/LightingPanel';
import { BottomToolbar } from '@/ui/BottomToolbar';
import { Viewport } from '@/scene/Viewport';
import { useAppStore } from '@/store/app';

export function AppLayout(): JSX.Element {
  const lightingPanelOpen = useAppStore((s) => s.lightingPanelOpen);
  const setLightingPanelOpen = useAppStore((s) => s.setLightingPanelOpen);
  const mode = useAppStore((s) => s.mode);
  const isMuseum = mode === 'Museum';

  return (
    <div className={`app-layout ${isMuseum ? 'museum-mode' : ''}`}>
      {!isMuseum && (
        <header className="app-header">
          <h1>GIZA</h1>
          <div className="header-controls">
            <ModeSelector />
            <TimelinePanel />
            <div className="lighting-dropdown">
              <button
                type="button"
                className={lightingPanelOpen ? 'lighting-btn active' : 'lighting-btn'}
                aria-expanded={lightingPanelOpen}
                onClick={() => setLightingPanelOpen(!lightingPanelOpen)}
              >
                Lighting
              </button>
              {lightingPanelOpen && (
                <div className="lighting-popover">
                  <LightingPanel />
                </div>
              )}
            </div>
          </div>
        </header>
      )}
      <main className="app-main">
        {!isMuseum && <LeftPanel />}
        <Viewport />
        {!isMuseum && <SidePanel />}
      </main>
      {!isMuseum && <BottomToolbar />}
    </div>
  );
}
