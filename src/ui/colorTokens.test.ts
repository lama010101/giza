import { describe, it, expect } from 'vitest';
import {
  STONE,
  SAND,
  COPPER,
  DARK_SLATE,
  SOFT_BLUE,
  EVIDENCE_OVERLAY_COLORS,
  CSS_VARS,
  evidenceClassToOverlayColor,
  confidenceToOverlayColor,
} from './colorTokens';

describe('Color Token System (M07-T02)', () => {
  it('defines all 5 palette families', () => {
    expect(STONE).toBeDefined();
    expect(SAND).toBeDefined();
    expect(COPPER).toBeDefined();
    expect(DARK_SLATE).toBeDefined();
    expect(SOFT_BLUE).toBeDefined();
  });

  it('Stone palette has 13 shades from 950 (darkest) to 10 (lightest)', () => {
    expect(STONE[950]).toMatch(/^#/);
    expect(STONE[10]).toMatch(/^#/);
    expect(STONE[950]).not.toBe(STONE[10]);
  });

  it('Sand palette has warm desert tones', () => {
    expect(SAND[500]).toMatch(/^#/);
    // Sand should be warmer (higher R) than Stone
    const sandR = parseInt(SAND[500].slice(1, 3), 16);
    const stoneR = parseInt(STONE[500].slice(1, 3), 16);
    expect(sandR).toBeGreaterThan(stoneR);
  });

  it('Copper palette has metallic accent tones', () => {
    expect(COPPER[500]).toMatch(/^#/);
    // Copper 500 is the canonical copper color
    expect(COPPER[500].toLowerCase()).toBe('#b87333');
  });

  it('Dark Slate palette has cool dark tones', () => {
    expect(DARK_SLATE[800]).toMatch(/^#/);
    // Dark slate should have a blue tint (B > R)
    const b = parseInt(DARK_SLATE[800].slice(5, 7), 16);
    const r = parseInt(DARK_SLATE[800].slice(1, 3), 16);
    expect(b).toBeGreaterThan(r);
  });

  it('Soft Blue palette is the primary action color', () => {
    expect(SOFT_BLUE[500]).toMatch(/^#/);
    expect(SOFT_BLUE[500].toLowerCase()).toBe('#3b82f6');
  });

  it('defines 5 evidence overlay colors per GIZA-04 §6.20', () => {
    expect(EVIDENCE_OVERLAY_COLORS.green).toBeDefined();
    expect(EVIDENCE_OVERLAY_COLORS.blue).toBeDefined();
    expect(EVIDENCE_OVERLAY_COLORS.orange).toBeDefined();
    expect(EVIDENCE_OVERLAY_COLORS.purple).toBeDefined();
    expect(EVIDENCE_OVERLAY_COLORS.red).toBeDefined();
  });

  it('CSS_VARS maps all tokens to custom property names', () => {
    expect(CSS_VARS['--stone-950']).toBe(STONE[950]);
    expect(CSS_VARS['--copper-500']).toBe(COPPER[500]);
    expect(CSS_VARS['--blue-500']).toBe(SOFT_BLUE[500]);
    expect(CSS_VARS['--ev-green']).toBe(EVIDENCE_OVERLAY_COLORS.green);
  });

  it('evidenceClassToOverlayColor maps E1→green, E2→blue, E3/E4→orange', () => {
    expect(evidenceClassToOverlayColor('E1')).toBe('green');
    expect(evidenceClassToOverlayColor('E2')).toBe('blue');
    expect(evidenceClassToOverlayColor('E3')).toBe('orange');
    expect(evidenceClassToOverlayColor('E4')).toBe('orange');
  });

  it('confidenceToOverlayColor maps confidence ranges correctly', () => {
    expect(confidenceToOverlayColor(95)).toBe('green');
    expect(confidenceToOverlayColor(85)).toBe('green');
    expect(confidenceToOverlayColor(75)).toBe('blue');
    expect(confidenceToOverlayColor(70)).toBe('blue');
    expect(confidenceToOverlayColor(55)).toBe('orange');
    expect(confidenceToOverlayColor(40)).toBe('red');
  });
});
