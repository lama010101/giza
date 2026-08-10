/**
 * 3D Geometry Verification
 *
 * Compares the actual Great Pyramid and Osiris Shaft blockouts (and the
 * measurement-derived LOD1 generator) against the documented survey values
 * in database/measurements/great-pyramid-measurements.ts and
 * docs/architecture/osiris-shaft-measurements.md.
 *
 * Run with: npx tsx scripts/verify-3d-geometry.ts
 */

/* eslint-disable no-console */

import { greatPyramidBlockout, type BlockoutNode } from '@db/blockouts/great-pyramid';
import { osirisBlockout } from '@db/blockouts/osiris-shaft';
import { generateGreatPyramidLOD1, type BlockoutNodeLOD1 } from '@db/geometry/gp-lod1';
import { degToRad, faceZAtHeight } from '@db/geometry/gp-geometry-utils';
import * as GPM from '@db/measurements/great-pyramid-measurements';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}
type Status = 'PASS' | 'WARN' | 'FAIL';

interface CheckResult {
  status: Status;
  scope: string;
  name: string;
  message: string;
  diff?: number;
  tolerance?: number;
}

const results: CheckResult[] = [];

function fmt(n: number, digits = 3): string {
  return n.toFixed(digits);
}

function normAngleRad(r: number): number {
  let a = r % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a <= -Math.PI) a += 2 * Math.PI;
  return a;
}

function findNode(blockout: { nodes: BlockoutNode[] }, id: string): BlockoutNode {
  const node = blockout.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Missing blockout node: ${id}`);
  return node;
}

function endpoints(node: BlockoutNode): { lower: Vector3; upper: Vector3 } {
  const rx = normAngleRad(node.rotation?.x ?? 0);
  const half = node.size.z / 2;
  // Centreline end points of the box in world space.
  const sy = half * Math.sin(rx);
  const cz = half * Math.cos(rx);
  const a: Vector3 = {
    x: node.position.x,
    y: node.position.y - sy,
    z: node.position.z + cz,
  };
  const b: Vector3 = {
    x: node.position.x,
    y: node.position.y + sy,
    z: node.position.z - cz,
  };
  // The supplied start/end points lie on the floor face (local y = -h/2),
  // which is offset from the centreline by -(h/2) in local Y world direction.
  const h = node.size.y / 2;
  const fy = -h * Math.cos(rx);
  const fz = -h * Math.sin(rx);
  a.y += fy;
  a.z += fz;
  b.y += fy;
  b.z += fz;
  return a.y < b.y ? { lower: a, upper: b } : { lower: b, upper: a };
}

function distance(a: Vector3, b: Vector3): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function addResult(
  status: Status,
  scope: string,
  name: string,
  message: string,
  diff?: number,
  tolerance?: number,
) {
  results.push({ status, scope, name, message, diff, tolerance });
}

function compare(
  scope: string,
  name: string,
  actual: number,
  expected: number,
  tolerance: number,
  unit = '',
): void {
  const diff = Math.abs(actual - expected);
  const status: Status = diff <= tolerance ? 'PASS' : 'FAIL';
  addResult(
    status,
    scope,
    name,
    `${name}: actual=${fmt(actual)}${unit}, expected=${fmt(expected)}${unit}, diff=${fmt(diff)}${unit} (tol ${fmt(tolerance)}${unit})`,
    diff,
    tolerance,
  );
}

function warnIf(scope: string, name: string, condition: boolean, message: string) {
  addResult(condition ? 'PASS' : 'WARN', scope, name, message);
}

function greatPyramidChecks() {
  const scope = 'Great Pyramid';
  const get = (id: string) => findNode(greatPyramidBlockout, id);

  // --- Exterior ---
  const ext = get('pyramid-exterior');
  compare(scope, 'Exterior base X', ext.size.x, GPM.GP_EXTERNAL.baseMean, 0.01, 'm');
  compare(scope, 'Exterior base Z', ext.size.z, GPM.GP_EXTERNAL.baseMean, 0.01, 'm');
  compare(scope, 'Exterior height', ext.size.y, GPM.GP_EXTERNAL.currentHeight, 0.01, 'm');
  compare(scope, 'Exterior center Y', ext.position.y, GPM.GP_EXTERNAL.currentHeight / 2, 0.01, 'm');

  // --- Entrance on north face ---
  const entrance = get('original-entrance');
  const expectedEntranceZ = faceZAtHeight(
    GPM.GP_ENTRANCE.heightAboveBase,
    GPM.GP_EXTERNAL.baseMean / 2,
    GPM.GP_EXTERNAL.casingAngleDeg,
  );
  compare(scope, 'Entrance X offset', entrance.position.x, GPM.GP_ENTRANCE.xOffset, 0.01, 'm');
  compare(scope, 'Entrance Y', entrance.position.y, GPM.GP_ENTRANCE.heightAboveBase, 0.01, 'm');
  compare(scope, 'Entrance Z on north face', entrance.position.z, expectedEntranceZ, 0.05, 'm');

  // --- Descending Passage ---
  const dp = get('descending-passage');
  const dpAngle = Math.abs(normAngleRad(dp.rotation?.x ?? 0));
  compare(
    scope,
    'DP slope',
    (dpAngle * 180) / Math.PI,
    GPM.GP_DESCENDING_PASSAGE.angleDeg,
    0.05,
    '°',
  );
  // The blockout models the sloped section only; total DP = sloped + horizontal.
  const dpSlopedLen =
    GPM.GP_DESCENDING_PASSAGE.totalLength - GPM.GP_SUBTERRANEAN.horizontalPassageLength;
  compare(scope, 'DP sloped length', dp.size.z, dpSlopedLen, 0.05, 'm');
  compare(scope, 'DP width', dp.size.x, GPM.GP_DESCENDING_PASSAGE.width, 0.01, 'm');
  compare(scope, 'DP height', dp.size.y, GPM.GP_DESCENDING_PASSAGE.height, 0.01, 'm');

  // --- Subterranean Chamber ---
  const sub = get('subterranean-chamber');
  compare(scope, 'Subterranean width', sub.size.x, GPM.GP_SUBTERRANEAN.width, 0.01, 'm');
  compare(scope, 'Subterranean height', sub.size.y, GPM.GP_SUBTERRANEAN.height, 0.01, 'm');
  compare(scope, 'Subterranean depth', sub.size.z, GPM.GP_SUBTERRANEAN.depth, 0.01, 'm');
  const subFloor = sub.position.y - sub.size.y / 2;
  compare(scope, 'Subterranean floor Y', subFloor, GPM.GP_SUBTERRANEAN.floorY, 0.2, 'm');

  // --- Pit aligned with chamber floor ---
  const pit = get('subterranean-pit');
  const pitTop = pit.position.y + pit.size.y / 2;
  const subFloorCheck = sub.position.y - sub.size.y / 2;
  compare(scope, 'Pit top vs chamber floor', pitTop, subFloorCheck, 0.05, 'm');

  // --- Ascending Passage ---
  const ap = get('ascending-passage');
  const apAngle = Math.abs(normAngleRad(ap.rotation?.x ?? 0));
  compare(
    scope,
    'AP slope',
    (apAngle * 180) / Math.PI,
    GPM.GP_ASCENDING_PASSAGE.angleDeg,
    0.05,
    '°',
  );
  compare(scope, 'AP length', ap.size.z, GPM.GP_ASCENDING_PASSAGE.length, 0.05, 'm');
  compare(scope, 'AP width', ap.size.x, GPM.GP_ASCENDING_PASSAGE.width, 0.01, 'm');
  compare(scope, 'AP height', ap.size.y, GPM.GP_ASCENDING_PASSAGE.height, 0.01, 'm');
  const apEnds = endpoints(ap);
  const entranceZ = faceZAtHeight(
    GPM.GP_ENTRANCE.heightAboveBase,
    GPM.GP_EXTERNAL.baseMean / 2,
    GPM.GP_EXTERNAL.casingAngleDeg,
  );
  const poiY =
    GPM.GP_ENTRANCE.heightAboveBase -
    GPM.GP_POI.distanceAlongDP * Math.sin(degToRad(GPM.GP_DESCENDING_PASSAGE.angleDeg));
  const poiZ =
    entranceZ + GPM.GP_POI.distanceAlongDP * Math.cos(degToRad(GPM.GP_DESCENDING_PASSAGE.angleDeg));
  const poi: Vector3 = { x: GPM.GP_ENTRANCE.xOffset, y: poiY, z: poiZ };
  compare(scope, 'AP lower end near POI', distance(apEnds.lower, poi), 0, 0.3, 'm');

  // --- Grand Gallery ---
  const gg = get('grand-gallery');
  const ggAngle = Math.abs(normAngleRad(gg.rotation?.x ?? 0));
  compare(scope, 'GG slope', (ggAngle * 180) / Math.PI, GPM.GP_GRAND_GALLERY.angleDeg, 0.05, '°');
  compare(scope, 'GG floor length', gg.size.z, GPM.GP_GRAND_GALLERY.floorLength, 0.05, 'm');
  compare(scope, 'GG height', gg.size.y, GPM.GP_GRAND_GALLERY.height, 0.01, 'm');
  compare(scope, 'GG floor width', gg.size.x, GPM.GP_GRAND_GALLERY.floorWidth, 0.01, 'm');
  const ggEnds = endpoints(gg);
  compare(
    scope,
    'GG lower end Y near ref',
    ggEnds.lower.y,
    GPM.GP_GRAND_GALLERY.floorNorthY,
    0.5,
    'm',
  );
  compare(
    scope,
    'GG upper end Y near ref',
    ggEnds.upper.y,
    GPM.GP_GRAND_GALLERY.floorHighY,
    0.5,
    'm',
  );
  // AP upper end and GG lower end share the same z at the junction; y differs because
  // the GG floor is stepped ~1.36 m below the AP floor at the north wall.
  const ggApJunctionDz = Math.abs(ggEnds.lower.z - apEnds.upper.z);
  const ggApJunctionDy = Math.abs(ggEnds.lower.y - apEnds.upper.y);
  compare(scope, 'GG/AP junction z overlap', ggApJunctionDz, 0, 0.5, 'm');
  warnIf(
    scope,
    'GG/AP junction y step',
    ggApJunctionDy < 2.0,
    `GG/AP junction vertical step ${fmt(ggApJunctionDy)} m (AP floor above GG floor, expected ~1.36 m)`,
  );

  // --- Antechamber ---
  const ant = get('antechamber');
  compare(scope, 'Antechamber width', ant.size.x, GPM.GP_ANTECHAMBER.width, 0.01, 'm');
  compare(scope, 'Antechamber height', ant.size.y, GPM.GP_ANTECHAMBER.height, 0.01, 'm');
  compare(scope, 'Antechamber depth', ant.size.z, GPM.GP_ANTECHAMBER.depth, 0.01, 'm');
  const antFloor = ant.position.y - ant.size.y / 2;
  compare(scope, 'Antechamber floor Y', antFloor, GPM.GP_ANTECHAMBER.floorY, 0.2, 'm');

  // --- King's Chamber ---
  const kc = get('kings-chamber');
  compare(scope, 'KC width', kc.size.x, GPM.GP_KINGS_CHAMBER.width, 0.01, 'm');
  compare(scope, 'KC height', kc.size.y, GPM.GP_KINGS_CHAMBER.height, 0.01, 'm');
  compare(scope, 'KC depth', kc.size.z, GPM.GP_KINGS_CHAMBER.depth, 0.01, 'm');
  const kcFloor = kc.position.y - kc.size.y / 2;
  const kcCeiling = kcFloor + kc.size.y;
  compare(scope, 'KC floor Y', kcFloor, GPM.GP_KINGS_CHAMBER.floorY, 0.05, 'm');
  compare(
    scope,
    'KC ceiling Y',
    kcCeiling,
    GPM.GP_KINGS_CHAMBER.ceilingHeightAbovePavement,
    0.05,
    'm',
  );

  // --- Sarcophagus ---
  const sarc = get('kings-sarcophagus');
  const sarcFloor = sarc.position.y - sarc.size.y / 2;
  compare(scope, 'Sarcophagus width', sarc.size.x, 0.978, 0.01, 'm');
  compare(scope, 'Sarcophagus height', sarc.size.y, 1.049, 0.01, 'm');
  compare(scope, 'Sarcophagus length', sarc.size.z, 2.276, 0.01, 'm');
  compare(scope, 'Sarcophagus floor on KC floor', sarcFloor, kcFloor, 0.05, 'm');

  // --- Relieving chambers stack ---
  let prevTop = kcCeiling;
  const relievingIds = [
    'relieving-davison',
    'relieving-wellington',
    'relieving-nelson',
    'relieving-arbuthnot',
    'relieving-campbell',
  ] as const;
  for (const id of relievingIds) {
    const r = get(id);
    const rFloor = r.position.y - r.size.y / 2;
    const gap = rFloor - prevTop;
    warnIf(
      scope,
      `${id} stack gap`,
      Math.abs(gap) < 0.2 || (gap > 0 && gap < 3.5),
      `${id} gap from previous ceiling = ${fmt(gap)} m`,
    );
    prevTop = r.position.y + r.size.y / 2;
  }
  const expectedTop = GPM.GP_KINGS_CHAMBER.floorY + GPM.GP_RELIEVING.totalHeight;
  compare(scope, 'Relieving total top Y', prevTop, expectedTop, 0.1, 'm');

  // --- Queen's Chamber ---
  const qc = get('queens-chamber');
  compare(scope, 'QC width', qc.size.x, GPM.GP_QUEENS_CHAMBER.width, 0.01, 'm');
  compare(scope, 'QC height', qc.size.y, GPM.GP_QUEENS_CHAMBER.height, 0.01, 'm');
  compare(scope, 'QC depth', qc.size.z, GPM.GP_QUEENS_CHAMBER.depth, 0.01, 'm');
  const qcFloor = qc.position.y - qc.size.y / 2;
  compare(scope, 'QC floor Y', qcFloor, GPM.GP_QUEENS_CHAMBER.floorY, 0.3, 'm');

  // --- Queen's Chamber Passage ---
  const qcp = get('queens-passage');
  // The blockout models the straight run from the AP/QC branch to the QC (52.1 m).
  // Petrie's 43.96 m is the gallery-north-wall-to-chamber segment; the extra length
  // reflects the current single-box approximation. Keep as a warning, not a fail.
  const qcpLengthDiff = Math.abs(qcp.size.z - GPM.GP_QC_PASSAGE.length);
  warnIf(
    scope,
    'QC passage length vs Petrie',
    qcpLengthDiff < 1.0,
    `QC passage length ${fmt(qcp.size.z)} m vs Petrie ${fmt(GPM.GP_QC_PASSAGE.length)} m (diff ${fmt(qcpLengthDiff)} m)`,
  );
  compare(scope, 'QC passage width', qcp.size.x, GPM.GP_QC_PASSAGE.width, 0.01, 'm');
  // Blockout uses the "before step" height as a simple approximation.
  warnIf(
    scope,
    'QC passage height',
    qcp.size.y === GPM.GP_QC_PASSAGE.heightBeforeStep,
    `QC passage height ${fmt(qcp.size.y)} m vs documented range ${fmt(
      GPM.GP_QC_PASSAGE.heightBeforeStep,
    )}-${fmt(GPM.GP_QC_PASSAGE.heightAfterStep)} m (blockout uses the lower step)`,
  );

  // --- KC / QC shafts ---
  const kcNorthZ = kc.position.z - kc.size.z / 2;
  const kcSouthZ = kc.position.z + kc.size.z / 2;
  const kcCeilingY = kcFloor + kc.size.y;

  const kcn = get('kc-north-shaft');
  const kcnAngle = Math.abs(normAngleRad(kcn.rotation?.x ?? 0));
  compare(
    scope,
    'KC North shaft slope',
    (kcnAngle * 180) / Math.PI,
    GPM.GP_KC_SHAFTS.north.angleDeg,
    0.05,
    '°',
  );
  compare(scope, 'KC North shaft diameter', kcn.size.x, GPM.GP_KC_SHAFTS.north.diameter, 0.01, 'm');
  const kcnEnds = endpoints(kcn);
  const kcnStart: Vector3 = { x: kcn.position.x, y: kcCeilingY, z: kcNorthZ };
  compare(
    scope,
    'KC North shaft starts at KC north wall',
    distance(kcnEnds.lower, kcnStart),
    0,
    0.2,
    'm',
  );

  const kcs = get('kc-south-shaft');
  const kcsAngle = Math.abs(normAngleRad(kcs.rotation?.x ?? 0));
  compare(
    scope,
    'KC South shaft slope',
    (kcsAngle * 180) / Math.PI,
    GPM.GP_KC_SHAFTS.south.angleDeg,
    0.05,
    '°',
  );
  compare(scope, 'KC South shaft diameter', kcs.size.x, GPM.GP_KC_SHAFTS.south.diameter, 0.01, 'm');
  const kcsEnds = endpoints(kcs);
  const kcsStart: Vector3 = { x: kcs.position.x, y: kcCeilingY, z: kcSouthZ };
  compare(
    scope,
    'KC South shaft starts at KC south wall',
    distance(kcsEnds.lower, kcsStart),
    0,
    0.2,
    'm',
  );

  const qcn = get('qc-north-shaft');
  const qcnAngle = Math.abs(normAngleRad(qcn.rotation?.x ?? 0));
  compare(
    scope,
    'QC North shaft slope',
    (qcnAngle * 180) / Math.PI,
    GPM.GP_QC_SHAFTS.north.angleDeg,
    0.1,
    '°',
  );
  compare(scope, 'QC North shaft diameter', qcn.size.x, GPM.GP_QC_SHAFTS.north.diameter, 0.01, 'm');

  const qcs = get('qc-south-shaft');
  const qcsAngle = Math.abs(normAngleRad(qcs.rotation?.x ?? 0));
  compare(
    scope,
    'QC South shaft slope',
    (qcsAngle * 180) / Math.PI,
    GPM.GP_QC_SHAFTS.south.angleDeg,
    0.1,
    '°',
  );
  compare(scope, 'QC South shaft diameter', qcs.size.x, GPM.GP_QC_SHAFTS.south.diameter, 0.01, 'm');

  // --- Well shaft & Grotto ---
  const ws = get('well-shaft');
  const wsAngle = Math.abs(normAngleRad(ws.rotation?.x ?? 0));
  warnIf(
    scope,
    'Well shaft slope',
    wsAngle > degToRad(45) - 0.1 && wsAngle < degToRad(75),
    `Well shaft slope ${fmt((wsAngle * 180) / Math.PI)}° — documented as single angled box approximating the lower ~45° section`,
  );
  warnIf(
    scope,
    'Well shaft length',
    ws.size.z > 50 && ws.size.z < 65,
    `Well shaft length ${fmt(ws.size.z)} m (ref ~55 m)`,
  );

  const grotto = get('grotto');
  const grottoAligned =
    Math.abs(grotto.position.x - ws.position.x) < 0.5 &&
    Math.abs(grotto.position.z - ws.position.z) < 0.5;
  warnIf(
    scope,
    'Grotto aligned with well shaft',
    grottoAligned,
    `Grotto at (${fmt(grotto.position.x)},${fmt(grotto.position.z)}) vs well shaft at (${fmt(ws.position.x)},${fmt(ws.position.z)})`,
  );

  // --- LOD0 vs LOD1 consistency ---
  const lod1 = new Map<string, BlockoutNodeLOD1>(generateGreatPyramidLOD1().map((n) => [n.id, n]));
  for (const lod0Node of greatPyramidBlockout.nodes) {
    const lod1Node = lod1.get(lod0Node.id);
    if (!lod1Node) {
      addResult(
        'WARN',
        scope,
        `LOD1 missing ${lod0Node.id}`,
        'LOD1 generator does not produce this node',
      );
      continue;
    }
    const dPos = distance(lod0Node.position, lod1Node.position);
    const dSize = distance(lod0Node.size, lod1Node.size);
    const dRot = Math.abs((lod0Node.rotation?.x ?? 0) - (lod1Node.rotation?.x ?? 0));
    warnIf(
      scope,
      `LOD0/LOD1 ${lod0Node.id} match`,
      dPos < 0.1 && dSize < 0.1 && dRot < 0.01,
      `${lod0Node.id} LOD0/LOD1 pos diff ${fmt(dPos)} m, size diff ${fmt(dSize)} m, rot diff ${fmt(dRot)} rad`,
    );
  }
}

function osirisChecks() {
  const scope = 'Osiris Shaft';
  const get = (id: string) => findNode(osirisBlockout, id);

  const shaftA = get('shaft-a');
  const shaftB = get('shaft-b');
  const shaftC = get('shaft-c');
  const chamberA = get('chamber-a');
  const chamberB = get('chamber-b');
  const chamberI = get('chamber-i');

  // Shaft A: 2.60 x 3.00 m mouth, 9.62 m deep
  compare(scope, 'Shaft A width X', shaftA.size.x, 2.6, 0.01, 'm');
  compare(scope, 'Shaft A width Z', shaftA.size.z, 3.0, 0.01, 'm');
  compare(scope, 'Shaft A depth', shaftA.size.y, 9.62, 0.01, 'm');

  // Chamber A: 3.85 (W) x 2.70 (H) x 8.60 (L)
  compare(scope, 'Chamber A width', chamberA.size.x, 3.85, 0.01, 'm');
  compare(scope, 'Chamber A height', chamberA.size.y, 2.7, 0.01, 'm');
  compare(scope, 'Chamber A length', chamberA.size.z, 8.6, 0.01, 'm');

  // Shaft B: 1.90 x 1.90 m, 13.25 m
  compare(scope, 'Shaft B cross-section', shaftB.size.x, 1.9, 0.01, 'm');
  compare(scope, 'Shaft B depth', shaftB.size.y, 13.25, 0.01, 'm');

  // Chamber B: 3.65 x 2.60 x 6.80
  compare(scope, 'Chamber B width', chamberB.size.x, 3.65, 0.01, 'm');
  compare(scope, 'Chamber B height', chamberB.size.y, 2.6, 0.01, 'm');
  compare(scope, 'Chamber B length', chamberB.size.z, 6.8, 0.01, 'm');

  // Shaft C: 1.65 (N-S) x 1.90 (E-W), 7.50 m
  compare(scope, 'Shaft C width X', shaftC.size.x, 1.9, 0.01, 'm');
  compare(scope, 'Shaft C width Z', shaftC.size.z, 1.65, 0.01, 'm');
  compare(scope, 'Shaft C depth', shaftC.size.y, 7.5, 0.01, 'm');

  // Chamber I: 6.5 (E-W) x 3.0 (H) x 9.0 (N-S)
  compare(scope, 'Chamber I width', chamberI.size.x, 6.5, 0.01, 'm');
  compare(scope, 'Chamber I height', chamberI.size.y, 3.0, 0.01, 'm');
  compare(scope, 'Chamber I length', chamberI.size.z, 9.0, 0.01, 'm');

  // Central island fits inside chamber I and has expected 3.2 x 5.2 footprint
  const island = get('central-island');
  compare(scope, 'Central island width', island.size.x, 3.2, 0.01, 'm');
  compare(scope, 'Central island height', island.size.y, 1.75, 0.01, 'm');
  compare(scope, 'Central island length', island.size.z, 5.2, 0.01, 'm');

  // Sarcophagus on island
  const sarc = get('sarcophagus-i');
  compare(scope, 'Sarcophagus I width', sarc.size.x, 1.08, 0.01, 'm');
  compare(scope, 'Sarcophagus I height', sarc.size.y, 0.95, 0.01, 'm');
  compare(scope, 'Sarcophagus I length', sarc.size.z, 2.28, 0.01, 'm');
  const islandTop = island.position.y + island.size.y / 2;
  const sarcFloor = sarc.position.y - sarc.size.y / 2;
  compare(scope, 'Sarcophagus on island', Math.abs(sarcFloor - islandTop), 0, 0.05, 'm');

  // Northern conduit from NW corner of Chamber I
  const conduit = get('northern-conduit');
  const chamberINorthWest: Vector3 = {
    x: chamberI.position.x - chamberI.size.x / 2,
    y: chamberI.position.y - chamberI.size.y / 2,
    z: chamberI.position.z - chamberI.size.z / 2,
  };
  // The conduit extends NW from its center; the end closest to the chamber is the SE end.
  const half = conduit.size.z / 2;
  const angle = conduit.rotation?.y ?? 0;
  const seEnd: Vector3 = {
    x: conduit.position.x - half * Math.sin(angle),
    y: conduit.position.y - conduit.size.y / 2,
    z: conduit.position.z - half * Math.cos(angle),
  };
  compare(
    scope,
    'Northern conduit starts at Chamber I NW corner',
    distance(seEnd, chamberINorthWest),
    0,
    0.2,
    'm',
  );
  warnIf(
    scope,
    'Northern conduit length',
    conduit.size.z >= 6.0 && conduit.size.z <= 7.0,
    `Northern conduit length ${fmt(conduit.size.z)} m (ref 6.0-7.0 m)`,
  );

  // Vertical stacking / depth
  const shaftABottom = shaftA.position.y - shaftA.size.y / 2;
  const chamberAFloor = chamberA.position.y - chamberA.size.y / 2;
  compare(scope, 'Shaft A bottom = Chamber A floor', shaftABottom, chamberAFloor, 0.01, 'm');

  const shaftBTop = shaftB.position.y + shaftB.size.y / 2;
  compare(scope, 'Shaft B top = Chamber A floor', shaftBTop, chamberAFloor, 0.05, 'm');

  const chamberBFloor = chamberB.position.y - chamberB.size.y / 2;
  const shaftBFloor = shaftB.position.y - shaftB.size.y / 2;
  compare(
    scope,
    'Chamber B floor below Shaft B floor',
    Math.abs(chamberBFloor - shaftBFloor),
    0.28,
    0.05,
    'm',
  );

  const shaftCTop = shaftC.position.y + shaftC.size.y / 2;
  compare(scope, 'Shaft C top = Chamber B floor', shaftCTop, chamberBFloor, 0.05, 'm');

  const shaftCBottom = shaftC.position.y - shaftC.size.y / 2;
  const chamberIFloor = chamberI.position.y - chamberI.size.y / 2;
  compare(scope, 'Shaft C bottom = Chamber I floor', shaftCBottom, chamberIFloor, 0.05, 'm');

  const totalDepth = shaftA.size.y + shaftB.size.y + shaftC.size.y;
  compare(scope, 'Total vertical depth', totalDepth, 30.37, 0.05, 'm');
}

function printReport() {
  let pass = 0;
  let warn = 0;
  let fail = 0;
  for (const r of results) {
    if (r.status === 'PASS') pass++;
    else if (r.status === 'WARN') warn++;
    else fail++;
  }

  console.log('\n=== GIZA 3D Geometry Verification Report ===\n');
  for (const r of results) {
    const line = `[${r.status}] ${r.scope} — ${r.message}`;
    console.log(line);
  }
  console.log(`\n--- Summary ---`);
  console.log(`PASS: ${pass}, WARN: ${warn}, FAIL: ${fail}`);
  return fail;
}

void greatPyramidChecks();
void osirisChecks();
const failures = printReport();
process.exit(failures > 0 ? 1 : 0);
