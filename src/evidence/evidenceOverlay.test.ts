import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  getOverlayColor,
  getOverlayColorByConfidence,
  getOverlayLabel,
  getOverlayColorHex,
} from './evidenceOverlay';
import { OVERLAY_COLORS } from './evidenceOverlay';
import type { Evidence } from '@/schemas/evidence';
import { EvidenceSchema } from '@/schemas/evidence';

function makeEvidence(overrides: Partial<z.input<typeof EvidenceSchema>>): Evidence {
  return EvidenceSchema.parse({
    id: 'EV-000001',
    title: 'Test',
    description: 'Test description',
    category: 'Survey',
    primaryClass: 'E2',
    confidence: 80,
    status: 'Published',
    sourceIds: ['SRC-0001'],
    objectIds: ['OBJ-0001'],
    version: 1,
    created: '',
    updated: '',
    ...overrides,
  });
}

describe('Evidence Overlay Color System (M08-T03)', () => {
  it('defines 5 overlay colors per GIZA-04 §6.20', () => {
    expect(OVERLAY_COLORS.green).toBe('#22c55e');
    expect(OVERLAY_COLORS.blue).toBe('#3b82f6');
    expect(OVERLAY_COLORS.orange).toBe('#f59e0b');
    expect(OVERLAY_COLORS.purple).toBe('#a855f7');
    expect(OVERLAY_COLORS.red).toBe('#ef4444');
  });

  it('maps E1 (direct observation) to green', () => {
    const ev = makeEvidence({ primaryClass: 'E1' });
    expect(getOverlayColor(ev)).toBe(OVERLAY_COLORS.green);
  });

  it('maps E2 (measured) to blue', () => {
    const ev = makeEvidence({ primaryClass: 'E2' });
    expect(getOverlayColor(ev)).toBe(OVERLAY_COLORS.blue);
  });

  it('maps E3 (interpretation) to orange', () => {
    const ev = makeEvidence({ primaryClass: 'E3' });
    expect(getOverlayColor(ev)).toBe(OVERLAY_COLORS.orange);
  });

  it('maps E4 (publication) to orange', () => {
    const ev = makeEvidence({ primaryClass: 'E4' });
    expect(getOverlayColor(ev)).toBe(OVERLAY_COLORS.orange);
  });

  it('maps simulation evidence (by tag) to purple', () => {
    const ev = makeEvidence({ primaryClass: 'E2', tags: ['simulation'] });
    expect(getOverlayColor(ev)).toBe(OVERLAY_COLORS.purple);
  });

  it('maps contradictory evidence (by tag) to red', () => {
    const ev = makeEvidence({ primaryClass: 'E1', tags: ['contradictory'] });
    expect(getOverlayColor(ev)).toBe(OVERLAY_COLORS.red);
  });

  it('maps retracted evidence to red', () => {
    const ev = makeEvidence({ primaryClass: 'E1', status: 'Retracted' });
    expect(getOverlayColor(ev)).toBe(OVERLAY_COLORS.red);
  });

  it('getOverlayColorByConfidence maps ranges correctly', () => {
    expect(getOverlayColorByConfidence(95)).toBe(OVERLAY_COLORS.green);
    expect(getOverlayColorByConfidence(75)).toBe(OVERLAY_COLORS.blue);
    expect(getOverlayColorByConfidence(55)).toBe(OVERLAY_COLORS.orange);
    expect(getOverlayColorByConfidence(30)).toBe(OVERLAY_COLORS.red);
  });

  it('getOverlayLabel returns human-readable labels', () => {
    expect(getOverlayLabel('green')).toBe('High confidence');
    expect(getOverlayLabel('blue')).toBe('Measured');
    expect(getOverlayLabel('orange')).toBe('Interpretation');
    expect(getOverlayLabel('purple')).toBe('Simulation');
    expect(getOverlayLabel('red')).toBe('Contradictory');
  });

  it('getOverlayColorHex returns hex for each color', () => {
    expect(getOverlayColorHex('green')).toBe('#22c55e');
    expect(getOverlayColorHex('blue')).toBe('#3b82f6');
  });
});
