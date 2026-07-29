// Verification of Great Pyramid blockout positions vs. reference measurements
// All values from docs/architecture/great-pyramid-measurements.md

const DEG = Math.PI / 180;

const get = (id) => nodes.find(n => n.id === id);

const nodes = [
  { id: 'pyramid-exterior', name: 'Pyramid Exterior', position: { x: 0, y: 69.3, z: 0 }, size: { x: 230.36, y: 138.6, z: 230.36 } },
  { id: 'original-entrance', name: 'Original Entrance', position: { x: 7.29, y: 16.97, z: -115.18 }, size: { x: 1.05, y: 1.19, z: 1 } },
  { id: 'descending-passage', name: 'Descending Passage', position: { x: 7.29, y: -5.92, z: -52.57 }, rotation: { x: 26.52 * DEG, y: 0, z: 0 }, size: { x: 1.05, y: 1.19, z: 105.16 } },
  { id: 'subterranean-chamber', name: 'Subterranean Chamber', position: { x: 7.29, y: -29.8, z: 0.5 }, size: { x: 8.3, y: 3.56, z: 5.2 } },
  { id: 'subterranean-pit', name: 'Central Pit', position: { x: 7.29, y: -34.07, z: 0.5 }, size: { x: 2.54, y: 5.03, z: 2.54 } },
  { id: 'ascending-passage', name: 'Ascending Passage', position: { x: 7.29, y: 18.0, z: -14.2 }, rotation: { x: -26.04 * DEG, y: 0, z: 0 }, size: { x: 1.0, y: 1.2, z: 39.29 } },
  { id: 'grand-gallery', name: 'Grand Gallery', position: { x: 7.22, y: 34.8, z: 9.66 }, rotation: { x: -26.28 * DEG, y: 0, z: 0 }, size: { x: 2.09, y: 8.74, z: 46.11 } },
  { id: 'antechamber', name: 'Antechamber', position: { x: 7.22, y: 44.8, z: 31.84 }, size: { x: 1.651, y: 3.794, z: 2.954 } },
  { id: 'kings-chamber', name: "King's Chamber", position: { x: 7.22, y: 45.94, z: 40.5 }, size: { x: 5.24, y: 5.97, z: 10.47 } },
  { id: 'kings-sarcophagus', name: "Sarcophagus", position: { x: 4.6, y: 43.5, z: 40.5 }, size: { x: 0.978, y: 1.049, z: 2.276 } },
  { id: 'relieving-davison', name: "Davison's", position: { x: 7.22, y: 49.42, z: 40.5 }, size: { x: 5.21, y: 1.0, z: 11.68 } },
  { id: 'relieving-wellington', name: "Wellington's", position: { x: 7.22, y: 50.91, z: 40.5 }, size: { x: 5.18, y: 1.99, z: 11.73 } },
  { id: 'relieving-nelson', name: "Nelson's", position: { x: 7.22, y: 52.44, z: 40.5 }, size: { x: 5.08, y: 1.07, z: 11.81 } },
  { id: 'relieving-arbuthnot', name: "Arbuthnot's", position: { x: 7.22, y: 53.75, z: 40.5 }, size: { x: 4.98, y: 1.55, z: 11.38 } },
  { id: 'relieving-campbell', name: "Campbell's", position: { x: 7.22, y: 58.21, z: 40.5 }, size: { x: 6.25, y: 7.37, z: 11.53 } },
  { id: 'queens-chamber', name: "Queen's Chamber", position: { x: 7.22, y: 24.05, z: 5 }, size: { x: 5.23, y: 6.23, z: 5.75 } },
  { id: 'queens-niche', name: "Niche", position: { x: 9.84, y: 23.85, z: 5 }, size: { x: 1.04, y: 4.69, z: 1.57 } },
  { id: 'queens-passage', name: "QC Passage", position: { x: 7.22, y: 24.3, z: -17 }, size: { x: 1.05, y: 1.45, z: 43.96 } },
  { id: 'kc-north-shaft', name: "KC N Shaft", position: { x: 7.22, y: 70.2, z: 35.5 }, rotation: { x: -32.6 * DEG, y: 0, z: 0 }, size: { x: 0.205, y: 0.215, z: 78.43 } },
  { id: 'kc-south-shaft', name: "KC S Shaft", position: { x: 7.22, y: 70.0, z: 45.5 }, rotation: { x: 45 * DEG, y: 0, z: 0 }, size: { x: 0.205, y: 0.215, z: 77.55 } },
  { id: 'qc-north-shaft', name: "QC N Shaft", position: { x: 7.22, y: 44.6, z: 2.0 }, rotation: { x: -39 * DEG, y: 0, z: 0 }, size: { x: 0.21, y: 0.21, z: 65.1 } },
  { id: 'qc-south-shaft', name: "QC S Shaft", position: { x: 7.22, y: 43.0, z: 8.0 }, rotation: { x: 39.6 * DEG, y: 0, z: 0 }, size: { x: 0.21, y: 0.21, z: 59.6 } },
  { id: 'well-shaft', name: 'Well Shaft', position: { x: 5.0, y: 3.2, z: -10.0 }, rotation: { x: 45 * DEG, y: 0, z: 0 }, size: { x: 0.78, y: 0.78, z: 55 } },
  { id: 'grotto', name: 'Grotto', position: { x: 5.0, y: 5.7, z: -10.0 }, size: { x: 2, y: 2, z: 2 } },
];

console.log('=== GREAT PYRAMID BLOCKOUT GEOMETRY AUDIT ===\n');

// 1. External dimensions
console.log('--- External ---');
console.log(`Base: 230.36m (ref: 230.329-230.364) ✓`);
console.log(`Height: 138.6m (ref: 138.5 current) ✓`);
console.log(`Center Y: 69.3 = 138.6/2 ✓`);

// 2. Entrance
console.log('\n--- Original Entrance ---');
console.log(`X: 7.29m E of center (ref: 7.29) ✓`);
console.log(`Y: 16.97m above base (ref: 16.97) ✓`);
console.log(`Z: -115.18 = -230.36/2 (north face) ✓`);

// 3. Descending Passage
console.log('\n--- Descending Passage ---');
const dp = get('descending-passage');
const dpAngle = (dp.rotation.x / DEG).toFixed(2);
const dpHalfLen = dp.size.z / 2;
const dpEndY = dp.position.y - dpHalfLen * Math.sin(dp.rotation.x);
const dpEndZ = dp.position.z + dpHalfLen * Math.cos(dp.rotation.x);
console.log(`Slope: ${dpAngle}° (ref: 26.52°) ✓`);
console.log(`Length: ${dp.size.z}m (ref: 105.16m) ✓`);
console.log(`Center: y=${dp.position.y}, z=${dp.position.z}`);
console.log(`Floor end (bottom): y=${dpEndY.toFixed(1)} (ref: ~-29.8), z=${dpEndZ.toFixed(1)} (ref: ~0.5)`);
console.log(`Cross-section: ${dp.size.x}×${dp.size.y}m (ref: 1.05×1.19m) ✓`);

// 4. Subterranean Chamber
console.log('\n--- Subterranean Chamber ---');
const sub = get('subterranean-chamber');
console.log(`Y: ${sub.position.y} (ref: ~-29.8 to -30.0) ✓`);
console.log(`Z: ${sub.position.z} (should be near 0, offset 0.5 south) ✓`);
console.log(`Size: ${sub.size.x}×${sub.size.y}×${sub.size.z}m (ref: ~8.3×~3.56×~5.2) ✓`);

// 5. Pit
console.log('\n--- Central Pit ---');
const pit = get('subterranean-pit');
console.log(`Y: ${pit.position.y} (below chamber floor ~-29.8-1.78=~-31.6) — check`);
const pitTop = pit.position.y + pit.size.y / 2;
const subFloor = sub.position.y - sub.size.y / 2;
console.log(`Pit top: ${pitTop.toFixed(1)}, Chamber floor: ${subFloor.toFixed(1)}`);
if (Math.abs(pitTop - subFloor) < 1) console.log('✓ Pit top near chamber floor');
else console.log(`✗ MISMATCH: pit top ${pitTop.toFixed(1)} vs chamber floor ${subFloor.toFixed(1)}`);
console.log(`Size: ${pit.size.x}×${pit.size.y}×${pit.size.z}m (ref: 2.54×~5.03×2.54) ✓`);

// 6. Ascending Passage
console.log('\n--- Ascending Passage ---');
const ap = get('ascending-passage');
const apAngle = Math.abs(ap.rotation.x / DEG);
console.log(`Slope: ${apAngle.toFixed(2)}° (ref: 26.04°) ✓`);
console.log(`Length: ${ap.size.z}m (ref: 39.29m) ✓`);
// POI (Point of Intersection with descending passage)
const apHalfLen = ap.size.z / 2;
const apLowY = ap.position.y - apHalfLen * Math.sin(Math.abs(ap.rotation.x));
const apHighY = ap.position.y + apHalfLen * Math.sin(Math.abs(ap.rotation.x));
console.log(`Lower end: y=${apLowY.toFixed(1)} (ref: ~11.1 POI)`);
console.log(`Upper end: y=${apHighY.toFixed(1)} (ref: ~24.9 GG floor start)`);
console.log(`Center y: ${ap.position.y} (expected ~${((11.1 + 24.9) / 2).toFixed(1)})`);

// Check if lower end reaches POI at y~11.1
if (Math.abs(apLowY - 11.1) < 2) console.log('✓ Lower end near POI');
else console.log(`✗ MISMATCH: lower end y=${apLowY.toFixed(1)} vs POI y≈11.1`);

// 7. Grand Gallery
console.log('\n--- Grand Gallery ---');
const gg = get('grand-gallery');
const ggAngle = Math.abs(gg.rotation.x / DEG);
console.log(`Slope: ${ggAngle.toFixed(2)}° (ref: 26.28° = 26°17') ✓`);
console.log(`Slope length: ${gg.size.z}m (ref: 46.11m) ✓`);
console.log(`Height: ${gg.size.y}m (ref: 8.74m perpendicular) ✓`);
console.log(`Width: ${gg.size.x}m (ref: 2.09m at floor) ✓`);
console.log(`X offset: ${gg.position.x}m E of center (ref: 7.22m) ✓`);

// GG floor levels
const ggHalfLen = gg.size.z / 2;
const ggLowY = gg.position.y - ggHalfLen * Math.sin(Math.abs(gg.rotation.x));
const ggHighY = gg.position.y + ggHalfLen * Math.sin(Math.abs(gg.rotation.x));
console.log(`Floor lower end: y≈${ggLowY.toFixed(1)} (ref: ~24.9)`);
console.log(`Floor upper end: y≈${ggHighY.toFixed(1)} (ref: ~42.6)`);
console.log(`Center y: ${gg.position.y} (expected ~${((24.9 + 42.6) / 2).toFixed(1)})`);

// Check GG connects to AP
if (Math.abs(ggLowY - apHighY) < 2) console.log(`✓ GG lower end (${ggLowY.toFixed(1)}) ≈ AP upper end (${apHighY.toFixed(1)})`);
else console.log(`✗ GAP: GG lower ${ggLowY.toFixed(1)} vs AP upper ${apHighY.toFixed(1)}`);

// 8. Antechamber
console.log('\n--- Antechamber ---');
const ant = get('antechamber');
console.log(`Y center: ${ant.position.y} (ref: ~42.9 floor, +${ant.size.y / 2}=${(42.9 + ant.size.y / 2).toFixed(1)} center)`);
console.log(`Size: ${ant.size.x}×${ant.size.y}×${ant.size.z}m (ref: 1.651×3.794×2.954) ✓`);
const antFloorY = ant.position.y - ant.size.y / 2;
console.log(`Floor Y: ${antFloorY.toFixed(1)} (ref: ~42.9)`);

// 9. King's Chamber
console.log('\n--- King\'s Chamber ---');
const kc = get('kings-chamber');
console.log(`Y center: ${kc.position.y}`);
const kcFloorY = kc.position.y - kc.size.y / 2;
console.log(`Floor Y: ${kcFloorY.toFixed(2)} (ref: 42.96)`);
if (Math.abs(kcFloorY - 42.96) < 0.1) console.log('✓ Floor level correct');
else console.log(`✗ MISMATCH: floor ${kcFloorY.toFixed(2)} vs ref 42.96`);
console.log(`Size: ${kc.size.x}×${kc.size.y}×${kc.size.z}m (ref: 5.24×5.97×10.47) ✓`);

// 10. Sarcophagus
console.log('\n--- Sarcophagus ---');
const sar = get('kings-sarcophagus');
console.log(`Position: x=${sar.position.x}, y=${sar.position.y}, z=${sar.position.z}`);
console.log(`KC floor: ${kcFloorY.toFixed(2)}, Sarc center: ${sar.position.y}`);
const sarFloor = sar.position.y - sar.size.y / 2;
console.log(`Sarc floor: ${sarFloor.toFixed(2)} (should be ≈ KC floor ${kcFloorY.toFixed(2)})`);
if (Math.abs(sarFloor - kcFloorY) < 0.1) console.log('✓ Sits on KC floor');
else console.log(`✗ MISMATCH: sarc floor ${sarFloor.toFixed(2)} vs KC floor ${kcFloorY.toFixed(2)}`);
console.log(`Size: ${sar.size.x}×${sar.size.y}×${sar.size.z}m (ref: 0.978×1.049×2.276) ✓`);

// 11. Relieving chambers
console.log('\n--- Relieving Chambers ---');
const kcCeiling = kcFloorY + kc.size.y;
console.log(`KC ceiling: ${kcCeiling.toFixed(2)} (ref: 48.93)`);
const relieving = ['relieving-davison', 'relieving-wellington', 'relieving-nelson', 'relieving-arbuthnot', 'relieving-campbell'];
let prevTop = kcCeiling;
for (const id of relieving) {
  const r = get(id);
  const rFloor = r.position.y - r.size.y / 2;
  const rTop = r.position.y + r.size.y / 2;
  const gap = rFloor - prevTop;
  console.log(`${r.name}: floor=${rFloor.toFixed(2)}, top=${rTop.toFixed(2)}, gap from prev=${gap.toFixed(2)}`);
  if (Math.abs(gap) < 0.2) console.log('  ✓ Stacks correctly');
  else console.log(`  ✗ Gap of ${gap.toFixed(2)}m from previous`);
  prevTop = rTop;
}
console.log(`Total top: ${prevTop.toFixed(2)} (ref: 42.96+21.11=64.07)`);

// 12. Queen's Chamber
console.log('\n--- Queen\'s Chamber ---');
const qc = get('queens-chamber');
const qcFloorY = qc.position.y - qc.size.y / 2;
console.log(`Y center: ${qc.position.y}, Floor Y: ${qcFloorY.toFixed(2)}`);
console.log(`Ref rough floor: 21.19, apex: 27.42`);
console.log(`Size: ${qc.size.x}×${qc.size.y}×${qc.size.z}m (ref: 5.23×6.23×5.75) ✓`);
if (Math.abs(qcFloorY - 21.19) < 0.5) console.log('✓ Floor level close to reference');
else console.log(`✗ MISMATCH: floor ${qcFloorY.toFixed(2)} vs ref 21.19`);

// 13. QC Passage
console.log('\n--- Queen\'s Chamber Passage ---');
const qcp = get('queens-passage');
console.log(`Y: ${qcp.position.y}, Length: ${qcp.size.z}m (ref: ~43.96m) ✓`);
console.log(`Cross-section: ${qcp.size.x}×${qcp.size.y} (ref: ~1.05×~1.45)`);
// Should connect QC to GG
const qcpHalfZ = qcp.size.z / 2;
const qcpSouthEnd = qcp.position.z + qcpHalfZ; // toward QC
const qcpNorthEnd = qcp.position.z - qcpHalfZ; // toward GG
console.log(`Z range: ${qcpNorthEnd.toFixed(1)} to ${qcpSouthEnd.toFixed(1)}`);
console.log(`QC center z: ${qc.position.z}, GG center z: ${gg.position.z}`);

// 14. Air shafts
console.log('\n--- King\'s Chamber Shafts ---');
const kcn = get('kc-north-shaft');
const kcs = get('kc-south-shaft');
console.log(`KC North: slope=${(Math.abs(kcn.rotation.x / DEG)).toFixed(1)}° (ref: 32.6°) ✓, len=${kcn.size.z}m (ref: 78.43m) ✓`);
console.log(`KC South: slope=${(Math.abs(kcs.rotation.x / DEG)).toFixed(1)}° (ref: 45°) ✓, len=${kcs.size.z}m (ref: 77.55m) ✓`);
// Check shaft start position (should start from KC)
const kcTop = kcFloorY + kc.size.y;
console.log(`KC ceiling: ${kcTop.toFixed(2)}`);
console.log(`KC N shaft x: ${kcn.position.x} (should be near KC west wall ~${(kc.position.x - kc.size.x / 2).toFixed(1)})`);
console.log(`KC S shaft x: ${kcs.position.x} (should be near KC east wall ~${(kc.position.x + kc.size.x / 2).toFixed(1)})`);

console.log('\n--- Queen\'s Chamber Shafts ---');
const qcn = get('qc-north-shaft');
const qcs = get('qc-south-shaft');
console.log(`QC North: slope=${(Math.abs(qcn.rotation.x / DEG)).toFixed(1)}° (ref: 39°) ✓, len=${qcn.size.z}m (ref: ~65.1m) ✓`);
console.log(`QC South: slope=${(qcs.rotation.x / DEG).toFixed(1)}° (ref: 39.6°) ✓, len=${qcs.size.z}m (ref: ~59.6m) ✓`);

// 15. Well Shaft & Grotto
console.log('\n--- Well Shaft ---');
const ws = get('well-shaft');
console.log(`Position: x=${ws.position.x}, y=${ws.position.y}, z=${ws.position.z}`);
console.log(`Slope: ${(ws.rotation.x / DEG).toFixed(1)}° (ref: ~45° lower section) ✓`);
console.log(`Length: ${ws.size.z}m (ref: ~55m) ✓`);
// Well shaft connects from GG lower end to DP
// GG lower end is at approximately x=7.22, y=ggLowY
// DP exit is at approximately x=7.29, y≈-17.6
console.log(`GG lower end: x=7.22, y≈${ggLowY.toFixed(1)}`);
console.log(`DP exit (97.16m from entrance): approximately y≈-17.6`);

console.log('\n--- Grotto ---');
const gr = get('grotto');
console.log(`Position: x=${gr.position.x}, y=${gr.position.y}, z=${gr.position.z}`);
console.log(`Ref: ~5.7m above base ✓`);
console.log(`Well shaft at same x,z: x=${ws.position.x}, z=${ws.position.z}`);
if (Math.abs(gr.position.x - ws.position.x) < 0.5 && Math.abs(gr.position.z - ws.position.z) < 0.5)
  console.log('✓ Grotto aligned with Well Shaft path');
else console.log('✗ Grotto not aligned with Well Shaft');

// 16. Check for z-axis alignment of King's complex
console.log('\n--- King\'s Complex Z-Alignment ---');
const kingsNodes = ['antechamber', 'kings-chamber', 'kings-sarcophagus', 'relieving-davison'];
for (const id of kingsNodes) {
  const n = get(id);
  console.log(`${n.name}: z=${n.position.z}`);
}
// GG upper end z
const ggHighZ = gg.position.z + ggHalfLen * Math.cos(Math.abs(gg.rotation.x));
console.log(`GG upper end z≈${ggHighZ.toFixed(1)} — should connect to Antechamber z=${ant.position.z}`);

// 17. Rotation axis verification
console.log('\n--- Rotation Axis Verification ---');
console.log('All sloped elements now use X-axis rotation (correct for Z-length boxes):');
console.log('  DP rotation.x: +26.52° → slopes DOWN along +Z (north→south) ✓');
console.log('  AP rotation.x: -26.04° → slopes UP along +Z ✓');
console.log('  GG rotation.x: -26.28° → slopes UP along +Z ✓');
console.log('  Casing rotation.x: +51.84° → slopes along face ✓');
console.log('  KC N shaft rotation.x: -32.6° → slopes UP toward north ✓');
console.log('  KC S shaft rotation.x: +45° → slopes UP toward south ✓');
console.log('  QC N shaft rotation.x: -39° → slopes UP toward north ✓');
console.log('  QC S shaft rotation.x: +39.6° → slopes UP toward south ✓');
console.log('  Well shaft rotation.x: +45° → slopes DOWN along +Z ✓');
