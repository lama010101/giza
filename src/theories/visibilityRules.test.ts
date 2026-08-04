import { describe, it, expect } from 'vitest';
import {
  evaluateRule,
  evaluateVisibility,
  evaluateBatchVisibility,
  filterVisibleNodes,
  createLayerRule,
  createChronologyRule,
  createEvidenceRule,
  type VisibilityRule,
} from './visibilityRules';
import type { HypothesisGeometryNode } from './types';

function makeNode(rules?: VisibilityRule[]): HypothesisGeometryNode {
  return {
    id: 'NODE-001',
    name: 'Test Node',
    position: { x: 0, y: 0, z: 0 },
    size: { x: 1, y: 1, z: 1 },
    color: '#ffffff',
    opacity: 1,
    hypothesisId: 'THEORY-001',
    evidenceIds: [],
    visibilityRules: rules,
  };
}

describe('Visibility Rules (M11-T20)', () => {
  describe('evaluateRule', () => {
    it('passes when layer matches', () => {
      const rule = createLayerRule('evidence');
      expect(evaluateRule(rule, { activeLayer: 'evidence' })).toBe(true);
    });

    it('fails when layer does not match', () => {
      const rule = createLayerRule('evidence');
      expect(evaluateRule(rule, { activeLayer: 'geometry' })).toBe(false);
    });

    it('passes when chronology matches', () => {
      const rule = createChronologyRule('old-kingdom');
      expect(evaluateRule(rule, { chronologyPeriod: 'old-kingdom' })).toBe(true);
    });

    it('passes when evidence count is sufficient', () => {
      const rule = createEvidenceRule(3);
      expect(evaluateRule(rule, { evidenceCount: 5 })).toBe(true);
    });

    it('fails when evidence count is insufficient', () => {
      const rule = createEvidenceRule(5);
      expect(evaluateRule(rule, { evidenceCount: 2 })).toBe(false);
    });
  });

  describe('evaluateVisibility', () => {
    it('returns false when hypothesis is not active', () => {
      const node = makeNode();
      expect(evaluateVisibility(node, { hypothesisActive: false })).toBe(false);
    });

    it('returns true when no rules and hypothesis is active', () => {
      const node = makeNode();
      expect(evaluateVisibility(node, { hypothesisActive: true })).toBe(true);
    });

    it('evaluates layer rules', () => {
      const node = makeNode([createLayerRule('evidence')]);
      expect(evaluateVisibility(node, { hypothesisActive: true, activeLayer: 'evidence' })).toBe(
        true,
      );
      expect(evaluateVisibility(node, { hypothesisActive: true, activeLayer: 'geometry' })).toBe(
        false,
      );
    });

    it('evaluates evidence rules', () => {
      const node = makeNode([createEvidenceRule(3)]);
      expect(evaluateVisibility(node, { hypothesisActive: true, evidenceCount: 5 })).toBe(true);
      expect(evaluateVisibility(node, { hypothesisActive: true, evidenceCount: 1 })).toBe(false);
    });
  });

  describe('evaluateBatchVisibility', () => {
    it('evaluates multiple nodes', () => {
      const nodes = [
        makeNode([createLayerRule('evidence')]),
        makeNode([createLayerRule('geometry')]),
      ];
      const results = evaluateBatchVisibility(nodes, {
        hypothesisActive: true,
        activeLayer: 'evidence',
      });
      expect(results[0].visible).toBe(true);
      expect(results[1].visible).toBe(false);
    });
  });

  describe('filterVisibleNodes', () => {
    it('filters to only visible nodes', () => {
      const nodes = [
        makeNode([createLayerRule('evidence')]),
        makeNode([createLayerRule('geometry')]),
      ];
      const visible = filterVisibleNodes(nodes, {
        hypothesisActive: true,
        activeLayer: 'evidence',
      });
      expect(visible).toHaveLength(1);
      expect(visible[0].id).toBe('NODE-001');
    });
  });

  describe('rule factories', () => {
    it('creates layer rule', () => {
      expect(createLayerRule('test').layer).toBe('test');
    });

    it('creates chronology rule', () => {
      expect(createChronologyRule('test').chronologyPeriod).toBe('test');
    });

    it('creates evidence rule', () => {
      expect(createEvidenceRule(5).minEvidenceCount).toBe(5);
    });
  });
});
