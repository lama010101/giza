/**
 * glTF loader with GIZA extras extraction per M04-T11.
 *
 * Parses glTF files (.glb binary and .gltf JSON) and extracts GIZA-specific
 * metadata from the `extras.giza` field on nodes, meshes, materials, and
 * textures. Validates extracted metadata against existing schemas.
 *
 * The loader works with the JSON structure of glTF 2.0. Binary buffer
 * parsing is handled at the accessor/bufferView level for vertex data.
 */

import {
  validateAssetMetadata,
  validateNodeMetadata,
  type ValidationResult,
} from '@/loaders/validators';

// ─── glTF JSON types ──────────────────────────────────────────────────────────

export interface GLTFNode {
  name?: string;
  mesh?: number;
  children?: number[];
  translation?: [number, number, number];
  rotation?: [number, number, number, number];
  scale?: [number, number, number];
  extras?: {
    giza?: GizaExtras;
    [key: string]: unknown;
  };
}

export interface GLTFMesh {
  name?: string;
  primitives: { attributes: Record<string, number>; indices?: number; material?: number }[];
  extras?: { giza?: GizaExtras };
}

export interface GLTFMaterial {
  name?: string;
  pbrMetallicRoughness?: {
    baseColorFactor?: [number, number, number, number];
    metallicFactor?: number;
    roughnessFactor?: number;
  };
  extras?: { giza?: GizaExtras };
}

export interface GLTFTexture {
  name?: string;
  source?: number;
  sampler?: number;
  extras?: { giza?: GizaExtras };
}

export interface GLTFAccessor {
  bufferView?: number;
  componentType: number;
  count: number;
  type: string;
  byteOffset?: number;
}

export interface GLTFBufferView {
  buffer: number;
  byteOffset?: number;
  byteLength: number;
  target?: number;
}

export interface GLTFBuffer {
  byteLength: number;
  uri?: string;
}

export interface GLTFScene {
  nodes?: number[];
}

export interface GLTFDocument {
  asset?: { version: string; generator?: string };
  scene?: number;
  scenes?: GLTFScene[];
  nodes?: GLTFNode[];
  meshes?: GLTFMesh[];
  materials?: GLTFMaterial[];
  textures?: GLTFTexture[];
  accessors?: GLTFAccessor[];
  bufferViews?: GLTFBufferView[];
  buffers?: GLTFBuffer[];
  extensionsUsed?: string[];
  extensionsRequired?: string[];
}

// ─── GIZA extras ──────────────────────────────────────────────────────────────

export interface GizaExtras {
  evidenceIds?: string[];
  confidence?: number;
  hypothesisTags?: string[];
  interactive?: boolean;
  layer?: string;
  // Asset-level fields
  assetId?: string;
  version?: number;
  monumentId?: string;
  locationId?: string;
  objectId?: string;
  sourceIds?: string[];
  chronologyTags?: string[];
  confidenceBasis?: string;
  coordinateLayer?: string;
  author?: string;
  approvedBy?: string;
  [key: string]: unknown;
}

// ─── Result types ─────────────────────────────────────────────────────────────

export interface GizaNodeMetadata {
  nodeIndex: number;
  name: string;
  giza: GizaExtras | null;
  validation: ValidationResult;
}

export interface GizaMeshMetadata {
  meshIndex: number;
  name: string;
  giza: GizaExtras | null;
  validation: ValidationResult;
}

export interface GizaMaterialMetadata {
  materialIndex: number;
  name: string;
  giza: GizaExtras | null;
}

export interface GizaTextureMetadata {
  textureIndex: number;
  name: string;
  giza: GizaExtras | null;
}

export interface GizaGLTFResult {
  format: 'glb' | 'gltf';
  assetVersion: string;
  generator?: string;
  nodeCount: number;
  meshCount: number;
  materialCount: number;
  textureCount: number;
  nodes: GizaNodeMetadata[];
  meshes: GizaMeshMetadata[];
  materials: GizaMaterialMetadata[];
  textures: GizaTextureMetadata[];
  assetMetadata: GizaExtras | null;
  assetValidation: ValidationResult;
  extensionsUsed: string[];
  hasKTX2Textures: boolean;
  errors: string[];
  warnings: string[];
}

// ─── Loader ───────────────────────────────────────────────────────────────────

/**
 * Parses a glTF JSON document and extracts GIZA metadata.
 *
 * @param json The parsed glTF JSON document.
 * @param format Whether the source was .glb or .gltf.
 */
export function parseGLTF(json: GLTFDocument, format: 'glb' | 'gltf'): GizaGLTFResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Basic structure validation
  if (!json.asset) {
    errors.push('glTF asset field is missing');
  }
  const assetVersion = json.asset?.version ?? '2.0';
  if (!assetVersion.startsWith('2.')) {
    warnings.push(`Unsupported glTF version: ${assetVersion}`);
  }

  // Extract node metadata
  const nodes: GizaNodeMetadata[] = (json.nodes ?? []).map((node, i) => {
    const giza = node.extras?.giza ?? null;
    const validation = giza
      ? validateNodeMetadata(giza as Record<string, unknown>)
      : { passed: true, errors: [], warnings: [] };
    if (!validation.passed) {
      warnings.push(`Node ${i} (${node.name ?? 'unnamed'}): ${validation.errors.join('; ')}`);
    }
    return {
      nodeIndex: i,
      name: node.name ?? `node_${i}`,
      giza,
      validation,
    };
  });

  // Extract mesh metadata
  const meshes: GizaMeshMetadata[] = (json.meshes ?? []).map((mesh, i) => {
    const giza = mesh.extras?.giza ?? null;
    const validation = giza
      ? validateNodeMetadata(giza as Record<string, unknown>)
      : { passed: true, errors: [], warnings: [] };
    return {
      meshIndex: i,
      name: mesh.name ?? `mesh_${i}`,
      giza,
      validation,
    };
  });

  // Extract material metadata
  const materials: GizaMaterialMetadata[] = (json.materials ?? []).map((mat, i) => ({
    materialIndex: i,
    name: mat.name ?? `material_${i}`,
    giza: mat.extras?.giza ?? null,
  }));

  // Extract texture metadata
  const textures: GizaTextureMetadata[] = (json.textures ?? []).map((tex, i) => ({
    textureIndex: i,
    name: tex.name ?? `texture_${i}`,
    giza: tex.extras?.giza ?? null,
  }));

  // Asset-level metadata (from the first node's extras or scene extras)
  const assetMetadata = extractAssetMetadata(json);
  const assetValidation = assetMetadata
    ? validateAssetMetadata(assetMetadata as Record<string, unknown>)
    : { passed: true, errors: [], warnings: [] };
  if (!assetValidation.passed) {
    warnings.push(`Asset metadata: ${assetValidation.errors.join('; ')}`);
  }

  // Check for KTX2 textures
  const extensionsUsed = json.extensionsUsed ?? [];
  const hasKTX2Textures = extensionsUsed.includes('KHR_texture_basisu');

  return {
    format,
    assetVersion,
    generator: json.asset?.generator,
    nodeCount: nodes.length,
    meshCount: meshes.length,
    materialCount: materials.length,
    textureCount: textures.length,
    nodes,
    meshes,
    materials,
    textures,
    assetMetadata,
    assetValidation,
    extensionsUsed,
    hasKTX2Textures,
    errors,
    warnings,
  };
}

/**
 * Extracts asset-level metadata from a glTF document.
 * Looks for `extras.giza` on the first scene or the root node.
 */
function extractAssetMetadata(json: GLTFDocument): GizaExtras | null {
  // Check scene-level extras
  const sceneIndex = json.scene ?? 0;
  const scene = json.scenes?.[sceneIndex];
  if (scene) {
    // Check first node in the scene
    const rootNodeIndex = scene.nodes?.[0];
    if (rootNodeIndex !== undefined) {
      const rootNode = json.nodes?.[rootNodeIndex];
      if (rootNode?.extras?.giza) {
        // Check if it has asset-level fields
        const giza = rootNode.extras.giza;
        if ('assetId' in giza || 'monumentId' in giza) {
          return giza;
        }
      }
    }
  }
  return null;
}

/**
 * Parses a .gltf JSON string.
 */
export function parseGLTFString(jsonString: string): GizaGLTFResult {
  let json: GLTFDocument;
  try {
    json = JSON.parse(jsonString) as GLTFDocument;
  } catch (err) {
    return {
      format: 'gltf',
      assetVersion: '2.0',
      nodeCount: 0,
      meshCount: 0,
      materialCount: 0,
      textureCount: 0,
      nodes: [],
      meshes: [],
      materials: [],
      textures: [],
      assetMetadata: null,
      assetValidation: { passed: false, errors: ['Invalid JSON'], warnings: [] },
      extensionsUsed: [],
      hasKTX2Textures: false,
      errors: [`JSON parse error: ${err instanceof Error ? err.message : String(err)}`],
      warnings: [],
    };
  }
  return parseGLTF(json, 'gltf');
}

/**
 * Parses a .glb binary buffer. The GLB format is:
 *   12-byte header (magic, version, length)
 *   JSON chunk (length, type, data)
 *   Binary chunk (length, type, data)
 *
 * Only the JSON chunk is parsed here; binary chunk data is referenced
 * by bufferViews for runtime loading.
 */
export function parseGLB(buffer: ArrayBuffer): GizaGLTFResult {
  const view = new DataView(buffer);
  // Header
  const magic = view.getUint32(0, true);
  if (magic !== 0x46546c67) {
    return {
      format: 'glb',
      assetVersion: '2.0',
      nodeCount: 0,
      meshCount: 0,
      materialCount: 0,
      textureCount: 0,
      nodes: [],
      meshes: [],
      materials: [],
      textures: [],
      assetMetadata: null,
      assetValidation: { passed: false, errors: ['Invalid GLB magic'], warnings: [] },
      extensionsUsed: [],
      hasKTX2Textures: false,
      errors: ['Invalid GLB magic number'],
      warnings: [],
    };
  }

  const version = view.getUint32(4, true);
  const totalLength = view.getUint32(8, true);

  if (version !== 2) {
    return {
      format: 'glb',
      assetVersion: String(version),
      nodeCount: 0,
      meshCount: 0,
      materialCount: 0,
      textureCount: 0,
      nodes: [],
      meshes: [],
      materials: [],
      textures: [],
      assetMetadata: null,
      assetValidation: {
        passed: false,
        errors: [`Unsupported GLB version: ${version}`],
        warnings: [],
      },
      extensionsUsed: [],
      hasKTX2Textures: false,
      errors: [`Unsupported GLB version: ${version}`],
      warnings: [],
    };
  }

  // JSON chunk
  const chunkLength = view.getUint32(12, true);
  const chunkType = view.getUint32(16, true);
  if (chunkType !== 0x4e4f534a) {
    return {
      format: 'glb',
      assetVersion: '2.0',
      nodeCount: 0,
      meshCount: 0,
      materialCount: 0,
      textureCount: 0,
      nodes: [],
      meshes: [],
      materials: [],
      textures: [],
      assetMetadata: null,
      assetValidation: { passed: false, errors: ['Invalid JSON chunk type'], warnings: [] },
      extensionsUsed: [],
      hasKTX2Textures: false,
      errors: ['Invalid JSON chunk type in GLB'],
      warnings: [],
    };
  }

  const jsonBytes = new Uint8Array(buffer, 20, chunkLength);
  const jsonString = new TextDecoder().decode(jsonBytes);

  void totalLength;
  const result = parseGLTFString(jsonString);
  result.format = 'glb';
  return result;
}
