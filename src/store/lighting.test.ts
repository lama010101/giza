import { describe, it, expect, beforeEach } from 'vitest';
import { useLightingStore, LIGHT_LAYERS, LIGHT_MODES, LIGHT_MODE_PRESETS } from './lighting';

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

  it('has 5 light layers defined', () => {
    expect(LIGHT_LAYERS).toHaveLength(5);
    expect(LIGHT_LAYERS).toContain('ambient');
    expect(LIGHT_LAYERS).toContain('directional');
    expect(LIGHT_LAYERS).toContain('local');
    expect(LIGHT_LAYERS).toContain('bounce');
    expect(LIGHT_LAYERS).toContain('volumetric');
  });

  it('has 3 light modes defined', () => {
    expect(LIGHT_MODES).toHaveLength(3);
    expect(LIGHT_MODES).toContain('Documentary');
    expect(LIGHT_MODES).toContain('Exploration');
    expect(LIGHT_MODES).toContain('Scientific Inspection');
  });

  it('defaults to Exploration mode with ambient/directional/local enabled', () => {
    const s = useLightingStore.getState();
    expect(s.lightMode).toBe('Exploration');
    expect(s.ambientEnabled).toBe(true);
    expect(s.directionalEnabled).toBe(true);
    expect(s.localEnabled).toBe(true);
  });

  it('defaults bounce and volumetric to disabled', () => {
    const s = useLightingStore.getState();
    expect(s.bounceEnabled).toBe(false);
    expect(s.volumetricEnabled).toBe(false);
  });

  it('toggles individual layers independently', () => {
    useLightingStore.getState().setLayerEnabled('ambient', false);
    expect(useLightingStore.getState().ambientEnabled).toBe(false);
    expect(useLightingStore.getState().directionalEnabled).toBe(true); // others unchanged

    useLightingStore.getState().setLayerEnabled('bounce', true);
    expect(useLightingStore.getState().bounceEnabled).toBe(true);
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

  it('sets bounce intensity', () => {
    useLightingStore.getState().setBounceIntensity(0.6);
    expect(useLightingStore.getState().bounceIntensity).toBe(0.6);
  });

  it('sets volumetric intensity and density', () => {
    useLightingStore.getState().setVolumetricIntensity(0.9);
    useLightingStore.getState().setVolumetricDensity(0.05);
    expect(useLightingStore.getState().volumetricIntensity).toBe(0.9);
    expect(useLightingStore.getState().volumetricDensity).toBe(0.05);
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

  describe('light mode presets', () => {
    it('Documentary mode has warm high-contrast lighting', () => {
      useLightingStore.getState().setLightMode('Documentary');
      const s = useLightingStore.getState();
      expect(s.lightMode).toBe('Documentary');
      expect(s.directionalIntensity).toBeGreaterThan(s.ambientIntensity);
      expect(s.volumetricEnabled).toBe(true);
    });

    it('Exploration mode has balanced lighting with bounce', () => {
      useLightingStore.getState().setLightMode('Exploration');
      const s = useLightingStore.getState();
      expect(s.lightMode).toBe('Exploration');
      expect(s.bounceEnabled).toBe(true);
      expect(s.volumetricEnabled).toBe(false);
    });

    it('Scientific Inspection mode has flat even lighting', () => {
      useLightingStore.getState().setLightMode('Scientific Inspection');
      const s = useLightingStore.getState();
      expect(s.lightMode).toBe('Scientific Inspection');
      expect(s.ambientIntensity).toBeGreaterThan(5);
      expect(s.directionalIntensity).toBeLessThan(1);
    });

    it('all presets define all required fields', () => {
      for (const mode of LIGHT_MODES) {
        const preset = LIGHT_MODE_PRESETS[mode];
        expect(preset.ambientIntensity).toBeDefined();
        expect(preset.directionalIntensity).toBeDefined();
        expect(preset.localIntensity).toBeDefined();
      }
    });
  });

  it('resets to defaults', () => {
    useLightingStore.getState().setAmbientIntensity(3);
    useLightingStore.getState().setDirectionalIntensity(5);
    useLightingStore.getState().setLocalIntensity(2);
    useLightingStore.getState().setBackground('#ffffff');
    useLightingStore.getState().setLightMode('Documentary');

    useLightingStore.getState().reset();

    expect(useLightingStore.getState().ambientIntensity).toBe(4);
    expect(useLightingStore.getState().directionalIntensity).toBe(1.2);
    expect(useLightingStore.getState().localIntensity).toBe(0.8);
    expect(useLightingStore.getState().background).toBe('#0f0f0f');
    expect(useLightingStore.getState().lightMode).toBe('Exploration');
  });
});
