import { describe, it, expect } from 'vitest';
import {
  parseOBJ,
  parseMTL,
  parsePLYMesh,
  parseGlTFMesh,
  checkManifold,
  checkWatertight,
  computeUVCoverage,
  validateMeshQuality,
  generatePhotogrammetryLODs,
  computeQualityMetrics,
  ingestPhotogrammetry,
  type PhotogrammetryMesh,
} from './photogrammetryLoader';

// ─── OBJ helpers ──────────────────────────────────────────────────────────

function makeCubeObj(): string {
  return [
    '# Simple cube',
    'mtllib cube.mtl',
    'v 0.0 0.0 0.0',
    'v 1.0 0.0 0.0',
    'v 1.0 1.0 0.0',
    'v 0.0 1.0 0.0',
    'v 0.0 0.0 1.0',
    'v 1.0 0.0 1.0',
    'v 1.0 1.0 1.0',
    'v 0.0 1.0 1.0',
    'vt 0.0 0.0',
    'vt 1.0 0.0',
    'vt 1.0 1.0',
    'vt 0.0 1.0',
    'vn 0.0 1.0 0.0',
    'usemtl cube_material',
    'f 1/1/1 2/2/1 3/3/1',
    'f 1/1/1 3/3/1 4/4/1',
    'f 5/1/1 6/2/1 7/3/1',
    'f 5/1/1 7/3/1 8/4/1',
  ].join('\n');
}

function makeSimpleObj(): string {
  return ['v 0.0 0.0 0.0', 'v 1.0 0.0 0.0', 'v 0.0 1.0 0.0', 'f 1 2 3'].join('\n');
}

function makeNonManifoldObj(): string {
  // Three triangles sharing a single edge (non-manifold)
  return [
    'v 0.0 0.0 0.0',
    'v 1.0 0.0 0.0',
    'v 0.0 1.0 0.0',
    'v 1.0 1.0 0.0',
    'f 1 2 3',
    'f 1 2 4',
    'f 1 2 3', // duplicate edge 1-2 → 3 triangles on same edge
  ].join('\n');
}

function makeMtl(): string {
  return [
    '# Materials',
    'newmtl cube_material',
    'map_Kd cube_diffuse.png',
    'map_Bump cube_normal.png',
  ].join('\n');
}

// ─── PLY mesh helper ──────────────────────────────────────────────────────

function makePlyMesh(): string {
  return [
    'ply',
    'format ascii 1.0',
    'element vertex 4',
    'property float x',
    'property float y',
    'property float z',
    'element face 2',
    'property list uchar int vertex_indices',
    'end_header',
    '0.0 0.0 0.0',
    '1.0 0.0 0.0',
    '1.0 1.0 0.0',
    '0.0 1.0 0.0',
    '3 0 1 2',
    '3 0 2 3',
  ].join('\n');
}

// ─── glTF helper ──────────────────────────────────────────────────────────

function makeSimpleGltf(): unknown {
  return {
    asset: { version: '2.0' },
    accessors: [
      {
        bufferView: 0,
        componentType: 5126,
        count: 3,
        type: 'VEC3',
        min: [0, 0, 0],
        max: [1, 1, 0],
      },
      { bufferView: 1, componentType: 5126, count: 3, type: 'VEC2', min: [0, 0], max: [1, 1] },
      { bufferView: 2, componentType: 5125, count: 3, type: 'SCALAR' },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: 36 },
      { buffer: 0, byteOffset: 36, byteLength: 24 },
      { buffer: 0, byteOffset: 60, byteLength: 12 },
    ],
    buffers: [{ byteLength: 72 }],
    meshes: [
      {
        primitives: [
          {
            attributes: { POSITION: 0, TEXCOORD_0: 1 },
            indices: 2,
            material: 0,
          },
        ],
      },
    ],
    materials: [
      {
        name: 'test_material',
        pbrMetallicRoughness: { baseColorTexture: { index: 0 } },
      },
    ],
    textures: [{ source: 0 }],
    images: [{ width: 1024, height: 1024 }],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('Photogrammetry Loader (M06.5-T03)', () => {
  describe('OBJ parsing', () => {
    it('parses OBJ with vertices, faces, UVs, and normals', () => {
      const obj = makeCubeObj();
      const mesh = parseOBJ(obj);

      expect(mesh.metadata.vertexCount).toBe(8);
      expect(mesh.metadata.triangleCount).toBe(4); // 4 faces → 4 triangles
      expect(mesh.metadata.sourceFormat).toBe('obj');

      // Check vertex positions
      expect(mesh.vertices[0]).toBe(0.0);
      expect(mesh.vertices[3]).toBe(1.0);

      // Check UVs exist
      expect(mesh.uvs).toBeDefined();
      expect(mesh.uvs!.length).toBe(16); // 8 vertices × 2

      // Check normals exist
      expect(mesh.normals).toBeDefined();
      expect(mesh.normals!.length).toBe(3); // 1 normal × 3
    });

    it('parses material references from OBJ', () => {
      const obj = makeCubeObj();
      const mesh = parseOBJ(obj);

      expect(mesh.materials.length).toBe(1);
      expect(mesh.materials[0].name).toBe('cube_material');
    });

    it('parses MTL file and maps materials', () => {
      const mtl = makeMtl();
      const materialMap = parseMTL(mtl);

      expect(materialMap.has('cube_material')).toBe(true);
      const mat = materialMap.get('cube_material')!;
      expect(mat.diffuseTexture).toBe('cube_diffuse.png');
      expect(mat.normalTexture).toBe('cube_normal.png');
    });

    it('computes correct bounds from OBJ mesh', () => {
      const obj = makeCubeObj();
      const mesh = parseOBJ(obj);

      expect(mesh.metadata.bounds.min).toEqual([0, 0, 0]);
      expect(mesh.metadata.bounds.max).toEqual([1, 1, 1]);
    });
  });

  describe('PLY mesh parsing', () => {
    it('parses PLY mesh with vertices and faces', () => {
      const ply = makePlyMesh();
      const mesh = parsePLYMesh(ply);

      expect(mesh.metadata.vertexCount).toBe(4);
      expect(mesh.metadata.triangleCount).toBe(2);
      expect(mesh.metadata.sourceFormat).toBe('ply');
      expect(mesh.vertices[0]).toBe(0.0);
      expect(mesh.triangles[0]).toBe(0);
      expect(mesh.triangles[1]).toBe(1);
      expect(mesh.triangles[2]).toBe(2);
    });
  });

  describe('glTF mesh parsing', () => {
    it('parses glTF mesh with positions, UVs, and materials', () => {
      const gltf = makeSimpleGltf();
      const mesh = parseGlTFMesh(gltf);

      expect(mesh.metadata.vertexCount).toBe(3);
      expect(mesh.metadata.sourceFormat).toBe('gltf');
      expect(mesh.materials.length).toBe(1);
      expect(mesh.materials[0].name).toBe('test_material');
      expect(mesh.metadata.textureResolution).toEqual([1024, 1024]);
    });
  });

  describe('mesh quality validation', () => {
    it('detects watertight mesh', () => {
      // Create a tetrahedron (watertight)
      const mesh: PhotogrammetryMesh = {
        vertices: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]),
        triangles: new Uint32Array([0, 1, 2, 0, 2, 3, 0, 3, 1, 1, 3, 2]),
        materials: [],
        metadata: {
          vertexCount: 4,
          triangleCount: 4,
          textureResolution: null,
          bounds: { min: [0, 0, 0], max: [1, 1, 1] },
          sourceFormat: 'obj',
        },
      };

      expect(checkWatertight(mesh)).toBe(true);
      expect(checkManifold(mesh)).toBe(true);
    });

    it('detects non-manifold mesh', () => {
      const obj = makeNonManifoldObj();
      const mesh = parseOBJ(obj);

      expect(checkManifold(mesh)).toBe(false);
    });

    it('detects non-watertight mesh (open mesh)', () => {
      const obj = makeSimpleObj(); // single triangle, not watertight
      const mesh = parseOBJ(obj);

      expect(checkWatertight(mesh)).toBe(false);
    });

    it('computes UV coverage', () => {
      const obj = makeCubeObj();
      const mesh = parseOBJ(obj);

      const coverage = computeUVCoverage(mesh);
      expect(coverage).toBeGreaterThan(0);
      expect(coverage).toBeLessThanOrEqual(1);
    });

    it('validateMeshQuality returns issues for open mesh', () => {
      const obj = makeSimpleObj();
      const mesh = parseOBJ(obj);

      const quality = validateMeshQuality(mesh);
      expect(quality.isWatertight).toBe(false);
      expect(quality.issues.length).toBeGreaterThan(0);
    });
  });

  describe('LOD generation', () => {
    it('generates LOD chain from photogrammetry mesh', () => {
      const obj = makeCubeObj();
      const mesh = parseOBJ(obj);
      const lods = generatePhotogrammetryLODs(mesh);

      expect(lods).toHaveLength(4);
      expect(lods[0].level).toBe('LOD0');
      expect(lods[3].level).toBe('LOD3');
    });
  });

  describe('quality metrics', () => {
    it('computes point density and coverage', () => {
      const mesh: PhotogrammetryMesh = {
        vertices: new Float32Array(300), // 100 vertices
        triangles: new Uint32Array(0),
        materials: [],
        metadata: {
          vertexCount: 100,
          triangleCount: 0,
          textureResolution: null,
          bounds: { min: [0, 0, 0], max: [10, 10, 10] },
          sourceFormat: 'obj',
        },
      };

      const metrics = computeQualityMetrics(mesh, 10, 200);
      expect(metrics.pointDensity).toBe(10); // 100 vertices / 10 m²
      expect(metrics.coveragePercentage).toBeLessThanOrEqual(100);
    });

    it('computes RMS error from deviations', () => {
      const mesh: PhotogrammetryMesh = {
        vertices: new Float32Array(3),
        triangles: new Uint32Array(0),
        materials: [],
        metadata: {
          vertexCount: 1,
          triangleCount: 0,
          textureResolution: null,
          bounds: { min: [0, 0, 0], max: [0, 0, 0] },
          sourceFormat: 'obj',
        },
      };

      const deviations = [0.003, 0.004, 0.005];
      const metrics = computeQualityMetrics(mesh, 1, 1, deviations);
      // RMS = sqrt((0.003² + 0.004² + 0.005²) / 3)
      const expectedRms = Math.sqrt((0.000009 + 0.000016 + 0.000025) / 3);
      expect(metrics.rmsError).toBeCloseTo(expectedRms, 6);
    });
  });

  describe('ingestPhotogrammetry', () => {
    it('auto-detects and ingests OBJ format', () => {
      const obj = makeCubeObj();
      const result = ingestPhotogrammetry(obj);

      expect(result.mesh.metadata.sourceFormat).toBe('obj');
      expect(result.quality).toBeDefined();
      expect(result.lods).toHaveLength(4);
    });

    it('auto-detects and ingests PLY format', () => {
      const ply = makePlyMesh();
      const result = ingestPhotogrammetry(ply);

      expect(result.mesh.metadata.sourceFormat).toBe('ply');
      expect(result.lods).toHaveLength(4);
    });

    it('ingests glTF format with explicit format parameter', () => {
      const gltf = makeSimpleGltf();
      const result = ingestPhotogrammetry(gltf, 'gltf');

      expect(result.mesh.metadata.sourceFormat).toBe('gltf');
      expect(result.lods).toHaveLength(4);
    });
  });
});
