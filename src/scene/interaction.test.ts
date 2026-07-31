import { describe, it, expect } from 'vitest';
import {
  resolveInteractionType,
  shouldOpenEvidenceView,
  shouldOpenTheoryView,
} from './interaction';
import type { RaycastHit } from './interaction';

describe('Raycast Interaction System (M08-T01)', () => {
  describe('resolveInteractionType', () => {
    it('returns measure when measurement mode is on', () => {
      expect(resolveInteractionType('Explore', true, false)).toBe('measure');
    });

    it('returns bookmark when shift is held', () => {
      expect(resolveInteractionType('Explore', false, true)).toBe('bookmark');
    });

    it('returns inspect in Research mode', () => {
      expect(resolveInteractionType('Research', false, false)).toBe('inspect');
    });

    it('returns focus by default', () => {
      expect(resolveInteractionType('Explore', false, false)).toBe('focus');
    });

    it('measurement mode takes priority over shift', () => {
      expect(resolveInteractionType('Explore', true, true)).toBe('measure');
    });
  });

  describe('shouldOpenEvidenceView', () => {
    it('returns true when hit has evidence IDs', () => {
      const hit: RaycastHit = {
        nodeId: 'node-1',
        evidenceIds: ['EV-100001'],
        point: { x: 0, y: 0, z: 0 },
        distance: 5,
      };
      expect(shouldOpenEvidenceView(hit)).toBe(true);
    });

    it('returns false when hit has no evidence IDs', () => {
      const hit: RaycastHit = {
        nodeId: 'node-1',
        point: { x: 0, y: 0, z: 0 },
        distance: 5,
      };
      expect(shouldOpenEvidenceView(hit)).toBe(false);
    });

    it('returns false when evidence IDs array is empty', () => {
      const hit: RaycastHit = {
        nodeId: 'node-1',
        evidenceIds: [],
        point: { x: 0, y: 0, z: 0 },
        distance: 5,
      };
      expect(shouldOpenEvidenceView(hit)).toBe(false);
    });
  });

  describe('shouldOpenTheoryView', () => {
    it('returns true when hit has object ID and hypotheses are active', () => {
      const hit: RaycastHit = {
        nodeId: 'node-1',
        objectId: 'OBJ-0101',
        point: { x: 0, y: 0, z: 0 },
        distance: 5,
      };
      expect(shouldOpenTheoryView(hit, true)).toBe(true);
    });

    it('returns false when no hypotheses are active', () => {
      const hit: RaycastHit = {
        nodeId: 'node-1',
        objectId: 'OBJ-0101',
        point: { x: 0, y: 0, z: 0 },
        distance: 5,
      };
      expect(shouldOpenTheoryView(hit, false)).toBe(false);
    });

    it('returns false when hit has no object ID', () => {
      const hit: RaycastHit = {
        nodeId: 'node-1',
        point: { x: 0, y: 0, z: 0 },
        distance: 5,
      };
      expect(shouldOpenTheoryView(hit, true)).toBe(false);
    });
  });
});
