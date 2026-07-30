import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface LightingState {
  ambientIntensity: number;
  directionalIntensity: number;
  directionalAzimuth: number;
  directionalElevation: number;
  localIntensity: number;
  background: string;
  setAmbientIntensity: (v: number) => void;
  setDirectionalIntensity: (v: number) => void;
  setDirectionalAzimuth: (v: number) => void;
  setDirectionalElevation: (v: number) => void;
  setLocalIntensity: (v: number) => void;
  setBackground: (v: string) => void;
  reset: () => void;
}

const DEFAULTS = {
  ambientIntensity: 4,
  directionalIntensity: 1.2,
  directionalAzimuth: 45,
  directionalElevation: 60,
  localIntensity: 0.8,
  background: '#0f0f0f',
} as const;

export const useLightingStore = create<LightingState>()(
  devtools(
    (set) => ({
      ...DEFAULTS,
      setAmbientIntensity: (ambientIntensity) => set({ ambientIntensity }),
      setDirectionalIntensity: (directionalIntensity) => set({ directionalIntensity }),
      setDirectionalAzimuth: (directionalAzimuth) => set({ directionalAzimuth }),
      setDirectionalElevation: (directionalElevation) => set({ directionalElevation }),
      setLocalIntensity: (localIntensity) => set({ localIntensity }),
      setBackground: (background) => set({ background }),
      reset: () => set({ ...DEFAULTS }),
    }),
    { name: 'GIZA Lighting Store' },
  ),
);
