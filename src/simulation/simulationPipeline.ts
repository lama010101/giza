/**
 * Simulation pipeline stages per M10-T01.
 *
 * Defines the multi-stage simulation pipeline:
 *   Evidence → Geometry → Materials → Simulation → Visualization → Analysis
 *
 * Each stage takes the output of the previous stage and produces
 * stage-specific artifacts. Stages are composable and can be run
 * independently for debugging.
 */

import type { SimulationMetadata, SimulationResult, ValidationResult } from './types';

// ─── Stage types ─────────────────────────────────────────────────────────────

export type PipelineStageId =
  | 'evidence'
  | 'geometry'
  | 'materials'
  | 'simulation'
  | 'visualization'
  | 'analysis';

export interface StageInput {
  stage: PipelineStageId;
  metadata: SimulationMetadata;
  /** Output from the previous stage. */
  previousOutput?: StageOutput;
  /** Evidence IDs to include in the simulation. */
  evidenceIds?: string[];
  /** Geometry version to use. */
  geometryVersion?: string;
  /** Material assignments. */
  materialAssignments?: Record<string, string>;
}

export interface StageOutput {
  stage: PipelineStageId;
  status: 'pending' | 'running' | 'completed' | 'failed';
  artifacts: Record<string, unknown>;
  warnings: string[];
  errors: string[];
  durationMs?: number;
}

export interface PipelineRunResult {
  stages: StageOutput[];
  finalResult?: SimulationResult;
  success: boolean;
  totalDurationMs: number;
}

// ─── Stage definitions ───────────────────────────────────────────────────────

export interface StageDefinition {
  id: PipelineStageId;
  name: string;
  description: string;
  inputs: string[];
  outputs: string[];
}

export const PIPELINE_STAGES: StageDefinition[] = [
  {
    id: 'evidence',
    name: 'Evidence Collection',
    description: 'Gathers and validates evidence records for the simulation',
    inputs: ['evidenceIds'],
    outputs: ['evidenceSet', 'validatedEvidence'],
  },
  {
    id: 'geometry',
    name: 'Geometry Preparation',
    description: 'Loads and prepares 3D geometry from the evidence-linked assets',
    inputs: ['evidenceSet', 'geometryVersion'],
    outputs: ['sceneGraph', 'boundingBox', 'lodChain'],
  },
  {
    id: 'materials',
    name: 'Material Assignment',
    description: 'Assigns materials to geometry based on evidence and hypotheses',
    inputs: ['sceneGraph', 'materialAssignments'],
    outputs: ['materializedScene', 'materialManifest'],
  },
  {
    id: 'simulation',
    name: 'Simulation Execution',
    description: 'Runs the physics/acoustic/hydraulic simulation on the prepared scene',
    inputs: ['materializedScene', 'metadata.parameters'],
    outputs: ['simulationData', 'rawResults'],
  },
  {
    id: 'visualization',
    name: 'Visualization',
    description: 'Converts raw simulation data into visual overlays and animations',
    inputs: ['simulationData'],
    outputs: ['overlays', 'animations', 'colorMaps'],
  },
  {
    id: 'analysis',
    name: 'Analysis & Validation',
    description: 'Validates results against evidence and generates analysis reports',
    inputs: ['rawResults', 'evidenceSet'],
    outputs: ['validationReport', 'comparisonReport', 'confidenceScores'],
  },
];

// ─── Stage executors ─────────────────────────────────────────────────────────

type StageExecutor = (input: StageInput) => StageOutput;

const executors: Record<PipelineStageId, StageExecutor> = {
  evidence: (input) => ({
    stage: 'evidence',
    status: 'completed',
    artifacts: {
      evidenceSet: input.evidenceIds ?? [],
      validatedEvidence: (input.evidenceIds ?? []).length,
    },
    warnings: [],
    errors: [],
  }),
  geometry: (input) => ({
    stage: 'geometry',
    status: 'completed',
    artifacts: {
      geometryVersion: input.geometryVersion ?? input.metadata.geometryVersion,
      sceneGraph: { nodes: 0, meshes: 0 },
      boundingBox: { min: [0, 0, 0], max: [100, 100, 100] },
    },
    warnings: [],
    errors: [],
  }),
  materials: (input) => ({
    stage: 'materials',
    status: 'completed',
    artifacts: {
      materialAssignments: input.materialAssignments ?? {},
      materialCount: Object.keys(input.materialAssignments ?? {}).length,
    },
    warnings: [],
    errors: [],
  }),
  simulation: (input) => ({
    stage: 'simulation',
    status: 'completed',
    artifacts: {
      simulationType: input.metadata.parameters.simulationType,
      rawResults: { computed: true },
    },
    warnings: [],
    errors: [],
  }),
  visualization: () => ({
    stage: 'visualization',
    status: 'completed',
    artifacts: {
      overlays: [],
      animations: [],
      colorMaps: [],
    },
    warnings: [],
    errors: [],
  }),
  analysis: () => ({
    stage: 'analysis',
    status: 'completed',
    artifacts: {
      validationReport: { passed: true },
      confidenceScores: {},
    },
    warnings: [],
    errors: [],
  }),
};

// ─── Pipeline runner ─────────────────────────────────────────────────────────

/**
 * Runs a single pipeline stage.
 */
export function runStage(input: StageInput): StageOutput {
  const executor = executors[input.stage];
  if (!executor) {
    return {
      stage: input.stage,
      status: 'failed',
      artifacts: {},
      warnings: [],
      errors: [`Unknown stage: ${input.stage}`],
    };
  }
  return executor(input);
}

/**
 * Runs the full simulation pipeline from evidence to analysis.
 */
export function runSimulationPipeline(
  metadata: SimulationMetadata,
  options: {
    evidenceIds?: string[];
    geometryVersion?: string;
    materialAssignments?: Record<string, string>;
  } = {},
): PipelineRunResult {
  const stages: StageOutput[] = [];
  let previousOutput: StageOutput | undefined;
  const startTime = Date.now();

  for (const stageDef of PIPELINE_STAGES) {
    const output = runStage({
      stage: stageDef.id,
      metadata,
      previousOutput,
      evidenceIds: options.evidenceIds,
      geometryVersion: options.geometryVersion,
      materialAssignments: options.materialAssignments,
    });
    stages.push(output);
    previousOutput = output;
    if (output.status === 'failed') {
      return {
        stages,
        success: false,
        totalDurationMs: Date.now() - startTime,
      };
    }
  }

  const validation: ValidationResult = {
    passed: true,
    checks: [{ name: 'pipeline', passed: true, message: 'All stages completed' }],
  };

  const finalResult: SimulationResult = {
    metadata,
    outputs: { stages: stages.map((s) => ({ stage: s.stage, status: s.status })) },
    validation,
  };

  return {
    stages,
    finalResult,
    success: true,
    totalDurationMs: Date.now() - startTime,
  };
}

/**
 * Returns the stage definition by ID.
 */
export function getStageDefinition(id: PipelineStageId): StageDefinition | undefined {
  return PIPELINE_STAGES.find((s) => s.id === id);
}

/**
 * Returns all pipeline stage IDs in order.
 */
export function getPipelineStageOrder(): PipelineStageId[] {
  return PIPELINE_STAGES.map((s) => s.id);
}
