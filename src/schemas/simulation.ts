import { z } from 'zod';
import { SimulationId } from './identifiers';

export const SimulationType = z.enum([
  'Hydraulic',
  'Acoustic',
  'Geological',
  'Structural',
  'Thermal',
  'Atmospheric',
  'Human Movement',
  'Chemical',
  'Electromagnetic',
  'Particle Flow',
]);

export type SimulationType = z.infer<typeof SimulationType>;

export const SimulationSchema = z.object({
  id: SimulationId,
  name: z.string().min(1),
  type: SimulationType,
  inputs: z.array(z.string()).default([]),
  outputs: z.array(z.string()).default([]),
  parameters: z.record(z.string(), z.unknown()).default({}),
  enabled: z.boolean().default(false),
});

export type Simulation = z.infer<typeof SimulationSchema>;
