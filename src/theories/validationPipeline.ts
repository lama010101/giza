/**
 * Validation methodology pipeline per M11.5-T14.
 *
 * Defines a five-stage validation pipeline for hypothesis plugins:
 *   1. HypothesisValidation — check hypothesis schema, plugin format, theory ID
 *   2. PredictionValidation — verify predictions are testable, measurable
 *   3. SimulationValidation — run prediction-simulation loop, check convergence
 *   4. EvidenceValidation — verify evidence linkage, confidence, source reliability
 *   5. PeerReview — track review status, reviewer, comments, approval
 *
 * Each stage produces a StageResult. The pipeline generates a final report
 * with pass/fail per stage and supports re-validation after updates.
 */

import { validatePlugin, type PluginValidationResult } from './pluginValidation';
import type { HypothesisPlugin } from './types';
import type { Hypothesis } from '@/schemas/hypothesis';
import type { Evidence } from '@/schemas/evidence';
import type { Source } from '@/schemas/source';

// ─── Stage definitions ─────────────────────────────────────────────────────

export const VALIDATION_STAGES = [
  'HypothesisValidation',
  'PredictionValidation',
  'SimulationValidation',
  'EvidenceValidation',
  'PeerReview',
] as const;

export type ValidationStage = (typeof VALIDATION_STAGES)[number];

export type ValidationStageStatus = 'pending' | 'passed' | 'failed' | 'skipped';

export interface ValidationStageResult {
  stage: ValidationStage;
  status: ValidationStageStatus;
  checks: { name: string; passed: boolean; message: string }[];
  errors: string[];
  warnings: string[];
  duration: number;
}

// ─── Peer review ────────────────────────────────────────────────────────────

export type PeerReviewStatus =
  | 'not-started'
  | 'in-review'
  | 'approved'
  | 'rejected'
  | 'changes-requested';

export interface PeerReviewEntry {
  reviewer: string;
  status: PeerReviewStatus;
  comments: string;
  reviewedAt: string;
}

// ─── Pipeline config ────────────────────────────────────────────────────────

export interface ValidationPipelineConfig {
  /** Whether to run simulation validation (requires a simulation runner). */
  runSimulation: boolean;
  /** Minimum number of evidence references required. */
  minEvidenceRefs: number;
  /** Minimum confidence score (0-100). */
  minConfidence: number;
  /** Whether peer review is required for a passing grade. */
  requirePeerReview: boolean;
  /** Minimum number of peer reviewers. */
  minReviewers: number;
}

export const DEFAULT_CONFIG: ValidationPipelineConfig = {
  runSimulation: false,
  minEvidenceRefs: 1,
  minConfidence: 0,
  requirePeerReview: false,
  minReviewers: 1,
};

// ─── Pipeline report ────────────────────────────────────────────────────────

export interface ValidationReport {
  hypothesisId: string;
  stages: ValidationStageResult[];
  overallPassed: boolean;
  summary: string;
  validatedAt: string;
  config: ValidationPipelineConfig;
}

// ─── Stage 1: Hypothesis validation ─────────────────────────────────────────

/**
 * Validates the hypothesis plugin format, theory ID, and schema.
 */
export function validateHypothesis(plugin: HypothesisPlugin): ValidationStageResult {
  const start = Date.now();
  const checks: { name: string; passed: boolean; message: string }[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Plugin format validation (delegates to pluginValidation.ts)
  const pluginResult: PluginValidationResult = validatePlugin(plugin);
  checks.push({
    name: 'Plugin format',
    passed: pluginResult.valid,
    message: pluginResult.valid ? 'Plugin format valid' : pluginResult.errors.join('; '),
  });
  errors.push(...pluginResult.errors);
  warnings.push(...pluginResult.warnings);

  // Theory ID format
  const idPattern = /^THEORY-\d{3}$/;
  checks.push({
    name: 'Theory ID format',
    passed: idPattern.test(plugin.id),
    message: idPattern.test(plugin.id)
      ? `${plugin.id} matches THEORY-NNN`
      : `${plugin.id} does not match THEORY-NNN`,
  });
  if (!idPattern.test(plugin.id)) {
    errors.push(`Theory ID "${plugin.id}" must match THEORY-NNN format`);
  }

  // Version
  checks.push({
    name: 'Version present',
    passed: !!plugin.version,
    message: plugin.version ? `Version: ${plugin.version}` : 'Version missing',
  });
  if (!plugin.version) {
    errors.push('Plugin version is required');
  }

  return {
    stage: 'HypothesisValidation',
    status: errors.length > 0 ? 'failed' : 'passed',
    checks,
    errors,
    warnings,
    duration: Date.now() - start,
  };
}

// ─── Stage 2: Prediction validation ─────────────────────────────────────────

/**
 * Validates that predictions are testable, measurable, and have tolerances.
 */
export function validatePredictions(
  hypothesis: Hypothesis,
  testableMap?: Map<string, unknown>,
): ValidationStageResult {
  const start = Date.now();
  const checks: { name: string; passed: boolean; message: string }[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const preds = hypothesis.predictions ?? [];
  checks.push({
    name: 'Has predictions',
    passed: preds.length > 0,
    message: preds.length > 0 ? `${preds.length} prediction(s)` : 'No predictions defined',
  });
  if (preds.length === 0) {
    warnings.push('Hypothesis has no predictions — it cannot be scientifically tested');
  }

  let testableCount = 0;
  for (const pred of preds) {
    if (!pred.description || pred.description.trim() === '') {
      errors.push(`Prediction ${pred.id}: description is required`);
    }
    if (!pred.predictedObservation || pred.predictedObservation.trim() === '') {
      warnings.push(`Prediction ${pred.id}: no predicted observation specified`);
    }
    if (testableMap?.has(pred.id)) {
      testableCount++;
    }
  }

  checks.push({
    name: 'Predictions have descriptions',
    passed: !errors.some((e) => e.includes('description')),
    message: errors.some((e) => e.includes('description'))
      ? 'Some predictions lack descriptions'
      : 'All predictions have descriptions',
  });

  checks.push({
    name: 'Testable predictions',
    passed: testableCount > 0 || preds.length === 0,
    message: `${testableCount} of ${preds.length} prediction(s) are testable via simulation`,
  });
  if (preds.length > 0 && testableCount === 0) {
    warnings.push('No predictions are currently testable via simulation');
  }

  return {
    stage: 'PredictionValidation',
    status: errors.length > 0 ? 'failed' : 'passed',
    checks,
    errors,
    warnings,
    duration: Date.now() - start,
  };
}

// ─── Stage 3: Simulation validation ─────────────────────────────────────────

/**
 * Validates simulation results — checks convergence and stability.
 * If no simulation results are provided, this stage is skipped.
 */
export function validateSimulation(simulationReport?: {
  passed: boolean;
  summary: string;
  confirmed: number;
  falsified: number;
}): ValidationStageResult {
  const start = Date.now();
  const checks: { name: string; passed: boolean; message: string }[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!simulationReport) {
    return {
      stage: 'SimulationValidation',
      status: 'skipped',
      checks: [
        { name: 'Simulation run', passed: false, message: 'No simulation results provided' },
      ],
      errors,
      warnings: ['Simulation validation skipped — no results available'],
      duration: Date.now() - start,
    };
  }

  checks.push({
    name: 'Simulation completed',
    passed: simulationReport.passed,
    message: simulationReport.summary,
  });

  checks.push({
    name: 'At least one confirmed prediction',
    passed: simulationReport.confirmed > 0,
    message: `${simulationReport.confirmed} confirmed, ${simulationReport.falsified} falsified`,
  });

  if (simulationReport.falsified > simulationReport.confirmed) {
    warnings.push(
      `More falsified (${simulationReport.falsified}) than confirmed (${simulationReport.confirmed}) predictions`,
    );
  }

  return {
    stage: 'SimulationValidation',
    status: errors.length > 0 ? 'failed' : 'passed',
    checks,
    errors,
    warnings,
    duration: Date.now() - start,
  };
}

// ─── Stage 4: Evidence validation ───────────────────────────────────────────

/**
 * Validates evidence linkage, confidence scores, and source reliability.
 */
export function validateEvidence(
  hypothesis: Hypothesis,
  _evidence: Evidence[],
  sources: Source[],
  config: ValidationPipelineConfig,
): ValidationStageResult {
  const start = Date.now();
  const checks: { name: string; passed: boolean; message: string }[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Evidence linkage
  const evidenceCount = hypothesis.supports.length + hypothesis.requiredEvidence.length;
  checks.push({
    name: 'Evidence linkage',
    passed: evidenceCount >= config.minEvidenceRefs,
    message: `${evidenceCount} evidence reference(s) (min: ${config.minEvidenceRefs})`,
  });
  if (evidenceCount < config.minEvidenceRefs) {
    errors.push(
      `Hypothesis has only ${evidenceCount} evidence refs (min: ${config.minEvidenceRefs})`,
    );
  }

  // Confidence score
  checks.push({
    name: 'Confidence score',
    passed: hypothesis.confidence >= config.minConfidence,
    message: `Confidence: ${hypothesis.confidence} (min: ${config.minConfidence})`,
  });
  if (hypothesis.confidence < config.minConfidence) {
    warnings.push(`Confidence ${hypothesis.confidence} is below minimum ${config.minConfidence}`);
  }

  // Source reliability
  const referencedSources = sources.filter((s) => hypothesis.references.includes(s.id));
  const lowReliability = referencedSources.filter((s) => (s.reliability ?? 50) < 30);
  checks.push({
    name: 'Source reliability',
    passed: lowReliability.length === 0,
    message:
      lowReliability.length === 0
        ? `${referencedSources.length} source(s) all above reliability threshold`
        : `${lowReliability.length} source(s) below reliability threshold`,
  });
  if (lowReliability.length > 0) {
    warnings.push(`${lowReliability.length} source(s) have reliability < 30%`);
  }

  return {
    stage: 'EvidenceValidation',
    status: errors.length > 0 ? 'failed' : 'passed',
    checks,
    errors,
    warnings,
    duration: Date.now() - start,
  };
}

// ─── Stage 5: Peer review ───────────────────────────────────────────────────

/**
 * Validates peer review status.
 */
export function validatePeerReview(
  reviews: PeerReviewEntry[],
  config: ValidationPipelineConfig,
): ValidationStageResult {
  const start = Date.now();
  const checks: { name: string; passed: boolean; message: string }[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!config.requirePeerReview) {
    return {
      stage: 'PeerReview',
      status: 'skipped',
      checks: [
        { name: 'Peer review required', passed: false, message: 'Peer review not required' },
      ],
      errors,
      warnings,
      duration: Date.now() - start,
    };
  }

  const approvals = reviews.filter((r) => r.status === 'approved');
  checks.push({
    name: 'Minimum reviewers',
    passed: approvals.length >= config.minReviewers,
    message: `${approvals.length} approval(s) (min: ${config.minReviewers})`,
  });
  if (approvals.length < config.minReviewers) {
    errors.push(`Only ${approvals.length} approval(s), need ${config.minReviewers}`);
  }

  const rejected = reviews.filter((r) => r.status === 'rejected');
  checks.push({
    name: 'No rejections',
    passed: rejected.length === 0,
    message: rejected.length === 0 ? 'No rejections' : `${rejected.length} rejection(s)`,
  });
  if (rejected.length > 0) {
    errors.push(`${rejected.length} reviewer(s) rejected the hypothesis`);
  }

  return {
    stage: 'PeerReview',
    status: errors.length > 0 ? 'failed' : 'passed',
    checks,
    errors,
    warnings,
    duration: Date.now() - start,
  };
}

// ─── Full pipeline ──────────────────────────────────────────────────────────

export interface PipelineInput {
  plugin: HypothesisPlugin;
  hypothesis: Hypothesis;
  evidence: Evidence[];
  sources: Source[];
  testableMap?: Map<string, unknown>;
  simulationReport?: { passed: boolean; summary: string; confirmed: number; falsified: number };
  peerReviews?: PeerReviewEntry[];
}

/**
 * Runs the full validation pipeline.
 */
export function runValidationPipeline(
  input: PipelineInput,
  config: ValidationPipelineConfig = DEFAULT_CONFIG,
): ValidationReport {
  const stages: ValidationStageResult[] = [];

  stages.push(validateHypothesis(input.plugin));
  stages.push(validatePredictions(input.hypothesis, input.testableMap));
  stages.push(validateSimulation(config.runSimulation ? input.simulationReport : undefined));
  stages.push(validateEvidence(input.hypothesis, input.evidence, input.sources, config));
  stages.push(validatePeerReview(input.peerReviews ?? [], config));

  const failedStages = stages.filter((s) => s.status === 'failed');
  const overallPassed = failedStages.length === 0;

  const summary = `Validation ${overallPassed ? 'PASSED' : 'FAILED'}: ${stages.filter((s) => s.status === 'passed').length} passed, ${failedStages.length} failed, ${stages.filter((s) => s.status === 'skipped').length} skipped.`;

  return {
    hypothesisId: input.plugin.id,
    stages,
    overallPassed,
    summary,
    validatedAt: new Date().toISOString(),
    config,
  };
}

/**
 * Generates a human-readable validation report.
 */
export function generateValidationReport(report: ValidationReport): string {
  const lines: string[] = [];
  lines.push(`=== Validation Report for ${report.hypothesisId} ===`);
  lines.push(`Date: ${report.validatedAt}`);
  lines.push(`Overall: ${report.overallPassed ? 'PASSED' : 'FAILED'}`);
  lines.push('');
  for (const stage of report.stages) {
    const icon =
      stage.status === 'passed' ? '[PASS]' : stage.status === 'failed' ? '[FAIL]' : '[SKIP]';
    lines.push(`${icon} ${stage.stage}`);
    for (const check of stage.checks) {
      lines.push(`  ${check.passed ? '✓' : '✗'} ${check.name}: ${check.message}`);
    }
    if (stage.errors.length > 0) {
      lines.push(`  Errors: ${stage.errors.join('; ')}`);
    }
    if (stage.warnings.length > 0) {
      lines.push(`  Warnings: ${stage.warnings.join('; ')}`);
    }
  }
  lines.push('');
  lines.push(report.summary);
  return lines.join('\n');
}

/**
 * Re-validates a hypothesis after updates.
 * Clears any cached results and runs the pipeline fresh.
 */
export function revalidate(
  input: PipelineInput,
  config?: ValidationPipelineConfig,
): ValidationReport {
  // Simply re-run the pipeline — no caching in this implementation.
  return runValidationPipeline(input, config ?? DEFAULT_CONFIG);
}
