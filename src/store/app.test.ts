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
    const { setMeasurementMode, addMeasurementPoint } = useAppStore.getState();

    setMeasurementMode(true);

    addMeasurementPoint({ x: 0, y: 0, z: 0 });
    expect(useAppStore.getState().measurementStart).toEqual({ x: 0, y: 0, z: 0 });
    expect(useAppStore.getState().measurementEnd).toBeNull();

    addMeasurementPoint({ x: 3, y: 4, z: 0 });
    expect(useAppStore.getState().measurementEnd).toEqual({ x: 3, y: 4, z: 0 });
    expect(useAppStore.getState().measurementResult).not.toBeNull();

    addMeasurementPoint({ x: 1, y: 1, z: 1 });
    expect(useAppStore.getState().measurementStart).toEqual({ x: 1, y: 1, z: 1 });
    expect(useAppStore.getState().measurementEnd).toBeNull();
    expect(useAppStore.getState().measurementResult).toBeNull();
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
    useAppStore.setState({ hiddenLayers: [] });
  });

  it('starts with no hidden layers', () => {
    expect(useAppStore.getState().hiddenLayers).toEqual([]);
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
});
