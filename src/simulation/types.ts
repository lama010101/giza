export type SimulationLifecycleState =
  | 'Idle'
  | 'ParameterSelection'
  | 'Validation'
  | 'Simulation'
  | 'Visualization'
  | 'Analysis'
  | 'Export';

export const LIFECYCLE_ORDER: SimulationLifecycleState[] = [
  'Idle',
  'ParameterSelection',
  'Validation',
  'Simulation',
  'Visualization',
  'Analysis',
  'Export',
];

export type ParameterProvenance =
  | 'Measured'
  | 'Published'
  | 'Estimated'
  | 'User-defined'
  | 'Experimental';

export interface ParameterEntry {
  name: string;
  value: number | string;
  provenance: ParameterProvenance;
  unit?: string;
  description?: string;
}

export interface ParameterSet {
  simulationType: string;
  version: number;
  parameters: ParameterEntry[];
}

export interface SimulationMetadata {
  id: string;
  softwareVersion: string;
  date: string;
  parameters: ParameterSet;
  author: string;
  geometryVersion: string;
  theoryContext: string;
  randomSeed: number;
}

export interface ValidationResult {
  passed: boolean;
  checks: ValidationCheck[];
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
  value?: number;
  threshold?: number;
}

export interface SimulationResult {
  metadata: SimulationMetadata;
  outputs: Record<string, unknown>;
  validation: ValidationResult;
}

export const SCIENTIFIC_TRANSPARENCY_DISCLAIMER =
  'This simulation demonstrates what would happen if a set of assumptions were true. ' +
  'It does not establish that those assumptions are historically correct. ' +
  'Parameters marked as Estimated or User-defined are assumptions, not measurements.';
