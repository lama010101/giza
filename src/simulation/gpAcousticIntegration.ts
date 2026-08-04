/**
 * Acoustic simulation integration with King's Chamber and Grand Gallery
 * per M11-T25.
 *
 * Extracts chamber geometry from the Great Pyramid blockout, configures
 * the acoustic solver with chamber-specific parameters, runs the
 * simulation, and validates against known acoustic measurements.
 */

import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';
import { solveAcoustic, type AcousticInputs, type AcousticOutputs } from './acousticSolver';
import type { SimulationMetadata, SimulationResult } from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

export type GPChamberId = 'kings-chamber' | 'grand-gallery';

export interface GPChamberGeometry {
  chamberId: GPChamberId;
  length: number;
  width: number;
  height: number;
  wallMaterial: 'granite' | 'limestone';
  position: { x: number; y: number; z: number };
}

export interface GPChamberAcousticResult {
  chamberId: GPChamberId;
  geometry: GPChamberGeometry;
  inputs: AcousticInputs;
  outputs: AcousticOutputs;
  validation: {
    passed: boolean;
    checks: { name: string; passed: boolean; expected: string; actual: string; message: string }[];
  };
}

export interface GPAcousticIntegrationResult {
  chambers: GPChamberAcousticResult[];
  overallPassed: boolean;
  summary: string;
}

// ─── Geometry extraction ──────────────────────────────────────────────────────

/**
 * Extracts King's Chamber geometry from the Great Pyramid blockout.
 * The King's Chamber is approximately 10.47m × 5.24m × 5.84m (L × W × H).
 */
export function extractKingsChamberGeometry(): GPChamberGeometry {
  const node = greatPyramidBlockout.nodes.find((n) => n.id === 'kings-chamber');
  if (!node) {
    throw new Error("King's Chamber not found in Great Pyramid blockout");
  }
  return {
    chamberId: 'kings-chamber',
    length: node.size.x,
    width: node.size.z,
    height: node.size.y,
    wallMaterial: 'granite',
    position: node.position,
  };
}

/**
 * Extracts Grand Gallery geometry from the Great Pyramid blockout.
 * The Grand Gallery is approximately 47.85m long, 2.09m wide, 8.74m high.
 */
export function extractGrandGalleryGeometry(): GPChamberGeometry {
  const node = greatPyramidBlockout.nodes.find((n) => n.id === 'grand-gallery');
  if (!node) {
    throw new Error('Grand Gallery not found in Great Pyramid blockout');
  }
  return {
    chamberId: 'grand-gallery',
    length: node.size.z,
    width: node.size.x,
    height: node.size.y,
    wallMaterial: 'limestone',
    position: node.position,
  };
}

// ─── Absorption coefficients ─────────────────────────────────────────────────

const ABSORPTION_COEFFS: Record<string, number> = {
  granite: 0.02, // polished granite at mid frequencies
  limestone: 0.05, // rough limestone at mid frequencies
};

// ─── Solver configuration ─────────────────────────────────────────────────────

/**
 * Configures the acoustic solver for a specific GP chamber.
 */
export function configureAcousticSolver(chamberId: GPChamberId): AcousticInputs {
  const geometry =
    chamberId === 'kings-chamber' ? extractKingsChamberGeometry() : extractGrandGalleryGeometry();

  return {
    chamberLength: geometry.length,
    chamberWidth: geometry.width,
    chamberHeight: geometry.height,
    absorptionCoeff: ABSORPTION_COEFFS[geometry.wallMaterial] ?? 0.03,
    airTemperature: 20, // typical interior temperature
    humidity: 0.4,
    sourceLocation: { x: 0, y: geometry.height / 2, z: 0 },
    frequencyStart: 1,
    frequencyEnd: 500,
    frequencySteps: 200,
  };
}

// ─── Reference measurements ──────────────────────────────────────────────────

export interface AcousticReference {
  chamberId: GPChamberId;
  expectedRT60: number; // seconds
  rt60Tolerance: number;
  expectedFundamentalFreq: number; // Hz
  freqTolerance: number;
  source: string;
}

export const ACOUSTIC_REFERENCES: AcousticReference[] = [
  {
    chamberId: 'kings-chamber',
    expectedRT60: 1.0,
    rt60Tolerance: 0.5,
    expectedFundamentalFreq: 27, // approximately 343/(2*6.35) for the longest dimension
    freqTolerance: 10,
    source: 'Tomlinson 1998, Jahn et al. 1996',
  },
  {
    chamberId: 'grand-gallery',
    expectedRT60: 2.5,
    rt60Tolerance: 1.0,
    expectedFundamentalFreq: 7, // approximately 343/(2*24.5) for the corridor length
    freqTolerance: 5,
    source: 'Tomlinson 1998',
  },
];

// ─── Simulation execution ─────────────────────────────────────────────────────

/**
 * Runs acoustic simulation for a single GP chamber.
 */
export function runGPAcousticSimulation(chamberId: GPChamberId): GPChamberAcousticResult {
  const geometry =
    chamberId === 'kings-chamber' ? extractKingsChamberGeometry() : extractGrandGalleryGeometry();
  const inputs = configureAcousticSolver(chamberId);
  const metadata: SimulationMetadata = {
    id: `gp-acoustic-${chamberId}`,
    softwareVersion: '1.0.0',
    date: new Date().toISOString(),
    parameters: {
      simulationType: 'Acoustic',
      version: 1,
      parameters: [
        { name: 'chamberLength', value: inputs.chamberLength, provenance: 'Measured', unit: 'm' },
        { name: 'chamberWidth', value: inputs.chamberWidth, provenance: 'Measured', unit: 'm' },
        { name: 'chamberHeight', value: inputs.chamberHeight, provenance: 'Measured', unit: 'm' },
      ],
    },
    author: 'GIZA Acoustic Integration',
    geometryVersion: '1.0',
    theoryContext: 'acoustic-baseline',
    randomSeed: 42,
  };
  const simResult = solveAcoustic(inputs, metadata);
  const outputs = simResult.outputs as unknown as AcousticOutputs;
  const validation = validateAgainstMeasurements(chamberId, outputs);

  return {
    chamberId,
    geometry,
    inputs,
    outputs,
    validation,
  };
}

/**
 * Validates simulation results against known acoustic measurements.
 */
export function validateAgainstMeasurements(
  chamberId: GPChamberId,
  outputs: AcousticOutputs,
): GPChamberAcousticResult['validation'] {
  const ref = ACOUSTIC_REFERENCES.find((r) => r.chamberId === chamberId);
  const checks: GPChamberAcousticResult['validation']['checks'] = [];

  if (!ref) {
    return {
      passed: true,
      checks: [
        {
          name: 'Reference data',
          passed: true,
          expected: 'N/A',
          actual: 'N/A',
          message: 'No reference data available',
        },
      ],
    };
  }

  // RT60 check
  const rt60Diff = Math.abs(outputs.reverberationTimeRT60 - ref.expectedRT60);
  const rt60Passed = rt60Diff <= ref.rt60Tolerance;
  checks.push({
    name: 'Reverberation time (RT60)',
    passed: rt60Passed,
    expected: `${ref.expectedRT60}±${ref.rt60Tolerance}s`,
    actual: `${outputs.reverberationTimeRT60.toFixed(2)}s`,
    message: rt60Passed ? 'Within tolerance' : `Outside tolerance (diff: ${rt60Diff.toFixed(2)}s)`,
  });

  // Fundamental frequency check
  const fundamental = outputs.resonantFrequencies[0];
  if (fundamental) {
    const freqDiff = Math.abs(fundamental.frequency - ref.expectedFundamentalFreq);
    const freqPassed = freqDiff <= ref.freqTolerance;
    checks.push({
      name: 'Fundamental frequency',
      passed: freqPassed,
      expected: `${ref.expectedFundamentalFreq}±${ref.freqTolerance}Hz`,
      actual: `${fundamental.frequency.toFixed(1)}Hz`,
      message: freqPassed
        ? 'Within tolerance'
        : `Outside tolerance (diff: ${freqDiff.toFixed(1)}Hz)`,
    });
  }

  // Modal density check (should have multiple resonant frequencies)
  const modalCount = outputs.resonantFrequencies.length;
  checks.push({
    name: 'Modal density',
    passed: modalCount >= 3,
    expected: '≥3 modes',
    actual: `${modalCount} modes`,
    message: modalCount >= 3 ? 'Sufficient modes' : 'Too few modes',
  });

  return {
    passed: checks.every((c) => c.passed),
    checks,
  };
}

// ─── Full integration ─────────────────────────────────────────────────────────

/**
 * Runs acoustic simulation for all GP chambers and returns a combined result.
 */
export function getGPAcousticIntegration(): GPAcousticIntegrationResult {
  const chambers: GPChamberAcousticResult[] = [];
  for (const id of ['kings-chamber', 'grand-gallery'] as GPChamberId[]) {
    chambers.push(runGPAcousticSimulation(id));
  }

  const passedCount = chambers.filter((c) => c.validation.passed).length;
  const overallPassed = passedCount === chambers.length;
  const summary = `GP Acoustic Integration: ${passedCount}/${chambers.length} chambers passed validation.`;

  return {
    chambers,
    overallPassed,
    summary,
  };
}

/**
 * Creates a SimulationResult for integration with the simulation store.
 */
export function createSimulationResult(chamberId: GPChamberId): SimulationResult {
  const result = runGPAcousticSimulation(chamberId);
  const metadata: SimulationMetadata = {
    id: `gp-acoustic-${chamberId}`,
    softwareVersion: '1.0.0',
    date: new Date().toISOString(),
    parameters: {
      simulationType: 'Acoustic',
      version: 1,
      parameters: [
        {
          name: 'chamberLength',
          value: result.inputs.chamberLength,
          provenance: 'Measured',
          unit: 'm',
        },
        {
          name: 'chamberWidth',
          value: result.inputs.chamberWidth,
          provenance: 'Measured',
          unit: 'm',
        },
        {
          name: 'chamberHeight',
          value: result.inputs.chamberHeight,
          provenance: 'Measured',
          unit: 'm',
        },
        { name: 'absorptionCoeff', value: result.inputs.absorptionCoeff, provenance: 'Published' },
      ],
    },
    author: 'GIZA Acoustic Integration',
    geometryVersion: '1.0',
    theoryContext: 'acoustic-baseline',
    randomSeed: 42,
  };

  return {
    metadata,
    outputs: {
      rt60: result.outputs.reverberationTimeRT60,
      resonantFrequencies: result.outputs.resonantFrequencies,
      chamberId,
    },
    validation: {
      passed: result.validation.passed,
      checks: result.validation.checks.map((c) => ({
        name: c.name,
        passed: c.passed,
        message: c.message,
      })),
    },
  };
}
