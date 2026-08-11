import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';
import type { Hypothesis } from '@/schemas/hypothesis';
import type { Simulation } from '@/schemas/simulation';
import type { HypothesisPlugin, HypothesisGeometryNode } from '../types';
import { localToWorld } from '@/scene/coordinateSystem';

const hypothesis: Hypothesis = {
  id: 'THEORY-GP-003',
  name: 'Hydraulic-Acoustic System Hypothesis',
  description:
    'The Great Pyramid functioned as a coupled hydraulic-acoustic resonator driven by hydrostatic pressure from the Osiris Shaft.',
  authors: [{ name: 'To be attributed' }],
  historicalBackground:
    'Proposed as an alternative to the mainstream funerary interpretation. Combines hydraulic and acoustic mechanisms into a single coupled energy system.',
  scientificAssumptions: [
    'The Osiris Shaft functioned as a deep vertical pressure reservoir.',
    'A dedicated underground conduit connected the Osiris Shaft to the subterranean hydraulic network beneath the Great Pyramid.',
    'Gravitational potential energy stored in the elevated water column is the primary driver — no mechanical pumps required.',
    'The pyramid geometry naturally amplifies hydraulic and acoustic resonance.',
    'Water was available at the plateau level during the relevant period.',
    'The subterranean passages could serve as hydraulic conduits.',
    'The Grand Gallery could function as an acoustic resonator.',
    "The King's Chamber granite could resonate at frequencies excited by the hydraulic system.",
  ],
  predictions: [
    {
      id: 'PRED-GP-003-01',
      hypothesisId: 'THEORY-GP-003',
      description:
        'Stable hydraulic oscillations can develop within the measured geometry of the subterranean chamber and passages.',
      predictedObservation:
        'Oscillatory flow with stable frequency and amplitude in the subterranean chamber under realistic boundary conditions.',
      evidenceRefs: [],
      status: 'untested',
    },
    {
      id: 'PRED-GP-003-02',
      hypothesisId: 'THEORY-GP-003',
      description:
        'Resonance frequencies emerge naturally without requiring unrealistic parameter values.',
      predictedObservation:
        "Natural frequencies within 1–1000 Hz range emerge from the Grand Gallery and King's Chamber geometry without extreme parameter tuning.",
      evidenceRefs: [],
      status: 'untested',
    },
    {
      id: 'PRED-GP-003-03',
      hypothesisId: 'THEORY-GP-003',
      description:
        'Acoustic amplification occurs in chambers consistent with the proposed mechanism.',
      predictedObservation:
        "Standing wave amplification in the Grand Gallery and King's Chamber at frequencies coupled to the hydraulic oscillation frequency.",
      evidenceRefs: [],
      status: 'untested',
    },
    {
      id: 'PRED-GP-003-04',
      hypothesisId: 'THEORY-GP-003',
      description: 'Coupled hydraulic-acoustic interactions produce coherent energy transfer.',
      predictedObservation:
        'Energy transfer from hydraulic oscillations to acoustic modes with measurable efficiency, not random dissipation.',
      evidenceRefs: [],
      status: 'untested',
    },
    {
      id: 'PRED-GP-003-05',
      hypothesisId: 'THEORY-GP-003',
      description: 'Predicted behavior is robust across realistic environmental conditions.',
      predictedObservation:
        'Stable oscillations and resonance persist across variations in water level, temperature, and conduit roughness within realistic ranges.',
      evidenceRefs: [],
      status: 'untested',
    },
    {
      id: 'PRED-GP-003-06',
      hypothesisId: 'THEORY-GP-003',
      description:
        'The Osiris Shaft water column generates sufficient hydrostatic pressure to drive the system.',
      predictedObservation:
        'Calculated hydraulic head from the Osiris Shaft exceeds the minimum pressure required to sustain flow through the conduit to the subterranean chamber.',
      evidenceRefs: [],
      status: 'untested',
    },
    {
      id: 'PRED-GP-003-07',
      hypothesisId: 'THEORY-GP-003',
      description:
        'The hypothesized underground conduit geometry is physically consistent with surveyed passage dimensions.',
      predictedObservation:
        'Conduit diameter, length, and slope are compatible with known passage geometry without requiring unobserved structures.',
      evidenceRefs: [],
      status: 'untested',
    },
  ],
  affectedStructures: [
    'OBJ-0006',
    'OBJ-0106',
    'OBJ-0105',
    'OBJ-0108',
    'OBJ-0109',
    'OBJ-0118',
    'OBJ-0111',
    'OBJ-0112',
  ],
  supports: [],
  contradicts: [],
  requiredEvidence: [],
  simulations: ['SIM-201', 'SIM-202', 'SIM-203', 'SIM-204'],
  visualizationRules: [
    {
      target: 'OBJ-0006',
      overlay: 'water-level',
      conditions: {},
      color: '#4488ff',
      opacity: 0.5,
      label: 'Water Column',
    },
    {
      target: 'OBJ-0106',
      overlay: 'highlight',
      conditions: {},
      color: '#4488ff',
      opacity: 0.3,
      label: 'Resonance Basin',
    },
    {
      target: 'OBJ-0105',
      overlay: 'flow-arrows',
      conditions: {},
      color: '#4488ff',
      opacity: 0.4,
      label: 'Pressure Conduit',
    },
    {
      target: 'OBJ-0108',
      overlay: 'flow-arrows',
      conditions: {},
      color: '#66aaff',
      opacity: 0.4,
      label: 'Acoustic Wave Guide',
    },
    {
      target: 'OBJ-0109',
      overlay: 'resonance-field',
      conditions: {},
      color: '#ff8844',
      opacity: 0.3,
      label: 'Acoustic Resonator',
    },
    {
      target: 'OBJ-0118',
      overlay: 'highlight',
      conditions: {},
      color: '#ff8844',
      opacity: 0.2,
      label: 'Secondary Resonance Chamber',
    },
    {
      target: 'OBJ-0111',
      overlay: 'resonance-field',
      conditions: {},
      color: '#ff4444',
      opacity: 0.3,
      label: 'Granite Resonator',
    },
    {
      target: 'OBJ-0112',
      overlay: 'highlight',
      conditions: {},
      color: '#ff4444',
      opacity: 0.2,
      label: 'Resonance Component',
    },
    {
      target: 'OBJ-0006',
      overlay: 'simulation-overlay',
      conditions: { activeHypotheses: ['THEORY-GP-003'], mode: 'Research' },
      color: '#4488ff',
      opacity: 0.4,
      label: 'SIM-201 Hydraulic Overlay',
    },
    {
      target: 'OBJ-0109',
      overlay: 'simulation-overlay',
      conditions: { activeHypotheses: ['THEORY-GP-003'], mode: 'Research' },
      color: '#ff8844',
      opacity: 0.4,
      label: 'SIM-202 Acoustic Overlay',
    },
    {
      target: 'OBJ-0111',
      overlay: 'simulation-overlay',
      conditions: { activeHypotheses: ['THEORY-GP-003'], mode: 'Research' },
      color: '#ff4444',
      opacity: 0.4,
      label: 'SIM-203 Structural Overlay',
    },
  ],
  confidence: 23,
  confidenceByObject: {
    'OBJ-0006': 30,
    'OBJ-0106': 25,
    'OBJ-0105': 20,
    'OBJ-0108': 20,
    'OBJ-0109': 25,
    'OBJ-0118': 15,
    'OBJ-0111': 30,
    'OBJ-0112': 20,
  },
  references: ['SRC-0001', 'SRC-0101'],
  bibliography: [],
  status: 'published',
  tags: ['hydraulic', 'acoustic', 'resonance', 'great-pyramid', 'osiris-shaft'],
};

const simulations: Simulation[] = [
  {
    id: 'SIM-201',
    name: 'Hydraulic: Osiris Shaft → Subterranean Chamber',
    type: 'Hydraulic',
    inputs: ['osiris_shaft_geometry', 'conduit_geometry', 'subterranean_chamber_mesh'],
    outputs: ['water_level', 'flow_rate', 'pressure_distribution', 'oscillation_frequency'],
    parameters: {
      waterColumnHeight: 33.55,
      conduitDiameter: 1.2,
      conduitLength: 96.0,
      conduitSlope: 26.52,
      chamberVolume: 274.0,
      gravity: 9.81,
      waterDensity: 1000.0,
    },
    enabled: true,
  },
  {
    id: 'SIM-202',
    name: "Acoustic: Grand Gallery + King's Chamber resonance",
    type: 'Acoustic',
    inputs: ['grand_gallery_mesh', 'kings_chamber_mesh', 'queens_chamber_mesh'],
    outputs: ['resonant_frequencies', 'standing_waves', 'rt60', 'pressure_distribution'],
    parameters: {
      galleryLength: 46.11,
      galleryHeight: 8.74,
      kingsChamberLength: 10.47,
      kingsChamberWidth: 5.24,
      kingsChamberHeight: 5.97,
      queensChamberLength: 5.85,
      queensChamberWidth: 5.2,
      queensChamberHeight: 6.23,
      absorptionCoeff: 0.05,
      airTemperature: 22,
      humidity: 50,
      frequencyStart: 10,
      frequencyEnd: 2000,
    },
    enabled: true,
  },
  {
    id: 'SIM-203',
    name: "Structural: King's Chamber granite vibration",
    type: 'Structural',
    inputs: ['kings_chamber_granite_mesh', 'sarcophagus_mesh'],
    outputs: ['modal_frequencies', 'vibration_modes', 'stress_distribution'],
    parameters: {
      graniteDensity: 2750,
      youngModulus: 50e9,
      poissonRatio: 0.25,
      dampingRatio: 0.01,
      chamberLength: 10.47,
      chamberWidth: 5.24,
      chamberHeight: 5.97,
    },
    enabled: true,
  },
  {
    id: 'SIM-204',
    name: 'Thermal: Temperature effects on water/air density',
    type: 'Thermal',
    inputs: ['chamber_geometry', 'environmental_parameters'],
    outputs: ['temperature_distribution', 'density_variations', 'thermal_expansion'],
    parameters: {
      ambientTemperature: 22,
      waterTemperature: 20,
      thermalExpansionCoeff: 2.1e-4,
      airDensityRef: 1.225,
      waterDensityRef: 1000.0,
    },
    enabled: true,
  },
];

export interface ExperimentalScenario {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export const experimentalScenarios: ExperimentalScenario[] = [
  {
    id: 'SCENARIO-A',
    name: 'Dry Pyramid',
    description: 'No water in the system. Baseline measurement with no hydraulic activity.',
    parameters: { waterColumnHeight: 0, inflowRate: 0 },
  },
  {
    id: 'SCENARIO-B',
    name: 'Flooded Lower Chambers',
    description: 'Subterranean chamber partially flooded with water from the Osiris Shaft.',
    parameters: { waterColumnHeight: 33.55, inflowRate: 0.001, chamberFloodLevel: 0.5 },
  },
  {
    id: 'SCENARIO-C',
    name: 'Oscillating Osiris Shaft',
    description: 'Water column in the Osiris Shaft oscillates with periodic inflow/outflow.',
    parameters: { waterColumnHeight: 33.55, oscillationAmplitude: 2.0, oscillationPeriod: 10 },
  },
  {
    id: 'SCENARIO-D',
    name: 'Variable Nile Pressure',
    description: 'Seasonal Nile flood variation affecting water supply pressure.',
    parameters: { waterColumnHeight: 33.55, seasonalVariation: true, floodAmplitude: 5.0 },
  },
  {
    id: 'SCENARIO-E',
    name: 'Artificial Pumping',
    description: 'Artificial pumping system maintaining constant pressure above natural head.',
    parameters: { waterColumnHeight: 40.0, artificialPressure: 50000, pumpRate: 0.01 },
  },
  {
    id: 'SCENARIO-F',
    name: 'Blocked Shafts',
    description: 'Some shafts blocked, testing pressure redistribution and flow restriction.',
    parameters: {
      waterColumnHeight: 33.55,
      blockedShafts: ['OBJ-0121', 'OBJ-0122'],
      blockageRatio: 0.8,
    },
  },
  {
    id: 'SCENARIO-G',
    name: 'Different Granite Properties',
    description: 'Alternative granite material properties for sensitivity analysis.',
    parameters: { graniteDensity: 2700, youngModulus: 40e9, dampingRatio: 0.02 },
  },
  {
    id: 'SCENARIO-H',
    name: 'Alternative Chamber Geometries',
    description: 'Modified chamber dimensions to test geometric sensitivity of resonance.',
    parameters: { kingsChamberHeight: 6.5, galleryHeight: 9.0 },
  },
];

export interface UserVariable {
  name: string;
  defaultValue: number;
  unit: string;
  min: number;
  max: number;
  provenance: 'Measured' | 'Published' | 'Estimated' | 'User-defined' | 'Experimental';
}

export const userVariables: UserVariable[] = [
  {
    name: 'waterLevel',
    defaultValue: 30.0,
    unit: 'm',
    min: 0,
    max: 50,
    provenance: 'User-defined',
  },
  {
    name: 'flowRate',
    defaultValue: 0.001,
    unit: 'm³/s',
    min: 0,
    max: 1,
    provenance: 'User-defined',
  },
  {
    name: 'pressure',
    defaultValue: 294300,
    unit: 'Pa',
    min: 0,
    max: 500000,
    provenance: 'Estimated',
  },
  { name: 'temperature', defaultValue: 22, unit: '°C', min: 0, max: 50, provenance: 'Estimated' },
  {
    name: 'rockDensity',
    defaultValue: 2750,
    unit: 'kg/m³',
    min: 2500,
    max: 3000,
    provenance: 'Published',
  },
  {
    name: 'airPressure',
    defaultValue: 101325,
    unit: 'Pa',
    min: 90000,
    max: 110000,
    provenance: 'Measured',
  },
  { name: 'humidity', defaultValue: 50, unit: '%', min: 0, max: 100, provenance: 'Estimated' },
  {
    name: 'gravity',
    defaultValue: 9.81,
    unit: 'm/s²',
    min: 9.78,
    max: 9.83,
    provenance: 'Measured',
  },
  {
    name: 'youngModulus',
    defaultValue: 50e9,
    unit: 'Pa',
    min: 30e9,
    max: 70e9,
    provenance: 'Published',
  },
  {
    name: 'surfaceRoughness',
    defaultValue: 0.003,
    unit: 'm',
    min: 0,
    max: 0.05,
    provenance: 'Estimated',
  },
  {
    name: 'shaftObstruction',
    defaultValue: 0,
    unit: '%',
    min: 0,
    max: 100,
    provenance: 'User-defined',
  },
  { name: 'openingSize', defaultValue: 1.2, unit: 'm', min: 0.1, max: 3.0, provenance: 'Measured' },
];

function buildOsirisConduitGeometry(): HypothesisGeometryNode[] {
  const conduitNode = osirisBlockout.nodes.find((n) => n.id === 'northern-conduit');
  const subterraneanNode = greatPyramidBlockout.nodes.find((n) => n.id === 'subterranean-chamber');
  if (!conduitNode || !subterraneanNode) return [];

  // Northern conduit exits Chamber I toward the NW. The local +Z axis of the
  // box is rotated by -135° around Y, so it points along (-1, 0, -1) — NW.
  const rotationY = conduitNode.rotation?.y ?? 0;
  const localZDir = {
    x: Math.sin(rotationY),
    y: 0,
    z: Math.cos(rotationY),
  };

  const startLocal = {
    x: conduitNode.position.x + localZDir.x * (conduitNode.size.z / 2),
    y: conduitNode.position.y,
    z: conduitNode.position.z + localZDir.z * (conduitNode.size.z / 2),
  };

  // Target the south wall center of the Subterranean Chamber.
  const endLocal = {
    x: subterraneanNode.position.x,
    y: subterraneanNode.position.y,
    z: subterraneanNode.position.z + subterraneanNode.size.z / 2,
  };

  const start = localToWorld(startLocal, 'osiris-shaft');
  const end = localToWorld(endLocal, 'great-pyramid');

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dz = end.z - start.z;
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
    z: (start.z + end.z) / 2,
  };

  const rx = Math.atan2(-dy, Math.sqrt(dx * dx + dz * dz));
  const ry = Math.atan2(dx, dz);

  return [
    {
      id: 'hyp-osiris-northern-conduit-to-gp-subterranean',
      name: 'Osiris Shaft → Subterranean Chamber (hydraulic hypothesis)',
      position: midpoint,
      size: { x: 0.6, y: 0.7, z: length },
      rotation: { x: rx, y: ry, z: 0 },
      color: '#f59e0b',
      opacity: 0.25,
      hypothesisId: 'THEORY-GP-003',
      evidenceIds: ['EV-000009'],
      metadata: {
        interpretation: 'Hydraulic hypothesis overlay',
        lengthMeters: length,
        diameterMeters: 0.6,
        startMonument: 'osiris-shaft',
        endMonument: 'great-pyramid',
        sourceIds: ['SRC-0001'],
      },
    },
  ];
}

export const gpHydraulicAcousticPlugin: HypothesisPlugin = {
  id: 'THEORY-GP-003',
  name: 'Hydraulic-Acoustic System Hypothesis',
  description:
    'The Great Pyramid as a coupled hydraulic-acoustic resonator driven by the Osiris Shaft.',
  version: '0.1.0',
  getHypothesis: () => hypothesis,
  getSimulations: () => simulations,
  getVisualizationRules: (objectId) =>
    hypothesis.visualizationRules.filter((rule) => rule.target === objectId),
  getGeometryNodes: () => buildOsirisConduitGeometry(),
};
