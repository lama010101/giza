/**
 * Hotspot creation tooling per M03.5 Scientific Content Pipeline.
 *
 * Turns approved evidence into scene hotspots without modifying geometry.
 * The flow is strictly: `createHotspotFromEvidence` → `validateHotspotDraft`
 * → `approveHotspotDraft`. A draft cannot be placed into the scene; only an
 * `ApprovedHotspot` can.
 *
 * Related: `docs/architecture/content-pipeline.md`, `src/evidence/hotspot.ts`,
 * `src/loaders/validators.ts` (ValidationResult pattern).
 */

import { z } from 'zod';
import type { ValidationResult } from '@/loaders/validators';

// ─── Types ────────────────────────────────────────────────────────────────

export const Vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

/**
 * 3D vector (matches `src/schemas/location.ts` Vector3).
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export const HotspotDraftSchema = z.object({
  id: z.string().min(1),
  evidenceId: z.string().min(1),
  position: Vector3Schema,
  label: z.string().min(1),
  status: z.literal('draft').default('draft'),
  createdAt: z.string(),
});

/**
 * A hotspot draft awaiting validation and approval.
 */
export interface HotspotDraft {
  id: string;
  evidenceId: string;
  position: Vector3;
  label: string;
  status: 'draft';
  createdAt: string;
}

export const ApprovedHotspotSchema = z.object({
  id: z.string().min(1),
  evidenceId: z.string().min(1),
  position: Vector3Schema,
  label: z.string().min(1),
  confidence: z.number().int().min(0).max(100).default(50),
  approvedAt: z.string(),
});

/**
 * A validated, approved hotspot ready for the scene.
 */
export interface ApprovedHotspot {
  id: string;
  evidenceId: string;
  position: Vector3;
  label: string;
  confidence: number;
  approvedAt: string;
}

// ─── Bounding box (Giza plateau, approximate) ─────────────────────────────

const GIZA_BOUNDS = {
  minX: -500,
  maxX: 500,
  minY: -100,
  maxY: 300,
  minZ: -500,
  maxZ: 500,
};

function isFiniteNumber(n: number): boolean {
  return typeof n === 'number' && Number.isFinite(n);
}

let hotspotCounter = 0;

function nextHotspotId(): string {
  hotspotCounter += 1;
  return `hotspot-${String(hotspotCounter).padStart(4, '0')}`;
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Creates a hotspot draft from an evidence record. The draft is not yet
 * valid for the scene — call `validateHotspotDraft` then `approveHotspotDraft`.
 *
 * @param evidenceId - The evidence record this hotspot annotates.
 * @param position - 3D world position for the hotspot.
 * @param label - Human-readable label shown in the scene.
 * @returns A hotspot draft with `status: 'draft'`.
 */
export function createHotspotFromEvidence(
  evidenceId: string,
  position: Vector3,
  label: string,
): HotspotDraft {
  return {
    id: nextHotspotId(),
    evidenceId,
    position,
    label,
    status: 'draft',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Validates a hotspot draft. Reuses the `ValidationResult` shape from
 * `src/loaders/validators.ts` (`{ passed, errors, warnings }`).
 *
 * Checks:
 * - non-empty label
 * - finite position coordinates
 * - valid evidence ID format (`EV-NNNNNN`)
 * - position inside the Giza plateau bounding box (warn-only)
 *
 * @param draft - The hotspot draft to validate.
 * @returns Validation result with `passed`, `errors`, and `warnings`.
 */
export function validateHotspotDraft(draft: HotspotDraft): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!draft.label || draft.label.trim().length === 0) {
    errors.push('Hotspot label must not be empty');
  }

  if (
    !isFiniteNumber(draft.position.x) ||
    !isFiniteNumber(draft.position.y) ||
    !isFiniteNumber(draft.position.z)
  ) {
    errors.push('Hotspot position coordinates must be finite numbers');
  }

  if (!/^EV-\d{6}$/.test(draft.evidenceId)) {
    errors.push(`Evidence ID "${draft.evidenceId}" must match format EV-NNNNNN`);
  }

  // Bounding box check (warn-only — out-of-bounds may be intentional for
  // overview/orthographic views).
  const { position } = draft;
  if (
    position.x < GIZA_BOUNDS.minX ||
    position.x > GIZA_BOUNDS.maxX ||
    position.y < GIZA_BOUNDS.minY ||
    position.y > GIZA_BOUNDS.maxY ||
    position.z < GIZA_BOUNDS.minZ ||
    position.z > GIZA_BOUNDS.maxZ
  ) {
    warnings.push(
      `Hotspot position (${position.x}, ${position.y}, ${position.z}) is outside the Giza plateau bounds`,
    );
  }

  return { passed: errors.length === 0, errors, warnings };
}

/**
 * Approves a hotspot draft into an `ApprovedHotspot` ready for the scene.
 * Throws if the draft has not passed validation.
 *
 * @param draft - The validated hotspot draft.
 * @param confidence - Optional confidence 0–100 (defaults to 50).
 * @returns An approved hotspot.
 */
export function approveHotspotDraft(draft: HotspotDraft, confidence = 50): ApprovedHotspot {
  const validation = validateHotspotDraft(draft);
  if (!validation.passed) {
    throw new Error(`Cannot approve hotspot draft ${draft.id}: ${validation.errors.join('; ')}`);
  }

  const clamped = Math.max(0, Math.min(100, Math.round(confidence)));
  return {
    id: draft.id,
    evidenceId: draft.evidenceId,
    position: draft.position,
    label: draft.label,
    confidence: clamped,
    approvedAt: new Date().toISOString(),
  };
}
