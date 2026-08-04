/**
 * glTF loader with extras.giza metadata extraction per GIZA - 10 §1.18.
 *
 * Extracts scientific metadata from glTF node and asset extras:
 *   - asset.extras.giza: assetId, version, monumentId, locationId,
 *     objectId, evidenceIds, sourceIds, chronologyTags, confidence,
 *     confidenceBasis, coordinateLayer, author, approvedBy, approvedDate
 *   - node.extras.giza: evidenceIds, confidence, interactive
 */

import { z } from 'zod';

// ─── Schemas ──────────────────────────────────────────────────────────────

export const ChronologyTagSchema = z.object({
  period: z.string(),
  scope: z.string().optional(),
});

export const AssetGizaExtrasSchema = z.object({
  assetId: z.string(),
  version: z.number().int().min(1),
  monumentId: z.string(),
  locationId: z.string(),
  objectId: z.string(),
  evidenceIds: z.array(z.string()),
  sourceIds: z.array(z.string()).default([]),
  chronologyTags: z.array(ChronologyTagSchema).default([]),
  confidence: z.number().min(0).max(100),
  confidenceBasis: z.string().default(''),
  coordinateLayer: z.string(),
  author: z.string().default(''),
  approvedBy: z.string().default(''),
  approvedDate: z.string().default(''),
});

export const NodeGizaExtrasSchema = z.object({
  evidenceIds: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(100).optional(),
  interactive: z.boolean().default(false),
});

export type AssetGizaExtras = z.infer<typeof AssetGizaExtrasSchema>;
export type NodeGizaExtras = z.infer<typeof NodeGizaExtrasSchema>;
export type ChronologyTag = z.infer<typeof ChronologyTagSchema>;

// ─── Extraction functions ─────────────────────────────────────────────────

/**
 * Extracts giza metadata from a glTF asset extras object.
 * Accepts either the full glTF root `{ asset: { extras: { giza: ... } } }`
 * or just the asset object `{ extras: { giza: ... } }`.
 * Returns null if no giza extras are present.
 */
export function extractAssetExtras(raw: unknown): AssetGizaExtras | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;

  // Navigate to the asset object: either root.asset or root itself
  let asset: Record<string, unknown>;
  if (root.asset && typeof root.asset === 'object') {
    asset = root.asset as Record<string, unknown>;
  } else {
    asset = root;
  }

  const extras = asset.extras as Record<string, unknown> | undefined;
  if (!extras || typeof extras !== 'object') return null;
  const giza = extras.giza;
  if (!giza || typeof giza !== 'object') return null;

  const result = AssetGizaExtrasSchema.safeParse(giza);
  return result.success ? result.data : null;
}

/**
 * Extracts giza metadata from a glTF node extras object.
 * Returns null if no giza extras are present.
 */
export function extractNodeExtras(raw: unknown): NodeGizaExtras | null {
  if (!raw || typeof raw !== 'object') return null;
  const node = raw as Record<string, unknown>;
  const extras = node.extras as Record<string, unknown> | undefined;
  if (!extras || typeof extras !== 'object') return null;
  const giza = extras.giza;
  if (!giza || typeof giza !== 'object') return null;

  const result = NodeGizaExtrasSchema.safeParse(giza);
  return result.success ? result.data : null;
}

// ─── Validation ───────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that an asset has all required giza extras fields.
 * Per GIZA - 10 §1.18, required fields are:
 *   evidence_id, object_id, location_id, chronology, confidence, source references
 */
export function validateAssetExtras(raw: unknown): ValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Asset is not an object'] };
  }

  const root = raw as Record<string, unknown>;
  let asset: Record<string, unknown>;
  if (root.asset && typeof root.asset === 'object') {
    asset = root.asset as Record<string, unknown>;
  } else {
    asset = root;
  }

  const extras = asset.extras as Record<string, unknown> | undefined;
  if (!extras) {
    return { valid: false, errors: ['Missing extras block'] };
  }

  const giza = extras.giza;
  if (!giza) {
    return { valid: false, errors: ['Missing extras.giza block'] };
  }

  const result = AssetGizaExtrasSchema.safeParse(giza);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`${issue.path.join('.')}: ${issue.message}`);
    }
    return { valid: false, errors };
  }

  // Additional validation: evidenceIds must not be empty
  if (result.data.evidenceIds.length === 0) {
    errors.push('evidenceIds must not be empty (GIZA-10 §1.18)');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates that a node has valid giza extras (if present).
 * Node extras are optional but if present must be valid.
 */
export function validateNodeExtras(raw: unknown): ValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Node is not an object'] };
  }

  const node = raw as Record<string, unknown>;
  const extras = node.extras as Record<string, unknown> | undefined;
  if (!extras) {
    return { valid: true, errors: [] }; // extras are optional on nodes
  }

  const giza = extras.giza;
  if (!giza) {
    return { valid: true, errors: [] }; // giza extras are optional on nodes
  }

  const result = NodeGizaExtrasSchema.safeParse(giza);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}

// ─── glTF parsing helpers ─────────────────────────────────────────────────

export interface ParsedGlTF {
  asset: AssetGizaExtras | null;
  nodes: { name: string; giza: NodeGizaExtras | null }[];
}

/**
 * Parses a raw glTF JSON object and extracts all giza metadata.
 */
export function parseGlTFMetadata(gltf: unknown): ParsedGlTF {
  const asset = extractAssetExtras(gltf);

  const nodes: { name: string; giza: NodeGizaExtras | null }[] = [];
  if (gltf && typeof gltf === 'object') {
    const gltfObj = gltf as Record<string, unknown>;
    const rawNodes = gltfObj.nodes;
    if (Array.isArray(rawNodes)) {
      for (const rawNode of rawNodes) {
        const node = rawNode as Record<string, unknown>;
        const name = typeof node.name === 'string' ? node.name : '';
        const giza = extractNodeExtras(rawNode);
        nodes.push({ name, giza });
      }
    }
  }

  return { asset, nodes };
}
