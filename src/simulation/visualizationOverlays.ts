/**
 * Visualization overlays for the hydraulic-acoustic hypothesis per M11.5-T11.
 *
 * Provides composable overlay layers that visualise simulation results on
 * chamber and shaft surfaces:
 *   - PressureMap: colour-coded pressure distribution on chamber surfaces
 *   - VelocityField: animated flow arrows / particles showing fluid velocity
 *   - WaveFront: expanding acoustic wave fronts from a source
 *   - StressField: structural stress visualisation on walls
 *   - TemperatureGradient: heat distribution overlays
 *
 * Multiple overlays can be active simultaneously (compositing). Each overlay
 * supports per-overlay opacity, colour scale, and animation controls. Overlay
 * data is generated from simulation results (hydraulic, acoustic, structural,
 * thermal).
 */

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export type OverlayType =
  | 'pressure-map'
  | 'velocity-field'
  | 'wave-front'
  | 'stress-field'
  | 'temperature-gradient';

export interface ColorScale {
  /** Hex colour stops ordered from low to high. */
  stops: string[];
  /** Minimum value mapped to the first stop. */
  min: number;
  /** Maximum value mapped to the last stop. */
  max: number;
}

export interface OverlayAnimation {
  enabled: boolean;
  /** Current animation time in seconds. */
  time: number;
  /** Animation speed multiplier. */
  speed: number;
}

export interface OverlayControl {
  opacity: number; // 0–1
  visible: boolean;
  colorScale: ColorScale;
  animation: OverlayAnimation;
}

// ─── Per-overlay data structures ───────────────────────────────────────────

export interface PressureMapCell {
  position: Vector3;
  normal: Vector3;
  pressure: number; // Pa
  normalized: number; // 0–1
}

export interface PressureMapData {
  type: 'pressure-map';
  cells: PressureMapCell[];
  range: { min: number; max: number };
  unit: string;
}

export interface VelocityFieldArrow {
  position: Vector3;
  direction: Vector3;
  magnitude: number; // m/s
}

export interface VelocityFieldData {
  type: 'velocity-field';
  arrows: VelocityFieldArrow[];
  particles: { position: Vector3; velocity: Vector3; age: number }[];
  range: { min: number; max: number };
  unit: string;
}

export interface WaveFrontData {
  type: 'wave-front';
  fronts: { time: number; radius: number; amplitude: number; source: Vector3 }[];
  speedOfSound: number;
  unit: string;
}

export interface StressFieldCell {
  position: Vector3;
  normal: Vector3;
  stress: number; // Pa
  normalized: number; // 0–1
}

export interface StressFieldData {
  type: 'stress-field';
  cells: StressFieldCell[];
  range: { min: number; max: number };
  unit: string;
}

export interface TemperatureGradientCell {
  position: Vector3;
  temperature: number; // °C
  normalized: number; // 0–1
}

export interface TemperatureGradientData {
  type: 'temperature-gradient';
  cells: TemperatureGradientCell[];
  range: { min: number; max: number };
  unit: string;
}

export type OverlayData =
  | PressureMapData
  | VelocityFieldData
  | WaveFrontData
  | StressFieldData
  | TemperatureGradientData;

export interface OverlayLayer {
  type: OverlayType;
  control: OverlayControl;
  data: OverlayData;
}

export interface OverlayComposite {
  layers: OverlayLayer[];
  /** Combined opacity for the whole composite (applied on top of per-layer). */
  masterOpacity: number;
}

// ─── Colour scales ─────────────────────────────────────────────────────────

export const PRESSURE_COLOR_SCALE: ColorScale = {
  stops: ['#0000ff', '#00aaff', '#00ff00', '#ffff00', '#ff0000'],
  min: 0,
  max: 200000,
};

export const VELOCITY_COLOR_SCALE: ColorScale = {
  stops: ['#000080', '#0080ff', '#00ffff', '#80ff80', '#ffff00'],
  min: 0,
  max: 5,
};

export const WAVE_COLOR_SCALE: ColorScale = {
  stops: ['#1a0033', '#4d0099', '#8000ff', '#cc66ff', '#ffccff'],
  min: 0,
  max: 1,
};

export const STRESS_COLOR_SCALE: ColorScale = {
  stops: ['#003300', '#006600', '#99cc00', '#ff9900', '#ff0000'],
  min: 0,
  max: 50000000,
};

export const TEMPERATURE_COLOR_SCALE: ColorScale = {
  stops: ['#0000cc', '#0066ff', '#00ffcc', '#ffcc00', '#ff3300'],
  min: 10,
  max: 40,
};

// ─── Default controls ──────────────────────────────────────────────────────

export function defaultControl(scale: ColorScale): OverlayControl {
  return {
    opacity: 0.8,
    visible: true,
    colorScale: scale,
    animation: { enabled: false, time: 0, speed: 1 },
  };
}

// ─── Colour mapping ────────────────────────────────────────────────────────

/**
 * Maps a normalised value [0, 1] to a hex colour from a colour scale.
 */
export function mapColor(scale: ColorScale, normalized: number): string {
  const clamped = Math.max(0, Math.min(1, normalized));
  const stops = scale.stops;
  if (stops.length === 0) return '#000000';
  if (stops.length === 1) return stops[0];

  const scaled = clamped * (stops.length - 1);
  const idx = Math.min(Math.floor(scaled), stops.length - 2);
  const localT = scaled - idx;
  return lerpHex(stops[idx], stops[idx + 1], localT);
}

function lerpHex(a: string, b: string, t: number): string {
  const pa = hexToRgb(a);
  const pb = hexToRgb(b);
  const r = Math.round(pa.r + (pb.r - pa.r) * t);
  const g = Math.round(pa.g + (pb.g - pa.g) * t);
  const bl = Math.round(pa.b + (pb.b - pa.b) * t);
  return rgbToHex(r, g, bl);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '');
  return {
    r: parseInt(cleaned.substring(0, 2), 16),
    g: parseInt(cleaned.substring(2, 4), 16),
    b: parseInt(cleaned.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (v: number): string => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ─── Overlay data generators ───────────────────────────────────────────────

/**
 * Generates a pressure map overlay from a pressure field on chamber surfaces.
 */
export function generatePressureMap(
  pressureField: { position: Vector3; normal: Vector3; pressure: number }[],
): PressureMapData {
  const pressures = pressureField.map((p) => p.pressure);
  const min = pressures.length > 0 ? Math.min(...pressures) : 0;
  const max = pressures.length > 0 ? Math.max(...pressures) : 0;
  const range = max - min || 1;

  const cells: PressureMapCell[] = pressureField.map((sample) => ({
    position: sample.position,
    normal: sample.normal,
    pressure: sample.pressure,
    normalized: (sample.pressure - min) / range,
  }));

  return { type: 'pressure-map', cells, range: { min, max }, unit: 'Pa' };
}

/**
 * Generates a velocity field overlay (arrows + particles) from a velocity field.
 */
export function generateVelocityField(
  velocityField: { position: Vector3; velocity: Vector3 }[],
  particleCount = 20,
): VelocityFieldData {
  const magnitudes = velocityField.map((v) =>
    Math.sqrt(v.velocity.x ** 2 + v.velocity.y ** 2 + v.velocity.z ** 2),
  );
  const min = magnitudes.length > 0 ? Math.min(...magnitudes) : 0;
  const max = magnitudes.length > 0 ? Math.max(...magnitudes) : 0;

  const arrows: VelocityFieldArrow[] = velocityField.map((sample) => {
    const mag = Math.sqrt(sample.velocity.x ** 2 + sample.velocity.y ** 2 + sample.velocity.z ** 2);
    return {
      position: sample.position,
      direction:
        mag > 0
          ? { x: sample.velocity.x / mag, y: sample.velocity.y / mag, z: sample.velocity.z / mag }
          : { x: 0, y: 0, z: 0 },
      magnitude: mag,
    };
  });

  const particles = arrows.slice(0, particleCount).map((a) => ({
    position: { ...a.position },
    velocity: {
      x: a.direction.x * a.magnitude,
      y: a.direction.y * a.magnitude,
      z: a.direction.z * a.magnitude,
    },
    age: 0,
  }));

  return { type: 'velocity-field', arrows, particles, range: { min, max }, unit: 'm/s' };
}

/**
 * Generates expanding wave fronts from an acoustic source.
 */
export function generateWaveFronts(
  source: Vector3,
  speedOfSound: number,
  maxTime: number,
  steps = 10,
): WaveFrontData {
  const fronts: { time: number; radius: number; amplitude: number; source: Vector3 }[] = [];
  for (let i = 1; i <= steps; i++) {
    const t = (i / steps) * maxTime;
    fronts.push({
      time: t,
      radius: speedOfSound * t,
      amplitude: 1 / (1 + t),
      source: { ...source },
    });
  }
  return { type: 'wave-front', fronts, speedOfSound, unit: 'Pa (relative)' };
}

/**
 * Generates a stress field overlay from a stress distribution on walls.
 */
export function generateStressField(
  stressField: { position: Vector3; normal: Vector3; stress: number }[],
): StressFieldData {
  const stresses = stressField.map((s) => s.stress);
  const min = stresses.length > 0 ? Math.min(...stresses) : 0;
  const max = stresses.length > 0 ? Math.max(...stresses) : 0;
  const range = max - min || 1;

  const cells: StressFieldCell[] = stressField.map((sample) => ({
    position: sample.position,
    normal: sample.normal,
    stress: sample.stress,
    normalized: (sample.stress - min) / range,
  }));

  return { type: 'stress-field', cells, range: { min, max }, unit: 'Pa' };
}

/**
 * Generates a temperature gradient overlay from a temperature distribution.
 */
export function generateTemperatureGradient(
  temperatureField: { position: Vector3; temperature: number }[],
): TemperatureGradientData {
  const temps = temperatureField.map((t) => t.temperature);
  const min = temps.length > 0 ? Math.min(...temps) : 0;
  const max = temps.length > 0 ? Math.max(...temps) : 0;
  const range = max - min || 1;

  const cells: TemperatureGradientCell[] = temperatureField.map((sample) => ({
    position: sample.position,
    temperature: sample.temperature,
    normalized: (sample.temperature - min) / range,
  }));

  return { type: 'temperature-gradient', cells, range: { min, max }, unit: '°C' };
}

// ─── Overlay compositing ───────────────────────────────────────────────────

/**
 * Creates an overlay layer from data and a colour scale.
 */
export function createOverlayLayer(type: OverlayType, data: OverlayData): OverlayLayer {
  const scaleMap: Record<OverlayType, ColorScale> = {
    'pressure-map': PRESSURE_COLOR_SCALE,
    'velocity-field': VELOCITY_COLOR_SCALE,
    'wave-front': WAVE_COLOR_SCALE,
    'stress-field': STRESS_COLOR_SCALE,
    'temperature-gradient': TEMPERATURE_COLOR_SCALE,
  };
  return {
    type,
    control: defaultControl(scaleMap[type]),
    data,
  };
}

/**
 * Creates a composite from multiple overlay layers.
 */
export function createComposite(layers: OverlayLayer[], masterOpacity = 1): OverlayComposite {
  return { layers, masterOpacity };
}

/**
 * Returns only the visible layers from a composite, applying master opacity.
 */
export function getVisibleLayers(composite: OverlayComposite): OverlayLayer[] {
  return composite.layers.filter((layer) => layer.control.visible);
}

/**
 * Computes the effective opacity of a layer (layer opacity × master opacity).
 */
export function effectiveOpacity(composite: OverlayComposite, layer: OverlayLayer): number {
  return layer.control.opacity * composite.masterOpacity;
}

// ─── Animation controls ────────────────────────────────────────────────────

/**
 * Advances the animation time for all animated layers in a composite.
 */
export function advanceOverlayAnimation(
  composite: OverlayComposite,
  delta: number,
): OverlayComposite {
  return {
    ...composite,
    layers: composite.layers.map((layer) => {
      if (!layer.control.animation.enabled) return layer;
      return {
        ...layer,
        control: {
          ...layer.control,
          animation: {
            ...layer.control.animation,
            time: layer.control.animation.time + delta * layer.control.animation.speed,
          },
        },
      };
    }),
  };
}

/**
 * Sets the opacity for a specific overlay type within a composite.
 */
export function setOverlayOpacity(
  composite: OverlayComposite,
  type: OverlayType,
  opacity: number,
): OverlayComposite {
  return {
    ...composite,
    layers: composite.layers.map((layer) =>
      layer.type === type
        ? { ...layer, control: { ...layer.control, opacity: Math.max(0, Math.min(1, opacity)) } }
        : layer,
    ),
  };
}

/**
 * Toggles visibility for a specific overlay type within a composite.
 */
export function toggleOverlayVisibility(
  composite: OverlayComposite,
  type: OverlayType,
): OverlayComposite {
  return {
    ...composite,
    layers: composite.layers.map((layer) =>
      layer.type === type
        ? { ...layer, control: { ...layer.control, visible: !layer.control.visible } }
        : layer,
    ),
  };
}

// ─── Simulation result integration ─────────────────────────────────────────

export interface SimulationResultsForOverlays {
  pressureField?: { position: Vector3; normal: Vector3; pressure: number }[];
  velocityField?: { position: Vector3; velocity: Vector3 }[];
  acousticSource?: Vector3;
  speedOfSound?: number;
  stressField?: { position: Vector3; normal: Vector3; stress: number }[];
  temperatureField?: { position: Vector3; temperature: number }[];
}

/**
 * Generates a composite overlay from simulation results, activating all
 * available overlay types based on which data is present.
 */
export function generateOverlayComposite(results: SimulationResultsForOverlays): OverlayComposite {
  const layers: OverlayLayer[] = [];

  if (results.pressureField && results.pressureField.length > 0) {
    layers.push(createOverlayLayer('pressure-map', generatePressureMap(results.pressureField)));
  }
  if (results.velocityField && results.velocityField.length > 0) {
    layers.push(createOverlayLayer('velocity-field', generateVelocityField(results.velocityField)));
  }
  if (results.acousticSource && results.speedOfSound) {
    layers.push(
      createOverlayLayer(
        'wave-front',
        generateWaveFronts(results.acousticSource, results.speedOfSound, 0.1),
      ),
    );
  }
  if (results.stressField && results.stressField.length > 0) {
    layers.push(createOverlayLayer('stress-field', generateStressField(results.stressField)));
  }
  if (results.temperatureField && results.temperatureField.length > 0) {
    layers.push(
      createOverlayLayer(
        'temperature-gradient',
        generateTemperatureGradient(results.temperatureField),
      ),
    );
  }

  return createComposite(layers);
}
