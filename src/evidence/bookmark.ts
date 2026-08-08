/**
 * Bookmark system per GIZA - 02 §23.15.
 *
 * Bookmarks store:
 *   camera position, visible layers, active theory, lighting,
 *   selected object, notes
 *
 * Export as URL or JSON.
 */

import { z } from 'zod';
import type { Vector3 } from '@/schemas/location';
import type { SceneLayer } from '@/store/app';

export const BookmarkSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  createdAt: z.string(),
  camera: z.object({
    position: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    target: z.object({ x: z.number(), y: z.number(), z: z.number() }),
    mode: z.string(),
  }),
  visibleLayers: z.array(z.string()),
  hiddenLayers: z.array(z.string()),
  activeHypothesisIds: z.array(z.string()),
  hiddenVisibilityLayers: z.array(z.string()).default([]),
  lighting: z
    .object({
      ambient: z.number().optional(),
      directional: z.number().optional(),
      local: z.number().optional(),
    })
    .optional(),
  selectedObjectId: z.string().nullable().optional(),
  selectedEvidenceId: z.string().nullable().optional(),
  notes: z.string().default(''),
});

export type Bookmark = z.infer<typeof BookmarkSchema>;

export interface BookmarkInput {
  id: string;
  name: string;
  camera: {
    position: Vector3;
    target: Vector3;
    mode: string;
  };
  visibleLayers: readonly SceneLayer[];
  hiddenLayers: readonly SceneLayer[];
  activeHypothesisIds: string[];
  hiddenVisibilityLayers?: readonly string[];
  lighting?: {
    ambient?: number;
    directional?: number;
    local?: number;
  };
  selectedObjectId?: string | null;
  selectedEvidenceId?: string | null;
  notes?: string;
}

export function createBookmark(input: BookmarkInput): Bookmark {
  return BookmarkSchema.parse({
    id: input.id,
    name: input.name,
    createdAt: new Date().toISOString(),
    camera: input.camera,
    visibleLayers: input.visibleLayers,
    hiddenLayers: input.hiddenLayers,
    activeHypothesisIds: input.activeHypothesisIds,
    hiddenVisibilityLayers: input.hiddenVisibilityLayers ?? [],
    lighting: input.lighting,
    selectedObjectId: input.selectedObjectId ?? null,
    selectedEvidenceId: input.selectedEvidenceId ?? null,
    notes: input.notes ?? '',
  });
}

// ─── Export ───────────────────────────────────────────────────────────────

export function bookmarkToJSON(bookmark: Bookmark): string {
  return JSON.stringify(bookmark, null, 2);
}

export function bookmarkFromJSON(json: string): Bookmark {
  return BookmarkSchema.parse(JSON.parse(json));
}

/**
 * Encodes a bookmark as a URL query string.
 * Format: ?bm=<base64-encoded JSON>
 */
export function bookmarkToURL(bookmark: Bookmark, baseUrl = ''): string {
  const json = JSON.stringify(bookmark);
  const encoded = btoa(encodeURIComponent(json));
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}bm=${encoded}`;
}

export function bookmarkFromURL(url: string): Bookmark | null {
  try {
    const urlObj = new URL(url);
    const encoded = urlObj.searchParams.get('bm');
    if (!encoded) return null;
    const json = decodeURIComponent(atob(encoded));
    return BookmarkSchema.parse(JSON.parse(json));
  } catch {
    return null;
  }
}

/**
 * Encodes a bookmark as a URL-safe base64 string (for environments
 * without `window.URL` access, e.g. tests).
 */
export function bookmarkToBase64(bookmark: Bookmark): string {
  const json = JSON.stringify(bookmark);
  return btoa(encodeURIComponent(json));
}

export function bookmarkFromBase64(encoded: string): Bookmark {
  const json = decodeURIComponent(atob(encoded));
  return BookmarkSchema.parse(JSON.parse(json));
}
