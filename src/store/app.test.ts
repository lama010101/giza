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
