/* eslint-disable no-console */
import * as THREE from 'three';
import { greatPyramidBlockout } from '../database/blockouts/great-pyramid';
import { osirisBlockout } from '../database/blockouts/osiris-shaft';

interface Vec3 {
  x: number;
  y: number;
  z: number;
}

interface NodeLike {
  id: string;
  name: string;
  position: Vec3;
  rotation?: Vec3;
  size: Vec3;
  objectId?: string;
}

interface BlockoutLike {
  id: string;
  name: string;
  nodes: NodeLike[];
}

function toThree(v: Vec3): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, v.z);
}

function fromThree(v: THREE.Vector3): Vec3 {
  return { x: v.x, y: v.y, z: v.z };
}

function axes(node: { position: Vec3; rotation?: Vec3 }): {
  x: THREE.Vector3;
  y: THREE.Vector3;
  z: THREE.Vector3;
} {
  const euler = new THREE.Euler(
    node.rotation?.x ?? 0,
    node.rotation?.y ?? 0,
    node.rotation?.z ?? 0,
    'XYZ',
  );
  return {
    x: new THREE.Vector3(1, 0, 0).applyEuler(euler),
    y: new THREE.Vector3(0, 1, 0).applyEuler(euler),
    z: new THREE.Vector3(0, 0, 1).applyEuler(euler),
  };
}

function floorEndPoints(node: { position: Vec3; rotation?: Vec3; size: Vec3 }): {
  start: Vec3;
  end: Vec3;
} {
  const p = toThree(node.position);
  const { y: ay, z: az } = axes(node);
  const halfDepth = node.size.z / 2;
  const halfHeight = node.size.y / 2;
  const start = p
    .clone()
    .add(az.clone().multiplyScalar(-halfDepth))
    .add(ay.clone().multiplyScalar(-halfHeight));
  const end = p
    .clone()
    .add(az.clone().multiplyScalar(halfDepth))
    .add(ay.clone().multiplyScalar(-halfHeight));
  return { start: fromThree(start), end: fromThree(end) };
}

function aabb(node: { position: Vec3; rotation?: Vec3; size: Vec3 }): { min: Vec3; max: Vec3 } {
  const p = toThree(node.position);
  const { x: ax, y: ay, z: az } = axes(node);
  const hx = node.size.x / 2;
  const hy = node.size.y / 2;
  const hz = node.size.z / 2;
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const corner = p
          .clone()
          .add(ax.clone().multiplyScalar(sx * hx))
          .add(ay.clone().multiplyScalar(sy * hy))
          .add(az.clone().multiplyScalar(sz * hz));
        min.min(corner);
        max.max(corner);
      }
    }
  }
  return { min: fromThree(min), max: fromThree(max) };
}

function fmt(v: Vec3) {
  return `(${v.x.toFixed(3)}, ${v.y.toFixed(3)}, ${v.z.toFixed(3)})`;
}

function aabbDistance(a: { min: Vec3; max: Vec3 }, b: { min: Vec3; max: Vec3 }): number {
  let dx = 0;
  if (a.max.x < b.min.x) dx = b.min.x - a.max.x;
  else if (b.max.x < a.min.x) dx = a.min.x - b.max.x;
  let dy = 0;
  if (a.max.y < b.min.y) dy = b.min.y - a.max.y;
  else if (b.max.y < a.min.y) dy = a.min.y - b.max.y;
  let dz = 0;
  if (a.max.z < b.min.z) dz = b.min.z - a.max.z;
  else if (b.max.z < a.min.z) dz = a.min.z - b.max.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function report(blockout: BlockoutLike) {
  console.log(`\n=== ${blockout.name} ===`);
  const nodes = blockout.nodes.filter((n) => n.size.z > 0 || n.size.x > 0 || n.size.y > 0);
  for (const n of nodes) {
    const { start, end } = floorEndPoints(n);
    const box = aabb(n);
    const rot = n.rotation ?? { x: 0, y: 0, z: 0 };
    console.log(`${n.id}: ${n.name}`);
    console.log(
      `  pos: ${fmt(n.position)} size: (${n.size.x.toFixed(3)}, ${n.size.y.toFixed(3)}, ${n.size.z.toFixed(3)}) rot: ${fmt(rot)}`,
    );
    console.log(`  floor start: ${fmt(start)} -> floor end: ${fmt(end)}`);
    console.log(`  aabb min: ${fmt(box.min)} max: ${fmt(box.max)}`);
  }

  const byObject = new Map<string, NodeLike[]>();
  for (const n of nodes) {
    if (!n.objectId) continue;
    const list = byObject.get(n.objectId) ?? [];
    list.push(n);
    byObject.set(n.objectId, list);
  }
  for (const [oid, list] of byObject) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => a.position.z - b.position.z);
    console.log(`\n-- object ${oid} --`);
    for (let i = 0; i < sorted.length; i++) {
      const n = sorted[i];
      const { start, end } = floorEndPoints(n);
      console.log(`  [${i}] ${n.id}: start ${fmt(start)} end ${fmt(end)}`);
    }
    for (let i = 0; i < sorted.length - 1; i++) {
      const aBox = aabb(sorted[i]);
      const bBox = aabb(sorted[i + 1]);
      const d = aabbDistance(aBox, bBox);
      console.log(`  gap/overlap ${sorted[i].id} <-> ${sorted[i + 1].id}: ${d.toFixed(3)} m`);
    }
  }

  const pairs: [string, string][] = [
    ['original-entrance', 'descending-passage'],
    ['descending-passage', 'descending-passage-horizontal'],
    ['descending-passage-horizontal', 'subterranean-chamber'],
    ['ascending-passage', 'grand-gallery'],
    ['grand-gallery', 'great-step-passage'],
    ['great-step-passage', 'antechamber'],
    ['antechamber', 'antechamber-kc-passage'],
    ['antechamber-kc-passage', 'kings-chamber'],
    ['kings-chamber', 'kings-sarcophagus'],
    ['kings-chamber', 'kc-north-shaft'],
    ['kings-chamber', 'kc-south-shaft'],
    ['queens-passage', 'queens-chamber'],
    ['queens-chamber', 'queens-niche'],
    ['al-mamun-bypass', 'modern-entrance'],
    ['shaft-a', 'chamber-a'],
    ['shaft-b', 'chamber-b'],
    ['shaft-c', 'chamber-i'],
    ['northern-conduit', 'chamber-i'],
  ];
  console.log('\n-- key pair distances (AABB) --');
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const [ida, idb] of pairs) {
    const a = byId.get(ida);
    const b = byId.get(idb);
    if (!a || !b) continue;
    const aBox = aabb(a);
    const bBox = aabb(b);
    const d = aabbDistance(aBox, bBox);
    const status = d < 0.001 ? 'touch/overlap' : d < 0.1 ? 'tiny gap' : 'gap';
    console.log(`  ${ida} <-> ${idb}: ${d.toFixed(3)} m (${status})`);
  }
}

report(greatPyramidBlockout);
report(osirisBlockout);
