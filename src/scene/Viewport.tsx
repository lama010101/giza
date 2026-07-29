import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { useAppStore } from '@/store/app';
import { OsirisScene } from './OsirisScene';

export function Viewport(): JSX.Element {
  const hoveredNodeId = useAppStore((s) => s.hoveredNodeId);
  const measurementMode = useAppStore((s) => s.measurementMode);
  const measurementStart = useAppStore((s) => s.measurementStart);
  const measurementEnd = useAppStore((s) => s.measurementEnd);
  const setMeasurementMode = useAppStore((s) => s.setMeasurementMode);
  const clearMeasurement = useAppStore((s) => s.clearMeasurement);

  const hoveredName = hoveredNodeId
    ? osirisBlockout.nodes.find((n) => n.id === hoveredNodeId)?.name
    : undefined;

  const distance =
    measurementStart && measurementEnd
      ? Math.hypot(
          measurementEnd.x - measurementStart.x,
          measurementEnd.y - measurementStart.y,
          measurementEnd.z - measurementStart.z,
        )
      : null;

  return (
    <div className="viewport">
      <OsirisScene />
      {hoveredName && <div className="viewport-overlay">{hoveredName}</div>}
      <div className="measure-tools">
        <button
          type="button"
          className={measurementMode ? 'active' : ''}
          aria-pressed={measurementMode}
          onClick={() => setMeasurementMode(!measurementMode)}
        >
          Measure
        </button>
        {measurementStart && (
          <>
            <span className="measure-readout">
              {distance !== null ? `${distance.toFixed(2)} m` : 'Pick a second point'}
            </span>
            <button type="button" onClick={clearMeasurement}>
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}
