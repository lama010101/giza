import { describe, it, expect } from 'vitest';
import {
  PERFORMANCE_MODE_SETTINGS,
  getPerformanceModeSettings,
  getRecommendedPerformanceMode,
  isRealtimeMode,
  estimateRunTime,
  type SimulationPerformanceMode,
} from './performanceModes';

describe('Performance Modes (M10-T11)', () => {
  describe('PERFORMANCE_MODE_SETTINGS', () => {
    it('has settings for all 4 modes', () => {
      const modes: SimulationPerformanceMode[] = ['preview', 'standard', 'research', 'offline'];
      for (const mode of modes) {
        expect(PERFORMANCE_MODE_SETTINGS[mode]).toBeDefined();
      }
    });

    it('preview has lowest fidelity', () => {
      expect(PERFORMANCE_MODE_SETTINGS.preview.meshResolution).toBe('low');
      expect(PERFORMANCE_MODE_SETTINGS.preview.particleCount).toBeLessThan(
        PERFORMANCE_MODE_SETTINGS.standard.particleCount,
      );
    });

    it('offline has highest fidelity', () => {
      expect(PERFORMANCE_MODE_SETTINGS.offline.meshResolution).toBe('ultra');
      expect(PERFORMANCE_MODE_SETTINGS.offline.particleCount).toBeGreaterThan(
        PERFORMANCE_MODE_SETTINGS.research.particleCount,
      );
    });

    it('preview and standard are realtime', () => {
      expect(PERFORMANCE_MODE_SETTINGS.preview.realtime).toBe(true);
      expect(PERFORMANCE_MODE_SETTINGS.standard.realtime).toBe(true);
    });

    it('research and offline are not realtime', () => {
      expect(PERFORMANCE_MODE_SETTINGS.research.realtime).toBe(false);
      expect(PERFORMANCE_MODE_SETTINGS.offline.realtime).toBe(false);
    });
  });

  describe('getPerformanceModeSettings', () => {
    it('returns settings for a mode', () => {
      const settings = getPerformanceModeSettings('standard');
      expect(settings.mode).toBe('standard');
      expect(settings.targetFPS).toBe(60);
    });
  });

  describe('getRecommendedPerformanceMode', () => {
    it('returns preview for low-end hardware', () => {
      expect(getRecommendedPerformanceMode(2, 'low')).toBe('preview');
    });

    it('returns standard for mid-range hardware', () => {
      expect(getRecommendedPerformanceMode(4, 'medium')).toBe('standard');
    });

    it('returns research for high-end hardware', () => {
      expect(getRecommendedPerformanceMode(8, 'ultra')).toBe('research');
    });
  });

  describe('isRealtimeMode', () => {
    it('returns true for preview', () => {
      expect(isRealtimeMode('preview')).toBe(true);
    });

    it('returns false for offline', () => {
      expect(isRealtimeMode('offline')).toBe(false);
    });
  });

  describe('estimateRunTime', () => {
    it('returns positive value', () => {
      const time = estimateRunTime('standard', 100);
      expect(time).toBeGreaterThan(0);
    });

    it('offline is slower than preview', () => {
      const previewTime = estimateRunTime('preview', 100);
      const offlineTime = estimateRunTime('offline', 100);
      expect(offlineTime).toBeGreaterThan(previewTime);
    });
  });
});
