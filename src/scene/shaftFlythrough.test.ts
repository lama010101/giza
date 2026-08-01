import { describe, it, expect } from 'vitest';
import {
  SHAFT_PATHS,
  DEFAULT_SAFETY_MARGIN,
  catmullRomInterpolate,
  samplePath,
  sampleSpeed,
  isPositionSafe,
  enforceCollisionAvoidance,
  generateKeyframes,
  createController,
  play,
  pause,
  stop,
  toggleReverse,
  setSpeed,
  advance,
  getControllerCamera,
  estimatePathLength,
  getAllPaths,
  getPath,
  type ShaftId,
  type FlythroughPath,
  type Vector3,
} from './shaftFlythrough';
import { DEFAULT_CONSTRAINTS } from './cameraConstraints';

function makePath(overrides?: Partial<FlythroughPath>): FlythroughPath {
  return {
    id: 'descending-passage',
    name: 'Test Passage',
    shaftRadius: 1.0,
    waypoints: [
      { position: { x: 0, y: 0, z: 0 }, lookAt: { x: 0, y: 0, z: 1 }, speed: 2 },
      { position: { x: 0, y: 0, z: 5 }, lookAt: { x: 0, y: 0, z: 6 }, speed: 2 },
      { position: { x: 0, y: 0, z: 10 }, lookAt: { x: 0, y: 0, z: 11 }, speed: 1 },
    ],
    ...overrides,
  };
}

describe('Shaft Flythrough (M11-T15)', () => {
  describe('path definitions', () => {
    it('defines all five shaft paths', () => {
      const ids: ShaftId[] = [
        'descending-passage',
        'ascending-passage',
        'well-shaft',
        'kings-chamber-north',
        'kings-chamber-south',
      ];
      for (const id of ids) {
        expect(SHAFT_PATHS[id]).toBeDefined();
        expect(SHAFT_PATHS[id].waypoints.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('each path has waypoints with position, lookAt, and speed', () => {
      const paths = getAllPaths();
      expect(paths.length).toBe(5);
      for (const path of paths) {
        for (const wp of path.waypoints) {
          expect(wp.position).toBeDefined();
          expect(wp.lookAt).toBeDefined();
          expect(typeof wp.speed).toBe('number');
          expect(wp.speed).toBeGreaterThan(0);
        }
        expect(path.shaftRadius).toBeGreaterThan(0);
      }
    });

    it('getPath returns a path by id', () => {
      const path = getPath('well-shaft');
      expect(path.id).toBe('well-shaft');
      expect(path.name).toBe('Well Shaft');
    });
  });

  describe('Catmull-Rom interpolation', () => {
    it('interpolates between control points', () => {
      const points: Vector3[] = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 10 },
      ];
      const mid = catmullRomInterpolate(points, 0.5);
      expect(mid.z).toBeCloseTo(5, 1);
    });

    it('clamps t to [0, 1]', () => {
      const points: Vector3[] = [
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: 10 },
      ];
      const before = catmullRomInterpolate(points, -0.5);
      const after = catmullRomInterpolate(points, 1.5);
      expect(before.z).toBeCloseTo(0, 1);
      expect(after.z).toBeCloseTo(10, 1);
    });

    it('samplePath returns position and lookAt', () => {
      const path = makePath();
      const sample = samplePath(path, 0.5);
      expect(sample.position).toBeDefined();
      expect(sample.lookAt).toBeDefined();
      expect(sample.position.z).toBeCloseTo(5, 0);
    });

    it('sampleSpeed blends waypoint speeds linearly', () => {
      const path = makePath();
      const speedMid = sampleSpeed(path, 0.5);
      const speedStart = sampleSpeed(path, 0);
      const speedEnd = sampleSpeed(path, 1);
      expect(speedStart).toBe(2);
      expect(speedEnd).toBe(1);
      expect(speedMid).toBeCloseTo(2, 5);
    });
  });

  describe('collision avoidance', () => {
    it('isPositionSafe returns true for centre-line positions', () => {
      const path = makePath({ shaftRadius: 1.0 });
      const safe = isPositionSafe(path, { x: 0, y: 0, z: 5 }, 0.15);
      expect(safe).toBe(true);
    });

    it('enforceCollisionAvoidance clamps position within shaft radius', () => {
      const path = makePath({ shaftRadius: 1.0 });
      const candidate: Vector3 = { x: 5, y: 0, z: 5 };
      const corrected = enforceCollisionAvoidance(path, candidate, 0.5, DEFAULT_CONSTRAINTS, 0.15);
      const dx = corrected.x - 0;
      const dist = Math.abs(dx);
      expect(dist).toBeLessThanOrEqual(path.shaftRadius - DEFAULT_SAFETY_MARGIN + 0.01);
    });

    it('enforceCollisionAvoidance respects camera height constraints', () => {
      const path = makePath();
      const candidate: Vector3 = { x: 0, y: -500, z: 5 };
      const corrected = enforceCollisionAvoidance(path, candidate, 0.5, DEFAULT_CONSTRAINTS, 0.15);
      expect(corrected.y).toBeGreaterThanOrEqual(DEFAULT_CONSTRAINTS.minHeight);
    });
  });

  describe('keyframe generation', () => {
    it('generates the requested number of keyframes', () => {
      const path = makePath();
      const keyframes = generateKeyframes(path, 10, 'normal');
      expect(keyframes).toHaveLength(10);
    });

    it('keyframes have increasing timestamps', () => {
      const path = makePath();
      const keyframes = generateKeyframes(path, 5, 'normal');
      for (let i = 1; i < keyframes.length; i++) {
        expect(keyframes[i].time).toBeGreaterThanOrEqual(keyframes[i - 1].time);
      }
    });

    it('fast preset produces shorter total duration than slow', () => {
      const path = makePath();
      const slow = generateKeyframes(path, 10, 'slow');
      const fast = generateKeyframes(path, 10, 'fast');
      const slowDur = slow[slow.length - 1].time;
      const fastDur = fast[fast.length - 1].time;
      expect(fastDur).toBeLessThan(slowDur);
    });
  });

  describe('playback controls', () => {
    it('createController initialises in stopped state', () => {
      const ctrl = createController('descending-passage');
      expect(ctrl.state).toBe('stopped');
      expect(ctrl.progress).toBe(0);
      expect(ctrl.speedPreset).toBe('normal');
      expect(ctrl.reversed).toBe(false);
    });

    it('play sets state to playing', () => {
      const ctrl = createController('descending-passage');
      expect(play(ctrl).state).toBe('playing');
    });

    it('pause sets state to paused and retains progress', () => {
      let ctrl = createController('descending-passage');
      ctrl = play(ctrl);
      ctrl = { ...ctrl, progress: 0.5 };
      ctrl = pause(ctrl);
      expect(ctrl.state).toBe('paused');
      expect(ctrl.progress).toBe(0.5);
    });

    it('stop resets progress and state', () => {
      let ctrl = createController('descending-passage');
      ctrl = play(ctrl);
      ctrl = { ...ctrl, progress: 0.7, reversed: true };
      ctrl = stop(ctrl);
      expect(ctrl.state).toBe('stopped');
      expect(ctrl.progress).toBe(0);
      expect(ctrl.reversed).toBe(false);
    });

    it('toggleReverse flips the reversed flag', () => {
      let ctrl = createController('descending-passage');
      expect(ctrl.reversed).toBe(false);
      ctrl = toggleReverse(ctrl);
      expect(ctrl.reversed).toBe(true);
      ctrl = toggleReverse(ctrl);
      expect(ctrl.reversed).toBe(false);
    });

    it('setSpeed updates the speed preset', () => {
      const ctrl = createController('descending-passage');
      expect(setSpeed(ctrl, 'fast').speedPreset).toBe('fast');
    });

    it('advance updates progress when playing', () => {
      let ctrl = createController('descending-passage');
      ctrl = play(ctrl);
      ctrl = advance(ctrl, 0.1);
      expect(ctrl.progress).toBeGreaterThan(0);
      expect(ctrl.elapsed).toBeGreaterThan(0);
    });

    it('advance does nothing when not playing', () => {
      let ctrl = createController('descending-passage');
      ctrl = advance(ctrl, 1.0);
      expect(ctrl.progress).toBe(0);
    });

    it('advance stops at end of path', () => {
      let ctrl = createController('descending-passage');
      ctrl = play(ctrl);
      ctrl = { ...ctrl, progress: 0.99 };
      ctrl = advance(ctrl, 10);
      expect(ctrl.progress).toBe(1);
      expect(ctrl.state).toBe('stopped');
    });

    it('advance in reverse stops at start', () => {
      let ctrl = createController('descending-passage');
      ctrl = play(ctrl);
      ctrl = toggleReverse(ctrl);
      ctrl = { ...ctrl, progress: 0.01 };
      ctrl = advance(ctrl, 10);
      expect(ctrl.progress).toBe(0);
      expect(ctrl.state).toBe('stopped');
    });
  });

  describe('getControllerCamera', () => {
    it('returns safe camera position and lookAt', () => {
      let ctrl = createController('descending-passage');
      ctrl = play(ctrl);
      ctrl = advance(ctrl, 0.05);
      const cam = getControllerCamera(ctrl, DEFAULT_CONSTRAINTS, 0.15);
      expect(cam.position).toBeDefined();
      expect(cam.lookAt).toBeDefined();
      expect(typeof cam.position.x).toBe('number');
    });
  });

  describe('estimatePathLength', () => {
    it('computes total segment distance', () => {
      const path = makePath();
      const length = estimatePathLength(path);
      expect(length).toBeCloseTo(10, 1);
    });
  });
});
