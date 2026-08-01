import { describe, it, expect } from 'vitest';
import {
  assessUncertainty,
  getUncertaintyColor,
  getUncertaintyIcon,
  assessBatchUncertainty,
  filterUncertainObjects,
} from './uncertaintyUI';
import type { Evidence } from '@/schemas/evidence';

function makeEvidence(
  id: string,
  objectIds: string[],
  confidence: number,
  conflictIds: string[] = [],
): Evidence {
  return {
    id,
    title: `Evidence ${id}`,
    description: '',
    category: 'Measurement',
    primaryClass: 'E1',
    secondaryClasses: [],
    confidence,
    confidenceBasis: 'survey',
    status: 'Published',
    sourceIds: [],
    objectIds,
    geometryRefs: [],
    mediaIds: [],
    dependencyIds: [],
    conflictIds,
    chronologyTags: [],
    tags: [],
    reviewLog: [],
    version: 1,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    createdBy: 'test',
    updatedBy: '',
  } as Evidence;
}

describe('Uncertainty UI (M07-T16)', () => {
  describe('assessUncertainty', () => {
    it('returns critical when no evidence linked', () => {
      const result = assessUncertainty('OBJ-001', []);
      expect(result.level).toBe('critical');
      expect(result.missingEvidenceCount).toBe(3);
      expect(result.suggestedActions.length).toBeGreaterThan(0);
    });

    it('returns high when insufficient evidence', () => {
      const evidence = [makeEvidence('EV-001', ['OBJ-001'], 80)];
      const result = assessUncertainty('OBJ-001', evidence);
      expect(result.level).toBe('high');
    });

    it('returns none when well-supported', () => {
      const evidence = [
        makeEvidence('EV-001', ['OBJ-001'], 85),
        makeEvidence('EV-002', ['OBJ-001'], 80),
        makeEvidence('EV-003', ['OBJ-001'], 90),
      ];
      const result = assessUncertainty('OBJ-001', evidence);
      expect(result.level).toBe('none');
    });

    it('returns medium when conflicts exist', () => {
      const evidence = [
        makeEvidence('EV-001', ['OBJ-001'], 80, ['CONF-001']),
        makeEvidence('EV-002', ['OBJ-001'], 80),
        makeEvidence('EV-003', ['OBJ-001'], 80),
      ];
      const result = assessUncertainty('OBJ-001', evidence);
      expect(result.level).toBe('medium');
      expect(result.conflictingEvidenceCount).toBe(1);
    });
  });

  describe('getUncertaintyColor', () => {
    it('returns a color for each level', () => {
      expect(getUncertaintyColor('none')).toBeDefined();
      expect(getUncertaintyColor('critical')).toBeDefined();
    });
  });

  describe('getUncertaintyIcon', () => {
    it('returns an icon for each level', () => {
      expect(getUncertaintyIcon('none')).toBe('check-circle');
      expect(getUncertaintyIcon('critical')).toBe('cancel');
    });
  });

  describe('assessBatchUncertainty', () => {
    it('assesses multiple objects', () => {
      const evidence = [makeEvidence('EV-001', ['OBJ-001'], 80)];
      const results = assessBatchUncertainty(['OBJ-001', 'OBJ-002'], evidence);
      expect(results).toHaveLength(2);
      expect(results[0].objectId).toBe('OBJ-001');
      expect(results[1].objectId).toBe('OBJ-002');
    });
  });

  describe('filterUncertainObjects', () => {
    it('filters to only uncertain objects', () => {
      const indicators = [
        {
          objectId: 'A',
          level: 'none',
          message: '',
          missingEvidenceCount: 0,
          conflictingEvidenceCount: 0,
          suggestedActions: [],
        },
        {
          objectId: 'B',
          level: 'medium',
          message: '',
          missingEvidenceCount: 1,
          conflictingEvidenceCount: 0,
          suggestedActions: [],
        },
        {
          objectId: 'C',
          level: 'critical',
          message: '',
          missingEvidenceCount: 3,
          conflictingEvidenceCount: 0,
          suggestedActions: [],
        },
      ] as const;
      const filtered = filterUncertainObjects([...indicators], 'medium');
      expect(filtered).toHaveLength(2);
      expect(filtered[0].objectId).toBe('B');
    });
  });
});
