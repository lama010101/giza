import { describe, it, expect, beforeEach } from 'vitest';
import { useLightingStore } from './lighting';

describe('useLightingStore', () => {
  beforeEach(() => {
    useLightingStore.getState().reset();
  });

  it('starts with default values', () => {
    const s = useLightingStore.getState();
    expect(s.ambientIntensity).toBe(4);
    expect(s.directionalIntensity).toBe(1.2);
    expect(s.directionalAzimuth).toBe(45);
    expect(s.directionalElevation).toBe(60);
    expect(s.localIntensity).toBe(0.8);
    expect(s.background).toBe('#0f0f0f');
  });

  it('sets ambient intensity', () => {
    useLightingStore.getState().setAmbientIntensity(2.5);
    expect(useLightingStore.getState().ambientIntensity).toBe(2.5);
  });

  it('sets directional intensity', () => {
    useLightingStore.getState().setDirectionalIntensity(3.0);
    expect(useLightingStore.getState().directionalIntensity).toBe(3.0);
  });

  it('sets local intensity', () => {
    useLightingStore.getState().setLocalIntensity(1.5);
    expect(useLightingStore.getState().localIntensity).toBe(1.5);
  });

  it('sets azimuth and elevation', () => {
    useLightingStore.getState().setDirectionalAzimuth(180);
    useLightingStore.getState().setDirectionalElevation(30);
    expect(useLightingStore.getState().directionalAzimuth).toBe(180);
    expect(useLightingStore.getState().directionalElevation).toBe(30);
  });

  it('sets background color', () => {
    useLightingStore.getState().setBackground('#1a2b3c');
    expect(useLightingStore.getState().background).toBe('#1a2b3c');
  });

  it('resets to defaults', () => {
    useLightingStore.getState().setAmbientIntensity(3);
    useLightingStore.getState().setDirectionalIntensity(5);
    useLightingStore.getState().setLocalIntensity(2);
    useLightingStore.getState().setBackground('#ffffff');

    useLightingStore.getState().reset();

    expect(useLightingStore.getState().ambientIntensity).toBe(4);
    expect(useLightingStore.getState().directionalIntensity).toBe(1.2);
    expect(useLightingStore.getState().localIntensity).toBe(0.8);
    expect(useLightingStore.getState().background).toBe('#0f0f0f');
  });
});
