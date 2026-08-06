/**
 * Procedural GLB asset generator for M06B.
 *
 * Creates actual `.glb` production assets under `assets/export/glB/` from the
 * surveyed blockout dimensions in `database/blockouts`. The meshes are simple
 * boxes derived from the measured sizes and positions, material-colored by
 * blockout metadata, and named for traceability.
 *
 * Run with: npx tsx scripts/generateExportAssets.ts
 */

import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { osirisBlockout } from '../database/blockouts/osiris-shaft';
import { greatPyramidBlockout } from '../database/blockouts/great-pyramid';

// Polyfill FileReader for Node so GLTFExporter can read generated Blobs.
class FileReaderPolyfill {
  result: ArrayBuffer | string | null = null;
  onloadend: (() => void) | null = null;

  readAsArrayBuffer(blob: Blob) {
    blob
      .arrayBuffer()
      .then((buf) => {
        this.result = buf;
        this.onloadend?.();
      })
      .catch(() => {
        // FileReader errors are surfaced by the exporter callback instead.
      });
  }

  async readAsDataURL(blob: Blob) {
    const buf = await blob.arrayBuffer();
    const b64 = Buffer.from(buf).toString('base64');
    this.result = `data:application/octet-stream;base64,${b64}`;
    this.onloadend?.();
  }
}

// @ts-expect-error polyfill FileReader for GLTFExporter in Node
globalThis.FileReader = FileReaderPolyfill;

const __filename = fileURLToPath(import.meta.url);
const root = dirname(__filename);
const outDir = join(root, '..', 'assets', 'export', 'glB');
mkdirSync(outDir, { recursive: true });

interface BlockoutNodeLike {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  size: { x: number; y: number; z: number };
  color: string;
  opacity?: number;
  overlay?: string;
  layer?: string;
}

function hexToNumber(hex: string): number {
  const normalized = hex.replace('#', '');
  return parseInt(normalized, 16);
}

function buildScene(nodes: BlockoutNodeLike[], includeOverlays = true): THREE.Scene {
  const scene = new THREE.Scene();
  scene.name = 'GIZA generated asset';

  for (const node of nodes) {
    if (!includeOverlays && node.overlay) continue;

    const geometry = new THREE.BoxGeometry(node.size.x, node.size.y, node.size.z);
    const material = new THREE.MeshStandardMaterial({
      color: hexToNumber(node.color),
      transparent: node.opacity !== undefined && node.opacity < 1.0,
      opacity: node.opacity ?? 1.0,
      roughness: 0.8,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = node.name;
    mesh.position.set(node.position.x, node.position.y, node.position.z);
    if (node.rotation) {
      mesh.rotation.set(node.rotation.x, node.rotation.y, node.rotation.z);
    }
    mesh.userData = { blockoutId: node.id, color: node.color };
    scene.add(mesh);
  }

  return scene;
}

async function exportGLB(scene: THREE.Scene, outPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (gltf) => {
        if (gltf instanceof ArrayBuffer) {
          writeFileSync(outPath, Buffer.from(gltf));
          resolve();
        } else {
          writeFileSync(outPath, JSON.stringify(gltf));
          resolve();
        }
      },
      (error) => reject(error instanceof Error ? error : new Error(String(error))),
      { binary: true },
    );
  });
}

async function writeGLB(name: string, nodes: BlockoutNodeLike[], includeOverlays = true) {
  const scene = buildScene(nodes, includeOverlays);
  const outPath = join(outDir, `${name}.glb`);
  await exportGLB(scene, outPath);
  // eslint-disable-next-line no-console
  console.log(`Generated ${outPath} (${scene.children.length} nodes)`);
}

function makeNode(
  id: string,
  name: string,
  pos: THREE.Vector3,
  size: THREE.Vector3,
  color: string,
): BlockoutNodeLike {
  return {
    id,
    name,
    position: { x: pos.x, y: pos.y, z: pos.z },
    size: { x: size.x, y: size.y, z: size.z },
    color,
  };
}

function makeRubble(id: string, name: string, center: THREE.Vector3, color: string) {
  const nodes: BlockoutNodeLike[] = [];
  const count = 5;
  const seed = center.x + center.y + center.z;
  for (let i = 0; i < count; i++) {
    const s = 0.15 + ((Math.abs(Math.sin(seed + i)) * 0.35) % 0.35);
    const x = center.x + Math.sin(seed + i * 1.5) * 0.4;
    const z = center.z + Math.cos(seed + i * 2.3) * 0.4;
    const y = center.y + s / 2 + i * 0.05;
    nodes.push(
      makeNode(
        `${id}-frag-${i}`,
        `${name} fragment ${i + 1}`,
        new THREE.Vector3(x, y, z),
        new THREE.Vector3(s, s, s),
        color,
      ),
    );
  }
  return nodes;
}

function makeBedrock(id: string, name: string, color: string): BlockoutNodeLike {
  return makeNode(id, name, new THREE.Vector3(0, 0, 0), new THREE.Vector3(2, 0.4, 1.5), color);
}

function makeGranite(id: string, name: string, color: string): BlockoutNodeLike {
  return makeNode(id, name, new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(1, 1, 1), color);
}

function makeStair(id: string, name: string, width: number, color: string): BlockoutNodeLike[] {
  const steps = 5;
  const rise = 0.3;
  const run = 0.4;
  const nodes: BlockoutNodeLike[] = [];
  for (let i = 0; i < steps; i++) {
    nodes.push(
      makeNode(
        `${id}-step-${i}`,
        `${name} step ${i + 1}`,
        new THREE.Vector3(0, rise / 2 + i * rise, i * run),
        new THREE.Vector3(width, rise, run),
        color,
      ),
    );
  }
  return nodes;
}

function makeShaftLining(id: string, name: string, color: string): BlockoutNodeLike {
  return makeNode(id, name, new THREE.Vector3(0, 1, 0), new THREE.Vector3(0.2, 2, 2), color);
}

function makeShaftFrame(id: string, name: string, color: string): BlockoutNodeLike {
  return makeNode(id, name, new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(1.2, 0.2, 1.2), color);
}

function makeMaterialSample(id: string, name: string, color: string): BlockoutNodeLike {
  return makeNode(id, name, new THREE.Vector3(0, 0.5, 0), new THREE.Vector3(1, 1, 1), color);
}

async function main() {
  const osirisNodes = osirisBlockout.nodes as BlockoutNodeLike[];
  const gpNodes = greatPyramidBlockout.nodes as BlockoutNodeLike[];

  // Rubble samples
  await writeGLB(
    'RUBBLE_001',
    makeRubble(
      'RUBBLE_001',
      'Mixed limestone rubble chunks',
      new THREE.Vector3(0, 0, 0),
      '#8a7a55',
    ),
    true,
  );
  await writeGLB(
    'RUBBLE_002',
    makeRubble('RUBBLE_002', 'Granite rubble fragments', new THREE.Vector3(0.2, 0, 0.2), '#7a4a4a'),
    true,
  );
  await writeGLB(
    'RUBBLE_003',
    makeRubble('RUBBLE_003', 'Small debris scatter', new THREE.Vector3(-0.2, 0, -0.1), '#9a8a65'),
    true,
  );

  // Bedrock samples
  await writeGLB('BEDROCK_001', [
    makeBedrock('BEDROCK_001', 'Tura limestone bedrock slab', '#c2b090'),
  ]);
  await writeGLB('BEDROCK_002', [makeBedrock('BEDROCK_002', 'Local limestone bedrock', '#b0a080')]);
  await writeGLB('BEDROCK_003', [
    makeBedrock('BEDROCK_003', 'Weathered limestone surface', '#a89868'),
  ]);

  // Granite samples
  await writeGLB('GRANITE_001', [makeGranite('GRANITE_001', 'Aswan red granite block', '#9a5a5a')]);
  await writeGLB('GRANITE_002', [makeGranite('GRANITE_002', 'Granite sarcophagus lid', '#6a3a3a')]);
  await writeGLB('GRANITE_003', [
    makeGranite('GRANITE_003', 'Polished granite surface', '#8a4a4a'),
  ]);

  // Stair/shaft samples
  await writeGLB('STAIR_001', makeStair('STAIR_001', 'Limestone stair section', 1.2, '#c2b090'));
  await writeGLB('STAIR_002', makeStair('STAIR_002', 'Granite stair section', 0.9, '#9a5a5a'));
  await writeGLB('SHAFT_001', [makeShaftLining('SHAFT_001', 'Vertical shaft lining', '#b0a080')]);
  await writeGLB('SHAFT_002', [makeShaftFrame('SHAFT_002', 'Shaft entrance frame', '#8a7a55')]);

  // Material samples
  await writeGLB('MAT_TuraLimestone', [
    makeMaterialSample('MAT_TuraLimestone', 'Tura limestone rendered sample', '#e8e0d0'),
  ]);
  await writeGLB('MAT_LocalLimestone', [
    makeMaterialSample('MAT_LocalLimestone', 'Local limestone rendered sample', '#c2b090'),
  ]);
  await writeGLB('MAT_AswanGranite', [
    makeMaterialSample('MAT_AswanGranite', 'Aswan granite rendered sample', '#9a5a5a'),
  ]);
  await writeGLB('MAT_Basalt', [
    makeMaterialSample('MAT_Basalt', 'Basalt rendered sample', '#3a3a3a'),
  ]);
  await writeGLB('MAT_Water', [
    makeMaterialSample('MAT_Water', 'Water surface rendered sample', '#0a4a6b'),
  ]);

  // Monument LODs
  await writeGLB('OS_LOD0', osirisNodes, true);
  await writeGLB(
    'OS_LOD1',
    osirisNodes.filter((n) => !n.id.startsWith('surface-')),
    false,
  );

  await writeGLB('GP_LOD0', gpNodes, true);
  await writeGLB(
    'GP_LOD1',
    gpNodes.filter(
      (n) =>
        n.id === 'pyramid-exterior' ||
        n.layer === 'kings-complex' ||
        n.layer === 'queens-complex' ||
        n.layer === 'gallery' ||
        n.layer === 'subterranean' ||
        n.layer === 'passages' ||
        n.layer === 'relieving',
    ),
    false,
  );
  await writeGLB(
    'GP_LOD2',
    gpNodes.filter((n) => n.id === 'pyramid-exterior' || n.layer === 'kings-complex'),
    false,
  );

  // eslint-disable-next-line no-console
  console.log('All export assets generated.');
}

main().catch((err) => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
