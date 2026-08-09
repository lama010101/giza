import { useAppStore } from '@/store/app';
import type { MeasurementType } from '@/evidence/measurement';
import { formatMeasurement } from '@/evidence/measurement';

const MEASUREMENT_TYPES: { id: MeasurementType; label: string; points: number }[] = [
  { id: 'distance', label: 'Distance', points: 2 },
  { id: 'height', label: 'Height', points: 2 },
  { id: 'angle', label: 'Angle', points: 3 },
  { id: 'area', label: 'Area', points: 3 },
  { id: 'volume', label: 'Volume', points: 2 },
];

function hintForType(type: MeasurementType, collected: number, result: boolean): string {
  if (result) return 'Click in the scene to start a new measurement.';
  const needed = MEASUREMENT_TYPES.find((t) => t.id === type)?.points ?? 2;
  if (collected === 0) return `Click ${needed === 2 ? 'two' : 'three'} points in the scene.`;
  return `Point ${collected + 1} of ${needed} — click in the scene.`;
}

export function MeasurementPanel(): JSX.Element {
  const measurementMode = useAppStore((s) => s.measurementMode);
  const setMeasurementMode = useAppStore((s) => s.setMeasurementMode);
  const measurementType = useAppStore((s) => s.measurementType);
  const setMeasurementType = useAppStore((s) => s.setMeasurementType);
  const measurementPoints = useAppStore((s) => s.measurementPoints);
  const measurementResult = useAppStore((s) => s.measurementResult);
  const clearMeasurement = useAppStore((s) => s.clearMeasurement);

  return (
    <section className="side-section" data-testid="measurement-panel">
      <h3>Measurement</h3>
      <div className="side-btn-group measurement-types" role="group" aria-label="Measurement type">
        {MEASUREMENT_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            className={measurementType === t.id ? 'active' : ''}
            aria-pressed={measurementType === t.id}
            onClick={() => setMeasurementType(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="side-btn-group">
        <button
          type="button"
          className={measurementMode ? 'active' : ''}
          aria-pressed={measurementMode}
          onClick={() => setMeasurementMode(!measurementMode)}
        >
          {measurementMode ? 'Stop' : 'Measure'}
        </button>
        {(measurementPoints.length > 0 || measurementResult) && (
          <button type="button" onClick={clearMeasurement}>
            Reset
          </button>
        )}
      </div>
      {measurementMode && !measurementResult && (
        <p className="side-hint" data-testid="measurement-hint">
          {hintForType(measurementType, measurementPoints.length, false)}
        </p>
      )}
      {measurementResult && (
        <p className="side-hint" data-testid="measurement-result">
          {formatMeasurement(measurementResult)}
        </p>
      )}
    </section>
  );
}
