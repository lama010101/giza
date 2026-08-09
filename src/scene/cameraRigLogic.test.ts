import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  getMovementConstraints,
  buildCameraObstacles,
  resolveSphereAabbCollision,
  applyCameraMovement,
  rejectSteepVelocity,
  getWorldMovementDirection,
  getActiveGamepad,
} from './cameraRigLogic';
import { DEFAULT_CONSTRAINTS, RESEARCH_CONSTRAINTS, FLY_CONSTRAINTS } from './cameraConstraints';

describe('cameraRigLogic', () => {
  describe('getMovementConstraints', () => {
    it('returns default constraints for Explore walk', () => {
      expect(getMovementConstraints('walk', 'Explore')).toBe(DEFAULT_CONSTRAINTS);
    });

    it('returns research constraints in Research mode', () => {
      expect(getMovementConstraints('walk', 'Research')).toBe(RESEARCH_CONSTRAINTS);
    });

    it('returns fly constraints for fly mode', () => {
      expect(getMovementConstraints('fly', 'Explore')).toBe(FLY_CONSTRAINTS);
    });
  });

  describe('buildCameraObstacles', () => {
    it('builds obstacles for the Osiris monument', () => {
      const obstacles = buildCameraObstacles('osiris', 'LOD0', []);
      expect(obstacles.length).toBeGreaterThan(0);
      expect(obstacles[0].min).toBeInstanceOf(THREE.Vector3);
      expect(obstacles[0].max).toBeInstanceOf(THREE.Vector3);
    });

    it('builds obstacles for the Great Pyramid', () => {
      const obstacles = buildCameraObstacles('great-pyramid', 'LOD0', []);
      expect(obstacles.length).toBeGreaterThan(0);
    });

    it('excludes hidden layers', () => {
      const all = buildCameraObstacles('osiris', 'LOD0', []);
      const hidden = buildCameraObstacles('osiris', 'LOD0', ['shafts']);
      expect(hidden.length).toBeLessThan(all.length);
    });

    it('excludes zero-size nodes', () => {
      const obstacles = buildCameraObstacles('great-pyramid', 'LOD0', []);
      const zeroSize = obstacles.find((o) => o.min.x === o.max.x);
      expect(zeroSize).toBeUndefined();
    });
  });

  describe('resolveSphereAabbCollision', () => {
    it('reports no collision when the sphere is outside the box', () => {
      const obstacle = {
        min: new THREE.Vector3(0, 0, 0),
        max: new THREE.Vector3(1, 1, 1),
        layer: 'test',
      };
      const position = new THREE.Vector3(2, 2, 2);
      const result = resolveSphereAabbCollision(position, 0.5, obstacle);
      expect(result.resolved).toBe(false);
    });

    it('resolves a collision and returns an upward normal for ground', () => {
      const obstacle = {
        min: new THREE.Vector3(-1, -1, -1),
        max: new THREE.Vector3(1, 0, 1),
        layer: 'test',
      };
      const position = new THREE.Vector3(0, 0.2, 0);
      const result = resolveSphereAabbCollision(position, 0.5, obstacle);
      expect(result.resolved).toBe(true);
      expect(result.position.y).toBeGreaterThan(position.y);
    });
  });

  describe('applyCameraMovement', () => {
    it('moves the camera without collision in fly mode', () => {
      const position = new THREE.Vector3(0, 0, 0);
      const velocity = new THREE.Vector3(1, 0, 0);
      const result = applyCameraMovement(position, velocity, 1, 0, [], FLY_CONSTRAINTS, 'fly');
      expect(result.position.x).toBe(1);
    });

    it('prevents intersecting an obstacle in walk mode', () => {
      const obstacle = {
        min: new THREE.Vector3(-1, -1, -1),
        max: new THREE.Vector3(1, 1, 1),
        layer: 'test',
      };
      const position = new THREE.Vector3(2, 0, 0);
      const velocity = new THREE.Vector3(-0.7, 0, 0);
      const result = applyCameraMovement(
        position,
        velocity,
        1,
        0.5,
        [obstacle],
        DEFAULT_CONSTRAINTS,
        'walk',
      );
      expect(result.position.x).toBeGreaterThan(1);
    });
  });

  describe('rejectSteepVelocity', () => {
    it('zeros velocity into a steep wall', () => {
      const velocity = new THREE.Vector3(-1, 0, 0);
      const normal = new THREE.Vector3(1, 0, 0);
      const result = rejectSteepVelocity(velocity, [normal], DEFAULT_CONSTRAINTS);
      expect(result.length()).toBe(0);
    });

    it('keeps velocity on a gentle slope', () => {
      const velocity = new THREE.Vector3(0, 1, 0);
      const normal = new THREE.Vector3(0, 1, 0);
      const result = rejectSteepVelocity(velocity, [normal], DEFAULT_CONSTRAINTS);
      expect(result.y).toBe(1);
    });
  });

  describe('getWorldMovementDirection', () => {
    it('produces a forward vector along -Z', () => {
      const q = new THREE.Quaternion();
      const dir = getWorldMovementDirection({ forward: 1, right: 0, up: 0 }, q, 'walk');
      expect(dir.z).toBeCloseTo(-1);
      expect(dir.y).toBe(0);
    });

    it('ignores vertical input in walk mode', () => {
      const q = new THREE.Quaternion();
      const dir = getWorldMovementDirection({ forward: 0, right: 0, up: 1 }, q, 'walk');
      expect(dir.y).toBe(0);
    });

    it('uses vertical input in fly mode', () => {
      const q = new THREE.Quaternion();
      const dir = getWorldMovementDirection({ forward: 0, right: 0, up: 1 }, q, 'fly');
      expect(dir.y).toBe(1);
    });
  });

  describe('getActiveGamepad', () => {
    it('returns null when navigator is unavailable or no gamepads', () => {
      expect(getActiveGamepad()).toBeNull();
    });
  });
});
