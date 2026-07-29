import { z } from 'zod';
import { LocationId } from './identifiers';

export const Vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

export type Vector3 = z.infer<typeof Vector3Schema>;

export const BoundingBoxSchema = z.object({
  min: Vector3Schema,
  max: Vector3Schema,
});

export type BoundingBox = z.infer<typeof BoundingBoxSchema>;

export const LocationSchema = z.object({
  id: LocationId,
  name: z.string().min(1),
  parent: LocationId.optional(),
  boundingBox: BoundingBoxSchema.optional(),
  center: Vector3Schema.optional(),
  geometry: z.string().optional(),
});

export type Location = z.infer<typeof LocationSchema>;
