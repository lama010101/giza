/**
 * Measurement tool per GIZA - 04 §6.18 and GIZA - 02 §23.16.
 *
 * Researchers may measure:
 *   distance, angles, height, surface area, volume
 *
 * The measurement tool never modifies geometry and references the exact
 * geometry version being measured.
 */

import type { Vector3 } from '@/schemas/location';

export type MeasurementType = 'distance' | 'angle' | 'height' | 'area' | 'volume';

export interface DistanceMeasurement {
  type: 'distance';
  start: Vector3;
  end: Vector3;
  value: number; // meters
  unit: 'm';
}

export interface AngleMeasurement {
  type: 'angle';
  pointA: Vector3;
  vertex: Vector3;
  pointB: Vector3;
  value: number; // degrees
  unit: 'deg';
}

export interface HeightMeasurement {
  type: 'height';
  base: Vector3;
  top: Vector3;
  value: number; // meters (Y axis only)
  unit: 'm';
}

export interface AreaMeasurement {
  type: 'area';
  points: [Vector3, Vector3, Vector3]; // triangle
  value: number; // square meters
  unit: 'm²';
}

export interface VolumeMeasurement {
  type: 'volume';
  min: Vector3; // bounding box min
  max: Vector3; // bounding box max
  value: number; // cubic meters
  unit: 'm³';
}

export type Measurement =
  | DistanceMeasurement
  | AngleMeasurement
  | HeightMeasurement
  | AreaMeasurement
  | VolumeMeasurement;

// ─── Calculation functions ────────────────────────────────────────────────

export function calculateDistance(start: Vector3, end: Vector3): number {
  return Math.hypot(end.x - start.x, end.y - start.y, end.z - start.z);
}

export function calculateHeight(base: Vector3, top: Vector3): number {
  return Math.abs(top.y - base.y);
}

export function calculateAngle(pointA: Vector3, vertex: Vector3, pointB: Vector3): number {
  // Vectors from vertex to A and B
  const vAx = pointA.x - vertex.x;
  const vAy = pointA.y - vertex.y;
  const vAz = pointA.z - vertex.z;
  const vBx = pointB.x - vertex.x;
  const vBy = pointB.y - vertex.y;
  const vBz = pointB.z - vertex.z;

  const dot = vAx * vBx + vAy * vBy + vAz * vBz;
  const magA = Math.hypot(vAx, vAy, vAz);
  const magB = Math.hypot(vBx, vBy, vBz);

  if (magA === 0 || magB === 0) return 0;
  const cos = Math.min(1, Math.max(-1, dot / (magA * magB)));
  return (Math.acos(cos) * 180) / Math.PI;
}

export function calculateTriangleArea(a: Vector3, b: Vector3, c: Vector3): number {
  // Cross product method: area = |AB × AC| / 2
  const abx = b.x - a.x;
  const aby = b.y - a.y;
  const abz = b.z - a.z;
  const acx = c.x - a.x;
  const acy = c.y - a.y;
  const acz = c.z - a.z;

  const crossX = aby * acz - abz * acy;
  const crossY = abz * acx - abx * acz;
  const crossZ = abx * acy - aby * acx;

  return Math.hypot(crossX, crossY, crossZ) / 2;
}

export function calculateBoundingBoxVolume(min: Vector3, max: Vector3): number {
  return Math.abs((max.x - min.x) * (max.y - min.y) * (max.z - min.z));
}

// ─── Factory functions ────────────────────────────────────────────────────

export function createDistanceMeasurement(start: Vector3, end: Vector3): DistanceMeasurement {
  return { type: 'distance', start, end, value: calculateDistance(start, end), unit: 'm' };
}

export function createHeightMeasurement(base: Vector3, top: Vector3): HeightMeasurement {
  return { type: 'height', base, top, value: calculateHeight(base, top), unit: 'm' };
}

export function createAngleMeasurement(
  pointA: Vector3,
  vertex: Vector3,
  pointB: Vector3,
): AngleMeasurement {
  return {
    type: 'angle',
    pointA,
    vertex,
    pointB,
    value: calculateAngle(pointA, vertex, pointB),
    unit: 'deg',
  };
}

export function createAreaMeasurement(a: Vector3, b: Vector3, c: Vector3): AreaMeasurement {
  return { type: 'area', points: [a, b, c], value: calculateTriangleArea(a, b, c), unit: 'm²' };
}

export function createVolumeMeasurement(min: Vector3, max: Vector3): VolumeMeasurement {
  return { type: 'volume', min, max, value: calculateBoundingBoxVolume(min, max), unit: 'm³' };
}

// ─── Formatting ───────────────────────────────────────────────────────────

export function formatMeasurement(m: Measurement): string {
  switch (m.type) {
    case 'distance':
      return `${m.value.toFixed(2)} ${m.unit}`;
    case 'height':
      return `${m.value.toFixed(2)} ${m.unit}`;
    case 'angle':
      return `${m.value.toFixed(1)}${m.unit}`;
    case 'area':
      return `${m.value.toFixed(2)} ${m.unit}`;
    case 'volume':
      return `${m.value.toFixed(2)} ${m.unit}`;
  }
}

// ─── Export ───────────────────────────────────────────────────────────────

export function measurementToJSON(m: Measurement): string {
  return JSON.stringify(m, null, 2);
}

export function measurementFromJSON(json: string): Measurement {
  return JSON.parse(json) as Measurement;
}
