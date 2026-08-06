import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const outDir = join(dirname(__filename), '..', 'assets', 'export', 'glB');
const files = readdirSync(outDir).filter((f) => f.endsWith('.glb'));

for (const file of files) {
  const data = readFileSync(join(outDir, file));
  const loader = new GLTFLoader();
  loader.parse(
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    '',
    (gltf) => {
      console.log(`✓ ${file}: ${gltf.scene.children.length} top-level nodes`);
    },
    (err) => {
      console.error(`✗ ${file}:`, err);
      process.exitCode = 1;
    },
  );
}
