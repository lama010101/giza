/**
 * Geological visualization modes per GIZA-03 §2.16 (M09-T11).
 *
 * 5 modes share the same geometry:
 *   1. Photorealistic — full PBR textures, realistic lighting
 *   2. Simplified Stratigraphy — color-coded geological layers
 *   3. Cutaway — cross-section view, interior visible
 *   4. Semi-transparent — ghosted exterior, interior visible
 *   5. Cross-sectional Engineering — schematic, dimensions labeled
 *
 * Switching modes is instant (no geometry reload).
 */

export type GeologicalMode =
  | 'photorealistic'
  | 'simplified-stratigraphy'
  | 'cutaway'
  | 'semi-transparent'
  | 'cross-sectional-engineering';

export const GEOLOGICAL_MODES: GeologicalMode[] = [
  'photorealistic',
  'simplified-stratigraphy',
  'cutaway',
  'semi-transparent',
  'cross-sectional-engineering',
];

export interface GeologicalModeConfig {
  mode: GeologicalMode;
  label: string;
  description: string;
  opacity: number;
  wireframe: boolean;
  colorOverride: string | null;
  showDimensions: boolean;
  showStrata: boolean;
  cutawayPlane: { normal: [number, number, number]; position: [number, number, number] } | null;
}

export const GEOLOGICAL_MODE_CONFIGS: Record<GeologicalMode, GeologicalModeConfig> = {
  photorealistic: {
    mode: 'photorealistic',
    label: 'Photorealistic',
    description: 'Full PBR textures with realistic lighting',
    opacity: 1.0,
    wireframe: false,
    colorOverride: null,
    showDimensions: false,
    showStrata: false,
    cutawayPlane: null,
  },
  'simplified-stratigraphy': {
    mode: 'simplified-stratigraphy',
    label: 'Simplified Stratigraphy',
    description: 'Color-coded geological layers',
    opacity: 1.0,
    wireframe: false,
    colorOverride: null,
    showDimensions: false,
    showStrata: true,
    cutawayPlane: null,
  },
  cutaway: {
    mode: 'cutaway',
    label: 'Cutaway',
    description: 'Cross-section view, interior visible',
    opacity: 1.0,
    wireframe: false,
    colorOverride: null,
    showDimensions: false,
    showStrata: false,
    cutawayPlane: { normal: [0, 0, 1], position: [0, 0, 0] },
  },
  'semi-transparent': {
    mode: 'semi-transparent',
    label: 'Semi-transparent',
    description: 'Ghosted exterior, interior visible',
    opacity: 0.3,
    wireframe: false,
    colorOverride: null,
    showDimensions: false,
    showStrata: false,
    cutawayPlane: null,
  },
  'cross-sectional-engineering': {
    mode: 'cross-sectional-engineering',
    label: 'Cross-sectional Engineering',
    description: 'Schematic with dimension labels',
    opacity: 0.8,
    wireframe: true,
    colorOverride: '#cccccc',
    showDimensions: true,
    showStrata: false,
    cutawayPlane: { normal: [0, 0, 1], position: [0, 0, 0] },
  },
};

/**
 * Stratigraphy color mapping for simplified stratigraphy mode.
 * Based on typical Giza plateau geology.
 */
export const STRATA_COLORS: { name: string; color: string; yRange: [number, number] }[] = [
  { name: 'Desert Sand', color: '#e8d8a8', yRange: [0, 5] },
  { name: 'Limestone (Upper)', color: '#c2b280', yRange: [-5, 0] },
  { name: 'Limestone (Middle)', color: '#a89868', yRange: [-15, -5] },
  { name: 'Limestone (Lower)', color: '#8a7a55', yRange: [-25, -15] },
  { name: 'Bedrock', color: '#6b5f45', yRange: [-35, -25] },
];

/**
 * Returns the strata color for a given Y elevation.
 */
export function getStrataColor(y: number): string {
  for (const strata of STRATA_COLORS) {
    if (y >= strata.yRange[0] && y <= strata.yRange[1]) {
      return strata.color;
    }
  }
  return '#6b5f45';
}
