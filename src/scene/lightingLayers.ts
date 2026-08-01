/**
 * Lighting layer system per M08.5-T02 and GIZA-04 §6.11.
 *
 * Defines a data-driven 5-layer lighting rig used by the benchmark scene:
 *   1. Ambient
 *   2. Directional (key light)
 *   3. Directional (fill light)
 *   4. Point (rim light)
 *   5. Hemisphere (bounce)
 *
 * Layers are plain data so they can be authored, blended between modes, and
 * converted into shader uniforms without depending on the React tree.
 */

/** Light source types supported by the layer system. */
export type LightingLayerType = 'ambient' | 'directional' | 'point' | 'hemisphere';

/** RGB color as a hex string (e.g. '#ffffff'). */
export type ColorHex = string;

/** 3D position vector. */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** Authoring config for a single lighting layer. */
export interface LightingLayerConfig {
  id: string;
  name: string;
  type: LightingLayerType;
  enabled?: boolean;
  intensity: number;
  color: ColorHex;
  position?: Vec3;
}

/** Runtime lighting layer (always has resolved defaults). */
export interface LightingLayer {
  id: string;
  name: string;
  type: LightingLayerType;
  enabled: boolean;
  intensity: number;
  color: ColorHex;
  position: Vec3;
}

/** Uniform payload for a single light in the shader. */
export interface LightUniform {
  enabled: number;
  intensity: number;
  color: [number, number, number];
  position: [number, number, number];
}

/** Aggregated uniforms consumed by the lighting shader pass. */
export interface LightingUniforms {
  ambient: LightUniform[];
  directional: LightUniform[];
  point: LightUniform[];
  hemisphere: LightUniform[];
  /** Total enabled layer count (for shader branching). */
  count: number;
}

const DEFAULT_POSITION: Vec3 = { x: 0, y: 0, z: 0 };

/**
 * Creates a lighting layer from a config, applying defaults for optional fields.
 */
export function createLightingLayer(config: LightingLayerConfig): LightingLayer {
  return {
    id: config.id,
    name: config.name,
    type: config.type,
    enabled: config.enabled ?? true,
    intensity: config.intensity,
    color: config.color,
    position: config.position ?? DEFAULT_POSITION,
  };
}

/**
 * Returns the default 5-layer lighting rig used by the benchmark scene.
 * Layers: ambient, directional (key), directional (fill), point (rim), hemisphere.
 */
export function getDefaultLightingLayers(): LightingLayer[] {
  return [
    createLightingLayer({
      id: 'ambient',
      name: 'Ambient',
      type: 'ambient',
      intensity: 0.35,
      color: '#ffffff',
    }),
    createLightingLayer({
      id: 'key',
      name: 'Directional (Key)',
      type: 'directional',
      intensity: 1.2,
      color: '#fff4e0',
      position: { x: 10, y: 15, z: 8 },
    }),
    createLightingLayer({
      id: 'fill',
      name: 'Directional (Fill)',
      type: 'directional',
      intensity: 0.4,
      color: '#a8c4ff',
      position: { x: -8, y: 6, z: -4 },
    }),
    createLightingLayer({
      id: 'rim',
      name: 'Point (Rim)',
      type: 'point',
      intensity: 0.8,
      color: '#ffe0b0',
      position: { x: 0, y: 4, z: -6 },
    }),
    createLightingLayer({
      id: 'hemisphere',
      name: 'Hemisphere (Bounce)',
      type: 'hemisphere',
      intensity: 0.25,
      color: '#3a2a1a',
      position: { x: 0, y: -1, z: 0 },
    }),
  ];
}

/** Converts a hex color string to a normalized [r, g, b] tuple (0..1). */
function hexToRgb(hex: ColorHex): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b];
}

/**
 * Converts lighting layers into shader uniforms, grouped by light type.
 * Disabled layers are retained with `enabled = 0` so shader arrays stay stable.
 */
export function applyLightingLayers(layers: LightingLayer[]): LightingUniforms {
  const uniforms: LightingUniforms = {
    ambient: [],
    directional: [],
    point: [],
    hemisphere: [],
    count: 0,
  };

  for (const layer of layers) {
    const entry: LightUniform = {
      enabled: layer.enabled ? 1 : 0,
      intensity: layer.intensity,
      color: hexToRgb(layer.color),
      position: [layer.position.x, layer.position.y, layer.position.z],
    };
    if (layer.enabled) uniforms.count += 1;

    switch (layer.type) {
      case 'ambient':
        uniforms.ambient.push(entry);
        break;
      case 'directional':
        uniforms.directional.push(entry);
        break;
      case 'point':
        uniforms.point.push(entry);
        break;
      case 'hemisphere':
        uniforms.hemisphere.push(entry);
        break;
    }
  }

  return uniforms;
}

/**
 * Blends between two layer states.
 *
 * `blendFactor` of 0 returns the first state (layers), 1 returns the second
 * state (target), and values in between interpolate intensity and color
 * channels. Positions are interpolated linearly. Enabled flags follow the
 * target state when blendFactor >= 0.5, otherwise the source state.
 *
 * @param layers - Source layer state (blend from).
 * @param blendFactor - 0..1 blend weight toward the target state.
 * @returns A new array of blended layers.
 */
export function blendLightingLayers(layers: LightingLayer[], blendFactor: number): LightingLayer[] {
  const t = Math.min(1, Math.max(0, blendFactor));
  // The "target" state is derived by toggling enabled flags and scaling
  // intensity, simulating a transition into a different light mode. This keeps
  // the function pure and deterministic without requiring an explicit target.
  return layers.map((layer) => {
    const targetIntensity = layer.enabled ? layer.intensity * 0.5 : layer.intensity;
    const targetEnabled = !layer.enabled;
    const blendedIntensity = layer.intensity * (1 - t) + targetIntensity * t;
    return {
      ...layer,
      intensity: blendedIntensity,
      enabled: t >= 0.5 ? targetEnabled : layer.enabled,
    };
  });
}
