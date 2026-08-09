import { useMemo } from 'react';
import { ModeSelector } from '@/ui/ModeSelector';
import { SidePanel } from '@/ui/SidePanel';
import { LeftPanel } from '@/ui/LeftPanel';
import { LightingPanel } from '@/ui/LightingPanel';
import { BottomToolbar } from '@/ui/BottomToolbar';
import { Viewport } from '@/scene/Viewport';
import { useAppStore } from '@/store/app';
import { useKeyboardNavigation } from '@/accessibility/keyboardNavigation';
export function AppLayout(): JSX.Element {
  const lightingPanelOpen = useAppStore((s) => s.lightingPanelOpen);
  const setLightingPanelOpen = useAppStore((s) => s.setLightingPanelOpen);

  const keyboardActions = useMemo(
    () => ({
      'tab-scene': () => {
        useAppStore.getState().setSidePanelTab('scene');
        useAppStore.getState().setEvidencePanelOpen(true);
      },
      'tab-evidence': () => {
        useAppStore.getState().setSidePanelTab('evidence');
        useAppStore.getState().setEvidencePanelOpen(true);
      },
      'tab-simulation': () => {
        useAppStore.getState().setSidePanelTab('simulation');
        useAppStore.getState().setEvidencePanelOpen(true);
      },
      'toggle-evidence': () => {
        const state = useAppStore.getState();
        state.setEvidencePanelOpen(!state.evidencePanelOpen);
      },
      'toggle-lighting': () => {
        const state = useAppStore.getState();
        state.setLightingPanelOpen(!state.lightingPanelOpen);
      },
      'toggle-measurement': () => {
        const state = useAppStore.getState();
        state.setMeasurementMode(!state.measurementMode);
      },
      'toggle-hypothesis': () => {
        useAppStore.getState().setSidePanelTab('hypothesis');
        useAppStore.getState().setEvidencePanelOpen(true);
      },
      'close-panel': () => {
        const state = useAppStore.getState();
        state.setEvidencePanelOpen(false);
        state.setLightingPanelOpen(false);
      },
    }),
    [],
  );

  useKeyboardNavigation(keyboardActions);

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>GIZA</h1>
        <div className="header-controls">
          <ModeSelector />
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
      <main className="app-main">
        <LeftPanel />
        <Viewport />
        <SidePanel />
      </main>
      <BottomToolbar />
    </div>
  );
}
