/**
 * Evidence hotspot data model per GIZA - 04 §6.16.
 *
 * Every hotspot exists as metadata:
 *   Position, Radius, Priority, Evidence IDs, Title, Description,
 *   Images, Publications, Confidence
 *
 * Clicking a hotspot never pauses rendering.
 */

import { z } from 'zod';

export const HotspotSchema = z.object({
  id: z.string().min(1),
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  radius: z.number().positive().default(1),
  priority: z.number().int().min(0).max(10).default(5),
  evidenceIds: z.array(z.string()).min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  imageIds: z.array(z.string()).default([]),
  publicationIds: z.array(z.string()).default([]),
  confidence: z.number().int().min(0).max(100).default(50),
  objectId: z.string().optional(),
});

export type Hotspot = z.infer<typeof HotspotSchema>;

/**
 * Generates hotspots from scene objects that have evidence IDs.
 * Each object with evidence becomes a hotspot at its world position.
 */
export function generateHotspotsFromObjects(
  objects: {
    id: string;
    name: string;
    position: { x: number; y: number; z: number };
    evidence?: string[];
    confidence?: number;
  }[],
): Hotspot[] {
  return objects
    .filter((obj) => obj.evidence && obj.evidence.length > 0)
    .map((obj) => ({
      id: `hotspot-${obj.id}`,
      position: obj.position,
      radius: 1.5,
      priority: 5,
      evidenceIds: obj.evidence!,
      title: obj.name,
      description: '',
      imageIds: [],
      publicationIds: [],
      confidence: obj.confidence ?? 50,
      objectId: obj.id,
    }));
}
