import type { Vector3 } from '@/schemas/location';

export interface BlockoutNode {
  id: string;
  name: string;
  position: Vector3;
  rotation?: Vector3;
  size: Vector3;
  objectId?: string;
  evidenceIds?: string[];
  sourceIds?: string[];
  layer: string;
  color: string;
  opacity?: number;
  overlay?: string;
}

export interface Blockout {
  id: string;
  name: string;
  units: 'meters';
  nodes: BlockoutNode[];
}

export const osirisBlockout: Blockout = {
  id: 'osiris-shaft-blockout',
  name: 'Osiris Shaft',
  units: 'meters',
  nodes: [
    {
      id: 'shaft-a',
      name: 'Shaft A',
      position: { x: 0, y: -4.81, z: 0 },
      size: { x: 2.6, y: 9.62, z: 3.0 },
      objectId: 'OBJ-0001',
      evidenceIds: ['EV-000001', 'EV-000010'],
      sourceIds: ['SRC-0001'],
      layer: 'shafts',
      color: '#8a7a55',
      opacity: 0.5,
    },
    {
      id: 'chamber-a',
      name: 'Chamber A',
      position: { x: 0, y: -8.27, z: -2.8 },
      size: { x: 3.85, y: 2.7, z: 8.6 },
      objectId: 'OBJ-0002',
      evidenceIds: ['EV-000002'],
      sourceIds: ['SRC-0001'],
      layer: 'level-1',
      color: '#c2ab7a',
      opacity: 0.3,
    },
    {
      id: 'shaft-b',
      name: 'Shaft B',
      position: { x: -1.125, y: -16.245, z: -6.0 },
      size: { x: 1.9, y: 13.25, z: 1.9 },
      objectId: 'OBJ-0003',
      evidenceIds: ['EV-000003', 'EV-000010'],
      sourceIds: ['SRC-0001'],
      layer: 'shafts',
      color: '#8a7a55',
      opacity: 0.5,
    },
    {
      id: 'chamber-b',
      name: 'Chamber B',
      position: { x: -1.125, y: -21.85, z: -10.35 },
      size: { x: 3.65, y: 2.6, z: 6.8 },
      objectId: 'OBJ-0004',
      evidenceIds: ['EV-000004'],
      sourceIds: ['SRC-0001'],
      layer: 'level-2',
      color: '#b39b6b',
      opacity: 0.3,
    },
    {
      id: 'shaft-c',
      name: 'Shaft C',
      position: { x: 0.9, y: -26.9, z: -7.0 },
      size: { x: 1.9, y: 7.5, z: 1.65 },
      objectId: 'OBJ-0005',
      evidenceIds: ['EV-000005', 'EV-000010'],
      sourceIds: ['SRC-0001'],
      layer: 'shafts',
      color: '#8a7a55',
      opacity: 0.5,
    },
    {
      id: 'chamber-i',
      name: 'Chamber I',
      position: { x: -1.4, y: -29.15, z: -7.0 },
      size: { x: 6.5, y: 3.0, z: 9.0 },
      objectId: 'OBJ-0006',
      evidenceIds: ['EV-000006', 'EV-000011'],
      sourceIds: ['SRC-0001'],
      layer: 'level-3',
      color: '#a38b5c',
      opacity: 0.3,
    },
    {
      id: 'central-island',
      name: 'Central Island',
      position: { x: -1.4, y: -29.775, z: -7.0 },
      size: { x: 3.2, y: 1.75, z: 5.2 },
      objectId: 'OBJ-0007',
      evidenceIds: ['EV-000007'],
      sourceIds: ['SRC-0001'],
      layer: 'level-3',
      color: '#7a6a4a',
    },
    {
      id: 'sarcophagus-i',
      name: 'Basalt Sarcophagus',
      position: { x: -1.4, y: -28.425, z: -6.5 },
      size: { x: 1.08, y: 0.95, z: 2.28 },
      objectId: 'OBJ-0008',
      evidenceIds: ['EV-000008'],
      sourceIds: ['SRC-0001', 'SRC-0002'],
      layer: 'level-3',
      color: '#3a3a3f',
    },
    {
      id: 'northern-conduit',
      name: 'Northern Conduit',
      position: { x: -7.054, y: -30.3, z: -13.904 },
      rotation: { x: 0, y: (-3 * Math.PI) / 4, z: 0 },
      size: { x: 0.6, y: 0.7, z: 6.8 },
      objectId: 'OBJ-0009',
      evidenceIds: ['EV-000009'],
      sourceIds: ['SRC-0001'],
      layer: 'level-3',
      color: '#6b5f45',
    },
    {
      id: 'chamber-i-water',
      name: 'Chamber I Water',
      position: { x: -1.4, y: -30.4, z: -7.0 },
      size: { x: 6.5, y: 0.5, z: 9.0 },
      layer: 'level-3',
      color: '#0a4a6b',
      opacity: 0.6,
      overlay: 'water',
    },
  ],
};
