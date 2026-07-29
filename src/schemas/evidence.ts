import { z } from 'zod';
import { EvidenceId, LocationId, ObjectId, SourceId } from './identifiers';

export const EvidenceClass = z.enum(['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8']);

export type EvidenceClass = z.infer<typeof EvidenceClass>;

export const EvidenceStatus = z.enum([
  'Draft',
  'Submitted',
  'In Review',
  'Verified',
  'Published',
  'Superseded',
  'Retracted',
]);

export type EvidenceStatus = z.infer<typeof EvidenceStatus>;

export const GeometryRefSchema = z.object({
  meshId: z.string().min(1),
  relation: z.enum([
    'measured_from',
    'reconstructed_from',
    'inferred_from',
    'deviation_validated_against',
    'texture_source_for',
  ]),
  confidenceContribution: z.number().min(0).max(1).default(1),
});

export type GeometryRef = z.infer<typeof GeometryRefSchema>;

export const ChronologyTagSchema = z.object({
  period: z.string().min(1),
  scope: z.string().min(1),
});

export type ChronologyTag = z.infer<typeof ChronologyTagSchema>;

export const ReviewEntrySchema = z.object({
  iteration: z.number().int().positive(),
  reviewer: z.string().min(1),
  decision: z.enum(['approve', 'reject', 'revise']),
  comments: z.string().default(''),
  date: z.string().default(''),
});

export type ReviewEntry = z.infer<typeof ReviewEntrySchema>;

export const EvidenceCategory = z.enum([
  'Measurement',
  'Observation',
  'Reconstruction',
  'Inference',
  'Photograph',
  'Scan',
  'Publication',
  'Report',
  'Survey',
]);

export type EvidenceCategory = z.infer<typeof EvidenceCategory>;

export const EvidenceSchema = z.object({
  id: EvidenceId,
  title: z.string().min(1),
  description: z.string().default(''),
  category: EvidenceCategory,
  primaryClass: EvidenceClass.default('E2'),
  secondaryClasses: z.array(EvidenceClass).default([]),
  confidence: z.number().int().min(0).max(100),
  confidenceBasis: z.string().default(''),
  measurementQuality: z.number().int().min(0).max(100).optional(),
  consensus: z.number().int().min(0).max(100).optional(),
  directObservation: z.number().int().min(0).max(100).optional(),
  status: EvidenceStatus,
  lifecycleState: EvidenceStatus.optional(),
  sourceIds: z.array(SourceId).default([]),
  locationId: LocationId.optional(),
  objectIds: z.array(ObjectId).default([]),
  geometryRefs: z.array(GeometryRefSchema).default([]),
  mediaIds: z.array(z.string()).default([]),
  dependencyIds: z.array(EvidenceId).default([]),
  conflictIds: z.array(z.string()).default([]),
  chronologyTags: z.array(ChronologyTagSchema).default([]),
  tags: z.array(z.string()).default([]),
  reviewLog: z.array(ReviewEntrySchema).default([]),
  version: z.number().int().positive().default(1),
  created: z.string().default(''),
  updated: z.string().default(''),
  createdBy: z.string().default(''),
  updatedBy: z.string().default(''),
});

export type Evidence = z.infer<typeof EvidenceSchema>;
