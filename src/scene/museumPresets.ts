import { localToWorld } from './coordinateSystem';
import type { Monument } from '@/store/app';
import type { Vector3 } from '@/schemas/location';

export interface MuseumPreset {
  name: string;
  position: Vector3;
  target: Vector3;
  dwellSeconds: number;
}

interface LocalMuseumPreset {
  name: string;
  localPosition: Vector3;
  localTarget: Vector3;
  dwellSeconds: number;
}

const GREAT_PYRAMID_PRESETS: LocalMuseumPreset[] = [
  {
    name: 'Pyramid Exterior',
    localPosition: { x: 80, y: 90, z: 120 },
    localTarget: { x: 0, y: 60, z: 0 },
    dwellSeconds: 6,
  },
  {
    name: "King's Chamber",
    localPosition: { x: 12, y: 48, z: 16 },
    localTarget: { x: 7.22, y: 45.88, z: 11.01 },
    dwellSeconds: 8,
  },
  {
    name: "Queen's Chamber",
    localPosition: { x: 6, y: 27, z: 12 },
    localTarget: { x: 0, y: 24.31, z: 6.32 },
    dwellSeconds: 8,
  },
  {
    name: 'Grand Gallery',
    localPosition: { x: 12, y: 40, z: -10 },
    localTarget: { x: 7.22, y: 36.25, z: -24.75 },
    dwellSeconds: 8,
  },
  {
    name: 'Subterranean Chamber',
    localPosition: { x: 6, y: -26, z: 10 },
    localTarget: { x: 0.66, y: -28.22, z: 5.18 },
    dwellSeconds: 8,
  },
];

const OSIRIS_PRESETS: LocalMuseumPreset[] = [
  {
    name: 'Osiris Shaft Surface',
    localPosition: { x: 15, y: 12, z: 15 },
    localTarget: { x: 0, y: -2, z: 0 },
    dwellSeconds: 6,
  },
  {
    name: 'Chamber A',
    localPosition: { x: 5, y: -6, z: 3 },
    localTarget: { x: 0, y: -8.27, z: -2.8 },
    dwellSeconds: 8,
  },
  {
    name: 'Chamber B',
    localPosition: { x: 4, y: -20, z: 0 },
    localTarget: { x: -1.125, y: -21.85, z: -6.0 },
    dwellSeconds: 8,
  },
  {
    name: 'Chamber I',
    localPosition: { x: 5, y: -28, z: -2 },
    localTarget: { x: -1.4, y: -29.15, z: -7.0 },
    dwellSeconds: 8,
  },
  {
    name: 'Northern Conduit',
    localPosition: { x: -10, y: -30, z: -20 },
    localTarget: { x: -7.054, y: -30.3, z: -13.904 },
    dwellSeconds: 8,
  },
  {
    name: 'Basalt Sarcophagus',
    localPosition: { x: -0.4, y: -27.5, z: -5 },
    localTarget: { x: -1.4, y: -28.43, z: -6.5 },
    dwellSeconds: 8,
  },
];

function toWorldPreset(local: LocalMuseumPreset, monument: Monument): MuseumPreset {
  const monumentKey = monument === 'osiris' ? 'osiris-shaft' : 'great-pyramid';
  return {
    name: local.name,
    position: localToWorld(local.localPosition, monumentKey),
    target: localToWorld(local.localTarget, monumentKey),
    dwellSeconds: local.dwellSeconds,
  };
}

export function getMuseumPresets(monument: Monument): MuseumPreset[] {
  const locals = monument === 'osiris' ? OSIRIS_PRESETS : GREAT_PYRAMID_PRESETS;
  return locals.map((p) => toWorldPreset(p, monument));
}
