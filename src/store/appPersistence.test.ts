import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AppState } from './app';

describe('App store session persistence (M07-T15)', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('restores persisted session state in under 1 second', async () => {
    const persisted: Partial<AppState> = {
      mode: 'Research',
      activeMonument: 'osiris',
      activeHypothesisIds: ['HYP-001'],
      activeLocationId: 'LOC-001',
      evidencePanelOpen: false,
      sidePanelTab: 'evidence',
      bookmarkedObjectIds: ['OBJ-0001'],
      cameraMode: 'walk',
      cameraTarget: { x: 1, y: 2, z: 3 },
      hiddenLayers: ['level-1'],
      lod: 'LOD1',
    };

    localStorage.setItem('giza-session', JSON.stringify({ state: persisted, version: 2 }));

    const start = performance.now();
    const { useAppStore } = await import('./app');
    // Allow the persist middleware to rehydrate asynchronously.
    await new Promise((resolve) => setTimeout(resolve, 0));
    const elapsed = performance.now() - start;

    const state = useAppStore.getState();
    expect(state.mode).toBe('Research');
    expect(state.activeMonument).toBe('osiris');
    expect(state.activeHypothesisIds).toEqual(['HYP-001']);
    expect(state.activeLocationId).toBe('LOC-001');
    expect(state.evidencePanelOpen).toBe(false);
    expect(state.sidePanelTab).toBe('evidence');
    expect(state.bookmarkedObjectIds).toEqual(['OBJ-0001']);
    expect(state.cameraMode).toBe('walk');
    expect(state.cameraTarget).toEqual({ x: 1, y: 2, z: 3 });
    expect(state.hiddenLayers).toEqual(['level-1']);
    expect(state.lod).toBe('LOD1');
    expect(elapsed).toBeLessThan(1000);
  });

  it('defaults to Explore mode and Great Pyramid when no persisted state exists', async () => {
    const start = performance.now();
    const { useAppStore } = await import('./app');
    await new Promise((resolve) => setTimeout(resolve, 0));
    const elapsed = performance.now() - start;

    const state = useAppStore.getState();
    expect(state.mode).toBe('Explore');
    expect(state.activeMonument).toBe('great-pyramid');
    expect(elapsed).toBeLessThan(1000);
  });
});
