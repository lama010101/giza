import { describe, it, expect } from 'vitest';
import { parseGLTF, parseGLTFString, parseGLB, type GLTFDocument } from './gltfLoader';

function makeMinimalGLTF(overrides: Partial<GLTFDocument> = {}): GLTFDocument {
  return {
    asset: { version: '2.0', generator: 'test' },
    scenes: [{ nodes: [0] }],
    scene: 0,
    nodes: [
      {
        name: 'Root',
        mesh: 0,
        extras: {
          giza: {
            evidenceIds: ['EV-001'],
            confidence: 80,
            interactive: true,
            layer: 'kings-complex',
          },
        },
      },
    ],
    meshes: [{ name: 'Mesh0', primitives: [{ attributes: { POSITION: 0 } }] }],
    materials: [{ name: 'Mat0' }],
    textures: [],
    ...overrides,
  };
}

describe('glTF Loader (M04-T11)', () => {
  describe('parseGLTF', () => {
    it('parses a minimal glTF document', () => {
      const result = parseGLTF(makeMinimalGLTF(), 'gltf');
      expect(result.format).toBe('gltf');
      expect(result.assetVersion).toBe('2.0');
      expect(result.nodeCount).toBe(1);
      expect(result.meshCount).toBe(1);
    });

    it('extracts GIZA extras from nodes', () => {
      const result = parseGLTF(makeMinimalGLTF(), 'gltf');
      expect(result.nodes[0].giza).not.toBeNull();
      expect(result.nodes[0].giza?.evidenceIds).toEqual(['EV-001']);
      expect(result.nodes[0].giza?.confidence).toBe(80);
    });

    it('extracts GIZA extras from meshes', () => {
      const doc = makeMinimalGLTF({
        meshes: [
          {
            name: 'ChamberMesh',
            primitives: [{ attributes: { POSITION: 0 } }],
            extras: {
              giza: {
                evidenceIds: ['EV-002'],
                confidence: 70,
                interactive: false,
                layer: 'gallery',
              },
            },
          },
        ],
      });
      const result = parseGLTF(doc, 'gltf');
      expect(result.meshes[0].giza?.evidenceIds).toEqual(['EV-002']);
    });

    it('extracts GIZA extras from materials', () => {
      const doc = makeMinimalGLTF({
        materials: [{ name: 'Limestone', extras: { giza: { layer: 'exterior' } } }],
      });
      const result = parseGLTF(doc, 'gltf');
      expect(result.materials[0].giza?.layer).toBe('exterior');
    });

    it('detects KTX2 textures via extensionsUsed', () => {
      const doc = makeMinimalGLTF({ extensionsUsed: ['KHR_texture_basisu'] });
      const result = parseGLTF(doc, 'gltf');
      expect(result.hasKTX2Textures).toBe(true);
    });

    it('reports missing asset field', () => {
      const result = parseGLTF({} as GLTFDocument, 'gltf');
      expect(result.errors.some((e) => e.includes('asset'))).toBe(true);
    });

    it('validates node metadata and reports warnings', () => {
      const doc = makeMinimalGLTF({
        nodes: [{ name: 'Bad', extras: { giza: { confidence: 150 } } }],
      });
      const result = parseGLTF(doc, 'gltf');
      expect(result.nodes[0].validation.passed).toBe(false);
    });
  });

  describe('parseGLTFString', () => {
    it('parses a JSON string', () => {
      const json = JSON.stringify(makeMinimalGLTF());
      const result = parseGLTFString(json);
      expect(result.format).toBe('gltf');
      expect(result.nodeCount).toBe(1);
    });

    it('returns error for invalid JSON', () => {
      const result = parseGLTFString('{ not valid json');
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.nodeCount).toBe(0);
    });
  });

  describe('parseGLB', () => {
    it('parses a valid GLB buffer', () => {
      const json = JSON.stringify(makeMinimalGLTF());
      const jsonBytes = new TextEncoder().encode(json);
      const jsonChunkLength = jsonBytes.length;

      // GLB: 12-byte header + 8-byte chunk header + JSON data
      const totalLength = 12 + 8 + jsonChunkLength;
      const buffer = new ArrayBuffer(totalLength);
      const view = new DataView(buffer);

      // Header
      view.setUint32(0, 0x46546c67, true); // "glTF"
      view.setUint32(4, 2, true); // version
      view.setUint32(8, totalLength, true); // length

      // JSON chunk header
      view.setUint32(12, jsonChunkLength, true);
      view.setUint32(16, 0x4e4f534a, true); // "JSON"

      // JSON data
      const bytes = new Uint8Array(buffer, 20, jsonChunkLength);
      bytes.set(jsonBytes);

      const result = parseGLB(buffer);
      expect(result.format).toBe('glb');
      expect(result.nodeCount).toBe(1);
    });

    it('rejects invalid GLB magic', () => {
      const buffer = new ArrayBuffer(20);
      const view = new DataView(buffer);
      view.setUint32(0, 0xdeadbeef, true);
      const result = parseGLB(buffer);
      expect(result.errors.some((e) => e.includes('magic'))).toBe(true);
    });
  });
});
