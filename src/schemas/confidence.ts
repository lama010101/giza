/**
 * Confidence scale constants and helper per GIZA - 01 Vision & Scientific
 * Foundation §6.
 *
 * Confidence is continuous (0–100), not binary. The scale below maps score
 * ranges to human-readable meanings used in UI labels and tooltips.
 */
export const CONFIDENCE_SCALE = {
  100: 'Measured directly',
  95: 'Multiple independent measurements',
  90: 'Strong archaeological consensus',
  80: 'Highly probable',
  70: 'Reasonable inference',
  60: 'Plausible',
  50: 'Competing interpretations',
  40: 'Weak evidence',
  30: 'Mostly speculative',
  20: 'Little supporting evidence',
  10: 'Hypothesis only',
} as const;

export type ConfidenceScore = 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 90 | 95 | 100;

/**
 * Returns the human-readable meaning string for a confidence score by
 * matching to the nearest defined scale point (per GIZA - 01 §6).
 */
export function confidenceLabel(score: number): string {
  const anchors = Object.keys(CONFIDENCE_SCALE)
    .map(Number)
    .sort((a, b) => a - b);
  let nearest = anchors[0];
  let minDelta = Math.abs(score - nearest);
  for (const anchor of anchors) {
    const delta = Math.abs(score - anchor);
    if (delta < minDelta) {
      minDelta = delta;
      nearest = anchor;
    }
  }
  return CONFIDENCE_SCALE[nearest as ConfidenceScore];
}
