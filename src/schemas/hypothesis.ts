import { z } from 'zod';
import { EvidenceId, ObjectId, SimulationId, SourceId, TheoryId } from './identifiers';
import { PredictionSchema } from './prediction';
import { AuthorSchema } from './person';

export const HypothesisStatus = z.enum(['draft', 'in-review', 'published', 'deprecated']);

export type HypothesisStatus = z.infer<typeof HypothesisStatus>;

export const ConfidenceWeightSchema = z.object({
  sourceReliability: z.number().min(0).max(1).default(0.35),
  measurementQuality: z.number().min(0).max(1).default(0.3),
  consensus: z.number().min(0).max(1).default(0.2),
  directObservation: z.number().min(0).max(1).default(0.15),
});

export type ConfidenceWeight = z.infer<typeof ConfidenceWeightSchema>;

export const ConfidenceModelSchema = z.object({
  weights: ConfidenceWeightSchema,
  notes: z.string().optional(),
});

export type ConfidenceModel = z.infer<typeof ConfidenceModelSchema>;

export const VisualizationRuleSchema = z.object({
  target: ObjectId,
  overlay: z.string().min(1),
  color: z.string().optional(),
  opacity: z.number().min(0).max(1).optional(),
  label: z.string().optional(),
  annotation: z.string().optional(),
  simulationOverlay: SimulationId.optional(),
  conditions: z.record(z.string(), z.unknown()).default({}),
});

export type VisualizationRule = z.infer<typeof VisualizationRuleSchema>;

export const PluginMetadataSchema = z.object({
  package: z.string().min(1),
  version: z.string().min(1),
  entry: z.string().min(1),
  configSchema: z.string().optional(),
});

export type PluginMetadata = z.infer<typeof PluginMetadataSchema>;

export const HypothesisSchema = z.object({
  id: TheoryId,
  name: z.string().min(1),
  description: z.string().min(1),
  authors: z.array(AuthorSchema),
  historicalBackground: z.string().optional(),
  scientificAssumptions: z.array(z.string()).default([]),
  predictions: z.array(PredictionSchema).default([]),
  affectedStructures: z.array(ObjectId).default([]),
  supports: z.array(EvidenceId).default([]),
  contradicts: z.array(EvidenceId).default([]),
  requiredEvidence: z.array(EvidenceId).default([]),
  simulations: z.array(SimulationId).default([]),
  visualizationRules: z.array(VisualizationRuleSchema).default([]),
  confidence: z.number().int().min(0).max(100),
  confidenceByObject: z.record(ObjectId, z.number().int().min(0).max(100)).default({}),
  confidenceModel: ConfidenceModelSchema.optional(),
  references: z.array(SourceId),
  bibliography: z.array(SourceId).default([]),
  plugin: PluginMetadataSchema.optional(),
  status: HypothesisStatus,
  tags: z.array(z.string()).default([]),
});

export type Hypothesis = z.infer<typeof HypothesisSchema>;
