/**
 * Great Pyramid — Geometry Derivation Utilities
 *
 * Pure functions for computing 3D positions, rotations, and sizes
 * from raw measurement constants. No hardcoded coordinates.
 *
 * Coordinate system: +X=east, +Y=up, +Z=south, origin at pyramid centre.
 */

import type { Vector3 } from '@/schemas/location';

const DEG = Math.PI / 180;

/** Convert degrees to radians */
export function degToRad(deg: number): number {
  return deg * DEG;
}

/** Midpoint of two 3D points */
export function midpoint(a: Vector3, b: Vector3): Vector3 {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    z: (a.z + b.z) / 2,
  };
}

/**
 * Compute the endpoint of a sloped passage starting from a given point.
 * The passage slopes in the Y-Z plane (rotation around X-axis).
 * Positive angle = downward toward +Z (south).
 * Negative angle = upward toward +Z (south).
 */
export function slopedEndpoint(
  start: Vector3,
  angleDeg: number,
  length: number,
  direction: 1 | -1 = 1,
): Vector3 {
  const rad = degToRad(angleDeg);
  return {
    x: start.x,
    y: start.y - direction * length * Math.sin(rad),
    z: start.z + direction * length * Math.cos(rad),
  };
}

/**
 * 3D distance between two points.
 */
export function distance3D(a: Vector3, b: Vector3): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Derive a sloped passage box from two floor endpoints.
 * The box length (size.z) is the 3D distance between endpoints.
 * The rotation is around X, computed from the Y-Z slope.
 * The box center is offset from the floor midpoint by half the height in the
 * perpendicular direction (so the floor face aligns with the endpoints).
 */
export function slopedBoxFromFloorEndpoints(
  start: Vector3,
  end: Vector3,
  width: number,
  height: number,
): { position: Vector3; rotation: Vector3; size: Vector3 } {
  const len = distance3D(start, end);
  const dy = end.y - start.y;
  const dz = end.z - start.z;

  // Direction of the floor centreline in the Y-Z plane.
  // For north-going features dz < 0; for south-going dz > 0.
  // The perpendicular that points upward in world Y is used to offset the box
  // centre from the floor midpoint.
  const yDir = len > 1e-9 ? dy / len : 0;
  const zDir = len > 1e-9 ? dz / len : 0;
  const upY = Math.abs(zDir);
  const upZ = -Math.sign(dz || 1) * yDir;
  const upLen = Math.hypot(upY, upZ);
  const safeUpLen = upLen > 1e-9 ? upLen : 1;

  // Three.js X-rotation maps local +Z to (0, -sin(rx), cos(rx)).
  // We choose rx so that local +Y points upward and the box spans the
  // start/end segment. This makes the floor face (local y = -h/2) sit on
  // the supplied endpoints.
  const rx = Math.atan2(-Math.sign(dz || 1) * yDir, Math.abs(zDir));

  const floorMid = midpoint(start, end);
  const halfH = height / 2;
  return {
    position: {
      x: floorMid.x,
      y: floorMid.y + (upY / safeUpLen) * halfH,
      z: floorMid.z + (upZ / safeUpLen) * halfH,
    },
    rotation: { x: rx, y: 0, z: 0 },
    size: { x: width, y: height, z: len },
  };
}

/**
 * Compute the center position of a sloped box from its two endpoints.
 * The center is the midpoint of the start and end points.
 */
export function slopedBoxCenter(start: Vector3, end: Vector3): Vector3 {
  return midpoint(start, end);
}

/**
 * Compute the rotation for a sloped element.
 * Positive angle (e.g., descending passage) → positive rotation.x (slopes down toward +Z).
 * Negative angle (e.g., ascending passage) → negative rotation.x (slopes up toward +Z).
 */
export function slopedBoxRotation(angleDeg: number): Vector3 {
  return { x: degToRad(angleDeg), y: 0, z: 0 };
}

/**
 * Compute the center of a horizontal (non-sloped) element from its start point and length.
 * The element extends in the +Z direction.
 */
export function horizontalCenter(start: Vector3, length: number): Vector3 {
  return {
    x: start.x,
    y: start.y,
    z: start.z + length / 2,
  };
}

/**
 * Compute the center Y of a chamber given its floor Y and height.
 */
export function chamberCenterY(floorY: number, height: number): number {
  return floorY + height / 2;
}

/**
 * Compute the center Z of a chamber given its south wall Z and depth (N-S).
 * The chamber extends from southWallZ toward -Z (north).
 */
export function chamberCenterZ(southWallZ: number, depth: number): number {
  return southWallZ - depth / 2;
}

/**
 * Compute the center X of a chamber given its east offset and width (E-W).
 */
export function chamberCenterX(xOffset: number): number {
  return xOffset;
}

/**
 * Compute the Z position of the pyramid's sloped north face at a given height.
 * The face recedes inward from the base edge as height increases.
 * At y=0 the face is at z = -baseHalfWidth.
 * At y=h the face is at z = -baseHalfWidth + h / tan(casingAngle).
 *
 * @param y Height above pavement (m)
 * @param baseHalfWidth Half the base mean width (m) = baseMean / 2
 * @param casingAngleDeg Casing slope angle in degrees (e.g., 51.84)
 * @returns Z coordinate of the north face at that height
 */
export function faceZAtHeight(y: number, baseHalfWidth: number, casingAngleDeg: number): number {
  return -baseHalfWidth + y / Math.tan(degToRad(casingAngleDeg));
}

/**
 * Compute the X position of the pyramid's sloped east face at a given height.
 * The face recedes inward from the base edge as height increases.
 * At y=0 the face is at x = +baseHalfWidth.
 * At y=h the face is at x = +baseHalfWidth - h / tan(casingAngle).
 *
 * @param y Height above pavement (m)
 * @param baseHalfWidth Half the base mean width (m) = baseMean / 2
 * @param casingAngleDeg Casing slope angle in degrees (e.g., 51.84)
 * @returns X coordinate of the east face at that height
 */
export function faceXAtHeight(y: number, baseHalfWidth: number, casingAngleDeg: number): number {
  return baseHalfWidth - y / Math.tan(degToRad(casingAngleDeg));
}
