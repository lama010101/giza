import { describe, it, expect, beforeEach } from 'vitest';
import { useSimulationStore } from './simulation';

describe('useSimulationStore', () => {
  beforeEach(() => {
    useSimulationStore.getState().reset();
  });

  it('starts with default values', () => {
    const state = useSimulationStore.getState();
    expect(state.running).toBe(false);
    expect(state.waterLevel).toBe(0.5);
    expect(state.inflowRate).toBe(0);
    expect(state.outflowRate).toBe(0);
    expect(state.channelWidth).toBe(1.35);
    expect(state.elapsedTime).toBe(0);
    expect(state.stable).toBe(false);
  });

  it('sets running state', () => {
    useSimulationStore.getState().setRunning(true);
    expect(useSimulationStore.getState().running).toBe(true);
  });

  it('clamps water level to valid range', () => {
    useSimulationStore.getState().setWaterLevel(100);
    expect(useSimulationStore.getState().waterLevel).toBeLessThanOrEqual(3);

    useSimulationStore.getState().setWaterLevel(-5);
    expect(useSimulationStore.getState().waterLevel).toBe(0);
  });

  it('updates water level based on net flow during tick', () => {
    useSimulationStore.getState().setRunning(true);
    useSimulationStore.getState().setInflowRate(0.5);
    useSimulationStore.getState().setOutflowRate(0.1);

    const initialLevel = useSimulationStore.getState().waterLevel;
    useSimulationStore.getState().tick(1);

    expect(useSimulationStore.getState().waterLevel).toBeCloseTo(initialLevel + 0.4, 5);
    expect(useSimulationStore.getState().elapsedTime).toBe(1);
  });

  it('does not tick when not running', () => {
    useSimulationStore.getState().setRunning(false);
    useSimulationStore.getState().setInflowRate(0.5);

    const initialLevel = useSimulationStore.getState().waterLevel;
    useSimulationStore.getState().tick(1);

    expect(useSimulationStore.getState().waterLevel).toBe(initialLevel);
    expect(useSimulationStore.getState().elapsedTime).toBe(0);
  });

  it('marks stable when net flow is near zero and water exists', () => {
    useSimulationStore.getState().setRunning(true);
    useSimulationStore.getState().setWaterLevel(1.0);
    useSimulationStore.getState().setInflowRate(0.0005);
    useSimulationStore.getState().setOutflowRate(0.0005);

    useSimulationStore.getState().tick(1);
    expect(useSimulationStore.getState().stable).toBe(true);
  });

  it('resets to defaults', () => {
    useSimulationStore.getState().setRunning(true);
    useSimulationStore.getState().setWaterLevel(2);
    useSimulationStore.getState().setInflowRate(0.3);
    useSimulationStore.getState().tick(2);

    useSimulationStore.getState().reset();

    expect(useSimulationStore.getState().running).toBe(false);
    expect(useSimulationStore.getState().waterLevel).toBe(0.5);
    expect(useSimulationStore.getState().inflowRate).toBe(0);
    expect(useSimulationStore.getState().elapsedTime).toBe(0);
  });
});
