/**
 * Shaft flythrough interaction system per M11-T15.
 *
 * Provides guided camera flythrough paths along the Great Pyramid shafts:
 *   - Descending Passage
 *   - Ascending Passage
 *   - Well Shaft
 *   - King's Chamber Shafts (northern + southern)
 *
 * Each path is a series of waypoints (position, look-at, speed) interpolated
 * via a Catmull-Rom spline for smooth camera motion. The system supports
 * play/pause/stop/reverse controls, variable speed presets, collision
 * avoidance with shaft walls (safety margin), and keyframe generation for
 * animation pipelines.
 *
 * Integrates with camera constraints (GIZA-04 §6.13–6.14) so that flythrough
 * positions never violate shaft geometry.
 */

import type { CameraConstraints } from '@/scene/cameraConstraints';
import { clampCameraPosition } from '@/scene/cameraConstraints';
import * as THREE from 'three';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface FlythroughWaypoint {
  position: Vector3;
  lookAt: Vector3;
  speed: number; // m/s at this waypoint
}

export type ShaftId =
  | 'descending-passage'
  | 'ascending-passage'
  | 'well-shaft'
  | 'kings-chamber-north'
  | 'kings-chamber-south';

export interface FlythroughPath {
  id: ShaftId;
  name: string;
  waypoints: FlythroughWaypoint[];
  /** Half-width of the shaft interior in metres (for collision margin). */
  shaftRadius: number;
}

export type PlaybackState = 'stopped' | 'playing' | 'paused';

export type SpeedPreset = 'slow' | 'normal' | 'fast';

export interface CameraKeyframe {
  time: number; // seconds from start
  position: Vector3;
  lookAt: Vector3;
}

export interface FlythroughController {
  pathId: ShaftId;
  state: PlaybackState;
  speedPreset: SpeedPreset;
  /** Normalised progress along the path [0, 1]. */
  progress: number;
  /** Whether the flythrough is traversing in reverse. */
  reversed: boolean;
  /** Elapsed simulation time in seconds. */
  elapsed: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const SPEED_MULTIPLIERS: Record<SpeedPreset, number> = {
  slow: 0.5,
  normal: 1.0,
  fast: 2.0,
};

/** Default safety margin from shaft walls in metres. */
export const DEFAULT_SAFETY_MARGIN = 0.15;

/**
 * Predefined flythrough paths for the Great Pyramid shafts.
 *
 * Coordinates use the project's internal coordinate system (metres, origin
 * at pyramid centre base). Values are approximate and derived from survey
 * data; they exist to demonstrate the flythrough system, not to assert
 * exact geometry.
 */
export const SHAFT_PATHS: Record<ShaftId, FlythroughPath> = {
  'descending-passage': {
    id: 'descending-passage',
    name: 'Descending Passage',
    shaftRadius: 0.55,
    waypoints: [
      {
        position: { x: 0, y: 0, z: 0 },
        lookAt: { x: 0, y: -20, z: 30 },
        speed: 2,
      },
      {
        position: { x: 0, y: -10, z: 15 },
        lookAt: { x: 0, y: -25, z: 35 },
        speed: 2,
      },
      {
        position: { x: 0, y: -20, z: 28 },
        lookAt: { x: 0, y: -28, z: 38 },
        speed: 1.5,
      },
      {
        position: { x: 0, y: -28, z: 38 },
        lookAt: { x: 0, y: -30, z: 40 },
        speed: 1,
      },
    ],
  },
  'ascending-passage': {
    id: 'ascending-passage',
    name: 'Ascending Passage',
    shaftRadius: 0.55,
    waypoints: [
      {
        position: { x: 0, y: -28, z: 38 },
        lookAt: { x: 0, y: -20, z: 30 },
        speed: 1.5,
      },
      {
        position: { x: 0, y: -15, z: 28 },
        lookAt: { x: 0, y: -5, z: 18 },
        speed: 2,
      },
      {
        position: { x: 0, y: 0, z: 18 },
        lookAt: { x: 0, y: 10, z: 8 },
        speed: 2,
      },
      {
        position: { x: 0, y: 15, z: 8 },
        lookAt: { x: 0, y: 25, z: 0 },
        speed: 1.5,
      },
    ],
  },
  'well-shaft': {
    id: 'well-shaft',
    name: 'Well Shaft',
    shaftRadius: 0.4,
    waypoints: [
      {
        position: { x: 0, y: -20, z: 30 },
        lookAt: { x: 0, y: -28, z: 28 },
        speed: 1,
      },
      {
        position: { x: 0.5, y: -25, z: 28 },
        lookAt: { x: 0.5, y: -30, z: 28 },
        speed: 1,
      },
      {
        position: { x: 1, y: -29, z: 28 },
        lookAt: { x: 1, y: -30.5, z: 28 },
        speed: 0.8,
      },
      {
        position: { x: 1, y: -30.5, z: 30 },
        lookAt: { x: 1, y: -30.65, z: 32 },
        speed: 0.8,
      },
    ],
  },
  'kings-chamber-north': {
    id: 'kings-chamber-north',
    name: "King's Chamber - Northern Shaft",
    shaftRadius: 0.11,
    waypoints: [
      {
        position: { x: 0, y: 43, z: 5 },
        lookAt: { x: 0, y: 45, z: -5 },
        speed: 0.5,
      },
      {
        position: { x: 0, y: 48, z: -2 },
        lookAt: { x: 0, y: 52, z: -8 },
        speed: 0.5,
      },
      {
        position: { x: 0, y: 55, z: -8 },
        lookAt: { x: 0, y: 60, z: -12 },
        speed: 0.4,
      },
      {
        position: { x: 0, y: 62, z: -12 },
        lookAt: { x: 0, y: 65, z: -15 },
        speed: 0.4,
      },
    ],
  },
  'kings-chamber-south': {
    id: 'kings-chamber-south',
    name: "King's Chamber - Southern Shaft",
    shaftRadius: 0.11,
    waypoints: [
      {
        position: { x: 0, y: 43, z: 5 },
        lookAt: { x: 0, y: 45, z: 15 },
        speed: 0.5,
      },
      {
        position: { x: 0, y: 48, z: 12 },
        lookAt: { x: 0, y: 52, z: 18 },
        speed: 0.5,
      },
      {
        position: { x: 0, y: 55, z: 18 },
        lookAt: { x: 0, y: 60, z: 22 },
        speed: 0.4,
      },
      {
        position: { x: 0, y: 62, z: 22 },
        lookAt: { x: 0, y: 65, z: 25 },
        speed: 0.4,
      },
    ],
  },
};

// ─── Spline interpolation ──────────────────────────────────────────────────

/**
 * Catmull-Rom spline interpolation for a list of Vector3 control points.
 *
 * @param points Control points (at least 2).
 * @param t Normalised parameter in [0, 1] across the whole spline.
 * @returns Interpolated position.
 */
export function catmullRomInterpolate(points: Vector3[], t: number): Vector3 {
  if (points.length < 2) {
    return points[0] ? { ...points[0] } : { x: 0, y: 0, z: 0 };
  }

  const clamped = Math.max(0, Math.min(1, t));
  const segments = points.length - 1;
  const scaled = clamped * segments;
  const segIndex = Math.min(Math.floor(scaled), segments - 1);
  const localT = scaled - segIndex;

  const p0 = points[Math.max(0, segIndex - 1)];
  const p1 = points[segIndex];
  const p2 = points[segIndex + 1];
  const p3 = points[Math.min(points.length - 1, segIndex + 2)];

  const t2 = localT * localT;
  const t3 = t2 * localT;

  const blend = (a: number, b: number, c: number, d: number): number =>
    0.5 *
    (2 * b + (c - a) * localT + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - 3 * c - a + d) * t3);

  return {
    x: blend(p0.x, p1.x, p2.x, p3.x),
    y: blend(p0.y, p1.y, p2.y, p3.y),
    z: blend(p0.z, p1.z, p2.z, p3.z),
  };
}

/**
 * Interpolates both position and look-at along a path at parameter t.
 */
export function samplePath(
  path: FlythroughPath,
  t: number,
): { position: Vector3; lookAt: Vector3 } {
  const positions = path.waypoints.map((w) => w.position);
  const lookAts = path.waypoints.map((w) => w.lookAt);
  return {
    position: catmullRomInterpolate(positions, t),
    lookAt: catmullRomInterpolate(lookAts, t),
  };
}

/**
 * Returns the interpolated speed at parameter t by linearly blending
 * the speeds of the two nearest waypoints.
 */
export function sampleSpeed(path: FlythroughPath, t: number): number {
  const waypoints = path.waypoints;
  if (waypoints.length === 0) return 0;
  if (waypoints.length === 1) return waypoints[0].speed;

  const clamped = Math.max(0, Math.min(1, t));
  const segments = waypoints.length - 1;
  const scaled = clamped * segments;
  const segIndex = Math.min(Math.floor(scaled), segments - 1);
  const localT = scaled - segIndex;

  const s1 = waypoints[segIndex].speed;
  const s2 = waypoints[segIndex + 1].speed;
  return s1 + (s2 - s1) * localT;
}

// ─── Collision avoidance ───────────────────────────────────────────────────

/**
 * Checks whether a position is within the shaft radius plus a safety margin
 * of the path centre-line at parameter t.
 *
 * @param path The flythrough path defining the shaft centre-line.
 * @param position The candidate camera position.
 * @param safetyMargin Additional margin from the shaft wall in metres.
 * @returns True if the position is safe (within the shaft + margin).
 */
export function isPositionSafe(
  path: FlythroughPath,
  position: Vector3,
  safetyMargin = DEFAULT_SAFETY_MARGIN,
): boolean {
  // Find the closest centre-line waypoint to the candidate position.
  let minDist = Infinity;
  for (const wp of path.waypoints) {
    const dx = wp.position.x - position.x;
    const dy = wp.position.y - position.y;
    const dz = wp.position.z - position.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < minDist) minDist = dist;
  }
  const allowedRadius = path.shaftRadius - safetyMargin;
  return minDist <= allowedRadius + path.shaftRadius;
}

/**
 * Enforces collision avoidance by clamping a candidate position toward the
 * nearest path centre-line sample if it would breach the safety margin.
 *
 * Also applies camera constraints (height limits) from the constraint system.
 */
export function enforceCollisionAvoidance(
  path: FlythroughPath,
  candidate: Vector3,
  t: number,
  constraints: CameraConstraints,
  safetyMargin = DEFAULT_SAFETY_MARGIN,
): Vector3 {
  const centre = samplePath(path, t).position;
  const dx = candidate.x - centre.x;
  const dy = candidate.y - centre.y;
  const dz = candidate.z - centre.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const maxRadius = path.shaftRadius - safetyMargin;

  let corrected: Vector3;
  if (dist > maxRadius && dist > 0) {
    const scale = maxRadius / dist;
    corrected = {
      x: centre.x + dx * scale,
      y: centre.y + dy * scale,
      z: centre.z + dz * scale,
    };
  } else {
    corrected = { ...candidate };
  }

  // Apply height constraints from the camera constraint system.
  const clamped = clampCameraPosition(
    new THREE.Vector3(corrected.x, corrected.y, corrected.z),
    constraints,
  );
  return { x: clamped.x, y: clamped.y, z: clamped.z };
}

// ─── Keyframe generation ───────────────────────────────────────────────────

/**
 * Generates a set of camera keyframes for the given path.
 *
 * @param path The flythrough path.
 * @param count Number of keyframes to generate (evenly spaced).
 * @param speedPreset Speed multiplier applied to waypoint speeds.
 * @returns Array of keyframes with absolute timestamps.
 */
export function generateKeyframes(
  path: FlythroughPath,
  count: number,
  speedPreset: SpeedPreset = 'normal',
): CameraKeyframe[] {
  if (count < 2) {
    const sample = samplePath(path, 0);
    return [{ time: 0, position: sample.position, lookAt: sample.lookAt }];
  }

  const keyframes: CameraKeyframe[] = [];
  const multiplier = SPEED_MULTIPLIERS[speedPreset];
  let elapsed = 0;

  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const sample = samplePath(path, t);
    keyframes.push({
      time: elapsed,
      position: sample.position,
      lookAt: sample.lookAt,
    });

    if (i < count - 1) {
      const nextT = (i + 1) / (count - 1);
      const segSpeed = sampleSpeed(path, (t + nextT) / 2) * multiplier;
      const segSample = samplePath(path, nextT);
      const dx = segSample.position.x - sample.position.x;
      const dy = segSample.position.y - sample.position.y;
      const dz = segSample.position.z - sample.position.z;
      const segLength = Math.sqrt(dx * dx + dy * dy + dz * dz);
      elapsed += segSpeed > 0 ? segLength / segSpeed : 0;
    }
  }

  return keyframes;
}

// ─── Playback controller ───────────────────────────────────────────────────

/**
 * Creates a new flythrough controller for the given shaft.
 */
export function createController(pathId: ShaftId): FlythroughController {
  return {
    pathId,
    state: 'stopped',
    speedPreset: 'normal',
    progress: 0,
    reversed: false,
    elapsed: 0,
  };
}

/**
 * Starts or resumes playback.
 */
export function play(controller: FlythroughController): FlythroughController {
  return { ...controller, state: 'playing' };
}

/**
 * Pauses playback (retains progress).
 */
export function pause(controller: FlythroughController): FlythroughController {
  return { ...controller, state: 'paused' };
}

/**
 * Stops playback and resets progress to the start.
 */
export function stop(controller: FlythroughController): FlythroughController {
  return { ...controller, state: 'stopped', progress: 0, elapsed: 0, reversed: false };
}

/**
 * Toggles reverse direction.
 */
export function toggleReverse(controller: FlythroughController): FlythroughController {
  return { ...controller, reversed: !controller.reversed };
}

/**
 * Sets the speed preset.
 */
export function setSpeed(
  controller: FlythroughController,
  preset: SpeedPreset,
): FlythroughController {
  return { ...controller, speedPreset: preset };
}

/**
 * Advances the controller by a time delta, updating progress and elapsed time.
 *
 * Progress wraps around when reaching either end (depending on direction).
 */
export function advance(controller: FlythroughController, delta: number): FlythroughController {
  if (controller.state !== 'playing') return controller;

  const path = SHAFT_PATHS[controller.pathId];
  const multiplier = SPEED_MULTIPLIERS[controller.speedPreset];
  const currentSpeed = sampleSpeed(path, controller.progress) * multiplier;

  // Estimate distance-based progress: convert speed (m/s) to t/s using
  // approximate total path length.
  const totalLength = estimatePathLength(path);
  const dProgress = totalLength > 0 ? (currentSpeed * delta) / totalLength : 0;

  let newProgress = controller.reversed
    ? controller.progress - dProgress
    : controller.progress + dProgress;

  // Clamp / wrap
  if (newProgress >= 1) {
    newProgress = 1;
    return {
      ...controller,
      progress: newProgress,
      state: 'stopped',
      elapsed: controller.elapsed + delta,
    };
  }
  if (newProgress <= 0) {
    newProgress = 0;
    return {
      ...controller,
      progress: newProgress,
      state: 'stopped',
      elapsed: controller.elapsed + delta,
    };
  }

  return {
    ...controller,
    progress: newProgress,
    elapsed: controller.elapsed + delta,
  };
}

/**
 * Returns the current camera position and look-at for a controller.
 */
export function getControllerCamera(
  controller: FlythroughController,
  constraints: CameraConstraints,
  safetyMargin = DEFAULT_SAFETY_MARGIN,
): { position: Vector3; lookAt: Vector3 } {
  const path = SHAFT_PATHS[controller.pathId];
  const sample = samplePath(path, controller.progress);
  const safePosition = enforceCollisionAvoidance(
    path,
    sample.position,
    controller.progress,
    constraints,
    safetyMargin,
  );
  return { position: safePosition, lookAt: sample.lookAt };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Estimates the total arc length of a path by summing segment distances.
 */
export function estimatePathLength(path: FlythroughPath): number {
  const waypoints = path.waypoints;
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    const a = waypoints[i - 1].position;
    const b = waypoints[i].position;
    total += Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2 + (b.z - a.z) ** 2);
  }
  return total;
}

/**
 * Returns all available shaft path definitions.
 */
export function getAllPaths(): FlythroughPath[] {
  return Object.values(SHAFT_PATHS);
}

/**
 * Returns a shaft path by ID.
 */
export function getPath(id: ShaftId): FlythroughPath {
  return SHAFT_PATHS[id];
}
