/**
 * Camera collision and movement constraints per GIZA - 04 §6.13–6.14.
 *
 * Implements:
 *   - Slope limits (prevent walking up surfaces steeper than maxSlope)
 *   - Acceleration and inertia (smooth velocity changes)
 *   - Collision avoidance (bounding box clamping)
 *   - Adjustable FOV
 *   - Minimized near clip for close-up inspection
 */

import * as THREE from 'three';

export interface CameraConstraints {
  minHeight: number;
  maxHeight: number;
  maxSlope: number; // degrees
  collisionRadius: number; // meters
  acceleration: number; // m/s²
  deceleration: number; // m/s²
  maxSpeed: number; // m/s
  fov: number;
  nearClip: number;
  farClip: number;
}

export const DEFAULT_CONSTRAINTS: CameraConstraints = {
  minHeight: -30.65,
  maxHeight: 200,
  maxSlope: 45,
  collisionRadius: 0.5,
  acceleration: 15,
  deceleration: 20,
  maxSpeed: 5,
  fov: 60,
  nearClip: 0.05,
  farClip: 2000,
};

export const RESEARCH_CONSTRAINTS: CameraConstraints = {
  ...DEFAULT_CONSTRAINTS,
  maxSpeed: 2,
  acceleration: 8,
  deceleration: 12,
  fov: 45,
  nearClip: 0.01,
};

export const FLY_CONSTRAINTS: CameraConstraints = {
  ...DEFAULT_CONSTRAINTS,
  minHeight: -100,
  maxHeight: 500,
  maxSpeed: 12,
  acceleration: 25,
  deceleration: 15,
  collisionRadius: 0,
};

/**
 * Applies acceleration to current velocity toward target direction.
 * Returns new velocity vector.
 */
export function applyAcceleration(
  currentVelocity: THREE.Vector3,
  targetDirection: THREE.Vector3,
  constraints: CameraConstraints,
  delta: number,
): THREE.Vector3 {
  const target = targetDirection.clone().multiplyScalar(constraints.maxSpeed);

  // Accelerate toward target
  const diff = target.clone().sub(currentVelocity);
  const accel = constraints.acceleration * delta;
  if (diff.length() <= accel) {
    return target;
  }
  diff.normalize().multiplyScalar(accel);
  return currentVelocity.clone().add(diff);
}

/**
 * Applies deceleration when no input is given.
 */
export function applyDeceleration(
  currentVelocity: THREE.Vector3,
  constraints: CameraConstraints,
  delta: number,
): THREE.Vector3 {
  const speed = currentVelocity.length();
  if (speed === 0) return currentVelocity;

  const decel = constraints.deceleration * delta;
  if (speed <= decel) {
    return new THREE.Vector3();
  }

  return currentVelocity
    .clone()
    .normalize()
    .multiplyScalar(speed - decel);
}

/**
 * Clamps camera position within constraints (height limits, collision radius).
 */
export function clampCameraPosition(
  position: THREE.Vector3,
  constraints: CameraConstraints,
): THREE.Vector3 {
  const clamped = position.clone();
  clamped.y = Math.max(constraints.minHeight, Math.min(constraints.maxHeight, clamped.y));
  return clamped;
}

/**
 * Checks if a slope angle is within the allowed limit.
 */
export function isSlopeAllowed(slopeDegrees: number, constraints: CameraConstraints): boolean {
  return slopeDegrees <= constraints.maxSlope;
}

/**
 * Calculates slope angle from a surface normal.
 */
export function slopeFromNormal(normal: THREE.Vector3): number {
  const up = new THREE.Vector3(0, 1, 0);
  const angle = normal.angleTo(up);
  return (angle * 180) / Math.PI;
}

/**
 * Applies camera constraints to a Three.js camera (FOV, near/far clip).
 */
export function applyCameraSettings(
  camera: THREE.PerspectiveCamera,
  constraints: CameraConstraints,
): void {
  camera.fov = constraints.fov;
  camera.near = constraints.nearClip;
  camera.far = constraints.farClip;
  camera.updateProjectionMatrix();
}
