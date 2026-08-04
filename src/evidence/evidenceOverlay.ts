/**
 * Evidence overlay color system per GIZA - 04 §6.20.
 *
 * Maps evidence records to overlay colors:
 *   Green  = High confidence (direct observation, E1)
 *   Blue   = Measured (E2)
 *   Orange = Interpretation (E3, E4)
 *   Purple = Simulation
 *   Red    = Contradictory evidence
 *
 * Evidence overlays are hypothesis-agnostic — they are always available
 * regardless of which hypotheses are active.
 */

import { EVIDENCE_OVERLAY_COLORS, type EvidenceOverlayColor } from '@/ui/colorTokens';
import type { Evidence } from '@/schemas/evidence';

export const OVERLAY_COLORS = EVIDENCE_OVERLAY_COLORS;

export const OVERLAY_COLOR_ARRAY = Object.values(OVERLAY_COLORS) as string[];

export function getOverlayColor(ev: Evidence): string {
  // Simulation evidence → purple
  if (ev.tags?.includes('simulation')) {
    return OVERLAY_COLORS.purple;
  }
  // Contradictory evidence → red
  if (ev.tags?.includes('contradictory') || ev.status === 'Retracted') {
    return OVERLAY_COLORS.red;
  }
  // Map by primary class
  switch (ev.primaryClass) {
    case 'E1':
      return OVERLAY_COLORS.green;
    case 'E2':
      return OVERLAY_COLORS.blue;
    case 'E3':
    case 'E4':
      return OVERLAY_COLORS.orange;
    default:
      return OVERLAY_COLORS.blue;
  }
}

export function getOverlayColorByConfidence(confidence: number): string {
  if (confidence >= 85) return OVERLAY_COLORS.green;
  if (confidence >= 70) return OVERLAY_COLORS.blue;
  if (confidence >= 50) return OVERLAY_COLORS.orange;
  return OVERLAY_COLORS.red;
}

export function getOverlayLabel(color: EvidenceOverlayColor): string {
  switch (color) {
    case 'green':
      return 'High confidence';
    case 'blue':
      return 'Measured';
    case 'orange':
      return 'Interpretation';
    case 'purple':
      return 'Simulation';
    case 'red':
      return 'Contradictory';
  }
}

export function getOverlayColorHex(color: EvidenceOverlayColor): string {
  return OVERLAY_COLORS[color];
}
