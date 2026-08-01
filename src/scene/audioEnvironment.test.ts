import { describe, it, expect } from 'vitest';
import {
  AUDIO_ZONES,
  getZoneAtPosition,
  getAudioZone,
  computeReverbParams,
  computeSpatialAudio,
  computeOcclusion,
  generateAmbience,
  computeDynamicMix,
  type AudioZoneId,
  type AudioSource,
  type OcclusionWall,
} from './audioEnvironment';

describe('Audio Environment System (M09-T20, GIZA-04 §6.11)', () => {
  describe('AUDIO_ZONES', () => {
    it('defines zones for both Osiris Shaft and Great Pyramid', () => {
      const ids = Object.keys(AUDIO_ZONES) as AudioZoneId[];
      expect(ids.length).toBeGreaterThanOrEqual(8);
      expect(ids).toContain('osiris-level-3');
      expect(ids).toContain('gp-kings-chamber');
      expect(ids).toContain('gp-grand-gallery');
    });

    it('every zone has reverb params and ambience layers', () => {
      for (const zone of Object.values(AUDIO_ZONES)) {
        expect(zone.reverb.decayTime).toBeGreaterThan(0);
        expect(zone.reverb.wetMix).toBeGreaterThanOrEqual(0);
        expect(zone.reverb.wetMix).toBeLessThanOrEqual(1);
        expect(zone.ambience.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getZoneAtPosition', () => {
    it('returns the correct zone for a position inside it', () => {
      const zone = getZoneAtPosition({ x: 7.22, y: 45.88, z: 11.02 });
      expect(zone).toBe('gp-kings-chamber');
    });

    it('returns null for a position outside all zones', () => {
      const zone = getZoneAtPosition({ x: 500, y: 500, z: 500 });
      expect(zone).toBeNull();
    });

    it('returns osiris-level-3 for the flooded chamber center', () => {
      const zone = getZoneAtPosition({ x: 0, y: -29.15, z: 0 });
      expect(zone).toBe('osiris-level-3');
    });
  });

  describe('getAudioZone', () => {
    it('returns the zone definition by ID', () => {
      const zone = getAudioZone('gp-grand-gallery');
      expect(zone.name).toBe('Grand Gallery');
      expect(zone.reverb.decayTime).toBeGreaterThan(0);
    });

    it('throws for an unknown zone ID', () => {
      expect(() => getAudioZone('unknown' as AudioZoneId)).toThrow();
    });
  });

  describe('computeReverbParams', () => {
    it('adjusts decay time based on chamber volume', () => {
      const smallZone = AUDIO_ZONES['gp-ascending-passage'];
      const largeZone = AUDIO_ZONES['gp-grand-gallery'];
      const smallReverb = computeReverbParams(smallZone);
      const largeReverb = computeReverbParams(largeZone);
      expect(largeReverb.decayTime).toBeGreaterThan(smallReverb.decayTime);
    });

    it('scales pre-delay with chamber size', () => {
      const zone = AUDIO_ZONES['gp-grand-gallery'];
      const reverb = computeReverbParams(zone);
      expect(reverb.preDelay).toBeGreaterThan(zone.reverb.preDelay);
    });

    it('preserves diffusion and wet mix from base config', () => {
      const zone = AUDIO_ZONES['gp-kings-chamber'];
      const reverb = computeReverbParams(zone);
      expect(reverb.diffusion).toBe(zone.reverb.diffusion);
      expect(reverb.wetMix).toBe(zone.reverb.wetMix);
    });
  });

  describe('computeSpatialAudio', () => {
    const listener = { x: 0, y: 0, z: 0 };
    const forward = { x: 0, y: 0, z: -1 };

    it('returns center pan and full attenuation for a source at the listener', () => {
      const source: AudioSource = { position: { x: 0, y: 0, z: 0 }, volume: 1 };
      const params = computeSpatialAudio(source, listener, forward, 50);
      expect(params.pan).toBeCloseTo(0, 5);
      expect(params.attenuation).toBeCloseTo(1, 5);
    });

    it('attenuates with distance', () => {
      const near: AudioSource = { position: { x: 0, y: 0, z: -5 }, volume: 1 };
      const far: AudioSource = { position: { x: 0, y: 0, z: -40 }, volume: 1 };
      const nearParams = computeSpatialAudio(near, listener, forward, 50);
      const farParams = computeSpatialAudio(far, listener, forward, 50);
      expect(nearParams.attenuation).toBeGreaterThan(farParams.attenuation);
    });

    it('computes pan based on source direction relative to listener forward', () => {
      const rightSource: AudioSource = { position: { x: 10, y: 0, z: 0 }, volume: 1 };
      const params = computeSpatialAudio(rightSource, listener, forward, 50);
      // With forward = -Z, right vector = (forward.z, 0, -forward.x) = (-1, 0, 0)
      // Source dir = (1, 0, 0), pan = (1 * -1) / 1 = -1
      expect(params.pan).toBeLessThan(0);
    });

    it('enables HRTF for close sources', () => {
      const close: AudioSource = { position: { x: 2, y: 0, z: -2 }, volume: 1 };
      const params = computeSpatialAudio(close, listener, forward, 50);
      expect(params.hrtf).toBe(true);
    });

    it('disables HRTF for distant sources', () => {
      const distant: AudioSource = { position: { x: 0, y: 0, z: -45 }, volume: 1 };
      const params = computeSpatialAudio(distant, listener, forward, 50);
      expect(params.hrtf).toBe(false);
    });
  });

  describe('computeOcclusion', () => {
    it('returns 1 (no occlusion) with no walls', () => {
      const occ = computeOcclusion({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, []);
      expect(occ).toBe(1);
    });

    it('reduces occlusion factor when a wall is between source and listener', () => {
      const walls: OcclusionWall[] = [
        { center: { x: 5, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, thickness: 0.5 },
      ];
      const occ = computeOcclusion({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, walls);
      expect(occ).toBeLessThan(1);
      expect(occ).toBeGreaterThan(0);
    });

    it('returns 1 when walls are not between source and listener', () => {
      const walls: OcclusionWall[] = [
        { center: { x: 20, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, thickness: 0.5 },
      ];
      const occ = computeOcclusion({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, walls);
      expect(occ).toBe(1);
    });

    it('fully blocks with very thick walls', () => {
      const walls: OcclusionWall[] = [
        { center: { x: 5, y: 0, z: 0 }, normal: { x: 1, y: 0, z: 0 }, thickness: 10 },
      ];
      const occ = computeOcclusion({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, walls);
      expect(occ).toBeLessThan(1e-10);
    });
  });

  describe('generateAmbience', () => {
    it('generates ambience state for each layer in the zone', () => {
      const zone = AUDIO_ZONES['osiris-level-3'];
      const ambience = generateAmbience(zone);
      expect(ambience.length).toBe(zone.ambience.length);
      for (const state of ambience) {
        expect(state.volume).toBeGreaterThanOrEqual(0);
        expect(state.volume).toBeLessThanOrEqual(1);
      }
    });

    it('water-dripping has a non-zero loop interval', () => {
      const zone = AUDIO_ZONES['osiris-level-2'];
      const ambience = generateAmbience(zone);
      const dripping = ambience.find((a) => a.layer === 'water-dripping');
      expect(dripping).toBeDefined();
      expect(dripping!.interval).toBeGreaterThan(0);
    });
  });

  describe('computeDynamicMix', () => {
    it('returns full weight for the active zone when inside it', () => {
      const mix = computeDynamicMix({ x: 7.22, y: 45.88, z: 11.02 }, 0.8);
      expect(mix.activeZone).toBe('gp-kings-chamber');
      expect(mix.activeWeight).toBe(1);
      expect(mix.masterVolume).toBe(0.8);
    });

    it('returns reduced weight when outside all zones', () => {
      const mix = computeDynamicMix({ x: 500, y: 500, z: 500 }, 0.8);
      expect(mix.activeWeight).toBeLessThan(1);
      expect(mix.activeZone).toBeDefined();
    });
  });
});
