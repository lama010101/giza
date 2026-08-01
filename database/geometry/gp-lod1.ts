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
  GP_WELL_SHAFT,
  GP_POI,
  GP_ANTECHAMBER,
  GP_SUBTERRANEAN,
  GP_QC_PASSAGE,
} from '@db/measurements/great-pyramid-measurements';
import {
  degToRad,
  slopedEndpoint,
  slopedBoxFromFloorEndpoints,
  chamberCenterY,
  faceZAtHeight,
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
      position: {
        x: 0,
        y: 5,
        z: faceZAtHeight(5, GP_EXTERNAL.baseMean / 2, GP_EXTERNAL.casingAngleDeg),
      },
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
        z: faceZAtHeight(
          GP_ENTRANCE.heightAboveBase,
          GP_EXTERNAL.baseMean / 2,
          GP_EXTERNAL.casingAngleDeg,
        ),
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
  // Shared computation: entrance on sloped north face, POI, DP endpoint
  const entranceZ = faceZAtHeight(
    GP_ENTRANCE.heightAboveBase,
    GP_EXTERNAL.baseMean / 2,
    GP_EXTERNAL.casingAngleDeg,
  );
  const dpStart: Vector3 = {
    x: GP_ENTRANCE.xOffset,
    y: GP_ENTRANCE.heightAboveBase,
    z: entranceZ,
  };
  // POI: where AP branches off DP, computed from distanceAlongDP constant
  const poiY =
    GP_ENTRANCE.heightAboveBase -
    GP_POI.distanceAlongDP * Math.sin(degToRad(GP_DESCENDING_PASSAGE.angleDeg));
  const poiZ =
    entranceZ + GP_POI.distanceAlongDP * Math.cos(degToRad(GP_DESCENDING_PASSAGE.angleDeg));
  // DP sloped section ends where horizontal section begins
  const dpSlopedLength =
    GP_DESCENDING_PASSAGE.totalLength - GP_SUBTERRANEAN.horizontalPassageLength;
  const dpSlopedEnd = slopedEndpoint(dpStart, GP_DESCENDING_PASSAGE.angleDeg, dpSlopedLength);
  // DP horizontal section: from sloped end south to subterranean chamber
  const dpHorizontalEnd: Vector3 = {
    x: dpSlopedEnd.x,
    y: dpSlopedEnd.y,
    z: dpSlopedEnd.z + GP_SUBTERRANEAN.horizontalPassageLength,
  };
  const dpBox = slopedBoxFromFloorEndpoints(
    dpStart,
    dpSlopedEnd,
    GP_DESCENDING_PASSAGE.width,
    GP_DESCENDING_PASSAGE.height,
  );
  nodes.push(
    calculated({
      id: 'descending-passage',
      name: 'Descending Passage (sloped)',
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
  // DP horizontal section
  {
    const horizBox = slopedBoxFromFloorEndpoints(
      dpSlopedEnd,
      dpHorizontalEnd,
      GP_DESCENDING_PASSAGE.width,
      GP_DESCENDING_PASSAGE.height,
    );
    nodes.push(
      calculated({
        id: 'descending-passage-horizontal',
        name: 'Descending Passage (horizontal)',
        position: horizBox.position,
        rotation: horizBox.rotation,
        size: horizBox.size,
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

  // --- Subterranean Chamber ---
  nodes.push(
    calculated({
      id: 'subterranean-chamber',
      name: 'Subterranean Chamber',
      position: {
        x: 0,
        y: GP_SUBTERRANEAN.floorY + GP_SUBTERRANEAN.height / 2,
        z: dpHorizontalEnd.z + GP_SUBTERRANEAN.depth / 2,
      },
      size: {
        x: GP_SUBTERRANEAN.width,
        y: GP_SUBTERRANEAN.height,
        z: GP_SUBTERRANEAN.depth,
      },
      objectId: 'OBJ-0106',
      evidenceIds: ['EV-100006'],
      sourceIds: ['SRC-0101'],
      layer: 'subterranean',
      color: '#6a5a40',
      opacity: 0.4,
      derivation: 'calculated',
    }),
  );
  nodes.push(fromBlockout('subterranean-pit', 'inferred'));

  // --- Ascending Passage ---
  {
    // AP starts at the Point of Intersection (POI) with DP
    // poiY and poiZ are computed above from GP_POI.distanceAlongDP
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

  // --- Antechamber ---
  // Positioned between GG south wall and KC north wall
  const ggEndZ =
    poiZ +
    GP_ASCENDING_PASSAGE.length * Math.cos(degToRad(GP_ASCENDING_PASSAGE.angleDeg)) +
    GP_GRAND_GALLERY.floorLength * Math.cos(degToRad(GP_GRAND_GALLERY.angleDeg));
  const antechamberNorthZ = ggEndZ + GP_ANTECHAMBER.gapFromGG;
  const antechamberCenterZ = antechamberNorthZ + GP_ANTECHAMBER.depth / 2;
  nodes.push(
    calculated({
      id: 'antechamber',
      name: 'Antechamber',
      position: {
        x: GP_GRAND_GALLERY.xOffset,
        y: chamberCenterY(GP_ANTECHAMBER.floorY, GP_ANTECHAMBER.height),
        z: antechamberCenterZ,
      },
      size: {
        x: GP_ANTECHAMBER.width,
        y: GP_ANTECHAMBER.height,
        z: GP_ANTECHAMBER.depth,
      },
      objectId: 'OBJ-0110',
      evidenceIds: ['EV-100010'],
      sourceIds: ['SRC-0101'],
      layer: 'kings-complex',
      color: '#a08060',
      opacity: 0.4,
      derivation: 'calculated',
    }),
  );

  // --- King's Chamber ---
  // KC z computed from measurement chain: GG end → antechamber → gap → KC
  const kcNorthZ = antechamberNorthZ + GP_ANTECHAMBER.depth + GP_ANTECHAMBER.gapToKC;
  const kcCenterZ = kcNorthZ + GP_KINGS_CHAMBER.depth / 2;
  nodes.push(
    calculated({
      id: 'kings-chamber',
      name: "King's Chamber",
      position: {
        x: GP_GRAND_GALLERY.xOffset,
        y: chamberCenterY(GP_KINGS_CHAMBER.floorY, GP_KINGS_CHAMBER.height),
        z: kcCenterZ,
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

  // --- Relieving Chambers ---
  // Aligned with corrected KC z, stacked above KC ceiling
  const kcCeilingY = GP_KINGS_CHAMBER.floorY + GP_KINGS_CHAMBER.height;
  const relievingNames = [
    'relieving-davison',
    'relieving-wellington',
    'relieving-nelson',
    'relieving-arbuthnot',
    'relieving-campbell',
  ] as const;
  let relievingY = kcCeilingY;
  for (const id of relievingNames) {
    const blockout = getBlockoutNode(id);
    const h = blockout.size.y;
    nodes.push(
      calculated({
        ...blockout,
        position: {
          x: GP_GRAND_GALLERY.xOffset,
          y: relievingY + h / 2,
          z: kcCenterZ,
        },
        lod: 'LOD1',
        derivation: 'calculated',
      } as BlockoutNodeLOD1),
    );
    relievingY += h;
  }

  // --- Queen's Chamber ---
  // QC is on the pyramid centre axis (x=0), not offset east like KC/GG
  nodes.push(
    calculated({
      id: 'queens-chamber',
      name: "Queen's Chamber",
      position: {
        x: GP_QUEENS_CHAMBER.centerX,
        y: chamberCenterY(GP_QUEENS_CHAMBER.floorY, GP_QUEENS_CHAMBER.height),
        z: GP_QUEENS_CHAMBER.centerZ,
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

  // --- Queen's Niche (from blockout) ---
  nodes.push(fromBlockout('queens-niche', 'measured'));

  // --- Queen's Chamber Passage ---
  // Horizontal passage from AP (at QC floor elevation) southward to QC north wall
  {
    const apDistToQC =
      (GP_QUEENS_CHAMBER.floorY - poiY) / Math.sin(degToRad(GP_ASCENDING_PASSAGE.angleDeg));
    const apQCJunctionZ = poiZ + apDistToQC * Math.cos(degToRad(GP_ASCENDING_PASSAGE.angleDeg));
    const qcNorthZ = GP_QUEENS_CHAMBER.centerZ - GP_QUEENS_CHAMBER.depth / 2;
    const qcPassageStart: Vector3 = {
      x: GP_ENTRANCE.xOffset,
      y: GP_QUEENS_CHAMBER.floorY,
      z: apQCJunctionZ,
    };
    const qcPassageEnd: Vector3 = {
      x: GP_QUEENS_CHAMBER.centerX,
      y: GP_QUEENS_CHAMBER.floorY,
      z: qcNorthZ,
    };
    const qcPassageBox = slopedBoxFromFloorEndpoints(
      qcPassageStart,
      qcPassageEnd,
      GP_QC_PASSAGE.width,
      GP_QC_PASSAGE.heightBeforeStep,
    );
    nodes.push(
      calculated({
        id: 'queens-passage',
        name: "Queen's Chamber Passage",
        position: qcPassageBox.position,
        rotation: qcPassageBox.rotation,
        size: qcPassageBox.size,
        objectId: 'OBJ-0120',
        evidenceIds: ['EV-100020'],
        sourceIds: ['SRC-0101'],
        layer: 'passages',
        color: '#c2ab7a',
        opacity: 0.4,
        derivation: 'calculated',
      }),
    );
  }

  // --- Shafts ---
  // KC shafts: computed from corrected KC geometry, exit at pyramid face
  {
    const kcCeilingY = GP_KINGS_CHAMBER.floorY + GP_KINGS_CHAMBER.height;
    const kcSouthZ = kcCenterZ + GP_KINGS_CHAMBER.depth / 2;

    // KC north shaft: starts at KC north wall ceiling, goes up toward north face
    const kcNorthStart: Vector3 = {
      x: GP_GRAND_GALLERY.xOffset,
      y: kcCeilingY,
      z: kcNorthZ,
    };
    // Solve for t where shaft meets north face:
    // z_start - t*cos(angle) = faceZAtHeight(y_start + t*sin(angle))
    const nAng = GP_KC_SHAFTS.north.angleDeg;
    const nSin = Math.sin(degToRad(nAng));
    const nCos = Math.cos(degToRad(nAng));
    const tanCasing = Math.tan(degToRad(GP_EXTERNAL.casingAngleDeg));
    // z_start - t*cos = -baseHalf + (y_start + t*sin) / tanCasing
    // z_start + baseHalf = t*cos + (y_start + t*sin) / tanCasing
    // z_start + baseHalf = t*cos + y_start/tanCasing + t*sin/tanCasing
    // z_start + baseHalf - y_start/tanCasing = t * (cos + sin/tanCasing)
    const kcNorthT =
      (kcNorthStart.z + GP_EXTERNAL.baseMean / 2 - kcNorthStart.y / tanCasing) /
      (nCos + nSin / tanCasing);
    const kcNorthEnd: Vector3 = {
      x: kcNorthStart.x,
      y: kcNorthStart.y + kcNorthT * nSin,
      z: kcNorthStart.z - kcNorthT * nCos,
    };
    const kcNorthBox = slopedBoxFromFloorEndpoints(
      kcNorthStart,
      kcNorthEnd,
      GP_KC_SHAFTS.north.diameter,
      GP_KC_SHAFTS.north.diameter,
    );
    nodes.push(
      calculated({
        id: 'kc-north-shaft',
        name: 'KC North Shaft',
        position: kcNorthBox.position,
        rotation: kcNorthBox.rotation,
        size: kcNorthBox.size,
        objectId: 'OBJ-0121',
        evidenceIds: ['EV-100021'],
        sourceIds: ['SRC-0105'],
        layer: 'shafts',
        color: '#7a6a4a',
        opacity: 0.5,
        derivation: 'calculated',
      }),
    );

    // KC south shaft: starts at KC south wall ceiling, goes up toward south face
    const kcSouthStart: Vector3 = {
      x: GP_GRAND_GALLERY.xOffset,
      y: kcCeilingY,
      z: kcSouthZ,
    };
    const sAng = GP_KC_SHAFTS.south.angleDeg;
    const sSin = Math.sin(degToRad(sAng));
    const sCos = Math.cos(degToRad(sAng));
    // South face: z = baseHalf - y / tanCasing
    // z_start + t*cos = baseHalf - (y_start + t*sin) / tanCasing
    // z_start - baseHalf + y_start/tanCasing = -t*cos - t*sin/tanCasing
    // baseHalf - z_start - y_start/tanCasing = t * (cos + sin/tanCasing)
    const kcSouthT =
      (GP_EXTERNAL.baseMean / 2 - kcSouthStart.z - kcSouthStart.y / tanCasing) /
      (sCos + sSin / tanCasing);
    const kcSouthEnd: Vector3 = {
      x: kcSouthStart.x,
      y: kcSouthStart.y + kcSouthT * sSin,
      z: kcSouthStart.z + kcSouthT * sCos,
    };
    const kcSouthBox = slopedBoxFromFloorEndpoints(
      kcSouthStart,
      kcSouthEnd,
      GP_KC_SHAFTS.south.diameter,
      GP_KC_SHAFTS.south.diameter,
    );
    nodes.push(
      calculated({
        id: 'kc-south-shaft',
        name: 'KC South Shaft',
        position: kcSouthBox.position,
        rotation: kcSouthBox.rotation,
        size: kcSouthBox.size,
        objectId: 'OBJ-0122',
        evidenceIds: ['EV-100022'],
        sourceIds: ['SRC-0105'],
        layer: 'shafts',
        color: '#7a6a4a',
        opacity: 0.5,
        derivation: 'calculated',
      }),
    );
  }

  // QC shafts: start from QC walls, don't exit pyramid — cap at ~60m
  {
    const qcCeilingY = GP_QUEENS_CHAMBER.floorY + GP_QUEENS_CHAMBER.height;
    const qcNorthZ = GP_QUEENS_CHAMBER.centerZ - GP_QUEENS_CHAMBER.depth / 2;
    const qcSouthZ = GP_QUEENS_CHAMBER.centerZ + GP_QUEENS_CHAMBER.depth / 2;
    const qcShaftMaxLen = 60;

    // QC north shaft
    const qcNorthStart: Vector3 = {
      x: GP_QUEENS_CHAMBER.centerX,
      y: qcCeilingY,
      z: qcNorthZ,
    };
    const qcNorthEnd = slopedEndpoint(qcNorthStart, GP_QC_SHAFTS.north.angleDeg, qcShaftMaxLen, -1);
    const qcNorthBox = slopedBoxFromFloorEndpoints(
      qcNorthStart,
      qcNorthEnd,
      GP_QC_SHAFTS.north.diameter,
      GP_QC_SHAFTS.north.diameter,
    );
    nodes.push(
      calculated({
        id: 'qc-north-shaft',
        name: 'QC North Shaft',
        position: qcNorthBox.position,
        rotation: qcNorthBox.rotation,
        size: qcNorthBox.size,
        objectId: 'OBJ-0123',
        evidenceIds: ['EV-100023'],
        sourceIds: ['SRC-0105'],
        layer: 'shafts',
        color: '#7a6a4a',
        opacity: 0.5,
        derivation: 'calculated',
      }),
    );

    // QC south shaft
    const qcSouthStart: Vector3 = {
      x: GP_QUEENS_CHAMBER.centerX,
      y: qcCeilingY,
      z: qcSouthZ,
    };
    const qcSouthEnd = slopedEndpoint(qcSouthStart, -GP_QC_SHAFTS.south.angleDeg, qcShaftMaxLen);
    const qcSouthBox = slopedBoxFromFloorEndpoints(
      qcSouthStart,
      qcSouthEnd,
      GP_QC_SHAFTS.south.diameter,
      GP_QC_SHAFTS.south.diameter,
    );
    nodes.push(
      calculated({
        id: 'qc-south-shaft',
        name: 'QC South Shaft',
        position: qcSouthBox.position,
        rotation: qcSouthBox.rotation,
        size: qcSouthBox.size,
        objectId: 'OBJ-0124',
        evidenceIds: ['EV-100024'],
        sourceIds: ['SRC-0105'],
        layer: 'shafts',
        color: '#7a6a4a',
        opacity: 0.5,
        derivation: 'calculated',
      }),
    );
  }

  // --- Well Shaft ---
  // Connects from GG west wall near floor level down to DP near subterranean chamber
  {
    const ggWestX = GP_GRAND_GALLERY.xOffset - GP_GRAND_GALLERY.floorWidth / 2;
    const wellStart: Vector3 = {
      x: ggWestX,
      y: GP_GRAND_GALLERY.floorLowY,
      z: poiZ + GP_ASCENDING_PASSAGE.length * Math.cos(degToRad(GP_ASCENDING_PASSAGE.angleDeg)),
    };
    // End near DP at subterranean chamber level
    const wellEnd: Vector3 = {
      x: ggWestX,
      y: dpSlopedEnd.y,
      z: dpSlopedEnd.z,
    };
    const wellBox = slopedBoxFromFloorEndpoints(
      wellStart,
      wellEnd,
      GP_WELL_SHAFT.width,
      GP_WELL_SHAFT.width,
    );
    nodes.push(
      calculated({
        id: 'well-shaft',
        name: 'Well Shaft',
        position: wellBox.position,
        rotation: wellBox.rotation,
        size: wellBox.size,
        objectId: 'OBJ-0125',
        evidenceIds: ['EV-100025'],
        sourceIds: ['SRC-0101'],
        layer: 'shafts',
        color: '#6a5a40',
        opacity: 0.5,
        derivation: 'inferred',
      }),
    );
  }

  // --- Grotto (from blockout) ---
  nodes.push(fromBlockout('grotto', 'inferred'));

  return nodes;
}
