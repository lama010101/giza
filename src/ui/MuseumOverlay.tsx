import { useAppStore, type AppMode } from '@/store/app';

export function MuseumOverlay(): JSX.Element | null {
  const mode = useAppStore((s) => s.mode);
  const museumPaused = useAppStore((s) => s.museumPaused);
  const museumPresetName = useAppStore((s) => s.museumPresetName);
  const setMuseumPaused = useAppStore((s) => s.setMuseumPaused);
  const setMode = useAppStore((s) => s.setMode);

  if (mode !== 'Museum') return null;

  const handleExit = (): void => {
    setMode('Explore' as AppMode);
    setMuseumPaused(false);
  };

  return (
    <div className="museum-overlay" data-testid="museum-overlay">
      <div className="museum-overlay-header">
        <h2 className="museum-overlay-title">GIZA</h2>
        <span className="museum-overlay-preset" data-testid="museum-preset-name">
          {museumPresetName ?? 'Loading…'}
        </span>
      </div>
      <div className="museum-overlay-controls">
        <button
          type="button"
          className="museum-overlay-btn"
          onClick={() => setMuseumPaused(!museumPaused)}
          aria-label={museumPaused ? 'Resume tour' : 'Pause tour'}
          data-testid="museum-pause-btn"
        >
          {museumPaused ? 'Resume' : 'Pause'}
        </button>
        <button
          type="button"
          className="museum-overlay-btn museum-overlay-exit"
          onClick={handleExit}
          aria-label="Exit museum mode"
          data-testid="museum-exit-btn"
        >
          Exit
        </button>
      </div>
      <p className="museum-overlay-hint">Touch anywhere to pause</p>
    </div>
  );
}
