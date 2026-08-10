import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const outDir = join(dirname(__filename), '..', 'assets', 'export', 'glB');

function loadAndCheck(file, outPath) {
  const data = readFileSync(outPath);
  const loader = new GLTFLoader();
  loader.parse(
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
    '',
    (gltf) => {
      const first = gltf.scene.children[0];
      const extras = first?.userData?.giza ?? first?.userData ?? null;
      if (extras && extras.assetId) {
        console.log(`✓ ${file}: ${gltf.scene.children.length} nodes, extras.assetId=${extras.assetId}`);
      } else {
        console.log(`✓ ${file}: ${gltf.scene.children.length} nodes`);
      }
    },
    (err) => {
      console.error(`✗ ${file}:`, err);
      process.exitCode = 1;
    },
  );
}

function verifyDir(dir) {
  const files = readdirSync(dir).filter((f) => f.endsWith('.glb'));
  for (const file of files) {
    loadAndCheck(file, join(dir, file));
  }
}

verifyDir(outDir);
const objectsDir = join(outDir, 'objects');
verifyDir(objectsDir);
