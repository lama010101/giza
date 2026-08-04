/**
 * Media license enforcement per M02-T11.
 *
 * Enforces license requirements for media linked to Published evidence.
 * Published evidence requires media to have a license that allows
 * redistribution.
 */

import type { Media } from '@/schemas/media';
import type { Evidence } from '@/schemas/evidence';

/**
 * Licenses that permit redistribution (for Published evidence).
 */
export const REDISTRIBUTION_LICENSES = new Set([
  'CC0',
  'CC-BY',
  'CC-BY-SA',
  'CC-BY-ND',
  'CC-BY-NC',
  'CC-BY-NC-SA',
  'CC-BY-NC-ND',
  'Public Domain',
  'MIT',
  'Apache-2.0',
  'GPL-3.0',
]);

/**
 * Licenses that restrict commercial use.
 */
export const NON_COMMERCIAL_LICENSES = new Set(['CC-BY-NC', 'CC-BY-NC-SA', 'CC-BY-NC-ND']);

/**
 * Licenses that prevent derivative works.
 */
export const NO_DERIVATIVES_LICENSES = new Set(['CC-BY-ND', 'CC-BY-NC-ND']);

export interface LicenseViolation {
  mediaId: string;
  evidenceId: string;
  violation: 'missing-license' | 'non-redistributable' | 'non-commercial' | 'no-derivatives';
  license: string;
  message: string;
}

/**
 * Checks media licenses for Published evidence.
 */
export function checkMediaLicenses(evidence: Evidence[], media: Media[]): LicenseViolation[] {
  const mediaMap = new Map(media.map((m) => [m.id, m]));
  const violations: LicenseViolation[] = [];

  for (const ev of evidence) {
    // Only enforce for Published evidence
    if (ev.status !== 'Published') continue;

    for (const mediaId of ev.mediaIds) {
      const m = mediaMap.get(mediaId);
      if (!m) continue;

      // Missing license
      if (!m.license || m.license.trim() === '') {
        violations.push({
          mediaId,
          evidenceId: ev.id,
          violation: 'missing-license',
          license: '',
          message: `Published evidence ${ev.id} references media ${mediaId} without a license`,
        });
        continue;
      }

      // Non-redistributable
      if (!REDISTRIBUTION_LICENSES.has(m.license)) {
        violations.push({
          mediaId,
          evidenceId: ev.id,
          violation: 'non-redistributable',
          license: m.license,
          message: `Media ${mediaId} has license "${m.license}" which is not in the approved redistribution list`,
        });
      }

      // Non-commercial restriction
      if (NON_COMMERCIAL_LICENSES.has(m.license)) {
        violations.push({
          mediaId,
          evidenceId: ev.id,
          violation: 'non-commercial',
          license: m.license,
          message: `Media ${mediaId} has non-commercial license "${m.license}" — commercial use restricted`,
        });
      }

      // No derivatives restriction
      if (NO_DERIVATIVES_LICENSES.has(m.license)) {
        violations.push({
          mediaId,
          evidenceId: ev.id,
          violation: 'no-derivatives',
          license: m.license,
          message: `Media ${mediaId} has no-derivatives license "${m.license}" — modifications restricted`,
        });
      }
    }
  }

  return violations;
}

/**
 * Returns true if a license permits redistribution.
 */
export function isRedistributable(license: string): boolean {
  return REDISTRIBUTION_LICENSES.has(license);
}

/**
 * Returns true if a license permits commercial use.
 */
export function isCommercialUse(license: string): boolean {
  return !NON_COMMERCIAL_LICENSES.has(license);
}

/**
 * Returns true if a license permits derivative works.
 */
export function allowsDerivatives(license: string): boolean {
  return !NO_DERIVATIVES_LICENSES.has(license);
}
