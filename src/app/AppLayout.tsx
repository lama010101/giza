import { ModeSelector } from '@/ui/ModeSelector';
import { SidePanel } from '@/ui/SidePanel';
import { Viewport } from '@/scene/Viewport';

export function AppLayout(): JSX.Element {
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>GIZA</h1>
        <ModeSelector />
      </header>
      <main className="app-main">
        <Viewport />
        <SidePanel />
      </main>
    </div>
  );
}
