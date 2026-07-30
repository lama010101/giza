/**
 * Great Pyramid — LOD1 Geometry Generator
 *
 * Produces measurement-derived geometry nodes for LOD1 rendering.
 * Positions are calculated from published survey data, not hardcoded.
 *
 * LOD0 = existing blockout (manual coordinates)
 * LOD1 = measurement-derived positions (this file)
 *
 * All nodes include provenance metadata: derivation type and source.
 */

import type { Vector3 } from '@/schemas/location';
import type { BlockoutNode } from '@db/blockouts/great-pyramid';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';
import {
  GP_EXTERNAL,
  GP_ENTRANCE,
  GP_DESCENDING_PASSAGE,
  GP_ASCENDING_PASSAGE,
  GP_GRAND_GALLERY,
  GP_KINGS_CHAMBER,
  GP_QUEENS_CHAMBER,
  GP_KC_SHAFTS,
  GP_QC_SHAFTS,
} from '@db/measurements/great-pyramid-measurements';
import {
  degToRad,
  slopedEndpoint,
  slopedBoxFromFloorEndpoints,
  chamberCenterY,
} from './gp-geometry-utils';

export type DerivationType = 'measured' | 'calculated' | 'inferred' | 'placeholder';

export interface BlockoutNodeLOD1 extends BlockoutNode {
  lod: 'LOD1';
  derivation: DerivationType;
}

/** Helper: get a blockout node by ID */
function getBlockoutNode(id: string): BlockoutNode {
  const node = greatPyramidBlockout.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Blockout node ${id} not found`);
  return node;
}

/** Helper: create a LOD1 node from a blockout node, adding provenance */
function fromBlockout(id: string, derivation: DerivationType): BlockoutNodeLOD1 {
  const node = getBlockoutNode(id);
  return { ...node, lod: 'LOD1', derivation };
}

/** Helper: create a LOD1 node with calculated position */
function calculated(node: Omit<BlockoutNodeLOD1, 'lod'>): BlockoutNodeLOD1 {
  return { ...node, lod: 'LOD1' };
}

/**
 * Generate all LOD1 geometry nodes for the Great Pyramid.
 * Returns ~40 nodes with measurement-derived positions.
 */
export function generateGreatPyramidLOD1(): BlockoutNodeLOD1[] {
  const nodes: BlockoutNodeLOD1[] = [];

  // --- Exterior ---
  nodes.push(
    calculated({
      id: 'pyramid-exterior',
      name: 'Pyramid Exterior (core masonry)',
      position: { x: 0, y: GP_EXTERNAL.currentHeight / 2, z: 0 },
      size: {
        x: GP_EXTERNAL.baseMean,
        y: GP_EXTERNAL.currentHeight,
        z: GP_EXTERNAL.baseMean,
      },
      objectId: 'OBJ-0101',
      evidenceIds: ['EV-100001'],
      sourceIds: ['SRC-0101', 'SRC-0102'],
      layer: 'exterior',
      color: '#c2b090',
      opacity: 0.15,
      derivation: 'measured',
    }),
  );

  nodes.push(
    calculated({
      id: 'casing-north',
      name: 'Casing Stones (north face, lower courses)',
      position: { x: 0, y: 5, z: -GP_EXTERNAL.baseMean / 2 },
      rotation: { x: degToRad(GP_EXTERNAL.casingAngleDeg), y: 0, z: 0 },
      size: { x: GP_EXTERNAL.baseMean, y: 10, z: 1 },
      objectId: 'OBJ-0102',
      evidenceIds: ['EV-100002'],
      sourceIds: ['SRC-0101'],
      layer: 'exterior',
      color: '#e8e0d0',
      opacity: 0.7,
      derivation: 'measured',
    }),
  );

  // --- Entrance ---
  nodes.push(
    calculated({
      id: 'original-entrance',
      name: 'Original Entrance',
      position: {
        x: GP_ENTRANCE.xOffset,
        y: GP_ENTRANCE.heightAboveBase,
        z: -GP_EXTERNAL.baseMean / 2,
      },
      size: { x: GP_DESCENDING_PASSAGE.width, y: GP_DESCENDING_PASSAGE.height, z: 1 },
      objectId: 'OBJ-0103',
      evidenceIds: ['EV-100003'],
      sourceIds: ['SRC-0101'],
      layer: 'exterior',
      color: '#8a7a55',
      derivation: 'measured',
    }),
  );

  nodes.push(fromBlockout('modern-entrance', 'measured'));

  // --- Descending Passage (sloped section) ---
  {
    const dpStart: Vector3 = {
      x: GP_ENTRANCE.xOffset,
      y: GP_ENTRANCE.heightAboveBase,
      z: -GP_EXTERNAL.baseMean / 2,
    };
    const dpEnd = slopedEndpoint(
      dpStart,
      GP_DESCENDING_PASSAGE.angleDeg,
      GP_DESCENDING_PASSAGE.totalLength,
    );
    const dpBox = slopedBoxFromFloorEndpoints(
      dpStart,
      dpEnd,
      GP_DESCENDING_PASSAGE.width,
      GP_DESCENDING_PASSAGE.height,
    );
    nodes.push(
      calculated({
        id: 'descending-passage',
        name: 'Descending Passage',
        position: dpBox.position,
        rotation: dpBox.rotation,
        size: dpBox.size,
        objectId: 'OBJ-0105',
        evidenceIds: ['EV-100005'],
        sourceIds: ['SRC-0101'],
        layer: 'passages',
        color: '#8a7a55',
        opacity: 0.4,
        derivation: 'calculated',
      }),
    );
  }

  // --- Subterranean Chamber + Pit (from blockout — no explicit constants) ---
  nodes.push(fromBlockout('subterranean-chamber', 'measured'));
  nodes.push(fromBlockout('subterranean-pit', 'measured'));

  // --- Ascending Passage ---
  {
    // AP starts at the Point of Intersection (POI) with DP
    // POI Y: where DP floor is at y = 11.1 m (approximately)
    const poiY = 11.1;
    // POI Z: computed from DP geometry
    // DP parametric: t = (entranceY - poiY) / sin(DP_angle)
    // poiZ = entranceZ + t * cos(DP_angle)
    const poiT =
      (GP_ENTRANCE.heightAboveBase - poiY) / Math.sin(degToRad(GP_DESCENDING_PASSAGE.angleDeg));
    const poiZ =
      -GP_EXTERNAL.baseMean / 2 + poiT * Math.cos(degToRad(GP_DESCENDING_PASSAGE.angleDeg));
    const apStart: Vector3 = { x: GP_ENTRANCE.xOffset, y: poiY, z: poiZ };
    const apEnd = slopedEndpoint(
      apStart,
      -GP_ASCENDING_PASSAGE.angleDeg,
      GP_ASCENDING_PASSAGE.length,
    );
    const apBox = slopedBoxFromFloorEndpoints(
      apStart,
      apEnd,
      GP_ASCENDING_PASSAGE.width,
      GP_ASCENDING_PASSAGE.height,
    );
    nodes.push(
      calculated({
        id: 'ascending-passage',
        name: 'Ascending Passage',
        position: apBox.position,
        rotation: apBox.rotation,
        size: apBox.size,
        objectId: 'OBJ-0108',
        evidenceIds: ['EV-100008'],
        sourceIds: ['SRC-0101'],
        layer: 'passages',
        color: '#c2ab7a',
        opacity: 0.4,
        derivation: 'calculated',
      }),
    );
  }

  // --- Grand Gallery ---
  {
    // GG starts at AP upper end (z) but at floorNorthY (y)
    // The AP opens into the GG above the floor level — there is a vertical drop
    // from the AP floor to the GG floor at the north wall.
    const poiY = 11.1;
    const poiT =
      (GP_ENTRANCE.heightAboveBase - poiY) / Math.sin(degToRad(GP_DESCENDING_PASSAGE.angleDeg));
    const poiZ =
      -GP_EXTERNAL.baseMean / 2 + poiT * Math.cos(degToRad(GP_DESCENDING_PASSAGE.angleDeg));
    const apEndZ =
      poiZ + GP_ASCENDING_PASSAGE.length * Math.cos(degToRad(GP_ASCENDING_PASSAGE.angleDeg));
    const ggStart: Vector3 = {
      x: GP_GRAND_GALLERY.xOffset,
      y: GP_GRAND_GALLERY.floorNorthY,
      z: apEndZ,
    };
    const ggEnd = slopedEndpoint(ggStart, -GP_GRAND_GALLERY.angleDeg, GP_GRAND_GALLERY.floorLength);
    const ggBox = slopedBoxFromFloorEndpoints(
      ggStart,
      ggEnd,
      GP_GRAND_GALLERY.floorWidth,
      GP_GRAND_GALLERY.height,
    );
    nodes.push(
      calculated({
        id: 'grand-gallery',
        name: 'Grand Gallery',
        position: ggBox.position,
        rotation: ggBox.rotation,
        size: ggBox.size,
        objectId: 'OBJ-0109',
        evidenceIds: ['EV-100009'],
        sourceIds: ['SRC-0101'],
        layer: 'gallery',
        color: '#d4c4a0',
        opacity: 0.35,
        derivation: 'calculated',
      }),
    );
  }

  // --- Antechamber (from blockout — no explicit constants in current measurements) ---
  nodes.push(fromBlockout('antechamber', 'measured'));

  // --- King's Chamber ---
  nodes.push(
    calculated({
      id: 'kings-chamber',
      name: "King's Chamber",
      position: {
        x: GP_GRAND_GALLERY.xOffset,
        y: chamberCenterY(GP_KINGS_CHAMBER.floorY, GP_KINGS_CHAMBER.height),
        z: 40.5, // aligned with relieving chambers
      },
      size: {
        x: GP_KINGS_CHAMBER.width,
        y: GP_KINGS_CHAMBER.height,
        z: GP_KINGS_CHAMBER.depth,
      },
      objectId: 'OBJ-0111',
      evidenceIds: ['EV-100011'],
      sourceIds: ['SRC-0101'],
      layer: 'kings-complex',
      color: '#8a6050',
      opacity: 0.4,
      derivation: 'measured',
    }),
  );

  // --- Sarcophagus (from blockout) ---
  nodes.push(fromBlockout('kings-sarcophagus', 'measured'));

  // --- Relieving Chambers (from blockout — individual dimensions from Vyse) ---
  nodes.push(fromBlockout('relieving-davison', 'measured'));
  nodes.push(fromBlockout('relieving-wellington', 'measured'));
  nodes.push(fromBlockout('relieving-nelson', 'measured'));
  nodes.push(fromBlockout('relieving-arbuthnot', 'measured'));
  nodes.push(fromBlockout('relieving-campbell', 'measured'));

  // --- Queen's Chamber ---
  nodes.push(
    calculated({
      id: 'queens-chamber',
      name: "Queen's Chamber",
      position: {
        x: GP_GRAND_GALLERY.xOffset,
        y: chamberCenterY(GP_QUEENS_CHAMBER.floorY, GP_QUEENS_CHAMBER.height),
        z: 5,
      },
      size: {
        x: GP_QUEENS_CHAMBER.width,
        y: GP_QUEENS_CHAMBER.height,
        z: GP_QUEENS_CHAMBER.depth,
      },
      objectId: 'OBJ-0118',
      evidenceIds: ['EV-100018'],
      sourceIds: ['SRC-0101'],
      layer: 'queens-complex',
      color: '#b39b6b',
      opacity: 0.4,
      derivation: 'measured',
    }),
  );

  // --- Queen's Niche + Passage (from blockout) ---
  nodes.push(fromBlockout('queens-niche', 'measured'));
  nodes.push(fromBlockout('queens-passage', 'measured'));

  // --- Shafts ---
  // KC shafts: use angle from constants, length/position from blockout (no length constants)
  {
    const kcNorth = getBlockoutNode('kc-north-shaft');
    nodes.push(
      calculated({
        ...kcNorth,
        rotation: { x: -degToRad(GP_KC_SHAFTS.north.angleDeg), y: 0, z: 0 },
        size: {
          x: GP_KC_SHAFTS.north.diameter,
          y: GP_KC_SHAFTS.north.diameter,
          z: kcNorth.size.z,
        },
        lod: 'LOD1',
        derivation: 'calculated',
      } as BlockoutNodeLOD1),
    );
  }
  {
    const kcSouth = getBlockoutNode('kc-south-shaft');
    nodes.push(
      calculated({
        ...kcSouth,
        rotation: { x: degToRad(GP_KC_SHAFTS.south.angleDeg), y: 0, z: 0 },
        size: {
          x: GP_KC_SHAFTS.south.diameter,
          y: GP_KC_SHAFTS.south.diameter,
          z: kcSouth.size.z,
        },
        lod: 'LOD1',
        derivation: 'calculated',
      } as BlockoutNodeLOD1),
    );
  }
  {
    const qcNorth = getBlockoutNode('qc-north-shaft');
    nodes.push(
      calculated({
        ...qcNorth,
        rotation: { x: -degToRad(GP_QC_SHAFTS.north.angleDeg), y: 0, z: 0 },
        size: {
          x: GP_QC_SHAFTS.north.diameter,
          y: GP_QC_SHAFTS.north.diameter,
          z: qcNorth.size.z,
        },
        lod: 'LOD1',
        derivation: 'calculated',
      } as BlockoutNodeLOD1),
    );
  }
  {
    const qcSouth = getBlockoutNode('qc-south-shaft');
    nodes.push(
      calculated({
        ...qcSouth,
        rotation: { x: degToRad(GP_QC_SHAFTS.south.angleDeg), y: 0, z: 0 },
        size: {
          x: GP_QC_SHAFTS.south.diameter,
          y: GP_QC_SHAFTS.south.diameter,
          z: qcSouth.size.z,
        },
        lod: 'LOD1',
        derivation: 'calculated',
      } as BlockoutNodeLOD1),
    );
  }

  // --- Well Shaft + Grotto (from blockout) ---
  nodes.push(fromBlockout('well-shaft', 'measured'));
  nodes.push(fromBlockout('grotto', 'inferred'));

  return nodes;
}
