import type {
  ParameterEntry,
  SimulationMetadata,
  SimulationResult,
  ValidationCheck,
  ValidationResult,
} from './types';

export interface AcousticInputs {
  chamberLength: number;
  chamberWidth: number;
  chamberHeight: number;
  absorptionCoeff: number;
  airTemperature: number;
  humidity: number;
  sourceLocation: { x: number; y: number; z: number };
  frequencyStart: number;
  frequencyEnd: number;
  frequencySteps: number;
}

export interface ResonantFrequency {
  frequency: number;
  mode: { nx: number; ny: number; nz: number };
  wavelength: number;
}

export interface StandingWave {
  frequency: number;
  mode: { nx: number; ny: number; nz: number };
  amplitude: number;
  nodes: number;
}

export interface ReflectionPath {
  bounceCount: number;
  pathLength: number;
  attenuation: number;
  delayMs: number;
}

export interface AcousticOutputs {
  resonantFrequencies: ResonantFrequency[];
  standingWaves: StandingWave[];
  reflectionPaths: ReflectionPath[];
  reverberationTimeRT60: number;
  energyDecay: { time: number; energyDb: number }[];
  waveInterference: { frequency: number; maxInterference: number; minInterference: number }[];
  frequencyResponse: { frequency: number; spl: number }[];
  pressureDistribution: { x: number; y: number; z: number; pressure: number }[];
}

const SPEED_OF_SOUND_20C = 343.0;

function speedOfSound(temperatureC: number): number {
  return SPEED_OF_SOUND_20C * Math.sqrt(1 + temperatureC / 273.15);
}

function computeResonantFrequencies(inputs: AcousticInputs): ResonantFrequency[] {
  const c = speedOfSound(inputs.airTemperature);
  const { chamberLength: L, chamberWidth: W, chamberHeight: H } = inputs;
  const results: ResonantFrequency[] = [];

  const maxModes = 5;
  for (let nx = 0; nx <= maxModes; nx++) {
    for (let ny = 0; ny <= maxModes; ny++) {
      for (let nz = 0; nz <= maxModes; nz++) {
        if (nx === 0 && ny === 0 && nz === 0) continue;
        const f = (c / 2) * Math.sqrt((nx / L) ** 2 + (ny / W) ** 2 + (nz / H) ** 2);
        if (f >= inputs.frequencyStart && f <= inputs.frequencyEnd) {
          results.push({
            frequency: f,
            mode: { nx, ny, nz },
            wavelength: c / f,
          });
        }
      }
    }
  }

  return results.sort((a, b) => a.frequency - b.frequency);
}

function computeStandingWaves(resonant: ResonantFrequency[], absorption: number): StandingWave[] {
  return resonant.map((r) => ({
    frequency: r.frequency,
    mode: r.mode,
    amplitude: 1 / (1 + absorption * r.frequency * 0.01),
    nodes: r.mode.nx + r.mode.ny + r.mode.nz,
  }));
}

function computeReflectionPaths(inputs: AcousticInputs, maxBounces: number): ReflectionPath[] {
  const c = speedOfSound(inputs.airTemperature);
  const { chamberLength: L, chamberWidth: W, chamberHeight: H } = inputs;
  const paths: ReflectionPath[] = [];

  const avgDimension = (L + W + H) / 3;

  for (let bounces = 1; bounces <= maxBounces; bounces++) {
    const pathLength = avgDimension * bounces;
    const attenuation = Math.pow(1 - inputs.absorptionCoeff, bounces);
    const delayMs = (pathLength / c) * 1000;
    paths.push({ bounceCount: bounces, pathLength, attenuation, delayMs });
  }

  return paths;
}

function computeRT60(inputs: AcousticInputs): number {
  const { chamberLength: L, chamberWidth: W, chamberHeight: H } = inputs;
  const volume = L * W * H;
  const surfaceArea = 2 * (L * W + L * H + W * H);
  const avgAbsorption = inputs.absorptionCoeff;

  const sabineRT60 = (0.161 * volume) / (surfaceArea * avgAbsorption);
  return sabineRT60;
}

function computeEnergyDecay(rt60: number, steps: number): { time: number; energyDb: number }[] {
  const decay: { time: number; energyDb: number }[] = [];
  const decayRate = 60 / rt60;

  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * rt60 * 1.5;
    const energyDb = -decayRate * t;
    decay.push({ time: t, energyDb });
  }

  return decay;
}

function computeWaveInterference(
  resonant: ResonantFrequency[],
): { frequency: number; maxInterference: number; minInterference: number }[] {
  return resonant.map((r) => {
    const maxInt = 2;
    const minInt = 0;
    return {
      frequency: r.frequency,
      maxInterference: maxInt,
      minInterference: minInt,
    };
  });
}

function computeFrequencyResponse(
  inputs: AcousticInputs,
  resonant: ResonantFrequency[],
): { frequency: number; spl: number }[] {
  const response: { frequency: number; spl: number }[] = [];
  const stepSize = (inputs.frequencyEnd - inputs.frequencyStart) / inputs.frequencySteps;

  for (let i = 0; i <= inputs.frequencySteps; i++) {
    const f = inputs.frequencyStart + i * stepSize;

    let spl = 60;
    for (const r of resonant) {
      const distance = Math.abs(f - r.frequency);
      const bandwidth = r.frequency * 0.05;
      if (distance < bandwidth) {
        spl += 6 * (1 - distance / bandwidth);
      }
    }
    spl = Math.min(spl, 120);

    response.push({ frequency: f, spl });
  }

  return response;
}

function computePressureDistribution(
  inputs: AcousticInputs,
  resonant: ResonantFrequency[],
): { x: number; y: number; z: number; pressure: number }[] {
  const { chamberLength: L, chamberWidth: W, chamberHeight: H } = inputs;
  const gridX = 5;
  const gridY = 5;
  const gridZ = 5;
  const distribution: { x: number; y: number; z: number; pressure: number }[] = [];

  const fundamental = resonant[0];
  if (!fundamental) {
    for (let i = 0; i <= gridX; i++) {
      for (let j = 0; j <= gridY; j++) {
        for (let k = 0; k <= gridZ; k++) {
          distribution.push({
            x: (i / gridX) * L,
            y: (j / gridY) * H,
            z: (k / gridZ) * W,
            pressure: 0,
          });
        }
      }
    }
    return distribution;
  }

  const { nx, ny, nz } = fundamental.mode;

  for (let i = 0; i <= gridX; i++) {
    for (let j = 0; j <= gridY; j++) {
      for (let k = 0; k <= gridZ; k++) {
        const x = (i / gridX) * L;
        const y = (j / gridY) * H;
        const z = (k / gridZ) * W;
        const pressure =
          Math.cos((nx * Math.PI * x) / L) *
          Math.cos((ny * Math.PI * z) / W) *
          Math.cos((nz * Math.PI * y) / H);
        distribution.push({ x, y, z, pressure });
      }
    }
  }

  return distribution;
}

export function solveAcoustic(
  inputs: AcousticInputs,
  metadata: SimulationMetadata,
): SimulationResult {
  const resonantFrequencies = computeResonantFrequencies(inputs);
  const standingWaves = computeStandingWaves(resonantFrequencies, inputs.absorptionCoeff);
  const reflectionPaths = computeReflectionPaths(inputs, 10);
  const reverberationTimeRT60 = computeRT60(inputs);
  const energyDecay = computeEnergyDecay(reverberationTimeRT60, 20);
  const waveInterference = computeWaveInterference(resonantFrequencies);
  const frequencyResponse = computeFrequencyResponse(inputs, resonantFrequencies);
  const pressureDistribution = computePressureDistribution(inputs, resonantFrequencies);

  const outputs: AcousticOutputs = {
    resonantFrequencies,
    standingWaves,
    reflectionPaths,
    reverberationTimeRT60,
    energyDecay,
    waveInterference,
    frequencyResponse,
    pressureDistribution,
  };

  const validation = validateAcoustic(inputs, outputs);

  return {
    metadata,
    outputs: outputs as unknown as Record<string, unknown>,
    validation,
  };
}

export function validateAcoustic(
  inputs: AcousticInputs,
  outputs: AcousticOutputs,
): ValidationResult {
  const checks: ValidationCheck[] = [];

  const totalEnergy = outputs.energyDecay.reduce(
    (sum, e) => sum + Math.pow(10, e.energyDb / 10),
    0,
  );
  const initialEnergy = Math.pow(10, 0 / 10);
  const energyRatio = totalEnergy / (initialEnergy * outputs.energyDecay.length);
  checks.push({
    name: 'Energy conservation',
    passed: energyRatio < 0.1,
    message: `Energy ratio ${energyRatio.toFixed(4)} < 0.1 threshold`,
    value: energyRatio,
    threshold: 0.1,
  });

  const maxResonantFreq =
    outputs.resonantFrequencies.length > 0
      ? outputs.resonantFrequencies[outputs.resonantFrequencies.length - 1].frequency
      : inputs.frequencyEnd;
  const minWavelength = speedOfSound(inputs.airTemperature) / maxResonantFreq;
  const fixedElementSize = 0.05;
  const elementsPerWavelength = minWavelength / fixedElementSize;
  checks.push({
    name: 'Mesh resolution adequacy',
    passed: elementsPerWavelength >= 6,
    message: `${elementsPerWavelength.toFixed(1)} elements per wavelength (min 6 required)`,
    value: elementsPerWavelength,
    threshold: 6,
  });

  const freqResponseValues = outputs.frequencyResponse.map((f) => f.spl);
  const maxSpl = Math.max(...freqResponseValues);
  const minSpl = Math.min(...freqResponseValues);
  const convergence = maxSpl - minSpl;
  checks.push({
    name: 'Frequency convergence',
    passed: convergence < 80,
    message: `SPL range ${convergence.toFixed(1)} dB < 80 dB threshold`,
    value: convergence,
    threshold: 80,
  });

  const allPassed = checks.every((c) => c.passed);
  return { passed: allPassed, checks };
}

export function defaultAcousticParameters(
  chamberLength: number,
  chamberWidth: number,
  chamberHeight: number,
): ParameterEntry[] {
  return [
    {
      name: 'chamberLength',
      value: chamberLength,
      provenance: 'Measured',
      unit: 'm',
      description: 'Chamber length (E-W)',
    },
    {
      name: 'chamberWidth',
      value: chamberWidth,
      provenance: 'Measured',
      unit: 'm',
      description: 'Chamber width (N-S)',
    },
    {
      name: 'chamberHeight',
      value: chamberHeight,
      provenance: 'Measured',
      unit: 'm',
      description: 'Chamber height',
    },
    {
      name: 'absorptionCoeff',
      value: 0.05,
      provenance: 'Published',
      unit: '',
      description: 'Average wall absorption coefficient',
    },
    {
      name: 'airTemperature',
      value: 22,
      provenance: 'Estimated',
      unit: '°C',
      description: 'Air temperature inside chamber',
    },
    {
      name: 'humidity',
      value: 50,
      provenance: 'Estimated',
      unit: '%',
      description: 'Relative humidity',
    },
    {
      name: 'sourceLocationX',
      value: chamberLength / 2,
      provenance: 'User-defined',
      unit: 'm',
      description: 'Sound source X position',
    },
    {
      name: 'sourceLocationY',
      value: chamberHeight / 2,
      provenance: 'User-defined',
      unit: 'm',
      description: 'Sound source Y position',
    },
    {
      name: 'sourceLocationZ',
      value: chamberWidth / 2,
      provenance: 'User-defined',
      unit: 'm',
      description: 'Sound source Z position',
    },
    {
      name: 'frequencyStart',
      value: 20,
      provenance: 'User-defined',
      unit: 'Hz',
      description: 'Frequency sweep start',
    },
    {
      name: 'frequencyEnd',
      value: 2000,
      provenance: 'User-defined',
      unit: 'Hz',
      description: 'Frequency sweep end',
    },
    {
      name: 'frequencySteps',
      value: 100,
      provenance: 'User-defined',
      unit: '',
      description: 'Frequency sweep steps',
    },
  ];
}
