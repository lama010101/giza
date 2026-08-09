import * as THREE from 'three';
import type { CameraMode, AppMode, Monument, SceneLayer } from '@/store/app';
import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';
import { generateGreatPyramidLOD1 } from '@db/geometry/gp-lod1';
import type { CameraConstraints } from './cameraConstraints';
import {
  DEFAULT_CONSTRAINTS,
  RESEARCH_CONSTRAINTS,
  FLY_CONSTRAINTS,
  isSlopeAllowed,
  slopeFromNormal,
} from './cameraConstraints';

export interface CameraObstacle {
  min: THREE.Vector3;
  max: THREE.Vector3;
  layer: string;
}

/**
 * Returns the first connected gamepad, if any.
 */
export function getActiveGamepad(): Gamepad | null {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
    return null;
  }
  const gamepads = navigator.getGamepads();
  for (const gp of gamepads) {
    if (gp?.connected) return gp;
  }
  return null;
}

export interface CollisionResult {
  resolved: boolean;
  position: THREE.Vector3;
  normal: THREE.Vector3;
}

export interface MovementResult {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  collisions: THREE.Vector3[];
}

/**
 * Selects the movement constraints based on the active app and camera modes.
 */
export function getMovementConstraints(
  cameraMode: CameraMode,
  appMode: AppMode,
): CameraConstraints {
  if (cameraMode === 'fly') return FLY_CONSTRAINTS;
  if (appMode === 'Research') return RESEARCH_CONSTRAINTS;
  return DEFAULT_CONSTRAINTS;
}

interface HasBounds {
  position: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  layer: string;
}

/**
 * Builds a list of axis-aligned bounding boxes for the currently visible scene.
 *
 * The result is intentionally conservative (AABB, no rotation). It is used for
 * camera collision and not for rendering, so it may differ slightly from the
 * visual mesh.
 */
export function buildCameraObstacles(
  monument: Monument,
  lod: string,
  hiddenLayers: readonly SceneLayer[],
): CameraObstacle[] {
  const hidden = new Set<string>(hiddenLayers);
  const obstacles: CameraObstacle[] = [];

  const addNode = (node: HasBounds): void => {
    if (hidden.has(node.layer)) return;
    if (node.size.x === 0 || node.size.y === 0 || node.size.z === 0) return;

    const hx = node.size.x / 2;
    const hy = node.size.y / 2;
    const hz = node.size.z / 2;
    const min = new THREE.Vector3(node.position.x - hx, node.position.y - hy, node.position.z - hz);
    const max = new THREE.Vector3(node.position.x + hx, node.position.y + hy, node.position.z + hz);
    obstacles.push({ min, max, layer: node.layer });
  };

  if (monument === 'osiris') {
    osirisBlockout.nodes.forEach(addNode);
  } else {
    const source = lod === 'LOD1' ? generateGreatPyramidLOD1() : greatPyramidBlockout.nodes;
    source.forEach(addNode);
  }

  return obstacles;
}

/**
 * Resolves an intersection between a sphere and an AABB by pushing the sphere
 * center to the surface along the shortest vector.
 */
export function resolveSphereAabbCollision(
  position: THREE.Vector3,
  radius: number,
  obstacle: CameraObstacle,
): CollisionResult {
  const closest = new THREE.Vector3().copy(position).clamp(obstacle.min, obstacle.max);
  const diff = new THREE.Vector3().subVectors(position, closest);
  const distSq = diff.lengthSq();

  if (distSq === 0 || distSq >= radius * radius) {
    return { resolved: false, position: position.clone(), normal: new THREE.Vector3(0, 1, 0) };
  }

  const dist = Math.sqrt(distSq);
  const normal = dist === 0 ? new THREE.Vector3(0, 1, 0) : diff.normalize();
  const resolved = closest.clone().add(normal.clone().multiplyScalar(radius));
  return { resolved: true, position: resolved, normal };
}

/**
 * Applies a single physics step with collision resolution for walk mode.
 *
 * Fly mode skips collision and only applies height constraints.
 */
export function applyCameraMovement(
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  delta: number,
  radius: number,
  obstacles: CameraObstacle[],
  constraints: CameraConstraints,
  cameraMode: CameraMode,
): MovementResult {
  const step = velocity.clone().multiplyScalar(delta);
  const candidate = position.clone().add(step);
  const collisions: THREE.Vector3[] = [];

  if (cameraMode === 'walk') {
    for (let iteration = 0; iteration < 4; iteration++) {
      let hit = false;
      for (const obstacle of obstacles) {
        const result = resolveSphereAabbCollision(candidate, radius, obstacle);
        if (result.resolved) {
          candidate.copy(result.position);
          collisions.push(result.normal);
          hit = true;
        }
      }
      if (!hit) break;
    }
    candidate.y = Math.max(candidate.y, constraints.minHeight);
  }

  candidate.y = Math.min(Math.max(candidate.y, constraints.minHeight), constraints.maxHeight);

  return { position: candidate, velocity: velocity.clone(), collisions };
}

/**
 * Removes the component of velocity that points into any collision normal
 * whose slope is too steep to walk on.
 */
export function rejectSteepVelocity(
  velocity: THREE.Vector3,
  collisionNormals: THREE.Vector3[],
  constraints: CameraConstraints,
): THREE.Vector3 {
  const v = velocity.clone();
  for (const normal of collisionNormals) {
    const slope = slopeFromNormal(normal);
    if (!isSlopeAllowed(slope, constraints)) {
      const dot = v.dot(normal);
      if (dot < 0) {
        v.addScaledVector(normal, -dot);
      }
    }
  }
  return v;
}

/**
 * Computes a movement direction in world space from local camera-relative
 * keyboard/gamepad input.
 */
export function getWorldMovementDirection(
  input: { forward: number; right: number; up: number },
  cameraQuaternion: THREE.Quaternion,
  cameraMode: CameraMode,
): THREE.Vector3 {
  const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(cameraQuaternion);
  if (cameraMode === 'walk') forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cameraQuaternion);
  if (cameraMode === 'walk') right.y = 0;
  right.normalize();

  const up = new THREE.Vector3(0, 1, 0);

  const dir = new THREE.Vector3()
    .addScaledVector(forward, input.forward)
    .addScaledVector(right, input.right);
  if (cameraMode === 'fly') dir.addScaledVector(up, input.up);

  if (dir.lengthSq() > 0) dir.normalize();
  return dir;
}
