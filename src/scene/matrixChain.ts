/**
 * Full 4×4 transformation matrix chain per M05-T03.
 *
 * Implements the 5-level coordinate hierarchy:
 *   Object → Room → Monument → Plateau → World
 *
 * Each level has its own local transform (translation, rotation, scale).
 * Matrices are chained (multiplied) to produce world-space transforms.
 * The chain supports both local-to-world (forward) and world-to-local
 * (inverse) transformations, plus matrix decomposition.
 *
 * Coordinate conventions follow {@link coordinateSystem.ts}: Y-up,
 * right-handed, meters, north = -Z, east = +X.
 */

import type { Vector3 } from '@/schemas/location';
import { COORDINATE_SYSTEM, MONUMENT_ORIGINS } from './coordinateSystem';

// ─── Matrix type ──────────────────────────────────────────────────────────

/**
 * A 4×4 transformation matrix stored in column-major order.
 * Index layout (row, col):
 *   0  4  8 12
 *   1  5  9 13
 *   2  6 10 14
 *   3  7 11 15
 */
export type Mat4 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

// ─── Hierarchy levels ─────────────────────────────────────────────────────

export const MATRIX_CHAIN_LEVELS = ['object', 'room', 'monument', 'plateau', 'world'] as const;

export type MatrixChainLevel = (typeof MATRIX_CHAIN_LEVELS)[number];

/**
 * Order from leaf (object) to root (world).
 * Index 0 = object (most local), index 4 = world (most global).
 */
export const CHAIN_ORDER_LEAF_TO_ROOT: readonly MatrixChainLevel[] = MATRIX_CHAIN_LEVELS;

/**
 * Order from root (world) to leaf (object).
 */
export const CHAIN_ORDER_ROOT_TO_LEAF: readonly MatrixChainLevel[] = [
  'world',
  'plateau',
  'monument',
  'room',
  'object',
];

// ─── Local transform definition ───────────────────────────────────────────

export interface LocalTransform {
  translation: Vector3;
  /** Euler angles in radians (X, Y, Z order) */
  rotation: Vector3;
  scale: Vector3;
}

export const IDENTITY_LOCAL_TRANSFORM: LocalTransform = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

/**
 * A full chain of local transforms, one per hierarchy level.
 * Missing levels default to the identity transform.
 */
export type TransformChain = Partial<Record<MatrixChainLevel, LocalTransform>>;

// ─── Matrix construction ──────────────────────────────────────────────────

/**
 * Returns the 4×4 identity matrix.
 */
export function identityMatrix(): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

/**
 * Creates a translation matrix.
 */
export function translationMatrix(t: Vector3): Mat4 {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, t.x, t.y, t.z, 1];
}

/**
 * Creates a scale matrix.
 */
export function scaleMatrix(s: Vector3): Mat4 {
  return [s.x, 0, 0, 0, 0, s.y, 0, 0, 0, 0, s.z, 0, 0, 0, 0, 1];
}

/**
 * Creates a rotation matrix from Euler angles (X, Y, Z order, in radians).
 */
export function rotationMatrix(r: Vector3): Mat4 {
  const cx = Math.cos(r.x);
  const sx = Math.sin(r.x);
  const cy = Math.cos(r.y);
  const sy = Math.sin(r.y);
  const cz = Math.cos(r.z);
  const sz = Math.sin(r.z);

  // Rz * Ry * Rx
  return [
    cy * cz,
    cy * sz,
    -sy,
    0,
    sx * sy * cz - cx * sz,
    sx * sy * sz + cx * cz,
    sx * cy,
    0,
    cx * sy * cz + sx * sz,
    cx * sy * sz - sx * cz,
    cx * cy,
    0,
    0,
    0,
    0,
    1,
  ];
}

/**
 * Composes a local transform (TRS: translation * rotation * scale) into a
 * single 4×4 matrix.
 */
export function composeMatrix(local: LocalTransform): Mat4 {
  const t = translationMatrix(local.translation);
  const r = rotationMatrix(local.rotation);
  const s = scaleMatrix(local.scale);
  return multiplyMatrices(multiplyMatrices(t, r), s);
}

// ─── Matrix operations ────────────────────────────────────────────────────

/**
 * Multiplies two 4×4 matrices: result = a × b.
 */
export function multiplyMatrices(a: Mat4, b: Mat4): Mat4 {
  const result = new Array(16).fill(0);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + row] * b[col * 4 + k];
      }
      result[col * 4 + row] = sum;
    }
  }
  return result as unknown as Mat4;
}

/**
 * Transforms a point by a 4×4 matrix (perspective divide applied).
 */
export function transformPoint(m: Mat4, p: Vector3): Vector3 {
  const x = m[0] * p.x + m[4] * p.y + m[8] * p.z + m[12];
  const y = m[1] * p.x + m[5] * p.y + m[9] * p.z + m[13];
  const z = m[2] * p.x + m[6] * p.y + m[10] * p.z + m[14];
  const w = m[3] * p.x + m[7] * p.y + m[11] * p.z + m[15];
  if (w === 0) return { x: 0, y: 0, z: 0 };
  return { x: x / w, y: y / w, z: z / w };
}

/**
 * Transforms a direction vector by a 4×4 matrix (no translation, no
 * perspective divide).
 */
export function transformDirection(m: Mat4, v: Vector3): Vector3 {
  return {
    x: m[0] * v.x + m[4] * v.y + m[8] * v.z,
    y: m[1] * v.x + m[5] * v.y + m[9] * v.z,
    z: m[2] * v.x + m[6] * v.y + m[10] * v.z,
  };
}

// ─── Matrix inversion ─────────────────────────────────────────────────────

/**
 * Computes the determinant of a 4×4 matrix.
 * Uses column-major indexing consistent with gl-matrix conventions.
 */
export function matrixDeterminant(m: Mat4): number {
  // In column-major: a[0..3]=col0, a[4..7]=col1, a[8..11]=col2, a[12..15]=col3
  // aRC notation: a00=a[0]=(r0,c0), a01=a[1]=(r1,c0), a10=a[4]=(r0,c1), etc.
  const a00 = m[0],
    a01 = m[1],
    a02 = m[2],
    a03 = m[3];
  const a10 = m[4],
    a11 = m[5],
    a12 = m[6],
    a13 = m[7];
  const a20 = m[8],
    a21 = m[9],
    a22 = m[10],
    a23 = m[11];
  const a30 = m[12],
    a31 = m[13],
    a32 = m[14],
    a33 = m[15];

  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;

  return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
}

/**
 * Inverts a 4×4 matrix. Returns the identity if the matrix is singular.
 * Uses column-major indexing consistent with gl-matrix conventions.
 */
export function invertMatrix(m: Mat4): Mat4 {
  const a00 = m[0],
    a01 = m[1],
    a02 = m[2],
    a03 = m[3];
  const a10 = m[4],
    a11 = m[5],
    a12 = m[6],
    a13 = m[7];
  const a20 = m[8],
    a21 = m[9],
    a22 = m[10],
    a23 = m[11];
  const a30 = m[12],
    a31 = m[13],
    a32 = m[14],
    a33 = m[15];

  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;

  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (Math.abs(det) < 1e-12) return identityMatrix();
  det = 1 / det;

  return [
    (a11 * b11 - a12 * b10 + a13 * b09) * det,
    (a02 * b10 - a01 * b11 - a03 * b09) * det,
    (a31 * b05 - a32 * b04 + a33 * b03) * det,
    (a22 * b04 - a21 * b05 - a23 * b03) * det,
    (a12 * b08 - a10 * b11 - a13 * b07) * det,
    (a00 * b11 - a02 * b08 + a03 * b07) * det,
    (a32 * b02 - a30 * b05 - a33 * b01) * det,
    (a20 * b05 - a22 * b02 + a23 * b01) * det,
    (a10 * b10 - a11 * b08 + a13 * b06) * det,
    (a01 * b08 - a00 * b10 - a03 * b06) * det,
    (a30 * b04 - a31 * b02 + a33 * b00) * det,
    (a21 * b02 - a20 * b04 - a23 * b00) * det,
    (a11 * b07 - a10 * b09 - a12 * b06) * det,
    (a00 * b09 - a01 * b07 + a02 * b06) * det,
    (a31 * b01 - a30 * b03 - a32 * b00) * det,
    (a20 * b03 - a21 * b01 + a22 * b00) * det,
  ];
}

// ─── Matrix decomposition ─────────────────────────────────────────────────

export interface DecomposedTransform {
  translation: Vector3;
  rotation: Vector3;
  scale: Vector3;
}

/**
 * Decomposes a 4×4 matrix into translation, rotation (Euler XYZ radians),
 * and scale components.
 */
export function decomposeMatrix(m: Mat4): DecomposedTransform {
  const translation: Vector3 = { x: m[12], y: m[13], z: m[14] };

  // Extract scale from column vectors
  const sx = Math.sqrt(m[0] * m[0] + m[1] * m[1] + m[2] * m[2]);
  const sy = Math.sqrt(m[4] * m[4] + m[5] * m[5] + m[6] * m[6]);
  const sz = Math.sqrt(m[8] * m[8] + m[9] * m[9] + m[10] * m[10]);

  // Determine if there's a negative scale (reflection)
  const det = matrixDeterminant(m);
  const sign = det < 0 ? -1 : 1;
  const scale: Vector3 = { x: sx, y: sy, z: sign * sz };

  // Build a pure rotation matrix (normalize columns)
  const invSx = sx !== 0 ? 1 / sx : 0;
  const invSy = sy !== 0 ? 1 / sy : 0;
  const invSz = sz !== 0 ? 1 / sz : 0;

  const r00 = m[0] * invSx;
  const r01 = m[1] * invSx;
  const r02 = m[2] * invSx;
  const r10 = m[4] * invSy;
  const r11 = m[5] * invSy;
  const r12 = m[6] * invSy;
  const r22 = m[10] * invSz;

  // Extract Euler angles (XYZ order) from the rotation matrix
  const rotationY = Math.asin(clamp(-r02, -1, 1));
  let rotationX: number;
  let rotationZ: number;

  if (Math.abs(r02) < 0.9999999) {
    rotationX = Math.atan2(r12, r22);
    rotationZ = Math.atan2(r01, r00);
  } else {
    // Gimbal lock
    rotationX = 0;
    rotationZ = Math.atan2(-r10, r11);
  }

  return {
    translation,
    rotation: { x: rotationX, y: rotationY, z: rotationZ },
    scale,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── Chain computation ────────────────────────────────────────────────────

/**
 * Computes the local-to-world matrix by chaining all transforms from
 * object → room → monument → plateau → world.
 *
 * The chain is applied leaf-first: world = M_world × M_plateau × M_monument
 * × M_room × M_object. A point in object-local space is transformed by
 * multiplying on the left: p_world = chain × p_object.
 */
export function computeLocalToWorldMatrix(chain: TransformChain): Mat4 {
  let result = identityMatrix();
  for (const level of CHAIN_ORDER_ROOT_TO_LEAF) {
    const local = chain[level] ?? IDENTITY_LOCAL_TRANSFORM;
    result = multiplyMatrices(result, composeMatrix(local));
  }
  return result;
}

/**
 * Computes the world-to-local (inverse) matrix by inverting the
 * local-to-world matrix.
 */
export function computeWorldToLocalMatrix(chain: TransformChain): Mat4 {
  return invertMatrix(computeLocalToWorldMatrix(chain));
}

/**
 * Transforms a point from local (object) space to world space.
 */
export function localToWorldPoint(chain: TransformChain, point: Vector3): Vector3 {
  return transformPoint(computeLocalToWorldMatrix(chain), point);
}

/**
 * Transforms a point from world space to local (object) space.
 */
export function worldToLocalPoint(chain: TransformChain, point: Vector3): Vector3 {
  return transformPoint(computeWorldToLocalMatrix(chain), point);
}

/**
 * Returns the matrix for a single hierarchy level (composed from world down
 * to that level, inclusive).
 */
export function computeLevelMatrix(chain: TransformChain, level: MatrixChainLevel): Mat4 {
  let result = identityMatrix();
  for (const l of CHAIN_ORDER_ROOT_TO_LEAF) {
    const local = chain[l] ?? IDENTITY_LOCAL_TRANSFORM;
    result = multiplyMatrices(result, composeMatrix(local));
    if (l === level) break;
  }
  return result;
}

// ─── Coordinate constants ─────────────────────────────────────────────────

/**
 * World-space origin for the plateau level (center of the Giza plateau).
 */
export const PLATEAU_ORIGIN: Vector3 = { ...COORDINATE_SYSTEM.worldOrigin };

/**
 * Default monument-level transform for the Great Pyramid.
 */
export const GREAT_PYRAMID_MONUMENT_TRANSFORM: LocalTransform = {
  translation: { ...MONUMENT_ORIGINS['great-pyramid'] },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

/**
 * Default monument-level transform for the Osiris Shaft (same XY origin,
 * underground).
 */
export const OSIRIS_SHAFT_MONUMENT_TRANSFORM: LocalTransform = {
  translation: { ...MONUMENT_ORIGINS['osiris-shaft'] },
  rotation: { x: 0, y: 0, z: 0 },
  scale: { x: 1, y: 1, z: 1 },
};

// ─── Chain builder ────────────────────────────────────────────────────────

/**
 * Builds a complete transform chain from individual level transforms.
 * Any omitted level defaults to the identity.
 */
export function buildTransformChain(
  levels: Partial<Record<MatrixChainLevel, LocalTransform>>,
): TransformChain {
  return { ...levels };
}

/**
 * Traverses the hierarchy from leaf to root, returning the list of
 * local transforms in order.
 */
export function traverseChainLeafToRoot(chain: TransformChain): LocalTransform[] {
  return CHAIN_ORDER_LEAF_TO_ROOT.map((level) => chain[level] ?? IDENTITY_LOCAL_TRANSFORM);
}

/**
 * Traverses the hierarchy from root to leaf, returning the list of
 * local transforms in order.
 */
export function traverseChainRootToLeaf(chain: TransformChain): LocalTransform[] {
  return CHAIN_ORDER_ROOT_TO_LEAF.map((level) => chain[level] ?? IDENTITY_LOCAL_TRANSFORM);
}
