import { describe, it, expect, beforeEach } from 'vitest';
import { debugOverlay, ALL_DEBUG_DISPLAYS, type DebugDisplay } from './debugOverlay';

describe('Debug Overlay (M04-T07)', () => {
  beforeEach(() => {
    debugOverlay._resetForTesting();
  });

  describe('ALL_DEBUG_DISPLAYS', () => {
    it('has 11 debug displays', () => {
      expect(ALL_DEBUG_DISPLAYS).toHaveLength(11);
    });

    it('includes all expected displays', () => {
      const expected: DebugDisplay[] = [
        'fps',
        'draw-calls',
        'triangles',
        'memory',
        'scene-stats',
        'lod-distribution',
        'bounding-boxes',
        'wireframe',
        'normals',
        'texcoords',
        'evidence-coverage',
      ];
      for (const display of expected) {
        expect(ALL_DEBUG_DISPLAYS).toContain(display);
      }
    });
  });

  describe('setEnabled', () => {
    it('enables the overlay', () => {
      debugOverlay.setEnabled(true);
      expect(debugOverlay.isEnabled()).toBe(true);
    });

    it('disables the overlay', () => {
      debugOverlay.setEnabled(true);
      debugOverlay.setEnabled(false);
      expect(debugOverlay.isEnabled()).toBe(false);
    });
  });

  describe('toggleDisplay', () => {
    it('toggles a display on', () => {
      debugOverlay.toggleDisplay('fps');
      expect(debugOverlay.getActiveDisplays()).toContain('fps');
    });

    it('toggles a display off', () => {
      debugOverlay.toggleDisplay('fps');
      debugOverlay.toggleDisplay('fps');
      expect(debugOverlay.getActiveDisplays()).not.toContain('fps');
    });
  });

  describe('enableAll', () => {
    it('enables all displays', () => {
      debugOverlay.enableAll();
      expect(debugOverlay.getActiveDisplays()).toHaveLength(11);
    });
  });

  describe('disableAll', () => {
    it('disables all displays', () => {
      debugOverlay.enableAll();
      debugOverlay.disableAll();
      expect(debugOverlay.getActiveDisplays()).toHaveLength(0);
    });
  });

  describe('recordFrame', () => {
    it('records frame time and calculates FPS', () => {
      debugOverlay.recordFrame(16.67);
      const stats = debugOverlay.getStats();
      expect(stats.frameTime).toBe(16.67);
      expect(stats.fps).toBe(Math.round(1000 / 16.67));
    });
  });

  describe('renderOverlay', () => {
    it('returns empty when disabled', () => {
      debugOverlay.setEnabled(false);
      expect(debugOverlay.renderOverlay()).toHaveLength(0);
    });

    it('returns lines for active displays', () => {
      debugOverlay.setEnabled(true);
      debugOverlay.updateStats({ fps: 60, drawCalls: 100, triangles: 50000 });
      debugOverlay.toggleDisplay('fps');
      debugOverlay.toggleDisplay('draw-calls');
      const lines = debugOverlay.renderOverlay();
      expect(lines.length).toBe(2);
      expect(lines[0]).toContain('FPS');
      expect(lines[1]).toContain('Draw Calls');
    });
  });
});
