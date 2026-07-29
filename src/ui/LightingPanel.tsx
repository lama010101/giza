import { useLightingStore } from '@/store/lighting';

export function LightingPanel(): JSX.Element {
  const ambientIntensity = useLightingStore((s) => s.ambientIntensity);
  const directionalIntensity = useLightingStore((s) => s.directionalIntensity);
  const directionalAzimuth = useLightingStore((s) => s.directionalAzimuth);
  const directionalElevation = useLightingStore((s) => s.directionalElevation);
  const localIntensity = useLightingStore((s) => s.localIntensity);
  const background = useLightingStore((s) => s.background);

  const setAmbientIntensity = useLightingStore((s) => s.setAmbientIntensity);
  const setDirectionalIntensity = useLightingStore((s) => s.setDirectionalIntensity);
  const setDirectionalAzimuth = useLightingStore((s) => s.setDirectionalAzimuth);
  const setDirectionalElevation = useLightingStore((s) => s.setDirectionalElevation);
  const setLocalIntensity = useLightingStore((s) => s.setLocalIntensity);
  const setBackground = useLightingStore((s) => s.setBackground);
  const reset = useLightingStore((s) => s.reset);

  return (
    <div className="lighting-panel" data-testid="lighting-panel">
      <h3>Lighting</h3>
      <div className="lighting-controls">
        <label>
          Ambient
          <input
            type="range"
            min="0"
            max="3"
            step="0.05"
            value={ambientIntensity}
            onChange={(e) => setAmbientIntensity(parseFloat(e.target.value))}
          />
          <span className="sim-value">{ambientIntensity.toFixed(2)}</span>
        </label>

        <label>
          Directional
          <input
            type="range"
            min="0"
            max="5"
            step="0.05"
            value={directionalIntensity}
            onChange={(e) => setDirectionalIntensity(parseFloat(e.target.value))}
          />
          <span className="sim-value">{directionalIntensity.toFixed(2)}</span>
        </label>

        <label>
          Azimuth
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={directionalAzimuth}
            onChange={(e) => setDirectionalAzimuth(parseFloat(e.target.value))}
          />
          <span className="sim-value">{directionalAzimuth}°</span>
        </label>

        <label>
          Elevation
          <input
            type="range"
            min="0"
            max="90"
            step="1"
            value={directionalElevation}
            onChange={(e) => setDirectionalElevation(parseFloat(e.target.value))}
          />
          <span className="sim-value">{directionalElevation}°</span>
        </label>

        <label>
          Local
          <input
            type="range"
            min="0"
            max="3"
            step="0.05"
            value={localIntensity}
            onChange={(e) => setLocalIntensity(parseFloat(e.target.value))}
          />
          <span className="sim-value">{localIntensity.toFixed(2)}</span>
        </label>

        <label>
          Background
          <input type="color" value={background} onChange={(e) => setBackground(e.target.value)} />
        </label>

        <button type="button" className="lighting-reset" onClick={reset}>
          Reset
        </button>
      </div>
    </div>
  );
}
