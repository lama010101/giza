import { solveAcoustic, type AcousticInputs } from '@/simulation/acousticSolver';
import type { SimulationMetadata, SimulationResult } from '@/simulation/types';

export interface HydraulicResult {
  pressure: number;
  flowRate: number;
  waterLevel: number;
  oscillationFrequency: number;
  stable: boolean;
}

export interface StructuralResult {
  modalFrequencies: number[];
  maxStress: number;
  dampingRatio: number;
}

export interface ThermalResult {
  temperatureDistribution: number[];
  waterDensity: number;
  airDensity: number;
  thermalExpansion: number;
}

export interface CoupledPhysicsResult {
  hydraulic: HydraulicResult;
  acoustic: SimulationResult;
  structural: StructuralResult;
  thermal: ThermalResult;
  energyTransferEfficiency: number;
  pathway: string[];
}

export interface CoupledPhysicsInputs {
  waterColumnHeight: number;
  conduitDiameter: number;
  conduitLength: number;
  gravity: number;
  waterDensity: number;
  chamberLength: number;
  chamberWidth: number;
  chamberHeight: number;
  galleryLength: number;
  galleryHeight: number;
  graniteDensity: number;
  youngModulus: number;
  poissonRatio: number;
  dampingRatio: number;
  ambientTemperature: number;
  waterTemperature: number;
  absorptionCoeff: number;
  humidity: number;
  frequencyStart: number;
  frequencyEnd: number;
}

export function solveHydraulic(inputs: CoupledPhysicsInputs): HydraulicResult {
  const pressure = inputs.waterDensity * inputs.gravity * inputs.waterColumnHeight;
  const crossSectionArea = Math.PI * (inputs.conduitDiameter / 2) ** 2;
  const flowRate =
    crossSectionArea * Math.sqrt((2 * pressure) / (inputs.waterDensity * inputs.conduitLength));
  const oscillationFrequency = Math.sqrt(inputs.gravity / inputs.waterColumnHeight) / (2 * Math.PI);
  const stable = inputs.waterColumnHeight > 0 && flowRate > 0;

  return {
    pressure,
    flowRate,
    waterLevel: inputs.waterColumnHeight,
    oscillationFrequency,
    stable,
  };
}

export function solveStructural(inputs: CoupledPhysicsInputs): StructuralResult {
  const { chamberLength: L, chamberWidth: W, chamberHeight: H } = inputs;
  const v = Math.sqrt(inputs.youngModulus / inputs.graniteDensity);
  const f1 = v / (2 * L);
  const f2 = v / (2 * W);
  const f3 = v / (2 * H);
  const f4 = v / (2 * Math.sqrt(L * L + W * W));
  const modalFrequencies = [f1, f2, f3, f4].sort((a, b) => a - b);
  const maxStress = inputs.youngModulus * 1e-6;

  return {
    modalFrequencies,
    maxStress,
    dampingRatio: inputs.dampingRatio,
  };
}

export function solveThermal(inputs: CoupledPhysicsInputs): ThermalResult {
  const thermalExpansionCoeff = 2.1e-4;
  const thermalExpansion = thermalExpansionCoeff * (inputs.waterTemperature - 20);
  const waterDensity = inputs.waterDensity * (1 - thermalExpansion);
  const airDensity = 1.225 * (273.15 / (273.15 + inputs.ambientTemperature));
  const temperatureDistribution = [
    inputs.ambientTemperature,
    inputs.ambientTemperature - 0.5,
    inputs.ambientTemperature - 1.0,
    inputs.waterTemperature,
    inputs.waterTemperature,
  ];

  return {
    temperatureDistribution,
    waterDensity,
    airDensity,
    thermalExpansion,
  };
}

export function runCoupledSimulation(
  inputs: CoupledPhysicsInputs,
  metadata: SimulationMetadata,
): CoupledPhysicsResult {
  const hydraulic = solveHydraulic(inputs);

  const thermal = solveThermal(inputs);

  const acousticInputs: AcousticInputs = {
    chamberLength: inputs.chamberLength,
    chamberWidth: inputs.chamberWidth,
    chamberHeight: inputs.chamberHeight,
    absorptionCoeff: inputs.absorptionCoeff,
    airTemperature: thermal.temperatureDistribution[0],
    humidity: inputs.humidity,
    sourceLocation: {
      x: inputs.chamberLength / 2,
      y: inputs.chamberHeight / 2,
      z: inputs.chamberWidth / 2,
    },
    frequencyStart: inputs.frequencyStart,
    frequencyEnd: inputs.frequencyEnd,
    frequencySteps: 100,
  };

  const acoustic = solveAcoustic(acousticInputs, metadata);

  const structural = solveStructural(inputs);

  const energyTransferEfficiency = hydraulic.stable
    ? Math.min(1, hydraulic.oscillationFrequency / 100)
    : 0;

  const pathway = [
    'Water Supply',
    'Osiris Shaft',
    'Hydrostatic Pressure',
    'Underground Conduit',
    'Subterranean Chamber',
    'Hydraulic Oscillations',
    'Ascending Passage',
    'Grand Gallery',
    "King's Chamber",
    'Granite Resonance',
  ];

  return {
    hydraulic,
    acoustic,
    structural,
    thermal,
    energyTransferEfficiency,
    pathway,
  };
}
