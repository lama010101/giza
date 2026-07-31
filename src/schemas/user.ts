import { z } from 'zod';
import { ObjectId, TheoryId } from './identifiers';
import { Vector3Schema } from './location';

/**
 * User, Bookmark, and Measurement schemas per GIZA - 05 Data Architecture §-19
 * and GIZA - 02 Information Architecture & UX §23.15 (Bookmarks) and §23.16
 * (Measurement Workflow).
 */

// --- User -----------------------------------------------------------------

export const UserId = z.string().regex(/^USER-\d{4}$/, 'Expected USER-NNNN');
export type UserId = z.infer<typeof UserId>;

export const UserRole = z.enum(['Researcher', 'Reviewer', 'Editor', 'Administrator']);

export type UserRole = z.infer<typeof UserRole>;

export const UserSchema = z.object({
  id: UserId,
  name: z.string().min(1),
  orcid: z.string().optional(),
  role: UserRole.default('Researcher'),
});

export type User = z.infer<typeof UserSchema>;

// --- Bookmark -------------------------------------------------------------

/**
 * Bookmark schema per GIZA - 02 §23.15.
 *
 * Each bookmark stores the camera, layers, theory, lighting, selected object,
 * and notes. Bookmarks are shareable via URLs or exported JSON.
 */
export const BookmarkId = z.string().regex(/^BM-\d{4}$/, 'Expected BM-NNNN');
export type BookmarkId = z.infer<typeof BookmarkId>;

export const CameraStateSchema = z.object({
  position: Vector3Schema,
  target: Vector3Schema,
  fov: z.number().min(10).max(120).optional(),
  mode: z.enum(['walk', 'fly', 'teleport']).optional(),
});

export type CameraState = z.infer<typeof CameraStateSchema>;

export const BookmarkSchema = z.object({
  id: BookmarkId,
  userId: UserId,
  name: z.string().min(1),
  camera: CameraStateSchema,
  layers: z.array(z.string()).default([]),
  activeHypotheses: z.array(TheoryId).default([]),
  lighting: z.record(z.string(), z.unknown()).default({}),
  selectedObject: ObjectId.optional(),
  notes: z.string().default(''),
  created: z.string().default(''),
});

export type Bookmark = z.infer<typeof BookmarkSchema>;

// --- Measurement ----------------------------------------------------------

/**
 * Measurement schema per GIZA - 02 §23.16.
 *
 * Measurements reference the exact geometry version so they remain valid
 * across scene updates.
 */
export const MeasurementId = z.string().regex(/^MEAS-\d{4}$/, 'Expected MEAS-NNNN');
export type MeasurementId = z.infer<typeof MeasurementId>;

export const MeasurementType = z.enum(['Distance', 'Angle', 'Height', 'SurfaceArea', 'Volume']);

export type MeasurementType = z.infer<typeof MeasurementType>;

export const MeasurementSchema = z.object({
  id: MeasurementId,
  userId: UserId,
  type: MeasurementType,
  points: z.array(Vector3Schema).min(2),
  value: z.number(),
  unit: z.string().default('m'),
  geometryVersion: z.string().min(1),
  annotation: z.string().default(''),
  created: z.string().default(''),
});

export type Measurement = z.infer<typeof MeasurementSchema>;
