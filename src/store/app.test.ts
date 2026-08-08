import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './app';

describe('useAppStore measurement', () => {
  beforeEach(() => {
    useAppStore.setState({
      measurementMode: false,
      measurementStart: null,
      measurementEnd: null,
      bookmarkedObjectIds: [],
    });
  });

  it('records start then end point, then restarts on the third click', () => {
    const { addMeasurementPoint } = useAppStore.getState();

    addMeasurementPoint({ x: 0, y: 0, z: 0 });
    expect(useAppStore.getState().measurementStart).toEqual({ x: 0, y: 0, z: 0 });
    expect(useAppStore.getState().measurementEnd).toBeNull();

    addMeasurementPoint({ x: 3, y: 4, z: 0 });
    expect(useAppStore.getState().measurementEnd).toEqual({ x: 3, y: 4, z: 0 });

    addMeasurementPoint({ x: 1, y: 1, z: 1 });
    expect(useAppStore.getState().measurementStart).toEqual({ x: 1, y: 1, z: 1 });
    expect(useAppStore.getState().measurementEnd).toBeNull();
  });

  it('clears points when measurement mode is disabled', () => {
    const { setMeasurementMode, addMeasurementPoint } = useAppStore.getState();

    setMeasurementMode(true);
    addMeasurementPoint({ x: 0, y: 0, z: 0 });
    setMeasurementMode(false);

    expect(useAppStore.getState().measurementStart).toBeNull();
    expect(useAppStore.getState().measurementEnd).toBeNull();
  });

  it('toggles bookmarked objects on and off', () => {
    const { toggleBookmarkedObject } = useAppStore.getState();

    toggleBookmarkedObject('OBJ-0008');
    expect(useAppStore.getState().bookmarkedObjectIds).toEqual(['OBJ-0008']);

    toggleBookmarkedObject('OBJ-0008');
    expect(useAppStore.getState().bookmarkedObjectIds).toEqual([]);
  });
});

describe('useAppStore bookmarks', () => {
  beforeEach(() => {
    useAppStore.setState({
      bookmarks: [],
      cameraPosition: { x: 1, y: 2, z: 3 },
      cameraTarget: { x: 0, y: 0, z: 0 },
      cameraMode: 'orbit',
      hiddenLayers: ['exterior'],
      hiddenVisibilityLayers: ['Modern'],
      activeHypothesisIds: ['hydraulic'],
      selectedObjectId: 'OBJ-0001',
      selectedEvidenceId: 'EV-0001',
    });
  });

  it('adds a bookmark from current state', () => {
    const { addBookmark } = useAppStore.getState();

    addBookmark('Test view', 'A note');
    const bms = useAppStore.getState().bookmarks;
    expect(bms).toHaveLength(1);
    expect(bms[0].name).toBe('Test view');
    expect(bms[0].notes).toBe('A note');
    expect(bms[0].camera.position).toEqual({ x: 1, y: 2, z: 3 });
    expect(bms[0].camera.mode).toBe('orbit');
    expect(bms[0].activeHypothesisIds).toEqual(['hydraulic']);
    expect(bms[0].selectedObjectId).toBe('OBJ-0001');
    expect(bms[0].selectedEvidenceId).toBe('EV-0001');
  });

  it('deletes a bookmark', () => {
    const { addBookmark, deleteBookmark } = useAppStore.getState();
    addBookmark('One');
    const id = useAppStore.getState().bookmarks[0].id;
    addBookmark('Two');
    deleteBookmark(id);
    expect(useAppStore.getState().bookmarks.map((b) => b.name)).toEqual(['Two']);
  });

  it('restores a bookmark into store state', () => {
    const { addBookmark, restoreBookmark } = useAppStore.getState();
    addBookmark('Saved');
    const bm = useAppStore.getState().bookmarks[0];

    useAppStore.setState({
      cameraPosition: { x: 0, y: 0, z: 0 },
      cameraTarget: { x: 0, y: 0, z: 0 },
      cameraMode: 'walk',
      hiddenLayers: [],
      hiddenVisibilityLayers: [],
      activeHypothesisIds: [],
      selectedObjectId: null,
      selectedEvidenceId: null,
    });

    restoreBookmark(bm.id);
    const state = useAppStore.getState();
    expect(state.cameraPosition).toEqual(bm.camera.position);
    expect(state.cameraTarget).toEqual(bm.camera.target);
    expect(state.cameraMode).toBe(bm.camera.mode);
    expect(state.hiddenLayers).toEqual(bm.hiddenLayers);
    expect(state.activeHypothesisIds).toEqual(bm.activeHypothesisIds);
    expect(state.selectedObjectId).toBe(bm.selectedObjectId);
  });
});

describe('useAppStore camera mode', () => {
  beforeEach(() => {
    useAppStore.setState({ cameraMode: 'orbit' });
  });

  it('defaults to orbit camera mode', () => {
    expect(useAppStore.getState().cameraMode).toBe('orbit');
  });

  it('sets camera mode to walk', () => {
    useAppStore.getState().setCameraMode('walk');
    expect(useAppStore.getState().cameraMode).toBe('walk');
  });

  it('sets camera mode to fly', () => {
    useAppStore.getState().setCameraMode('fly');
    expect(useAppStore.getState().cameraMode).toBe('fly');
  });

  it('sets camera mode to teleport', () => {
    useAppStore.getState().setCameraMode('teleport');
    expect(useAppStore.getState().cameraMode).toBe('teleport');
  });
});

describe('useAppStore layer visibility', () => {
  beforeEach(() => {
    useAppStore.setState({ hiddenLayers: [], hiddenVisibilityLayers: [] });
  });

  it('starts with no hidden layers', () => {
    expect(useAppStore.getState().hiddenLayers).toEqual([]);
  });

  it('starts with no hidden visibility layers', () => {
    expect(useAppStore.getState().hiddenVisibilityLayers).toEqual([]);
  });

  it('toggles a layer on (hidden)', () => {
    useAppStore.getState().toggleLayer('shafts');
    expect(useAppStore.getState().hiddenLayers).toEqual(['shafts']);
  });

  it('toggles a layer off (visible again)', () => {
    useAppStore.getState().toggleLayer('level-3');
    useAppStore.getState().toggleLayer('level-3');
    expect(useAppStore.getState().hiddenLayers).toEqual([]);
  });

  it('can hide multiple layers', () => {
    useAppStore.getState().toggleLayer('shafts');
    useAppStore.getState().toggleLayer('level-1');
    expect(useAppStore.getState().hiddenLayers).toEqual(['shafts', 'level-1']);
  });

  it('toggles a visibility layer', () => {
    useAppStore.getState().toggleVisibilityLayer('Evidence');
    expect(useAppStore.getState().hiddenVisibilityLayers).toEqual(['Evidence']);
    useAppStore.getState().toggleVisibilityLayer('Evidence');
    expect(useAppStore.getState().hiddenVisibilityLayers).toEqual([]);
  });

  it('can replace all visibility layers', () => {
    useAppStore.getState().setHiddenVisibilityLayers(['Theory', 'Water']);
    expect(useAppStore.getState().hiddenVisibilityLayers).toEqual(['Theory', 'Water']);
  });
});
