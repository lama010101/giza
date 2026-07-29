import { z } from 'zod';
import { EvidenceId, PredictionId, TheoryId } from './identifiers';

export const PredictionStatus = z.enum([
  'untested',
  'confirmed',
  'partially-confirmed',
  'contradicted',
  'inconclusive',
]);

export type PredictionStatus = z.infer<typeof PredictionStatus>;

export const PredictionSchema = z.object({
  id: PredictionId,
  hypothesisId: TheoryId,
  description: z.string().min(1),
  predictedObservation: z.string().default(''),
  evidenceRefs: z.array(EvidenceId).default([]),
  status: PredictionStatus.default('untested'),
  comparisonResult: z.unknown().nullable().optional(),
});

export type Prediction = z.infer<typeof PredictionSchema>;
