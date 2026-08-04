import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  DEFAULT_CONSTRAINTS,
  RESEARCH_CONSTRAINTS,
  FLY_CONSTRAINTS,
  applyAcceleration,
  applyDeceleration,
  clampCameraPosition,
  isSlopeAllowed,
  slopeFromNormal,
  applyCameraSettings,
} from './cameraConstraints';

describe('Camera Constraints (M07-T12)', () => {
  describe('constraint presets', () => {
    it('DEFAULT_CONSTRAINTS has sensible values', () => {
      expect(DEFAULT_CONSTRAINTS.maxSpeed).toBeGreaterThan(0);
      expect(DEFAULT_CONSTRAINTS.acceleration).toBeGreaterThan(0);
      expect(DEFAULT_CONSTRAINTS.maxSlope).toBe(45);
      expect(DEFAULT_CONSTRAINTS.fov).toBe(60);
    });

    it('RESEARCH_CONSTRAINTS is slower with tighter near clip', () => {
      expect(RESEARCH_CONSTRAINTS.maxSpeed).toBeLessThan(DEFAULT_CONSTRAINTS.maxSpeed);
      expect(RESEARCH_CONSTRAINTS.nearClip).toBeLessThan(DEFAULT_CONSTRAINTS.nearClip);
    });

    it('FLY_CONSTRAINTS has higher max height and no collision', () => {
      expect(FLY_CONSTRAINTS.maxHeight).toBeGreaterThan(DEFAULT_CONSTRAINTS.maxHeight);
      expect(FLY_CONSTRAINTS.collisionRadius).toBe(0);
    });
  });

  describe('applyAcceleration', () => {
    it('accelerates toward target direction', () => {
      const vel = new THREE.Vector3(0, 0, 0);
      const target = new THREE.Vector3(0, 0, -1);
      const result = applyAcceleration(vel, target, DEFAULT_CONSTRAINTS, 0.1);
      expect(result.length()).toBeGreaterThan(0);
      expect(result.z).toBeLessThan(0);
    });

    it('reaches target when acceleration exceeds difference', () => {
      const vel = new THREE.Vector3(0, 0, -4);
      const target = new THREE.Vector3(0, 0, -1);
      const result = applyAcceleration(vel, target, DEFAULT_CONSTRAINTS, 1);
      expect(result.z).toBe(-DEFAULT_CONSTRAINTS.maxSpeed);
    });

    it('does not exceed max speed', () => {
      const vel = new THREE.Vector3(0, 0, 0);
      const target = new THREE.Vector3(0, 0, -1);
      const result = applyAcceleration(vel, target, DEFAULT_CONSTRAINTS, 10);
      expect(result.length()).toBeLessThanOrEqual(DEFAULT_CONSTRAINTS.maxSpeed + 0.001);
    });
  });

  describe('applyDeceleration', () => {
    it('decelerates toward zero', () => {
      const vel = new THREE.Vector3(5, 0, 0);
      const result = applyDeceleration(vel, DEFAULT_CONSTRAINTS, 0.1);
      expect(result.length()).toBeLessThan(5);
    });

    it('returns zero when speed is below deceleration', () => {
      const vel = new THREE.Vector3(0.5, 0, 0);
      const result = applyDeceleration(vel, DEFAULT_CONSTRAINTS, 1);
      expect(result.length()).toBe(0);
    });

    it('returns zero for zero velocity', () => {
      const vel = new THREE.Vector3();
      const result = applyDeceleration(vel, DEFAULT_CONSTRAINTS, 0.1);
      expect(result.length()).toBe(0);
    });
  });

  describe('clampCameraPosition', () => {
    it('clamps Y to minHeight', () => {
      const pos = new THREE.Vector3(0, -100, 0);
      const result = clampCameraPosition(pos, DEFAULT_CONSTRAINTS);
      expect(result.y).toBe(DEFAULT_CONSTRAINTS.minHeight);
    });

    it('clamps Y to maxHeight', () => {
      const pos = new THREE.Vector3(0, 500, 0);
      const result = clampCameraPosition(pos, DEFAULT_CONSTRAINTS);
      expect(result.y).toBe(DEFAULT_CONSTRAINTS.maxHeight);
    });

    it('does not modify position within bounds', () => {
      const pos = new THREE.Vector3(10, 50, -20);
      const result = clampCameraPosition(pos, DEFAULT_CONSTRAINTS);
      expect(result.y).toBe(50);
    });
  });

  describe('slope limits', () => {
    it('allows slopes within limit', () => {
      expect(isSlopeAllowed(30, DEFAULT_CONSTRAINTS)).toBe(true);
      expect(isSlopeAllowed(45, DEFAULT_CONSTRAINTS)).toBe(true);
    });

    it('rejects slopes exceeding limit', () => {
      expect(isSlopeAllowed(60, DEFAULT_CONSTRAINTS)).toBe(false);
    });

    it('calculates slope from surface normal', () => {
      const flatNormal = new THREE.Vector3(0, 1, 0);
      expect(slopeFromNormal(flatNormal)).toBeCloseTo(0, 1);

      const verticalNormal = new THREE.Vector3(1, 0, 0);
      expect(slopeFromNormal(verticalNormal)).toBeCloseTo(90, 1);
    });
  });

  describe('applyCameraSettings', () => {
    it('applies FOV and clip settings to camera', () => {
      const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      applyCameraSettings(camera, RESEARCH_CONSTRAINTS);
      expect(camera.fov).toBe(RESEARCH_CONSTRAINTS.fov);
      expect(camera.near).toBe(RESEARCH_CONSTRAINTS.nearClip);
      expect(camera.far).toBe(RESEARCH_CONSTRAINTS.farClip);
    });
  });
});
