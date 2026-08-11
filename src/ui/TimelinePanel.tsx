import { useAppStore } from '@/store/app';
import {
  TIMELINE_PHASES,
  TIMELINE_PHASE_ORDER,
  type ChronologyPeriod,
} from '@/scene/chronologyLayers';

function formatDateYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  if (year === 0) return '0';
  return `${year} CE`;
}

export function TimelinePanel(): JSX.Element {
  const chronologyPeriod = useAppStore((s) => s.chronologyPeriod);
  const setChronologyPeriod = useAppStore((s) => s.setChronologyPeriod);

  const options: (ChronologyPeriod | null)[] = [null, ...TIMELINE_PHASE_ORDER];
  const value = chronologyPeriod === null ? 0 : 1 + TIMELINE_PHASE_ORDER.indexOf(chronologyPeriod);

  const active = value === 0 ? null : TIMELINE_PHASES[value - 1];

  const handleChange = (index: number): void => {
    setChronologyPeriod(options[index] ?? null);
  };

  return (
    <div className="timeline-panel" data-testid="timeline-panel">
      <span className="timeline-title">Timeline</span>
      <input
        type="range"
        min={0}
        max={options.length - 1}
        step={1}
        value={value}
        onChange={(e) => handleChange(parseInt(e.target.value, 10))}
        aria-label="Historical timeline"
        data-testid="timeline-slider"
        className="timeline-slider"
      />
      <div className="timeline-labels" aria-hidden="true">
        <span>All</span>
        {TIMELINE_PHASES.map((phase) => (
          <span key={phase.id}>{phase.label}</span>
        ))}
      </div>
      {active ? (
        <div className="timeline-info" data-testid="timeline-info">
          {active.label}: {formatDateYear(active.dateRange.start)} —{' '}
          {formatDateYear(active.dateRange.end)}
        </div>
      ) : (
        <div className="timeline-info" data-testid="timeline-info">
          All historical phases
        </div>
      )}
    </div>
  );
}
