/**
 * Survey deviation validator per M06A-T09 and M06.5-T06.
 *
 * Validates that reconstructed geometry deviates from survey
 * measurements within acceptable tolerances.
 */

export interface SurveyPoint {
  id: string;
  position: { x: number; y: number; z: number };
  confidence: number; // 0-100
  source: string; // Survey reference
}

export interface DeviationResult {
  pointId: string;
  surveyPoint: SurveyPoint;
  reconstructedPosition: { x: number; y: number; z: number };
  deviation: number; // in meters
  withinTolerance: boolean;
}

export interface DeviationReport {
  results: DeviationResult[];
  maxDeviation: number;
  meanDeviation: number;
  rmsDeviation: number;
  pointsWithinTolerance: number;
  totalPoints: number;
  passRate: number; // 0-1
  passed: boolean;
}

/**
 * Default tolerances by confidence level.
 */
export const TOLERANCE_BY_CONFIDENCE: Record<string, number> = {
  high: 0.005, // 5mm for high-confidence points
  medium: 0.02, // 2cm for medium-confidence
  low: 0.1, // 10cm for low-confidence
};

function getTolerance(confidence: number): number {
  if (confidence >= 80) return TOLERANCE_BY_CONFIDENCE.high;
  if (confidence >= 50) return TOLERANCE_BY_CONFIDENCE.medium;
  return TOLERANCE_BY_CONFIDENCE.low;
}

/**
 * Validates reconstructed geometry against survey points.
 */
export function validateSurveyDeviation(
  surveyPoints: SurveyPoint[],
  reconstructedPositions: Map<string, { x: number; y: number; z: number }>,
  customTolerance?: number,
): DeviationReport {
  const results: DeviationResult[] = [];

  for (const surveyPoint of surveyPoints) {
    const reconstructed = reconstructedPositions.get(surveyPoint.id);
    if (!reconstructed) continue;

    const dx = reconstructed.x - surveyPoint.position.x;
    const dy = reconstructed.y - surveyPoint.position.y;
    const dz = reconstructed.z - surveyPoint.position.z;
    const deviation = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const tolerance = customTolerance ?? getTolerance(surveyPoint.confidence);

    results.push({
      pointId: surveyPoint.id,
      surveyPoint,
      reconstructedPosition: reconstructed,
      deviation,
      withinTolerance: deviation <= tolerance,
    });
  }

  const deviations = results.map((r) => r.deviation);
  const maxDeviation = Math.max(...deviations, 0);
  const meanDeviation = deviations.reduce((a, b) => a + b, 0) / deviations.length;
  const rmsDeviation = Math.sqrt(deviations.reduce((sum, d) => sum + d * d, 0) / deviations.length);
  const pointsWithinTolerance = results.filter((r) => r.withinTolerance).length;
  const passRate = pointsWithinTolerance / results.length;

  return {
    results,
    maxDeviation,
    meanDeviation,
    rmsDeviation,
    pointsWithinTolerance,
    totalPoints: results.length,
    passRate,
    passed: passRate >= 0.95, // 95% of points must be within tolerance
  };
}

/**
 * Returns a summary of deviations grouped by confidence level.
 */
export function summarizeByConfidence(
  report: DeviationReport,
): { confidence: string; count: number; meanDeviation: number; passRate: number }[] {
  const groups = new Map<string, DeviationResult[]>();

  for (const result of report.results) {
    const conf =
      result.surveyPoint.confidence >= 80
        ? 'high'
        : result.surveyPoint.confidence >= 50
          ? 'medium'
          : 'low';
    if (!groups.has(conf)) groups.set(conf, []);
    groups.get(conf)!.push(result);
  }

  return [...groups.entries()].map(([confidence, results]) => ({
    confidence,
    count: results.length,
    meanDeviation: results.reduce((a, b) => a + b.deviation, 0) / results.length,
    passRate: results.filter((r) => r.withinTolerance).length / results.length,
  }));
}
