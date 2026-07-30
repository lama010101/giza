// Verification of Osiris Shaft blockout positions vs. Hawass 2007 measurements
// Reference: docs/architecture/osiris-shaft-measurements.md

const DEG = Math.PI / 180;

const get = (id) => nodes.find((n) => n.id === id);

const nodes = [
  { id: 'shaft-a', name: 'Shaft A', position: { x: 0, y: -4.81, z: 0 }, size: { x: 2.6, y: 9.62, z: 3.0 } },
  { id: 'chamber-a', name: 'Chamber A', position: { x: 0, y: -8.27, z: -2.8 }, size: { x: 3.85, y: 2.7, z: 8.6 } },
  { id: 'shaft-b', name: 'Shaft B', position: { x: -1.125, y: -16.245, z: -6.0 }, size: { x: 1.9, y: 13.25, z: 1.9 } },
  { id: 'chamber-b', name: 'Chamber B', position: { x: -1.125, y: -21.85, z: -10.35 }, size: { x: 3.65, y: 2.6, z: 6.8 } },
  { id: 'shaft-c', name: 'Shaft C', position: { x: 0.9, y: -26.9, z: -7.0 }, size: { x: 1.9, y: 7.5, z: 1.65 } },
  { id: 'chamber-i', name: 'Chamber I', position: { x: -1.4, y: -29.15, z: -7.0 }, size: { x: 6.5, y: 3.0, z: 9.0 } },
  { id: 'central-island', name: 'Central Island', position: { x: -1.4, y: -29.775, z: -7.0 }, size: { x: 3.2, y: 1.75, z: 5.2 } },
  { id: 'sarcophagus-i', name: 'Basalt Sarcophagus', position: { x: -1.4, y: -28.425, z: -6.5 }, size: { x: 1.08, y: 0.95, z: 2.28 } },
  { id: 'northern-conduit', name: 'Northern Conduit', position: { x: -7.054, y: -30.3, z: -13.904 }, rotation: { x: 0, y: (-3 * Math.PI) / 4, z: 0 }, size: { x: 0.6, y: 0.7, z: 6.8 } },
  { id: 'chamber-i-water', name: 'Chamber I Water', position: { x: -1.4, y: -30.4, z: -7.0 }, size: { x: 6.5, y: 0.5, z: 9.0 } },
];

let failures = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
  } else {
    console.log(`  ✗ ${message}`);
    failures += 1;
  }
}

function range(node, axis) {
  const half = node.size[axis] / 2;
  return [node.position[axis] - half, node.position[axis] + half];
}

console.log('=== OSIRIS SHAFT BLOCKOUT GEOMETRY AUDIT ===\n');

// 1. Shaft A
console.log('--- Shaft A ---');
const sa = get('shaft-a');
console.log(`Entrance cross-section: ${sa.size.x} × ${sa.size.z} m (ref: 2.60 × 3.00 m)`);
console.log(`Depth: ${sa.size.y} m (ref: 9.62 m)`);
assert(Math.abs(sa.size.x - 2.6) < 0.01 && Math.abs(sa.size.z - 3.0) < 0.01, 'Cross-section matches');
assert(Math.abs(sa.size.y - 9.62) < 0.01, 'Depth matches');

// 2. Chamber A
console.log('\n--- Chamber A ---');
const ca = get('chamber-a');
const caFloor = ca.position.y - ca.size.y / 2;
const caNorth = ca.position.z - ca.size.z / 2;
const caSouth = ca.position.z + ca.size.z / 2;
const caWest = ca.position.x - ca.size.x / 2;
const caEast = ca.position.x + ca.size.x / 2;
console.log(`Dimensions: ${ca.size.x} × ${ca.size.y} × ${ca.size.z} m (ref: 3.85 × 2.70 × 8.60 m)`);
console.log(`Floor Y: ${caFloor.toFixed(2)} (ref: -9.62)`);
console.log(`Z range: ${caNorth.toFixed(2)} to ${caSouth.toFixed(2)} (extends north from Shaft A)`);
assert(Math.abs(ca.size.x - 3.85) < 0.01 && Math.abs(ca.size.y - 2.7) < 0.01 && Math.abs(ca.size.z - 8.6) < 0.01, 'Dimensions match');
assert(Math.abs(caFloor + 9.62) < 0.01, 'Floor aligns with Shaft A bottom');
assert(caNorth < 0 && caSouth > 0, 'Chamber A crosses the Shaft A z=0 plane and extends north');
assert(caNorth < -1.5, 'Chamber A extends north beyond Shaft A');

// 3. Shaft B
console.log('\n--- Shaft B ---');
const sb = get('shaft-b');
const sbTop = sb.position.y + sb.size.y / 2;
const sbBottom = sb.position.y - sb.size.y / 2;
const sbNorth = sb.position.z - sb.size.z / 2;
const sbSouth = sb.position.z + sb.size.z / 2;
console.log(`Mouth: ${sb.size.x} × ${sb.size.z} m (ref: 1.90 × 1.90 m)`);
console.log(`Depth: ${sb.size.y} m (ref: 13.25 m)`);
console.log(`Top Y: ${sbTop.toFixed(2)} (ref: -9.62)`);
console.log(`Bottom Y: ${sbBottom.toFixed(2)}`);
assert(Math.abs(sb.size.x - 1.9) < 0.01 && Math.abs(sb.size.z - 1.9) < 0.01, 'Cross-section matches');
assert(Math.abs(sb.size.y - 13.25) < 0.01, 'Depth matches');
assert(Math.abs(sbTop + 9.62) < 0.01, 'Top aligns with Chamber A floor');

// Position in Chamber A: 1.10 m from N wall, 0.80 m from W wall (center-to-wall per blockout convention)
const distNorth = Math.abs(sb.position.z - caNorth);
const distWest = Math.abs(sb.position.x - caWest);
console.log(`Distance from Chamber A north wall: ${distNorth.toFixed(2)} m (ref: 1.10)`);
console.log(`Distance from Chamber A west wall: ${distWest.toFixed(2)} m (ref: 0.80)`);
assert(Math.abs(distNorth - 1.10) < 0.05, 'Shaft B is ~1.10 m from Chamber A north wall');
assert(Math.abs(distWest - 0.80) < 0.05, 'Shaft B is ~0.80 m from Chamber A west wall');
assert(sbNorth > caNorth && sbSouth < caSouth, 'Shaft B is within Chamber A');

// 4. Chamber B
console.log('\n--- Chamber B ---');
const cb = get('chamber-b');
const cbFloor = cb.position.y - cb.size.y / 2;
const cbNorth = cb.position.z - cb.size.z / 2;
const cbSouth = cb.position.z + cb.size.z / 2;
console.log(`Dimensions: ${cb.size.x} × ${cb.size.y} × ${cb.size.z} m (ref: 3.65 × 2.60 × 6.80 m)`);
console.log(`Floor Y: ${cbFloor.toFixed(2)} (ref: ${(sbBottom - 0.28).toFixed(2)})`);
console.log(`Z range: ${cbNorth.toFixed(2)} to ${cbSouth.toFixed(2)}`);
assert(Math.abs(cb.size.x - 3.65) < 0.01 && Math.abs(cb.size.y - 2.6) < 0.01 && Math.abs(cb.size.z - 6.8) < 0.01, 'Dimensions match');
assert(Math.abs((sbBottom - cbFloor) - 0.28) < 0.01, 'Floor is 0.28 m below Shaft B floor');
assert(cbSouth < sbNorth + 0.01, 'Chamber B extends north from Shaft B');

// 5. Shaft C
console.log('\n--- Shaft C ---');
const sc = get('shaft-c');
const scTop = sc.position.y + sc.size.y / 2;
const scBottom = sc.position.y - sc.size.y / 2;
console.log(`Cross-section: ${sc.size.x} × ${sc.size.z} m (ref: 1.90 × 1.65 m)`);
console.log(`Depth: ${sc.size.y} m (ref: 7.50 m)`);
console.log(`Top Y: ${scTop.toFixed(2)} (ref: ${cbFloor.toFixed(2)})`);
console.log(`Bottom Y: ${scBottom.toFixed(2)}`);
assert(Math.abs(sc.size.x - 1.9) < 0.01 && Math.abs(sc.size.z - 1.65) < 0.01, 'Cross-section matches');
assert(Math.abs(sc.size.y - 7.5) < 0.01, 'Depth matches');
assert(Math.abs(scTop - cbFloor) < 0.01, 'Top aligns with Chamber B floor');
assert(sc.position.x > 0, 'Shaft C is on the east side of Chamber B');
assert(sc.position.z <= cbSouth + 0.5, 'Shaft C is near the south end of Chamber B');

// 6. Chamber I
console.log('\n--- Chamber I ---');
const ci = get('chamber-i');
const ciFloor = ci.position.y - ci.size.y / 2;
const ciNorth = ci.position.z - ci.size.z / 2;
const ciSouth = ci.position.z + ci.size.z / 2;
const ciWest = ci.position.x - ci.size.x / 2;
const ciEast = ci.position.x + ci.size.x / 2;
console.log(`Dimensions: ${ci.size.x} × ${ci.size.y} × ${ci.size.z} m (ref: 6.5 × ~3.0 × 9.0 m)`);
console.log(`Floor Y: ${ciFloor.toFixed(2)} (ref: ${scBottom.toFixed(2)})`);
console.log(`Z range: ${ciNorth.toFixed(2)} to ${ciSouth.toFixed(2)}`);
assert(Math.abs(ci.size.x - 6.5) < 0.01 && Math.abs(ci.size.z - 9.0) < 0.01, 'Floor plan matches');
assert(Math.abs(ciFloor - scBottom) < 0.01, 'Floor aligns with Shaft C bottom');
assert(ciEast > sc.position.x, 'Chamber I extends west of Shaft C (Shaft C is on its east side)');
assert(sc.position.z >= ciNorth && sc.position.z <= ciSouth, 'Shaft C is within Chamber I z extent');

// 7. Central Island
console.log('\n--- Central Island ---');
const island = get('central-island');
const islandTop = island.position.y + island.size.y / 2;
const islandBottom = island.position.y - island.size.y / 2;
console.log(`Dimensions: ${island.size.x} × ${island.size.y} × ${island.size.z} m (ref: 3.2 × ~1.5–2.0 × 5.2 m)`);
console.log(`Top Y: ${islandTop.toFixed(3)}`);
console.log(`Bottom Y: ${islandBottom.toFixed(3)} (ref: ${ciFloor.toFixed(3)})`);
assert(Math.abs(island.size.x - 3.2) < 0.01 && Math.abs(island.size.z - 5.2) < 0.01, 'Plan dimensions match');
assert(Math.abs(islandBottom - ciFloor) < 0.01, 'Island sits on Chamber I floor');
assert(island.position.y > ciFloor && islandTop < ci.position.y + ci.size.y / 2, 'Island is inside Chamber I');

// 8. Sarcophagus
console.log('\n--- Basalt Sarcophagus ---');
const sarc = get('sarcophagus-i');
const sarcFloor = sarc.position.y - sarc.size.y / 2;
console.log(`Exterior dimensions: ${sarc.size.x} × ${sarc.size.y} × ${sarc.size.z} m (ref: 1.08 × ~0.95 × 2.28 m)`);
console.log(`Sits on island top: ${sarcFloor.toFixed(3)} == ${islandTop.toFixed(3)}`);
assert(Math.abs(sarc.size.x - 1.08) < 0.01 && Math.abs(sarc.size.z - 2.28) < 0.01, 'Exterior length/width match');
assert(Math.abs(sarcFloor - islandTop) < 0.01, 'Sarcophagus sits on Central Island top');

// 9. Northern Conduit
console.log('\n--- Northern Conduit ---');
const nc = get('northern-conduit');
const ncAngle = (nc.rotation.y / DEG).toFixed(1);
const ncHalfLen = nc.size.z / 2;
// local -z end (toward SE) is the end that should sit at Chamber I NW corner
const dirX = Math.sin(nc.rotation.y);
const dirZ = Math.cos(nc.rotation.y);
const ncNearX = nc.position.x - ncHalfLen * dirX;
const ncNearZ = nc.position.z - ncHalfLen * dirZ;
const ncFarX = nc.position.x + ncHalfLen * dirX;
const ncFarZ = nc.position.z + ncHalfLen * dirZ;
console.log(`Cross-section: ${nc.size.x} × ${nc.size.y} m (ref: 0.5–0.6 × 0.5–0.7 m)`);
console.log(`Length: ${nc.size.z} m (ref: 6.0–7.0 m)`);
console.log(`Rotation Y: ${ncAngle}° (ref: -135° / NW)`);
console.log(`Near end (SE): x=${ncNearX.toFixed(2)}, z=${ncNearZ.toFixed(2)}`);
console.log(`Far end (NW): x=${ncFarX.toFixed(2)}, z=${ncFarZ.toFixed(2)}`);
assert(Math.abs(ncAngle - -135) < 0.5, 'Conduit points NW');
assert(Math.abs(ncNearX - ciWest) < 0.15 && Math.abs(ncNearZ - ciNorth) < 0.15, 'Near end sits at Chamber I NW corner');
assert(ncFarX < ncNearX && ncFarZ < ncNearZ, 'Far end extends further NW');

// 10. Vertical stack / total depth
console.log('\n--- Vertical Stack ---');
const totalDepth = -ciFloor;
console.log(`Shaft A bottom: ${(-sa.size.y).toFixed(2)}`);
console.log(`Shaft B bottom: ${sbBottom.toFixed(2)}`);
console.log(`Chamber B floor: ${cbFloor.toFixed(2)}`);
console.log(`Shaft C bottom / Chamber I floor: ${ciFloor.toFixed(2)}`);
console.log(`Total descent to Level 3 floor: ${totalDepth.toFixed(2)} m`);
assert(Math.abs(sa.size.y - 9.62) < 0.01, 'Shaft A depth 9.62 m');
assert(Math.abs(sb.size.y - 13.25) < 0.01, 'Shaft B depth 13.25 m');
assert(Math.abs(sc.size.y - 7.5) < 0.01, 'Shaft C depth 7.50 m');
assert(Math.abs((sbBottom - cbFloor) - 0.28) < 0.01, 'Level 2 floor is 0.28 m below Shaft B floor');
assert(Math.abs(ciFloor - scBottom) < 0.01, 'Level 3 floor aligns with Shaft C bottom');
assert(Math.abs(totalDepth - (9.62 + 13.25 + 0.28 + 7.5)) < 0.05, 'Total depth includes floor step (30.65 m)');

if (failures === 0) {
  console.log('\n=== OSIRIS SHAFT GEOMETRY AUDIT PASSED ===');
} else {
  console.log(`\n=== OSIRIS SHAFT GEOMETRY AUDIT FAILED: ${failures} issue(s) ===`);
  process.exit(1);
}
