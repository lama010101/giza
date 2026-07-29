import { useAppStore } from '@/store/app';
import type { AppMode } from '@/store/app';

const MODES: AppMode[] = ['Explore', 'Research'];

export function ModeSelector(): JSX.Element {
  const { mode, setMode } = useAppStore();

  return (
    <div className="mode-selector">
      {MODES.map((m) => (
        <button
          key={m}
          className={mode === m ? 'active' : ''}
          onClick={() => setMode(m)}
          type="button"
        >
          {m}
        </button>
      ))}
    </div>
  );
}
