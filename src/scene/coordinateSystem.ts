import type { Vector3 } from '@/schemas/location';

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
  /** World origin is anchored at the Great Pyramid GPS datum (see ADR-0008) */
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

/** Earth radius for equirectangular GPS conversion, in meters. */
export const EARTH_RADIUS_METERS = 6_371_000;

/**
 * GPS datum for the world origin.
 * The Great Pyramid apex is the current plateau reference because its
 * published coordinates are the most precisely surveyed anchor available.
 */
export const PLATEAU_ORIGIN_GPS = { latitude: 29.9792368, longitude: 31.1342008 };

/**
 * Published GPS coordinates for each monument (WGS-84).
 * Sources:
 *   - Great Pyramid: Google Maps place page (29.9792368 N, 31.1342008 E)
 *   - Osiris Shaft: Google Maps place page (29.9752738 N, 31.1345962 E)
 *   - Khafre: Ancient Locations / Google Maps (29.9759186 N, 31.130861 E)
 *   - Menkaure: Wikipedia (29.97250 N, 31.12833 E)
 */
const MONUMENT_GPS = {
  'great-pyramid': { latitude: 29.9792368, longitude: 31.1342008 },
  'osiris-shaft': { latitude: 29.9752738, longitude: 31.1345962 },
  khafre: { latitude: 29.9759186, longitude: 31.130861 },
  menkaure: { latitude: 29.9725, longitude: 31.12833 },
} as const;

/**
 * Converts a WGS-84 lat/lon coordinate to plateau-world meters.
 * North is -Z, East is +X, Y is 0 (sea-level/ground plane).
 */
export function latLonToPlateauMeters(latitude: number, longitude: number): Vector3 {
  const origin = PLATEAU_ORIGIN_GPS;
  const cosLat = Math.cos((origin.latitude * Math.PI) / 180);
  const dLat = latitude - origin.latitude;
  const dLon = longitude - origin.longitude;
  const north = (dLat * Math.PI * EARTH_RADIUS_METERS) / 180;
  const east = (dLon * Math.PI * EARTH_RADIUS_METERS * cosLat) / 180;
  return { x: east, y: 0, z: -north };
}

/**
 * Known monument origins in world coordinates (meters).
 * Derived from MONUMENT_GPS using an equirectangular projection at the
 * Great Pyramid latitude. Values are rounded to millimeter precision.
 */
export const MONUMENT_ORIGINS: Record<keyof typeof MONUMENT_GPS, Vector3> = {
  'great-pyramid': { x: 0, y: 0, z: 0 },
  'osiris-shaft': latLonToPlateauMeters(
    MONUMENT_GPS['osiris-shaft'].latitude,
    MONUMENT_GPS['osiris-shaft'].longitude,
  ),
  khafre: latLonToPlateauMeters(MONUMENT_GPS.khafre.latitude, MONUMENT_GPS.khafre.longitude),
  menkaure: latLonToPlateauMeters(MONUMENT_GPS.menkaure.latitude, MONUMENT_GPS.menkaure.longitude),
};

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
