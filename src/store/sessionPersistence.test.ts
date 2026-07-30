import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './app';

describe('useAppStore session persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    useAppStore.setState({
      mode: 'Explore',
      activeMonument: 'osiris',
      activeHypothesisIds: [],
      activeLocationId: null,
      evidencePanelOpen: true,
      sidePanelTab: 'scene',
      bookmarkedObjectIds: [],
      cameraMode: 'orbit',
      cameraTarget: { x: 0, y: -15, z: 2 },
      hiddenLayers: [],
      lod: 'LOD0',
      hoveredNodeId: null,
      measurementMode: false,
      measurementStart: null,
      measurementEnd: null,
    });
  });

  it('persists bookmarked objects to localStorage', () => {
    useAppStore.getState().toggleBookmarkedObject('OBJ-0001');
    const stored = JSON.parse(localStorage.getItem('giza-session') ?? '{}') as {
      state: { bookmarkedObjectIds: string[] };
    };
    expect(stored.state.bookmarkedObjectIds).toEqual(['OBJ-0001']);
  });

  it('persists active monument to localStorage', () => {
    useAppStore.getState().setActiveMonument('great-pyramid');
    const stored = JSON.parse(localStorage.getItem('giza-session') ?? '{}') as {
      state: { activeMonument: string };
    };
    expect(stored.state.activeMonument).toBe('great-pyramid');
  });

  it('persists camera target to localStorage', () => {
    useAppStore.getState().setCameraTarget({ x: 10, y: -20, z: 5 });
    const stored = JSON.parse(localStorage.getItem('giza-session') ?? '{}') as {
      state: { cameraTarget: { x: number; y: number; z: number } };
    };
    expect(stored.state.cameraTarget).toEqual({ x: 10, y: -20, z: 5 });
  });

  it('persists hidden layers to localStorage', () => {
    useAppStore.getState().toggleLayer('shafts');
    useAppStore.getState().toggleLayer('level-1');
    const stored = JSON.parse(localStorage.getItem('giza-session') ?? '{}') as {
      state: { hiddenLayers: string[] };
    };
    expect(stored.state.hiddenLayers).toEqual(['shafts', 'level-1']);
  });

  it('persists mode to localStorage', () => {
    useAppStore.getState().setMode('Research');
    const stored = JSON.parse(localStorage.getItem('giza-session') ?? '{}') as {
      state: { mode: string };
    };
    expect(stored.state.mode).toBe('Research');
  });

  it('does not persist transient state (hoveredNodeId)', () => {
    useAppStore.getState().setHoveredNodeId('some-node');
    const stored = JSON.parse(localStorage.getItem('giza-session') ?? '{}') as {
      state: { hoveredNodeId?: string };
    };
    expect(stored.state.hoveredNodeId).toBeUndefined();
  });

  it('does not persist transient state (measurementMode)', () => {
    useAppStore.getState().setMeasurementMode(true);
    const stored = JSON.parse(localStorage.getItem('giza-session') ?? '{}') as {
      state: { measurementMode?: boolean };
    };
    expect(stored.state.measurementMode).toBeUndefined();
  });
});
