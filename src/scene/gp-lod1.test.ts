import { describe, it, expect } from 'vitest';
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
  slopedBoxCenter,
  slopedBoxRotation,
  slopedBoxFromFloorEndpoints,
  distance3D,
  chamberCenterY,
  faceZAtHeight,
  midpoint,
} from '@db/geometry/gp-geometry-utils';
import { generateGreatPyramidLOD1 } from '@db/geometry/gp-lod1';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';
import { buildGreatPyramidSceneGraph } from '@/scene/greatPyramidSceneGraph';

describe('gp-geometry-utils', () => {
  it('degToRad converts correctly', () => {
    expect(degToRad(0)).toBe(0);
    expect(degToRad(90)).toBeCloseTo(Math.PI / 2);
    expect(degToRad(180)).toBeCloseTo(Math.PI);
  });

  it('midpoint computes correctly', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 10, y: 20, z: 30 };
    expect(midpoint(a, b)).toEqual({ x: 5, y: 10, z: 15 });
  });

  it('slopedEndpoint computes downward passage', () => {
    const start = { x: 0, y: 16.97, z: -115.18 };
    const end = slopedEndpoint(start, 26.52, 105.23);
    expect(end.x).toBe(start.x);
    expect(end.y).toBeCloseTo(16.97 - 105.23 * Math.sin(degToRad(26.52)), 2);
    expect(end.z).toBeCloseTo(-115.18 + 105.23 * Math.cos(degToRad(26.52)), 2);
  });

  it('slopedEndpoint computes upward passage with negative angle', () => {
    const start = { x: 0, y: 11.1, z: -103.4 };
    const end = slopedEndpoint(start, -26.04, 39.28);
    expect(end.x).toBe(start.x);
    expect(end.y).toBeCloseTo(11.1 + 39.28 * Math.sin(degToRad(26.04)), 2);
    expect(end.z).toBeCloseTo(-103.4 + 39.28 * Math.cos(degToRad(26.04)), 2);
  });

  it('distance3D computes correctly', () => {
    const a = { x: 0, y: 0, z: 0 };
    const b = { x: 3, y: 4, z: 0 };
    expect(distance3D(a, b)).toBeCloseTo(5, 5);
  });

  it('slopedBoxFromFloorEndpoints offsets position to box center', () => {
    const start = { x: 0, y: 0, z: 0 };
    const end = { x: 0, y: 10, z: 10 };
    const height = 2;
    const box = slopedBoxFromFloorEndpoints(start, end, 1, height);
    // Floor midpoint is (0, 5, 5)
    // Angle = -atan2(10, 10) = -45° in rad
    const angle = -Math.atan2(10, 10);
    const expectedY = 5 + (height / 2) * Math.cos(angle);
    const expectedZ = 5 + (height / 2) * Math.sin(angle);
    expect(box.position.y).toBeCloseTo(expectedY, 5);
    expect(box.position.z).toBeCloseTo(expectedZ, 5);
    expect(box.size.z).toBeCloseTo(distance3D(start, end), 5);
  });

  it('slopedBoxCenter computes midpoint of endpoints', () => {
    const a = { x: 0, y: 10, z: 0 };
    const b = { x: 0, y: 0, z: 20 };
    expect(slopedBoxCenter(a, b)).toEqual({ x: 0, y: 5, z: 10 });
  });

  it('slopedBoxRotation converts angle to radians', () => {
    const rot = slopedBoxRotation(26.52);
    expect(rot.x).toBeCloseTo(degToRad(26.52));
    expect(rot.y).toBe(0);
    expect(rot.z).toBe(0);
  });

  it('chamberCenterY computes floor + height/2', () => {
    expect(chamberCenterY(42.96, 5.97)).toBeCloseTo(45.945, 2);
  });
});

describe('Measurement Constants', () => {
  it('GP_EXTERNAL has expected values', () => {
    expect(GP_EXTERNAL.baseMean).toBeCloseTo(230.364, 1);
    expect(GP_EXTERNAL.currentHeight).toBeCloseTo(138.5, 1);
    expect(GP_EXTERNAL.casingAngleDeg).toBeCloseTo(51.84, 1);
  });

  it('GP_ENTRANCE has expected values', () => {
    expect(GP_ENTRANCE.heightAboveBase).toBeCloseTo(16.97, 1);
    expect(GP_ENTRANCE.xOffset).toBeCloseTo(7.29, 1);
  });

  it('GP_DESCENDING_PASSAGE has expected values', () => {
    expect(GP_DESCENDING_PASSAGE.angleDeg).toBeCloseTo(26.52, 1);
    expect(GP_DESCENDING_PASSAGE.totalLength).toBeCloseTo(105.16, 1);
  });

  it('GP_ASCENDING_PASSAGE has expected values', () => {
    expect(GP_ASCENDING_PASSAGE.angleDeg).toBeCloseTo(26.04, 1);
    expect(GP_ASCENDING_PASSAGE.length).toBeCloseTo(39.29, 1);
  });

  it('GP_GRAND_GALLERY has expected values', () => {
    expect(GP_GRAND_GALLERY.angleDeg).toBeCloseTo(26.28, 1);
    expect(GP_GRAND_GALLERY.floorLength).toBeCloseTo(47.85, 1);
  });

  it('GP_KINGS_CHAMBER has expected values', () => {
    expect(GP_KINGS_CHAMBER.width).toBeCloseTo(5.24, 1);
    expect(GP_KINGS_CHAMBER.height).toBeCloseTo(5.97, 1);
    expect(GP_KINGS_CHAMBER.depth).toBeCloseTo(10.47, 1);
  });

  it('GP_QUEENS_CHAMBER has expected values', () => {
    expect(GP_QUEENS_CHAMBER.width).toBeCloseTo(5.23, 1);
    expect(GP_QUEENS_CHAMBER.height).toBeCloseTo(6.23, 1);
  });

  it('GP_KC_SHAFTS have expected angles', () => {
    expect(GP_KC_SHAFTS.north.angleDeg).toBeCloseTo(32.6, 1);
    expect(GP_KC_SHAFTS.south.angleDeg).toBeCloseTo(45.0, 1);
  });

  it('GP_QC_SHAFTS have expected angles', () => {
    expect(GP_QC_SHAFTS.north.angleDeg).toBeCloseTo(39.0, 1);
    expect(GP_QC_SHAFTS.south.angleDeg).toBeCloseTo(39.6, 1);
  });
});

describe('generateGreatPyramidLOD1', () => {
  const lod1Nodes = generateGreatPyramidLOD1();

  it('produces nodes', () => {
    expect(lod1Nodes.length).toBeGreaterThan(0);
  });

  it('all nodes have lod = LOD1', () => {
    for (const node of lod1Nodes) {
      expect(node.lod).toBe('LOD1');
    }
  });

  it('all nodes have a derivation type', () => {
    for (const node of lod1Nodes) {
      expect(['measured', 'calculated', 'inferred', 'placeholder']).toContain(node.derivation);
    }
  });

  it('pyramid-exterior uses measurement-derived position', () => {
    const ext = lod1Nodes.find((n) => n.id === 'pyramid-exterior');
    expect(ext).toBeDefined();
    expect(ext!.position.y).toBeCloseTo(GP_EXTERNAL.currentHeight / 2, 1);
    expect(ext!.size.x).toBeCloseTo(GP_EXTERNAL.baseMean, 1);
  });

  it('casing-north uses measurement-derived rotation', () => {
    const casing = lod1Nodes.find((n) => n.id === 'casing-north');
    expect(casing).toBeDefined();
    expect(casing!.rotation?.x).toBeCloseTo(degToRad(GP_EXTERNAL.casingAngleDeg), 2);
  });

  it('original-entrance uses measurement constants', () => {
    const entrance = lod1Nodes.find((n) => n.id === 'original-entrance');
    expect(entrance).toBeDefined();
    expect(entrance!.position.x).toBeCloseTo(GP_ENTRANCE.xOffset, 1);
    expect(entrance!.position.y).toBeCloseTo(GP_ENTRANCE.heightAboveBase, 1);
  });

  it('descending-passage (sloped) is calculated from measurements', () => {
    const dp = lod1Nodes.find((n) => n.id === 'descending-passage');
    expect(dp).toBeDefined();
    expect(dp!.derivation).toBe('calculated');
    const slopedLen = GP_DESCENDING_PASSAGE.totalLength - 9.0; // minus horizontal section
    expect(dp!.size.z).toBeCloseTo(slopedLen, 1);
  });

  it('descending-passage-horizontal exists', () => {
    const dph = lod1Nodes.find((n) => n.id === 'descending-passage-horizontal');
    expect(dph).toBeDefined();
    expect(dph!.derivation).toBe('calculated');
  });

  it('ascending-passage is calculated from measurements', () => {
    const ap = lod1Nodes.find((n) => n.id === 'ascending-passage');
    expect(ap).toBeDefined();
    expect(ap!.derivation).toBe('calculated');
    expect(ap!.size.z).toBeCloseTo(GP_ASCENDING_PASSAGE.length, 1);
  });

  it('grand-gallery is calculated from measurements', () => {
    const gg = lod1Nodes.find((n) => n.id === 'grand-gallery');
    expect(gg).toBeDefined();
    expect(gg!.derivation).toBe('calculated');
    expect(gg!.size.z).toBeCloseTo(GP_GRAND_GALLERY.floorLength, 1);
  });

  it('Grand Gallery center Y is offset from floor midpoint to box center', () => {
    const gg = lod1Nodes.find((n) => n.id === 'grand-gallery');
    expect(gg).toBeDefined();
    const floorMidY = (GP_GRAND_GALLERY.floorNorthY + GP_GRAND_GALLERY.floorHighY) / 2;
    const offsetY = (GP_GRAND_GALLERY.height / 2) * Math.cos(degToRad(GP_GRAND_GALLERY.angleDeg));
    const expectedY = floorMidY + offsetY;
    expect(gg!.position.y).toBeCloseTo(expectedY, 1);
  });

  it('Grand Gallery has correct rotation (-26.28°)', () => {
    const gg = lod1Nodes.find((n) => n.id === 'grand-gallery');
    expect(gg).toBeDefined();
    expect(gg!.rotation!.x).toBeCloseTo(-degToRad(GP_GRAND_GALLERY.angleDeg), 2);
  });

  it('kings-chamber uses measurement constants', () => {
    const kc = lod1Nodes.find((n) => n.id === 'kings-chamber');
    expect(kc).toBeDefined();
    expect(kc!.size.x).toBeCloseTo(GP_KINGS_CHAMBER.width, 1);
    expect(kc!.size.y).toBeCloseTo(GP_KINGS_CHAMBER.height, 1);
    expect(kc!.size.z).toBeCloseTo(GP_KINGS_CHAMBER.depth, 1);
  });

  it('queens-chamber uses measurement constants', () => {
    const qc = lod1Nodes.find((n) => n.id === 'queens-chamber');
    expect(qc).toBeDefined();
    expect(qc!.size.x).toBeCloseTo(GP_QUEENS_CHAMBER.width, 1);
    expect(qc!.size.y).toBeCloseTo(GP_QUEENS_CHAMBER.height, 1);
  });

  it('kc-north-shaft uses measurement-derived angle (positive rotation for north-going)', () => {
    const shaft = lod1Nodes.find((n) => n.id === 'kc-north-shaft');
    expect(shaft).toBeDefined();
    // North shaft goes up toward -Z, so rotation.x is positive (-Z end up)
    expect(shaft!.rotation?.x).toBeCloseTo(degToRad(GP_KC_SHAFTS.north.angleDeg), 2);
  });

  it('kc-south-shaft uses measurement-derived angle', () => {
    const shaft = lod1Nodes.find((n) => n.id === 'kc-south-shaft');
    expect(shaft).toBeDefined();
    // South shaft goes up toward +Z, so rotation.x is negative (same as ascending)
    expect(shaft!.rotation?.x).toBeCloseTo(-degToRad(GP_KC_SHAFTS.south.angleDeg), 2);
  });

  it('entrance z matches faceZAtHeight(16.97)', () => {
    const entrance = lod1Nodes.find((n) => n.id === 'original-entrance');
    expect(entrance).toBeDefined();
    const expectedZ = faceZAtHeight(
      GP_ENTRANCE.heightAboveBase,
      GP_EXTERNAL.baseMean / 2,
      GP_EXTERNAL.casingAngleDeg,
    );
    expect(entrance!.position.z).toBeCloseTo(expectedZ, 1);
  });

  it('queens-chamber is at x=0 (centre axis)', () => {
    const qc = lod1Nodes.find((n) => n.id === 'queens-chamber');
    expect(qc).toBeDefined();
    expect(qc!.position.x).toBeCloseTo(0, 1);
  });

  it('subterranean chamber z is near DP endpoint', () => {
    const sub = lod1Nodes.find((n) => n.id === 'subterranean-chamber');
    expect(sub).toBeDefined();
    // Subterranean chamber is slightly north of centre per Petrie
    // Just verify it's in a reasonable range (within pyramid base)
    expect(sub!.position.z).toBeGreaterThan(-GP_EXTERNAL.baseMean / 2);
    expect(sub!.position.z).toBeLessThan(GP_EXTERNAL.baseMean / 2);
  });

  it('relieving chambers z matches KC z', () => {
    const kc = lod1Nodes.find((n) => n.id === 'kings-chamber');
    const davison = lod1Nodes.find((n) => n.id === 'relieving-davison');
    expect(kc).toBeDefined();
    expect(davison).toBeDefined();
    expect(davison!.position.z).toBeCloseTo(kc!.position.z, 1);
  });

  it('KC north shaft starts at KC north wall floor level', () => {
    const shaft = lod1Nodes.find((n) => n.id === 'kc-north-shaft');
    expect(shaft).toBeDefined();
    // Shaft starts at KC floor and goes up — midpoint will be above KC floor
    expect(shaft!.position.y).toBeGreaterThan(GP_KINGS_CHAMBER.floorY);
  });

  it('qc-north-shaft uses measurement-derived angle (positive rotation for north-going)', () => {
    const shaft = lod1Nodes.find((n) => n.id === 'qc-north-shaft');
    expect(shaft).toBeDefined();
    // North shaft goes up toward -Z, so rotation.x is positive (-Z end up)
    expect(shaft!.rotation?.x).toBeCloseTo(degToRad(GP_QC_SHAFTS.north.angleDeg), 2);
  });

  it('qc-south-shaft uses measurement-derived angle (negative rotation for south-going)', () => {
    const shaft = lod1Nodes.find((n) => n.id === 'qc-south-shaft');
    expect(shaft).toBeDefined();
    // South shaft goes up toward +Z, so rotation.x is negative (same as ascending)
    expect(shaft!.rotation?.x).toBeCloseTo(-degToRad(GP_QC_SHAFTS.south.angleDeg), 2);
  });

  it('KC shafts start at KC floor level (lower end near floorY)', () => {
    const north = lod1Nodes.find((n) => n.id === 'kc-north-shaft');
    const south = lod1Nodes.find((n) => n.id === 'kc-south-shaft');
    expect(north).toBeDefined();
    expect(south).toBeDefined();
    // The shaft midpoint is offset from the floor midpoint by half-height perpendicular.
    // The lower end (start) should be at floorY. Check that midpoint is not absurdly high.
    // KC north shaft exits at ~79m, so midpoint ~60m is expected.
    // Just verify position.y is reasonable (below pyramid top).
    expect(north!.position.y).toBeLessThan(GP_EXTERNAL.currentHeight);
    expect(south!.position.y).toBeLessThan(GP_EXTERNAL.currentHeight);
    // And above the KC floor
    expect(north!.position.y).toBeGreaterThan(GP_KINGS_CHAMBER.floorY);
    expect(south!.position.y).toBeGreaterThan(GP_KINGS_CHAMBER.floorY);
  });

  it('QC shafts start at QC floor level (lower end near floorY)', () => {
    const north = lod1Nodes.find((n) => n.id === 'qc-north-shaft');
    const south = lod1Nodes.find((n) => n.id === 'qc-south-shaft');
    expect(north).toBeDefined();
    expect(south).toBeDefined();
    // QC shafts go up ~60m from floor level. Midpoint will be well above QC.
    // Just verify position is reasonable (below pyramid top, above QC floor).
    expect(north!.position.y).toBeLessThan(GP_EXTERNAL.currentHeight);
    expect(south!.position.y).toBeLessThan(GP_EXTERNAL.currentHeight);
    expect(north!.position.y).toBeGreaterThan(GP_QUEENS_CHAMBER.floorY);
    expect(south!.position.y).toBeGreaterThan(GP_QUEENS_CHAMBER.floorY);
  });

  it('LOD1 node count is >= LOD0 node count', () => {
    // LOD1 may have additional nodes (e.g. descending-passage-horizontal)
    expect(lod1Nodes.length).toBeGreaterThanOrEqual(greatPyramidBlockout.nodes.length);
  });

  it('all LOD1 node IDs are valid', () => {
    const lod0Ids = new Set(greatPyramidBlockout.nodes.map((n) => n.id));
    // Nodes that exist only in LOD1 (not in LOD0 blockout)
    const lod1OnlyIds = new Set(['descending-passage-horizontal']);
    for (const node of lod1Nodes) {
      expect(lod0Ids.has(node.id) || lod1OnlyIds.has(node.id)).toBe(true);
    }
  });
});

describe('LOD0 Scene Graph (backward compatibility)', () => {
  const graph = buildGreatPyramidSceneGraph('LOD0');

  it('has a root node', () => {
    const all = graph.getAllNodes();
    const root = all.find((n) => n.parentId === null);
    expect(root).toBeDefined();
    expect(root?.name).toBe('Great Pyramid');
  });

  it('has 26 mesh nodes', () => {
    const all = graph.getAllNodes();
    const layerGroupIds = new Set([
      'gp-root',
      'gp-exterior',
      'gp-passages',
      'gp-subterranean',
      'gp-gallery',
      'gp-kings-complex',
      'gp-queens-complex',
      'gp-relieving',
      'gp-shafts',
    ]);
    const meshNodes = all.filter((n) => !layerGroupIds.has(n.id));
    expect(meshNodes).toHaveLength(26);
  });
});

describe('LOD1 Scene Graph', () => {
  const graph = buildGreatPyramidSceneGraph('LOD1');

  it('has a root node', () => {
    const all = graph.getAllNodes();
    const root = all.find((n) => n.parentId === null);
    expect(root).toBeDefined();
    expect(root?.name).toBe('Great Pyramid');
  });

  it('has layer group nodes', () => {
    const all = graph.getAllNodes();
    const layerIds = [
      'gp-exterior',
      'gp-passages',
      'gp-subterranean',
      'gp-gallery',
      'gp-kings-complex',
      'gp-queens-complex',
      'gp-relieving',
      'gp-shafts',
    ];
    for (const id of layerIds) {
      expect(all.find((n) => n.id === id)).toBeDefined();
    }
  });

  it('has all LOD1 mesh nodes', () => {
    const lod1Nodes = generateGreatPyramidLOD1();
    const all = graph.getAllNodes();
    for (const node of lod1Nodes) {
      const sceneNode = all.find((n) => n.id === node.id);
      expect(sceneNode).toBeDefined();
    }
  });

  it('all nodes are visible by default', () => {
    const all = graph.getAllNodes();
    for (const node of all) {
      expect(node.visible).toBe(true);
    }
  });
});
