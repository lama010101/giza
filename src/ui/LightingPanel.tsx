import { useLightingStore, LIGHT_LAYERS, LIGHT_MODES } from '@/store/lighting';
import type { LightLayer, LightMode } from '@/store/lighting';

export function LightingPanel(): JSX.Element {
  const ambientIntensity = useLightingStore((s) => s.ambientIntensity);
  const directionalIntensity = useLightingStore((s) => s.directionalIntensity);
  const directionalAzimuth = useLightingStore((s) => s.directionalAzimuth);
  const directionalElevation = useLightingStore((s) => s.directionalElevation);
  const localIntensity = useLightingStore((s) => s.localIntensity);
  const bounceIntensity = useLightingStore((s) => s.bounceIntensity);
  const volumetricIntensity = useLightingStore((s) => s.volumetricIntensity);
  const volumetricDensity = useLightingStore((s) => s.volumetricDensity);
  const background = useLightingStore((s) => s.background);
  const lightMode = useLightingStore((s) => s.lightMode);

  const setAmbientIntensity = useLightingStore((s) => s.setAmbientIntensity);
  const setDirectionalIntensity = useLightingStore((s) => s.setDirectionalIntensity);
  const setDirectionalAzimuth = useLightingStore((s) => s.setDirectionalAzimuth);
  const setDirectionalElevation = useLightingStore((s) => s.setDirectionalElevation);
  const setLocalIntensity = useLightingStore((s) => s.setLocalIntensity);
  const setBounceIntensity = useLightingStore((s) => s.setBounceIntensity);
  const setVolumetricIntensity = useLightingStore((s) => s.setVolumetricIntensity);
  const setVolumetricDensity = useLightingStore((s) => s.setVolumetricDensity);
  const setBackground = useLightingStore((s) => s.setBackground);
  const setLayerEnabled = useLightingStore((s) => s.setLayerEnabled);
  const setLightMode = useLightingStore((s) => s.setLightMode);
  const reset = useLightingStore((s) => s.reset);

  // Read all layer enabled flags at top level (rules of hooks)
  const ambientEnabled = useLightingStore((s) => s.ambientEnabled);
  const directionalEnabled = useLightingStore((s) => s.directionalEnabled);
  const localEnabled = useLightingStore((s) => s.localEnabled);
  const bounceEnabled = useLightingStore((s) => s.bounceEnabled);
  const volumetricEnabled = useLightingStore((s) => s.volumetricEnabled);

  const layerEnabledMap: Record<LightLayer, boolean> = {
    ambient: ambientEnabled,
    directional: directionalEnabled,
    local: localEnabled,
    bounce: bounceEnabled,
    volumetric: volumetricEnabled,
  };

  return (
    <div className="lighting-panel" data-testid="lighting-panel">
      <h3>Lighting</h3>
      <div className="lighting-controls">
        {/* Light mode preset selector */}
        <label>
          Mode
          <select
            value={lightMode}
            onChange={(e) => setLightMode(e.target.value as LightMode)}
            className="lighting-mode-select"
          >
            {LIGHT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>

        {/* Per-layer enable toggles */}
        <div className="lighting-layers">
          {LIGHT_LAYERS.map((layer) => (
            <label key={layer} className="lighting-layer-toggle">
              <input
                type="checkbox"
                checked={layerEnabledMap[layer]}
                onChange={(e) => setLayerEnabled(layer, e.target.checked)}
              />
              <span>{layer.charAt(0).toUpperCase() + layer.slice(1)}</span>
            </label>
          ))}
        </div>

        <label>
          Ambient
          <input
            type="range"
            min="0"
            max="8"
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
          Bounce
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={bounceIntensity}
            onChange={(e) => setBounceIntensity(parseFloat(e.target.value))}
          />
          <span className="sim-value">{bounceIntensity.toFixed(2)}</span>
        </label>

        <label>
          Volumetric
          <input
            type="range"
            min="0"
            max="2"
            step="0.05"
            value={volumetricIntensity}
            onChange={(e) => setVolumetricIntensity(parseFloat(e.target.value))}
          />
          <span className="sim-value">{volumetricIntensity.toFixed(2)}</span>
        </label>

        <label>
          Fog Density
          <input
            type="range"
            min="0"
            max="0.1"
            step="0.001"
            value={volumetricDensity}
            onChange={(e) => setVolumetricDensity(parseFloat(e.target.value))}
          />
          <span className="sim-value">{volumetricDensity.toFixed(3)}</span>
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
