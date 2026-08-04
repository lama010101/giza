/**
 * Object linkage tooling per M03.5-T05.
 *
 * Links evidence records to scene objects (OBJ-NNNN) and geometry references,
 * maintaining bidirectional traceability between observations and the meshes
 * they describe. Linking is explicit and auditable — it never silently attaches
 * an object to evidence.
 *
 * Related: `docs/architecture/content-pipeline.md`, `src/schemas/evidence.ts`
 */

import type { Evidence, GeometryRef } from '@/schemas/evidence';
import type { SceneObject } from '@/schemas/object';
import { evidenceStore, type EvidenceStore } from './EvidenceStore';

// ─── Types ────────────────────────────────────────────────────────────────

export type ObjectRelation =
  | 'measured_from'
  | 'reconstructed_from'
  | 'inferred_from'
  | 'deviation_validated_against'
  | 'texture_source_for';

export interface ObjectReference {
  /** The linked object identifier. */
  objectId: string;
  /** Human-readable name that matched in the text. */
  objectName: string;
  /** Heuristic match confidence (0–100). */
  confidence: number;
}

export interface ObjectLinkOptions {
  /** Geometry relation for the evidence → object link. */
  relation?: ObjectRelation;
  /** How much this link contributes to geometry confidence (0–1). */
  confidenceContribution?: number;
  /** Optional pre-built geometry reference; overrides relation/confidenceContribution. */
  geometryRef?: GeometryRef;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function normalizeForMatch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function wordBoundaryMatch(text: string, name: string): boolean {
  const normalizedText = ` ${normalizeForMatch(text)} `;
  const normalizedName = normalizeForMatch(name);
  if (!normalizedName) return false;
  const pattern = new RegExp(
    `(?:^|\\s)${normalizedName.split(' ').join('(?:\\s+|[-\\/])')}(?:$|\\s)`,
    'i',
  );
  return pattern.test(normalizedText);
}

function maskMatchedRange(text: string, name: string): string {
  const normalizedText = ` ${normalizeForMatch(text)} `;
  const normalizedName = normalizeForMatch(name);
  if (!normalizedName) return text;
  const pattern = new RegExp(
    `(?:^|\\s)${normalizedName.split(' ').join('(?:\\s+|[-\\/])')}(?:$|\\s)`,
    'i',
  );
  const match = pattern.exec(normalizedText);
  if (!match) return text;
  const start = match.index;
  const end = start + match[0].length;
  const chars = normalizedText.split('');
  for (let i = start; i < end; i += 1) {
    if (chars[i] && chars[i] !== ' ') chars[i] = '\0';
  }
  return chars.join('').replace(/\0+/g, ' ').trim();
}

function mergeGeometryRefs(existing: GeometryRef[], addition: GeometryRef): GeometryRef[] {
  const next = existing.filter((ref) => ref.meshId !== addition.meshId);
  next.push(addition);
  return next;
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Detects object references in a text by matching object names from a catalog.
 * Longer names are checked first to avoid false substring matches (e.g.
 * "King's Chamber" before "Chamber").
 */
export function detectObjectReferences(text: string, objects: SceneObject[]): ObjectReference[] {
  const matches: ObjectReference[] = [];
  const seen = new Set<string>();

  const sorted = [...objects].sort((a, b) => b.name.length - a.name.length);
  let remainingText = text;

  for (const obj of sorted) {
    if (seen.has(obj.id)) continue;
    if (wordBoundaryMatch(remainingText, obj.name)) {
      seen.add(obj.id);
      matches.push({ objectId: obj.id, objectName: obj.name, confidence: 80 });
      remainingText = maskMatchedRange(remainingText, obj.name);
    }
  }

  return matches;
}

/**
 * Builds a `GeometryRef` for an object link.
 */
export function createObjectGeometryRef(
  objectId: string,
  relation: ObjectRelation = 'measured_from',
  confidenceContribution = 1,
): GeometryRef {
  return {
    meshId: objectId,
    relation,
    confidenceContribution: Math.max(0, Math.min(1, confidenceContribution)),
  };
}

/**
 * Links a single evidence record to a single object. Updates the evidence
 * with the object ID and a geometry reference. Returns the updated evidence,
 * or `undefined` if the evidence was not found.
 */
export function linkEvidenceToObject(
  evidenceId: string,
  objectId: string,
  options: ObjectLinkOptions = {},
  store: EvidenceStore = evidenceStore,
): Evidence | undefined {
  const evidence = store.getById(evidenceId);
  if (!evidence) return undefined;

  const geometryRef =
    options.geometryRef ??
    createObjectGeometryRef(objectId, options.relation, options.confidenceContribution);

  const objectIds = new Set([...evidence.objectIds, objectId]);
  const geometryRefs = mergeGeometryRefs(evidence.geometryRefs, geometryRef);

  return store.update(evidenceId, {
    objectIds: Array.from(objectIds),
    geometryRefs,
    updatedBy: 'object-linkage-tool',
  });
}

/**
 * Links a single evidence record to multiple objects in one update.
 */
export function linkEvidenceToObjects(
  evidenceId: string,
  refs: ObjectReference[],
  options: { relation?: ObjectRelation; confidenceContribution?: number } = {},
  store: EvidenceStore = evidenceStore,
): Evidence | undefined {
  const evidence = store.getById(evidenceId);
  if (!evidence) return undefined;
  if (refs.length === 0) return evidence;

  const objectIds = new Set(evidence.objectIds);
  let geometryRefs = [...evidence.geometryRefs];

  for (const ref of refs) {
    objectIds.add(ref.objectId);
    const geometryRef = createObjectGeometryRef(
      ref.objectId,
      options.relation,
      options.confidenceContribution,
    );
    geometryRefs = mergeGeometryRefs(geometryRefs, geometryRef);
  }

  return store.update(evidenceId, {
    objectIds: Array.from(objectIds),
    geometryRefs,
    updatedBy: 'object-linkage-tool',
  });
}

/**
 * Returns all evidence linked to a given object.
 */
export function getEvidenceForObject(
  objectId: string,
  store: EvidenceStore = evidenceStore,
): Evidence[] {
  return store.getAll().filter((ev) => ev.objectIds.includes(objectId));
}

/**
 * Returns all object IDs linked to a given evidence record.
 */
export function getObjectsForEvidence(
  evidenceId: string,
  store: EvidenceStore = evidenceStore,
): string[] {
  return store.getById(evidenceId)?.objectIds ?? [];
}
