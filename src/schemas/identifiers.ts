import { z } from 'zod';

export const EvidenceId = z.string().regex(/^EV-\d{6}$/, 'Expected EV-NNNNNN');
export type EvidenceId = z.infer<typeof EvidenceId>;

export const SourceId = z.string().regex(/^SRC-\d{4}$/, 'Expected SRC-NNNN');
export type SourceId = z.infer<typeof SourceId>;

export const ObjectId = z.string().regex(/^OBJ-\d{4}$/, 'Expected OBJ-NNNN');
export type ObjectId = z.infer<typeof ObjectId>;

export const LocationId = z.string().regex(/^LOC-\d{3}$/, 'Expected LOC-NNN');
export type LocationId = z.infer<typeof LocationId>;

export const TheoryId = z.string().regex(/^THEORY-[A-Z0-9-]+$/, 'Expected THEORY-NNN');
export type TheoryId = z.infer<typeof TheoryId>;

export const PredictionId = z.string().regex(/^PRED-[A-Z0-9-]+-\d{2}$/, 'Expected PRED-NNN-NN');
export type PredictionId = z.infer<typeof PredictionId>;

export const SimulationId = z.string().regex(/^SIM-\d{3}$/, 'Expected SIM-NNN');
export type SimulationId = z.infer<typeof SimulationId>;
