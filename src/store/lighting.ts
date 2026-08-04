import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

/**
 * 5-layer lighting system per GIZA - 04 §6.11.
 *
 * Layers: Ambient + Directional + Local + Bounce + Volumetric
 * Each layer can be enabled independently.
 *
 * Light modes (M08.5-T02):
 *   Documentary — warm, cinematic, high contrast
 *   Exploration — balanced, neutral
 *   Scientific Inspection — flat, even, low shadow
 */

export type LightLayer = 'ambient' | 'directional' | 'local' | 'bounce' | 'volumetric';
export type LightMode = 'Documentary' | 'Exploration' | 'Scientific Inspection';

export const LIGHT_LAYERS: readonly LightLayer[] = [
  'ambient',
  'directional',
  'local',
  'bounce',
  'volumetric',
] as const;

export const LIGHT_MODES: readonly LightMode[] = [
  'Documentary',
  'Exploration',
  'Scientific Inspection',
] as const;

interface LightingState {
  // Per-layer enabled flags (each layer independently toggleable)
  ambientEnabled: boolean;
  directionalEnabled: boolean;
  localEnabled: boolean;
  bounceEnabled: boolean;
  volumetricEnabled: boolean;

  // Per-layer intensities
  ambientIntensity: number;
  directionalIntensity: number;
  directionalAzimuth: number;
  directionalElevation: number;
  localIntensity: number;
  bounceIntensity: number;
  volumetricIntensity: number;
  volumetricDensity: number;

  // Light mode preset
  lightMode: LightMode;

  background: string;

  // Setters
  setLayerEnabled: (layer: LightLayer, enabled: boolean) => void;
  setAmbientIntensity: (v: number) => void;
  setDirectionalIntensity: (v: number) => void;
  setDirectionalAzimuth: (v: number) => void;
  setDirectionalElevation: (v: number) => void;
  setLocalIntensity: (v: number) => void;
  setBounceIntensity: (v: number) => void;
  setVolumetricIntensity: (v: number) => void;
  setVolumetricDensity: (v: number) => void;
  setLightMode: (mode: LightMode) => void;
  setBackground: (v: string) => void;
  reset: () => void;
}

const DEFAULTS = {
  ambientEnabled: true,
  directionalEnabled: true,
  localEnabled: true,
  bounceEnabled: false,
  volumetricEnabled: false,
  ambientIntensity: 4,
  directionalIntensity: 1.2,
  directionalAzimuth: 45,
  directionalElevation: 60,
  localIntensity: 0.8,
  bounceIntensity: 0.3,
  volumetricIntensity: 0.5,
  volumetricDensity: 0.02,
  lightMode: 'Exploration' as LightMode,
  background: '#0f0f0f',
};

/**
 * Light mode presets per M08.5-T02.
 * Each mode sets characteristic intensities and enabled flags.
 */
export const LIGHT_MODE_PRESETS: Record<LightMode, Partial<typeof DEFAULTS>> = {
  Documentary: {
    ambientEnabled: true,
    directionalEnabled: true,
    localEnabled: true,
    bounceEnabled: false,
    volumetricEnabled: true,
    ambientIntensity: 1.5,
    directionalIntensity: 2.5,
    directionalAzimuth: 30,
    directionalElevation: 25,
    localIntensity: 1.2,
    volumetricIntensity: 0.8,
    volumetricDensity: 0.04,
  },
  Exploration: {
    ambientEnabled: true,
    directionalEnabled: true,
    localEnabled: true,
    bounceEnabled: true,
    volumetricEnabled: false,
    ambientIntensity: 4,
    directionalIntensity: 1.2,
    directionalAzimuth: 45,
    directionalElevation: 60,
    localIntensity: 0.8,
    bounceIntensity: 0.3,
  },
  'Scientific Inspection': {
    ambientEnabled: true,
    directionalEnabled: true,
    localEnabled: true,
    bounceEnabled: true,
    volumetricEnabled: false,
    ambientIntensity: 6,
    directionalIntensity: 0.8,
    directionalAzimuth: 90,
    directionalElevation: 80,
    localIntensity: 1.5,
    bounceIntensity: 0.5,
  },
};

export const useLightingStore = create<LightingState>()(
  devtools(
    persist(
      (set) => ({
        ...DEFAULTS,
        setLayerEnabled: (layer, enabled) => {
          const key = `${layer}Enabled` as const;
          set({ [key]: enabled } as Partial<LightingState>);
        },
        setAmbientIntensity: (ambientIntensity) => set({ ambientIntensity }),
        setDirectionalIntensity: (directionalIntensity) => set({ directionalIntensity }),
        setDirectionalAzimuth: (directionalAzimuth) => set({ directionalAzimuth }),
        setDirectionalElevation: (directionalElevation) => set({ directionalElevation }),
        setLocalIntensity: (localIntensity) => set({ localIntensity }),
        setBounceIntensity: (bounceIntensity) => set({ bounceIntensity }),
        setVolumetricIntensity: (volumetricIntensity) => set({ volumetricIntensity }),
        setVolumetricDensity: (volumetricDensity) => set({ volumetricDensity }),
        setLightMode: (lightMode) => {
          const preset = LIGHT_MODE_PRESETS[lightMode];
          set({ lightMode, ...preset });
        },
        setBackground: (background) => set({ background }),
        reset: () => set({ ...DEFAULTS }),
      }),
      {
        name: 'giza-lighting',
        version: 2,
        migrate: (persisted, version) => {
          const state = (persisted ?? {}) as Partial<LightingState>;
          // v1 only had ambient/directional/local without enabled flags.
          // v2 adds bounce, volumetric, enabled flags, and light mode.
          if (version < 2) {
            state.ambientEnabled = true;
            state.directionalEnabled = true;
            state.localEnabled = true;
            state.bounceEnabled = false;
            state.volumetricEnabled = false;
            state.bounceIntensity = DEFAULTS.bounceIntensity;
            state.volumetricIntensity = DEFAULTS.volumetricIntensity;
            state.volumetricDensity = DEFAULTS.volumetricDensity;
            state.lightMode = DEFAULTS.lightMode;
          }
          return state;
        },
      },
    ),
    { name: 'GIZA Lighting Store' },
  ),
);
