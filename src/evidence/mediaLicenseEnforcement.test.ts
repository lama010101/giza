import { describe, it, expect } from 'vitest';
import {
  checkMediaLicenses,
  isRedistributable,
  isCommercialUse,
  allowsDerivatives,
  REDISTRIBUTION_LICENSES,
} from './mediaLicenseEnforcement';
import type { Evidence } from '@/schemas/evidence';
import type { Media } from '@/schemas/media';

function makeEvidence(overrides: Partial<Evidence> = {}): Evidence {
  return {
    id: 'EV-000001',
    title: 'Test',
    description: '',
    category: 'Survey',
    primaryClass: 'E2',
    secondaryClasses: [],
    confidence: 80,
    confidenceBasis: '',
    status: 'Published',
    sourceIds: [],
    locationId: undefined,
    objectIds: [],
    geometryRefs: [],
    mediaIds: ['MED-0001'],
    dependencyIds: [],
    conflictIds: [],
    chronologyTags: [],
    tags: [],
    reviewLog: [],
    version: 1,
    created: '',
    updated: '',
    createdBy: '',
    updatedBy: '',
    ...overrides,
  };
}

function makeMedia(id: string, license: string): Media {
  return {
    id,
    type: 'Photograph',
    url: 'https://example.com/photo.jpg',
    license,
    credit: '',
    capturedDate: '',
    capturedBy: '',
    evidenceIds: [],
  } as Media;
}

describe('Media License Enforcement (M02-T11)', () => {
  describe('checkMediaLicenses', () => {
    it('passes for Published evidence with redistributable license', () => {
      const evidence = [makeEvidence()];
      const media = [makeMedia('MED-0001', 'CC-BY')];
      const violations = checkMediaLicenses(evidence, media);
      expect(violations).toHaveLength(0);
    });

    it('flags missing license for Published evidence', () => {
      const evidence = [makeEvidence()];
      const media = [makeMedia('MED-0001', '')];
      const violations = checkMediaLicenses(evidence, media);
      expect(violations.some((v) => v.violation === 'missing-license')).toBe(true);
    });

    it('flags non-redistributable license', () => {
      const evidence = [makeEvidence()];
      const media = [makeMedia('MED-0001', 'Unknown License')];
      const violations = checkMediaLicenses(evidence, media);
      expect(violations.some((v) => v.violation === 'non-redistributable')).toBe(true);
    });

    it('flags non-commercial license', () => {
      const evidence = [makeEvidence()];
      const media = [makeMedia('MED-0001', 'CC-BY-NC')];
      const violations = checkMediaLicenses(evidence, media);
      expect(violations.some((v) => v.violation === 'non-commercial')).toBe(true);
    });

    it('flags no-derivatives license', () => {
      const evidence = [makeEvidence()];
      const media = [makeMedia('MED-0001', 'CC-BY-ND')];
      const violations = checkMediaLicenses(evidence, media);
      expect(violations.some((v) => v.violation === 'no-derivatives')).toBe(true);
    });

    it('does not enforce for Draft evidence', () => {
      const evidence = [makeEvidence({ status: 'Draft' })];
      const media = [makeMedia('MED-0001', '')];
      const violations = checkMediaLicenses(evidence, media);
      expect(violations).toHaveLength(0);
    });
  });

  describe('isRedistributable', () => {
    it('returns true for CC-BY', () => {
      expect(isRedistributable('CC-BY')).toBe(true);
    });

    it('returns false for unknown license', () => {
      expect(isRedistributable('Unknown')).toBe(false);
    });
  });

  describe('isCommercialUse', () => {
    it('returns true for CC-BY', () => {
      expect(isCommercialUse('CC-BY')).toBe(true);
    });

    it('returns false for CC-BY-NC', () => {
      expect(isCommercialUse('CC-BY-NC')).toBe(false);
    });
  });

  describe('allowsDerivatives', () => {
    it('returns true for CC-BY', () => {
      expect(allowsDerivatives('CC-BY')).toBe(true);
    });

    it('returns false for CC-BY-ND', () => {
      expect(allowsDerivatives('CC-BY-ND')).toBe(false);
    });
  });

  describe('REDISTRIBUTION_LICENSES', () => {
    it('includes common open licenses', () => {
      expect(REDISTRIBUTION_LICENSES.has('CC0')).toBe(true);
      expect(REDISTRIBUTION_LICENSES.has('CC-BY')).toBe(true);
      expect(REDISTRIBUTION_LICENSES.has('CC-BY-SA')).toBe(true);
      expect(REDISTRIBUTION_LICENSES.has('Public Domain')).toBe(true);
    });
  });
});
