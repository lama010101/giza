/**
 * Exported coordinate system constants per M05-T02.
 *
 * The GIZA platform uses Y-up world coordinates aligned with
 * archaeological survey conventions.
 */

export const COORDINATE_SYSTEM = {
  /** Up axis — Y is up, consistent with WebGL/Three.js */
  upAxis: 'y' as const,
  /** Right-handed coordinate system */
  handedness: 'right' as const,
  /** World units are meters */
  unit: 'meters' as const,
  /** World origin at the center of the Giza plateau */
  worldOrigin: { x: 0, y: 0, z: 0 },
  /** North is -Z (towards the Nile) */
  northAxis: { x: 0, y: 0, z: -1 },
  /** East is +X */
  eastAxis: { x: 1, y: 0, z: 0 },
  /** Up is +Y */
  upVector: { x: 0, y: 1, z: 0 },
} as const;

/**
 * Coordinate system hierarchy:
 *   World → Plateau → Monument → Room → Object
 *
 * Each level has its own local origin and transform.
 */
export const COORDINATE_LEVELS = ['world', 'plateau', 'monument', 'room', 'object'] as const;

export type CoordinateLevel = (typeof COORDINATE_LEVELS)[number];

/**
 * Known monument origins in world coordinates (meters).
 * Aligned with the Giza plateau survey grid.
 */
export const MONUMENT_ORIGINS = {
  'great-pyramid': { x: 0, y: 0, z: 0 },
  'osiris-shaft': { x: 0, y: 0, z: 0 }, // Same location, underground
  khafre: { x: -470, y: 0, z: -160 },
  menkaure: { x: -730, y: 0, z: -340 },
} as const;

/**
 * Converts local coordinates to world coordinates using a monument origin.
 */
export function localToWorld(
  local: { x: number; y: number; z: number },
  monumentId: keyof typeof MONUMENT_ORIGINS,
): { x: number; y: number; z: number } {
  const origin = MONUMENT_ORIGINS[monumentId];
  return {
    x: local.x + origin.x,
    y: local.y + origin.y,
    z: local.z + origin.z,
  };
}

/**
 * Converts world coordinates to local coordinates for a monument.
 */
export function worldToLocal(
  world: { x: number; y: number; z: number },
  monumentId: keyof typeof MONUMENT_ORIGINS,
): { x: number; y: number; z: number } {
  const origin = MONUMENT_ORIGINS[monumentId];
  return {
    x: world.x - origin.x,
    y: world.y - origin.y,
    z: world.z - origin.z,
  };
}

/**
 * Returns the coordinate level for a given scene node ID prefix.
 */
export function getCoordinateLevel(nodeId: string): CoordinateLevel {
  // Check more specific levels first
  if (nodeId.includes('-room-') || nodeId.includes('-chamber-')) return 'room';
  if (nodeId.startsWith('world-')) return 'world';
  if (nodeId.startsWith('plateau-')) return 'plateau';
  if (nodeId.startsWith('gp-') || nodeId.startsWith('osiris-')) return 'monument';
  return 'object';
}
