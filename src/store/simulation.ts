import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface HydraulicState {
  running: boolean;
  waterLevel: number;
  inflowRate: number;
  outflowRate: number;
  channelWidth: number;
  elapsedTime: number;
  stable: boolean;
}

interface SimulationState extends HydraulicState {
  setRunning: (running: boolean) => void;
  setWaterLevel: (level: number) => void;
  setInflowRate: (rate: number) => void;
  setOutflowRate: (rate: number) => void;
  setChannelWidth: (width: number) => void;
  tick: (delta: number) => void;
  reset: () => void;
}

const CHAMBER_FLOOR_Y = -30.65;
const CHAMBER_CEILING_Y = -27.65;
const ISLAND_TOP_Y = -28.9;
const MAX_WATER_LEVEL = CHAMBER_CEILING_Y - CHAMBER_FLOOR_Y;

export const CHAMBER_FLOOR = CHAMBER_FLOOR_Y;
export const ISLAND_TOP = ISLAND_TOP_Y;

export const useSimulationStore = create<SimulationState>()(
  devtools(
    (set) => ({
      running: false,
      waterLevel: 0.5,
      inflowRate: 0.0,
      outflowRate: 0.0,
      channelWidth: 1.35,
      elapsedTime: 0,
      stable: false,

      setRunning: (running) => set({ running }),
      setWaterLevel: (waterLevel) =>
        set({ waterLevel: Math.max(0, Math.min(MAX_WATER_LEVEL, waterLevel)) }),
      setInflowRate: (inflowRate) => set({ inflowRate }),
      setOutflowRate: (outflowRate) => set({ outflowRate }),
      setChannelWidth: (channelWidth) => set({ channelWidth }),

      tick: (delta) =>
        set((state) => {
          if (!state.running) return state;

          const netFlow = state.inflowRate - state.outflowRate;
          const newLevel = Math.max(
            0,
            Math.min(MAX_WATER_LEVEL, state.waterLevel + netFlow * delta),
          );
          const newElapsed = state.elapsedTime + delta;
          const stable = Math.abs(netFlow) < 0.001 && newLevel > 0;

          return {
            waterLevel: newLevel,
            elapsedTime: newElapsed,
            stable,
          };
        }),

      reset: () =>
        set({
          running: false,
          waterLevel: 0.5,
          inflowRate: 0.0,
          outflowRate: 0.0,
          elapsedTime: 0,
          stable: false,
        }),
    }),
    { name: 'GIZA Simulation Store' },
  ),
);
