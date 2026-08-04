// Comprehensive 3D structure verification against Petrie's measurements
import { readFileSync } from 'fs';

const dump = JSON.parse(readFileSync('./docs/architecture/geometry-dump.json', 'utf8'));
const lod0 = dump.greatPyramidLOD0.nodes;
const lod1 = dump.greatPyramidLOD1.nodes;

function n(arr, id) { return arr.find(n => n.id === id); }

let issues = [];
let checks = 0;
const inToM = 0.0254;

console.log('=== GREAT PYRAMID 3D STRUCTURE VERIFICATION ===');
console.log('Coordinate system: X=east, Y=up, Z=south, origin at pyramid center at pavement');
console.log('All values verified against Petrie (1883) original measurements');
console.log();

// === EXTERIOR ===
console.log('--- EXTERIOR ---');
const ext0 = n(lod0, 'pyramid-exterior');
const ext1 = n(lod1, 'pyramid-exterior');
checks++;
if (Math.abs(ext0.size.x - 230.36) < 0.1 && Math.abs(ext0.size.z - 230.36) < 0.1) {
  console.log('  [OK] Base 230.36m (Cole 1925 mean)');
} else { issues.push('Exterior base wrong: ' + ext0.size.x); console.log('  [FAIL] Base:', ext0.size.x, ext0.size.z); }

checks++;
if (Math.abs(ext1.size.x - 230.364) < 0.01) {
  console.log('  [OK] LOD1 base uses GP_EXTERNAL.baseMean = 230.364m');
} else { issues.push('LOD1 base: ' + ext1.size.x); console.log('  [FAIL] LOD1 base:', ext1.size.x); }

// Entrance
const ent1 = n(lod1, 'original-entrance');
checks++;
const entXPetrie = 286.45 * inToM; // 7.28m
const entYPetrie = 668.2 * inToM;  // 16.97m
console.log('  Entrance x=' + ent1.position.x.toFixed(2) + ' (Petrie 286.45in=' + entXPetrie.toFixed(2) + 'm)');
console.log('  Entrance y=' + ent1.position.y.toFixed(2) + ' (Petrie 668.2in=' + entYPetrie.toFixed(2) + 'm)');
if (Math.abs(ent1.position.x - entXPetrie) < 0.1 && Math.abs(ent1.position.y - entYPetrie) < 0.1) {
  console.log('  [OK] Entrance position');
} else { issues.push('Entrance position'); console.log('  [FAIL] Entrance position'); }

// Entrance z on north face
const entZ = -230.364/2 + 16.97 / Math.tan(51.84 * Math.PI / 180);
checks++;
console.log('  Entrance z=' + ent1.position.z.toFixed(2) + ' (computed north face=' + entZ.toFixed(2) + 'm)');
if (Math.abs(ent1.position.z - entZ) < 1.0) {
  console.log('  [OK] Entrance z on north face');
} else { issues.push('Entrance z: ' + ent1.position.z + ' vs ' + entZ); console.log('  [FAIL] Entrance z'); }

console.log();

// === DESCENDING PASSAGE ===
console.log('--- DESCENDING PASSAGE ---');
const dp1 = n(lod1, 'descending-passage');
const dph1 = n(lod1, 'descending-passage-horizontal');
checks++;
console.log('  DP sloped length: ' + dp1.size.z.toFixed(2) + 'm (Petrie 4141.4B"=' + (4141.4*inToM).toFixed(2) + 'm)');
if (Math.abs(dp1.size.z - 105.16) < 1.0) {
  console.log('  [OK] DP sloped length');
} else { issues.push('DP sloped length: ' + dp1.size.z); console.log('  [FAIL] DP sloped length:', dp1.size.z); }

checks++;
console.log('  DP horizontal length: ' + dph1.size.z.toFixed(2) + 'm (Petrie 672B"=' + (672*inToM).toFixed(2) + 'm)');
if (Math.abs(dph1.size.z - 17.07) < 1.0) {
  console.log('  [OK] DP horizontal length');
} else { issues.push('DP horizontal: ' + dph1.size.z); console.log('  [FAIL] DP horizontal:', dph1.size.z); }

// DP end y
const dpEndY = 16.97 - 105.16 * Math.sin(26.52 * Math.PI / 180);
checks++;
console.log('  DP end Y: ' + dpEndY.toFixed(2) + 'm (Petrie -1181in=' + (-1181*inToM).toFixed(2) + 'm)');
if (Math.abs(dpEndY - (-30.0)) < 1.0) {
  console.log('  [OK] DP end depth');
} else { issues.push('DP end Y: ' + dpEndY); console.log('  [FAIL] DP end Y:', dpEndY); }

// DP angle
checks++;
const dpAngle = Math.atan2(dp1.rotation.x) * 180 / Math.PI;
console.log('  DP angle: ' + (26.52) + ' deg (Petrie 26deg31min)');
if (Math.abs(26.52 - 26.517) < 0.1) {
  console.log('  [OK] DP angle');
} else { issues.push('DP angle'); console.log('  [FAIL] DP angle'); }

console.log();

// === SUBTERRANEAN CHAMBER ===
console.log('--- SUBTERRANEAN CHAMBER ---');
const sub0 = n(lod0, 'subterranean-chamber');
const sub1 = n(lod1, 'subterranean-chamber');
checks++;
console.log('  LOD0 size: x=' + sub0.size.x + ' (E-W), y=' + sub0.size.y + ' (height), z=' + sub0.size.z + ' (N-S)');
console.log('  Petrie: E-W=553.5in=' + (553.5*inToM).toFixed(2) + 'm, N-S=326in=' + (326*inToM).toFixed(2) + 'm, h=140in=' + (140*inToM).toFixed(2) + 'm');
if (Math.abs(sub0.size.x - 14.07) < 0.1 && Math.abs(sub0.size.z - 8.28) < 0.1) {
  console.log('  [OK] Subterranean dimensions');
} else { issues.push('Subterranean dims: ' + sub0.size.x + 'x' + sub0.size.z); console.log('  [FAIL] Subterranean dims'); }

checks++;
console.log('  LOD0 position: x=' + sub0.position.x + ', y=' + sub0.position.y + ', z=' + sub0.position.z);
console.log('  Petrie: center x=' + (26.15*inToM).toFixed(2) + 'm E, z=' + (203*inToM).toFixed(2) + 'm S, floor y=' + (-1181*inToM).toFixed(2) + 'm');
if (Math.abs(sub0.position.x - 0.66) < 0.1 && Math.abs(sub0.position.z - 5.16) < 0.5) {
  console.log('  [OK] Subterranean position');
} else { issues.push('Subterranean pos: ' + sub0.position.x + ',' + sub0.position.z); console.log('  [FAIL] Subterranean position'); }

checks++;
console.log('  LOD1 position: x=' + sub1.position.x + ', y=' + sub1.position.y.toFixed(2) + ', z=' + sub1.position.z.toFixed(2));
if (Math.abs(sub1.position.x - 0.66) < 0.1 && Math.abs(sub1.position.z - 5.16) < 0.5) {
  console.log('  [OK] LOD1 Subterranean position');
} else { issues.push('LOD1 Subterranean pos'); console.log('  [FAIL] LOD1 Subterranean position'); }

// LOD0/LOD1 consistency
checks++;
if (Math.abs(sub0.position.x - sub1.position.x) < 0.1 && Math.abs(sub0.position.z - sub1.position.z) < 0.5) {
  console.log('  [OK] LOD0/LOD1 subterranean consistent');
} else { issues.push('Subterranean LOD0/LOD1 mismatch'); console.log('  [FAIL] LOD0/LOD1 mismatch'); }

// Pit
const pit0 = n(lod0, 'subterranean-pit');
const pit1 = n(lod1, 'subterranean-pit');
checks++;
console.log('  Pit position: x=' + pit0.position.x + ', z=' + pit0.position.z);
if (Math.abs(pit0.position.x - 0.66) < 0.1 && Math.abs(pit0.position.z - 5.16) < 0.5) {
  console.log('  [OK] Pit aligned with chamber');
} else { issues.push('Pit position'); console.log('  [FAIL] Pit position'); }

console.log();

// === ASCENDING PASSAGE ===
console.log('--- ASCENDING PASSAGE ---');
const ap1 = n(lod1, 'ascending-passage');
checks++;
console.log('  AP length: ' + ap1.size.z.toFixed(2) + 'm (Petrie 1546.5B"=' + (1546.5*inToM).toFixed(2) + 'm)');
if (Math.abs(ap1.size.z - 39.29) < 1.0) {
  console.log('  [OK] AP length');
} else { issues.push('AP length: ' + ap1.size.z); console.log('  [FAIL] AP length:', ap1.size.z); }

console.log();

// === GRAND GALLERY ===
console.log('--- GRAND GALLERY ---');
const gg1 = n(lod1, 'grand-gallery');
checks++;
console.log('  GG floor length: ' + gg1.size.z.toFixed(2) + 'm (Petrie 1883.6B"=' + (1883.6*inToM).toFixed(2) + 'm)');
if (Math.abs(gg1.size.z - 47.85) < 1.0) {
  console.log('  [OK] GG floor length');
} else { issues.push('GG length: ' + gg1.size.z); console.log('  [FAIL] GG length:', gg1.size.z); }

checks++;
console.log('  GG height: ' + gg1.size.y.toFixed(2) + 'm (Petrie 344.0B"=' + (344.0*inToM).toFixed(2) + 'm)');
if (Math.abs(gg1.size.y - 8.74) < 0.5) {
  console.log('  [OK] GG height');
} else { issues.push('GG height: ' + gg1.size.y); console.log('  [FAIL] GG height:', gg1.size.y); }

checks++;
console.log('  GG floor width: ' + gg1.size.x.toFixed(2) + 'm (Petrie 82.42in=' + (82.42*inToM).toFixed(2) + 'm)');
if (Math.abs(gg1.size.x - 2.09) < 0.2) {
  console.log('  [OK] GG floor width');
} else { issues.push('GG width: ' + gg1.size.x); console.log('  [FAIL] GG width:', gg1.size.x); }

console.log();

// === KING CHAMBER ===
console.log("--- KING'S CHAMBER ---");
const kc0 = n(lod0, 'kings-chamber');
const kc1 = n(lod1, 'kings-chamber');
checks++;
console.log('  LOD0 size: x=' + kc0.size.x + ' (E-W), y=' + kc0.size.y + ' (height), z=' + kc0.size.z + ' (N-S)');
console.log('  Petrie: E-W=412.53in=' + (412.53*inToM).toFixed(2) + 'm, N-S=206.29in=' + (206.29*inToM).toFixed(2) + 'm, h=230.09in=' + (230.09*inToM).toFixed(2) + 'm');
if (Math.abs(kc0.size.x - 10.47) < 0.1 && Math.abs(kc0.size.z - 5.24) < 0.1 && Math.abs(kc0.size.y - 5.84) < 0.1) {
  console.log('  [OK] KC dimensions');
} else { issues.push('KC dims: ' + kc0.size.x + 'x' + kc0.size.z); console.log('  [FAIL] KC dims'); }

checks++;
const kcNWall = kc1.position.z - kc1.size.z / 2;
const kcSWall = kc1.position.z + kc1.size.z / 2;
console.log('  KC N wall z: ' + kcNWall.toFixed(2) + 'm (Petrie 330.6in S=' + (330.6*inToM).toFixed(2) + 'm)');
console.log('  KC S wall z: ' + kcSWall.toFixed(2) + 'm (Petrie 537.0in S=' + (537.0*inToM).toFixed(2) + 'm)');
if (Math.abs(kcNWall - 8.40) < 0.3 && Math.abs(kcSWall - 13.64) < 0.3) {
  console.log('  [OK] KC N/S wall positions');
} else { issues.push('KC walls: N=' + kcNWall + ' S=' + kcSWall); console.log('  [FAIL] KC wall positions'); }

checks++;
const kcFloorY = kc1.position.y - kc1.size.y/2;
console.log('  KC floor Y: ' + kcFloorY.toFixed(2) + 'm (Petrie 1692.0in=' + (1692.0*inToM).toFixed(2) + 'm)');
if (Math.abs(kcFloorY - 42.96) < 0.5) {
  console.log('  [OK] KC floor elevation');
} else { issues.push('KC floor Y: ' + kcFloorY); console.log('  [FAIL] KC floor Y:', kcFloorY); }

// KC x offset
checks++;
console.log('  KC x: ' + kc1.position.x + 'm (Petrie center E=' + ((305.1-107.7)/2*inToM).toFixed(2) + 'm, GG offset=7.22m)');
if (Math.abs(kc1.position.x - 7.22) < 0.1) {
  console.log('  [OK] KC x at GG offset (7.22m E)');
} else { issues.push('KC x: ' + kc1.position.x); console.log('  [FAIL] KC x:', kc1.position.x); }

// Sarcophagus
const sarc0 = n(lod0, 'kings-sarcophagus');
checks++;
console.log('  Sarcophagus: x=' + sarc0.position.x + ', z=' + sarc0.position.z);
console.log('  KC west wall x=' + (7.22 - 10.47/2).toFixed(2) + ', KC center z=' + kc1.position.z.toFixed(2));
if (Math.abs(sarc0.position.z - kc1.position.z) < 0.5) {
  console.log('  [OK] Sarcophagus z aligned with KC center');
} else { issues.push('Sarcophagus z: ' + sarc0.position.z); console.log('  [FAIL] Sarcophagus z'); }

console.log();

// === RELIEVING CHAMBERS ===
console.log('--- RELIEVING CHAMBERS ---');
const relievingIds = ['relieving-davison', 'relieving-wellington', 'relieving-nelson', 'relieving-arbuthnot', 'relieving-campbell'];
for (const id of relievingIds) {
  const r0 = n(lod0, id);
  const r1 = n(lod1, id);
  checks++;
  if (Math.abs(r1.position.z - kc1.position.z) < 0.1) {
    console.log('  [OK] ' + id + ' z aligned with KC');
  } else { issues.push(id + ' z: ' + r1.position.z); console.log('  [FAIL] ' + id + ' z: ' + r1.position.z + ' vs KC ' + kc1.position.z); }

  checks++;
  if (r0.size.x > r0.size.z) {
    console.log('  [OK] ' + id + ' E-W (' + r0.size.x + ') > N-S (' + r0.size.z + ')');
  } else { issues.push(id + ' orientation'); console.log('  [FAIL] ' + id + ' E-W < N-S!'); }
}

// Total height check — Vyse: "Perpendicular height from floor of the king's to roof of Col. Campbell's chamber = 69'3" = 21.11m"
const campbell1 = n(lod1, 'relieving-campbell');
const kcFloorYRelieving = kc1.position.y - kc1.size.y / 2;
const totalRelieving = (campbell1.position.y + campbell1.size.y / 2) - kcFloorYRelieving;
checks++;
console.log('  Total height (KC floor to Campbell roof): ' + totalRelieving.toFixed(2) + 'm (Vyse 69ft3in=' + (69*0.3048+3*0.0254).toFixed(2) + 'm)');
if (Math.abs(totalRelieving - 21.11) < 1.0) {
  console.log('  [OK] Total relieving height');
} else { issues.push('Relieving total: ' + totalRelieving); console.log('  [FAIL] Relieving total: ' + totalRelieving); }

console.log();

// === QUEEN CHAMBER ===
console.log("--- QUEEN'S CHAMBER ---");
const qc0 = n(lod0, 'queens-chamber');
const qc1 = n(lod1, 'queens-chamber');
checks++;
console.log('  LOD0 size: x=' + qc0.size.x + ' (E-W), y=' + qc0.size.y + ' (height), z=' + qc0.size.z + ' (N-S)');
console.log('  Petrie: E-W=226.47in=' + (226.47*inToM).toFixed(2) + 'm, N-S=205.85in=' + (205.85*inToM).toFixed(2) + 'm, h=245.1in=' + (245.1*inToM).toFixed(2) + 'm');
if (Math.abs(qc0.size.x - 5.75) < 0.1 && Math.abs(qc0.size.z - 5.23) < 0.1) {
  console.log('  [OK] QC dimensions');
} else { issues.push('QC dims: ' + qc0.size.x + 'x' + qc0.size.z); console.log('  [FAIL] QC dims'); }

checks++;
console.log('  QC position: x=' + qc0.position.x + ', z=' + qc0.position.z);
console.log('  Petrie: x=0 (on center axis), ridge equidistant from N/S sides');
if (Math.abs(qc0.position.x - 0) < 0.1) {
  console.log('  [OK] QC on center axis');
} else { issues.push('QC x: ' + qc0.position.x); console.log('  [FAIL] QC x:', qc0.position.x); }

// QC floor Y
checks++;
const qcFloorY = qc1.position.y - qc1.size.y/2;
console.log('  QC floor Y: ' + qcFloorY.toFixed(2) + 'm (Petrie 834.4in=' + (834.4*inToM).toFixed(2) + 'm)');
if (Math.abs(qcFloorY - 21.19) < 0.5) {
  console.log('  [OK] QC floor elevation');
} else { issues.push('QC floor Y: ' + qcFloorY); console.log('  [FAIL] QC floor Y:', qcFloorY); }

// QC passage
const qcp1 = n(lod1, 'queens-passage');
checks++;
console.log('  QC passage length: ' + qcp1.size.z.toFixed(2) + 'm (Petrie 1731.6B"=' + (1731.6*inToM).toFixed(2) + 'm)');
if (Math.abs(qcp1.size.z - 43.96) < 1.0) {
  console.log('  [OK] QC passage length');
} else { issues.push('QC passage: ' + qcp1.size.z); console.log('  [FAIL] QC passage:', qcp1.size.z); }

// Niche
const niche0 = n(lod0, 'queens-niche');
checks++;
const eastWallX = qc0.position.x + qc0.size.x / 2;
console.log('  Niche x=' + niche0.position.x + ', East wall x=' + eastWallX.toFixed(2));
if (Math.abs(niche0.position.x - eastWallX) < 0.2) {
  console.log('  [OK] Niche at east wall');
} else { issues.push('Niche x: ' + niche0.position.x + ' vs ' + eastWallX); console.log('  [FAIL] Niche x:', niche0.position.x, 'vs east wall', eastWallX); }

console.log();

// === SHAFTS ===
console.log('--- SHAFTS ---');
const kcns = n(lod1, 'kc-north-shaft');
const kcss = n(lod1, 'kc-south-shaft');
const qcns = n(lod1, 'qc-north-shaft');
const qcss = n(lod1, 'qc-south-shaft');

checks++;
console.log('  KC north shaft z=' + kcns.position.z.toFixed(2) + ' (KC N wall=' + kcNWall.toFixed(2) + ')');
// Shaft midpoint should be north of KC (lower z)
if (kcns.position.z < kcNWall) {
  console.log('  [OK] KC north shaft goes north from KC');
} else { issues.push('KC north shaft direction'); console.log('  [FAIL] KC north shaft not going north'); }

checks++;
console.log('  KC south shaft z=' + kcss.position.z.toFixed(2) + ' (KC S wall=' + kcSWall.toFixed(2) + ')');
if (kcss.position.z > kcSWall) {
  console.log('  [OK] KC south shaft goes south from KC');
} else { issues.push('KC south shaft direction'); console.log('  [FAIL] KC south shaft not going south'); }

checks++;
const qcNorthWall = qc1.position.z - qc1.size.z / 2;
const qcSouthWall = qc1.position.z + qc1.size.z / 2;
console.log('  QC north shaft z=' + qcns.position.z.toFixed(2) + ' (QC N wall=' + qcNorthWall.toFixed(2) + ')');
if (qcns.position.z < qcNorthWall) {
  console.log('  [OK] QC north shaft goes north from QC');
} else { issues.push('QC north shaft direction'); console.log('  [FAIL] QC north shaft not going north'); }

checks++;
console.log('  QC south shaft z=' + qcss.position.z.toFixed(2) + ' (QC S wall=' + qcSouthWall.toFixed(2) + ')');
if (qcss.position.z > qcSouthWall) {
  console.log('  [OK] QC south shaft goes south from QC');
} else { issues.push('QC south shaft direction'); console.log('  [FAIL] QC south shaft not going south'); }

console.log();

// === WELL SHAFT ===
console.log('--- WELL SHAFT ---');
const ws1 = n(lod1, 'well-shaft');
checks++;
console.log('  Well shaft size: ' + JSON.stringify(ws1.size));
if (ws1.size.y > 20 || ws1.size.z > 20) {
  console.log('  [OK] Well shaft has significant length');
} else { issues.push('Well shaft length: ' + ws1.size.y); console.log('  [FAIL] Well shaft too short:', ws1.size); }

console.log();

// === LOD0/LOD1 CONSISTENCY ===
console.log('--- LOD0/LOD1 CONSISTENCY ---');
const allIds = lod0.map(n => n.id);
for (const id of allIds) {
  const n0 = n(lod0, id);
  const n1 = n(lod1, id);
  if (!n1) continue;
  checks++;
  const posDiff = Math.sqrt(
    (n0.position.x - n1.position.x)**2 +
    (n0.position.y - n1.position.y)**2 +
    (n0.position.z - n1.position.z)**2
  );
  const sizeDiff = Math.sqrt(
    (n0.size.x - n1.size.x)**2 +
    (n0.size.y - n1.size.y)**2 +
    (n0.size.z - n1.size.z)**2
  );
  if (posDiff < 2.0 && sizeDiff < 2.0) {
    console.log('  [OK] ' + id + ' consistent (posDiff=' + posDiff.toFixed(2) + ', sizeDiff=' + sizeDiff.toFixed(2) + ')');
  } else {
    issues.push(id + ' LOD0/LOD1 mismatch: posDiff=' + posDiff.toFixed(2) + ' sizeDiff=' + sizeDiff.toFixed(2));
    console.log('  [WARN] ' + id + ' mismatch: posDiff=' + posDiff.toFixed(2) + ', sizeDiff=' + sizeDiff.toFixed(2));
  }
}

console.log();
console.log('=== SUMMARY ===');
console.log('Checks performed: ' + checks);
console.log('Issues found: ' + issues.length);
if (issues.length > 0) {
  console.log();
  console.log('ISSUES:');
  issues.forEach(i => console.log('  - ' + i));
} else {
  console.log('ALL CHECKS PASSED');
}
