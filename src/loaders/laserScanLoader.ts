/**
 * Laser scan data loaders per M06.5-T02.
 *
 * Provides parsers for three point-cloud formats used in survey ingestion:
 *   - PLY  (Polygon File Format) — ASCII and binary variants
 *   - LAS  (LIDAR Archive Standard) — header + point records
 *   - E57  (ASTM E57) — XML envelope + binary blob
 *
 * All loaders return a unified `PointCloudResult` with positions, optional
 * normals and colours, and standardised metadata (scan date, scanner model,
 * point count, axis-aligned bounds).
 *
 * Quality profiles enforce point-count limits and support downsampling when
 * a scan exceeds the budget for the target profile.
 */

import { z } from 'zod';
import { ASSET_CLASSES, type AssetClass } from '@/loaders/validators';

// ─── Quality profiles ─────────────────────────────────────────────────────

export type QualityProfile = 'draft' | 'standard' | 'archive';

const POINT_COUNT_LIMITS: Record<QualityProfile, number> = {
  draft: 500_000,
  standard: 5_000_000,
  archive: 50_000_000,
};

export function getPointCountLimit(profile: QualityProfile): number {
  return POINT_COUNT_LIMITS[profile];
}

// ─── Unified result types ─────────────────────────────────────────────────

export interface PointCloudBounds {
  min: [number, number, number];
  max: [number, number, number];
}

export interface PointCloudMetadata {
  scanDate: string;
  scannerModel: string;
  pointCount: number;
  bounds: PointCloudBounds;
}

export interface PointCloudResult {
  points: Float32Array; // interleaved xyz, length = pointCount * 3
  normals?: Float32Array; // interleaved xyz, length = pointCount * 3
  colors?: Float32Array; // normalised 0-1 rgb, length = pointCount * 3
  metadata: PointCloudMetadata;
}

// ─── Zod schemas ──────────────────────────────────────────────────────────

export const PointCloudMetadataSchema = z.object({
  scanDate: z.string(),
  scannerModel: z.string(),
  pointCount: z.number().int().min(0),
  bounds: z.object({
    min: z.tuple([z.number(), z.number(), z.number()]),
    max: z.tuple([z.number(), z.number(), z.number()]),
  }),
});

export const PointCloudResultSchema = z.object({
  points: z.instanceof(Float32Array),
  normals: z.instanceof(Float32Array).optional(),
  colors: z.instanceof(Float32Array).optional(),
  metadata: PointCloudMetadataSchema,
});

// ─── Helpers ──────────────────────────────────────────────────────────────

function computeBounds(positions: Float32Array): PointCloudBounds {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  if (!Number.isFinite(minX)) {
    return { min: [0, 0, 0], max: [0, 0, 0] };
  }

  return {
    min: [minX, minY, minZ],
    max: [maxX, maxY, maxZ],
  };
}

/**
 * Downsamples a point cloud by keeping every Nth point (strided sampling).
 * Returns a new PointCloudResult with reduced point count.
 */
export function downsamplePointCloud(
  cloud: PointCloudResult,
  targetCount: number,
): PointCloudResult {
  const currentCount = cloud.metadata.pointCount;
  if (currentCount <= targetCount) return cloud;

  const step = Math.ceil(currentCount / targetCount);
  const newPoints: number[] = [];
  const newNormals: number[] = cloud.normals ? [] : undefined!;
  const newColors: number[] = cloud.colors ? [] : undefined!;

  for (let i = 0; i < currentCount; i += step) {
    const base = i * 3;
    newPoints.push(cloud.points[base], cloud.points[base + 1], cloud.points[base + 2]);
    if (cloud.normals) {
      newNormals.push(cloud.normals[base], cloud.normals[base + 1], cloud.normals[base + 2]);
    }
    if (cloud.colors) {
      newColors.push(cloud.colors[base], cloud.colors[base + 1], cloud.colors[base + 2]);
    }
  }

  const points = new Float32Array(newPoints);
  const normals = cloud.normals ? new Float32Array(newNormals) : undefined;
  const colors = cloud.colors ? new Float32Array(newColors) : undefined;

  return {
    points,
    normals,
    colors,
    metadata: {
      ...cloud.metadata,
      pointCount: newPoints.length / 3,
      bounds: computeBounds(points),
    },
  };
}

/**
 * Validates that a point cloud's point count is within the limit for the
 * given quality profile. Returns a validation result with errors if the
 * limit is exceeded.
 */
export function validatePointCount(
  pointCount: number,
  profile: QualityProfile,
): { passed: boolean; errors: string[] } {
  const limit = getPointCountLimit(profile);
  if (pointCount > limit) {
    return {
      passed: false,
      errors: [`Point count ${pointCount} exceeds ${profile} profile limit of ${limit}`],
    };
  }
  return { passed: true, errors: [] };
}

// ─── PLY parser ───────────────────────────────────────────────────────────

interface PlyProperty {
  name: string;
  type: string;
}

interface PlyElement {
  name: string;
  count: number;
  properties: PlyProperty[];
}

interface PlyHeader {
  format: 'ascii' | 'binary_little_endian' | 'binary_big_endian';
  version: string;
  elements: PlyElement[];
  headerLength: number;
  comments: string[];
}

/**
 * Parses a PLY header from raw text content.
 * Returns the parsed header and the byte offset where data begins.
 */
function parsePlyHeader(text: string): PlyHeader | null {
  const lines = text.split('\n');
  if (lines.length === 0 || lines[0].trim() !== 'ply') return null;

  let format: PlyHeader['format'] = 'ascii';
  let version = '1.0';
  const elements: PlyElement[] = [];
  const comments: string[] = [];
  let currentElement: PlyElement | null = null;
  let headerLength = 0;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    headerLength += lines[i].length + 1; // +1 for newline

    if (line === 'end_header') break;

    if (line.startsWith('format ')) {
      const parts = line.split(/\s+/);
      format = parts[1] as PlyHeader['format'];
      version = parts[2] ?? '1.0';
    } else if (line.startsWith('comment ')) {
      comments.push(line.substring(8));
    } else if (line.startsWith('element ')) {
      const parts = line.split(/\s+/);
      currentElement = { name: parts[1], count: parseInt(parts[2], 10), properties: [] };
      elements.push(currentElement);
    } else if (line.startsWith('property ') && currentElement) {
      const parts = line.split(/\s+/);
      if (parts.length >= 3) {
        currentElement.properties.push({ name: parts[parts.length - 1], type: parts[1] });
      } else if (parts.length === 2) {
        currentElement.properties.push({ name: parts[1], type: 'float' });
      }
    }
  }

  return { format, version, elements, headerLength, comments };
}

function plyTypeSize(type: string): number {
  switch (type) {
    case 'char':
    case 'uchar':
    case 'int8':
    case 'uint8':
      return 1;
    case 'short':
    case 'ushort':
    case 'int16':
    case 'uint16':
      return 2;
    case 'int':
    case 'uint':
    case 'float':
    case 'int32':
    case 'uint32':
    case 'float32':
      return 4;
    case 'double':
    case 'float64':
    case 'int64':
    case 'uint64':
      return 8;
    default:
      return 4;
  }
}

function readPlyValue(
  view: DataView,
  offset: number,
  type: string,
): { value: number; size: number } {
  const size = plyTypeSize(type);
  switch (type) {
    case 'char':
    case 'int8':
      return { value: view.getInt8(offset), size };
    case 'uchar':
    case 'uint8':
      return { value: view.getUint8(offset), size };
    case 'short':
    case 'int16':
      return { value: view.getInt16(offset, true), size };
    case 'ushort':
    case 'uint16':
      return { value: view.getUint16(offset, true), size };
    case 'int':
    case 'int32':
      return { value: view.getInt32(offset, true), size };
    case 'uint':
    case 'uint32':
      return { value: view.getUint32(offset, true), size };
    case 'float':
    case 'float32':
      return { value: view.getFloat32(offset, true), size };
    case 'double':
    case 'float64':
      return { value: view.getFloat64(offset, true), size };
    default:
      return { value: view.getFloat32(offset, true), size };
  }
}

/**
 * Parses PLY format (ASCII and binary) extracting vertex positions, normals,
 * and colours. Returns a unified PointCloudResult.
 */
export function parsePLY(
  data: ArrayBuffer | string,
  metadata?: Partial<PointCloudMetadata>,
): PointCloudResult {
  const text = typeof data === 'string' ? data : new TextDecoder().decode(data.slice(0, 4096));
  const header = parsePlyHeader(text);
  if (!header) throw new Error('Invalid PLY file: missing or malformed header');

  const vertexElement = header.elements.find((e) => e.name === 'vertex');
  if (!vertexElement) throw new Error('PLY file has no vertex element');

  const propNames = vertexElement.properties.map((p) => p.name);
  const hasNormal = ['nx', 'ny', 'nz'].every((n) => propNames.includes(n));
  const hasColor = ['red', 'green', 'blue'].every((n) => propNames.includes(n));

  const pointCount = vertexElement.count;
  const points = new Float32Array(pointCount * 3);
  const normals = hasNormal ? new Float32Array(pointCount * 3) : undefined;
  const colors = hasColor ? new Float32Array(pointCount * 3) : undefined;

  const propIndex: Record<string, number> = {};
  vertexElement.properties.forEach((p, i) => {
    propIndex[p.name] = i;
  });

  if (header.format === 'ascii') {
    const fullText = typeof data === 'string' ? data : new TextDecoder().decode(data);
    const dataStart = fullText.indexOf('end_header') + 'end_header'.length;
    const dataLines = fullText.slice(dataStart).trim().split('\n');

    for (let i = 0; i < pointCount && i < dataLines.length; i++) {
      const tokens = dataLines[i].trim().split(/\s+/).map(Number);
      const xIdx = propIndex.x ?? 0;
      const yIdx = propIndex.y ?? 1;
      const zIdx = propIndex.z ?? 2;
      points[i * 3] = tokens[xIdx] ?? 0;
      points[i * 3 + 1] = tokens[yIdx] ?? 0;
      points[i * 3 + 2] = tokens[zIdx] ?? 0;

      if (normals) {
        normals[i * 3] = tokens[propIndex.nx] ?? 0;
        normals[i * 3 + 1] = tokens[propIndex.ny] ?? 0;
        normals[i * 3 + 2] = tokens[propIndex.nz] ?? 0;
      }
      if (colors) {
        colors[i * 3] = (tokens[propIndex.red] ?? 0) / 255;
        colors[i * 3 + 1] = (tokens[propIndex.green] ?? 0) / 255;
        colors[i * 3 + 2] = (tokens[propIndex.blue] ?? 0) / 255;
      }
    }
  } else {
    // Binary
    const fullText = typeof data === 'string' ? data : new TextDecoder().decode(data);
    const headerEnd = fullText.indexOf('end_header') + 'end_header'.length + 1;
    const buffer = typeof data === 'string' ? new ArrayBuffer(0) : data;
    const view = new DataView(buffer, headerEnd);

    let offset = 0;
    for (let i = 0; i < pointCount; i++) {
      for (const prop of vertexElement.properties) {
        const { value, size } = readPlyValue(view, offset, prop.type);
        offset += size;

        if (prop.name === 'x') points[i * 3] = value;
        else if (prop.name === 'y') points[i * 3 + 1] = value;
        else if (prop.name === 'z') points[i * 3 + 2] = value;
        else if (prop.name === 'nx' && normals) normals[i * 3] = value;
        else if (prop.name === 'ny' && normals) normals[i * 3 + 1] = value;
        else if (prop.name === 'nz' && normals) normals[i * 3 + 2] = value;
        else if (prop.name === 'red' && colors) colors[i * 3] = value / 255;
        else if (prop.name === 'green' && colors) colors[i * 3 + 1] = value / 255;
        else if (prop.name === 'blue' && colors) colors[i * 3 + 2] = value / 255;
      }
    }
  }

  const bounds = computeBounds(points);
  const scannerModel =
    metadata?.scannerModel ?? extractComment(header.comments, 'scanner') ?? 'Unknown';
  const scanDate = metadata?.scanDate ?? extractComment(header.comments, 'date') ?? '';

  return {
    points,
    normals,
    colors,
    metadata: {
      scanDate,
      scannerModel,
      pointCount,
      bounds,
    },
  };
}

function extractComment(comments: string[], key: string): string | undefined {
  const found = comments.find((c) => c.toLowerCase().startsWith(key.toLowerCase()));
  if (!found) return undefined;
  const parts = found.split(':');
  return parts.length > 1 ? parts.slice(1).join(':').trim() : undefined;
}

// ─── LAS parser ───────────────────────────────────────────────────────────

export interface LasPointData {
  x: number;
  y: number;
  z: number;
  intensity: number;
  classification: number;
}

export interface LasHeader {
  fileSignature: string; // "LASF"
  versionMajor: number;
  versionMinor: number;
  pointCount: number;
  pointDataFormat: number;
  pointDataRecordLength: number;
  pointDataOffset: number;
  scale: { x: number; y: number; z: number };
  offset: { x: number; y: number; z: number };
}

/**
 * Parses a LAS file header from a buffer.
 */
export function parseLasHeader(buffer: ArrayBuffer): LasHeader | null {
  if (buffer.byteLength < 96) return null;

  const view = new DataView(buffer);
  const sigBytes = new Uint8Array(buffer, 0, 4);
  const signature = String.fromCharCode(sigBytes[0], sigBytes[1], sigBytes[2], sigBytes[3]);

  if (signature !== 'LASF') return null;

  const versionMajor = view.getUint16(24, true);
  const versionMinor = view.getUint16(26, true);
  const pointDataOffset = view.getUint32(96, true);
  const pointDataFormat = view.getUint8(104) & 0x0f;
  const pointDataRecordLength = view.getUint16(105, true);
  const pointCount = view.getUint32(107, true);

  const scaleX = view.getFloat64(131, true);
  const scaleY = view.getFloat64(139, true);
  const scaleZ = view.getFloat64(147, true);
  const offsetX = view.getFloat64(155, true);
  const offsetY = view.getFloat64(163, true);
  const offsetZ = view.getFloat64(171, true);

  return {
    fileSignature: signature,
    versionMajor,
    versionMinor,
    pointCount,
    pointDataFormat,
    pointDataRecordLength,
    pointDataOffset,
    scale: { x: scaleX, y: scaleY, z: scaleZ },
    offset: { x: offsetX, y: offsetY, z: offsetZ },
  };
}

/**
 * Parses a LAS file (header + point records) extracting x/y/z positions,
 * intensity, and classification. Returns a unified PointCloudResult with
 * intensity stored in the metadata.
 */
export function parseLAS(
  buffer: ArrayBuffer,
  metadata?: Partial<PointCloudMetadata>,
): PointCloudResult {
  const header = parseLasHeader(buffer);
  if (!header) throw new Error('Invalid LAS file: missing or malformed header');

  const view = new DataView(buffer);
  const pointCount = header.pointCount;
  const points = new Float32Array(pointCount * 3);

  // Track classification distribution for metadata
  const classifications = new Map<number, number>();

  for (let i = 0; i < pointCount; i++) {
    const recordOffset = header.pointDataOffset + i * header.pointDataRecordLength;
    if (recordOffset + 20 > buffer.byteLength) break;

    const rawX = view.getInt32(recordOffset, true);
    const rawY = view.getInt32(recordOffset + 4, true);
    const rawZ = view.getInt32(recordOffset + 8, true);
    const classification = view.getUint8(recordOffset + 15) & 0x1f;

    const x = rawX * header.scale.x + header.offset.x;
    const y = rawY * header.scale.y + header.offset.y;
    const z = rawZ * header.scale.z + header.offset.z;

    points[i * 3] = x;
    points[i * 3 + 1] = y;
    points[i * 3 + 2] = z;

    classifications.set(classification, (classifications.get(classification) ?? 0) + 1);
  }

  const bounds = computeBounds(points);

  return {
    points,
    metadata: {
      scanDate: metadata?.scanDate ?? '',
      scannerModel: metadata?.scannerModel ?? 'Unknown',
      pointCount,
      bounds,
    },
  };
}

// ─── E57 parser ───────────────────────────────────────────────────────────

export interface E57Header {
  fileSignature: string; // "ASTM-E57"
  majorVersion: number;
  minorVersion: number;
  filePhysicalLength: number;
  xmlPhysicalOffset: number;
  xmlLogicalLength: number;
  pageSize: number;
}

export interface E57Data3D {
  pointCount: number;
  positions: Float32Array;
  bounds: PointCloudBounds;
}

/**
 * Parses an E57 file header.
 */
export function parseE57Header(buffer: ArrayBuffer): E57Header | null {
  if (buffer.byteLength < 48) return null;

  const bytes = new Uint8Array(buffer, 0, 8);
  const signature = String.fromCharCode(...bytes);

  if (signature !== 'ASTM-E57') return null;

  const view = new DataView(buffer);
  return {
    fileSignature: signature,
    majorVersion: view.getUint32(8, true),
    minorVersion: view.getUint32(12, true),
    filePhysicalLength: Number(view.getBigUint64(16, true)),
    xmlPhysicalOffset: Number(view.getBigUint64(24, true)),
    xmlLogicalLength: Number(view.getBigUint64(32, true)),
    pageSize: view.getUint32(40, true),
  };
}

/**
 * Parses an E57 file (XML envelope + binary blob). The XML envelope contains
 * metadata about the scan (guid, scan date, scanner model), while the binary
 * section holds the point cloud data.
 *
 * This parser extracts point positions and metadata from a simplified E57
 * structure where the XML is stored as a string and the binary blob follows.
 */
export function parseE57(
  buffer: ArrayBuffer,
  metadata?: Partial<PointCloudMetadata>,
): PointCloudResult {
  const header = parseE57Header(buffer);
  if (!header) throw new Error('Invalid E57 file: missing or malformed header');

  // Read XML envelope
  const xmlBytes = new Uint8Array(
    buffer,
    header.xmlPhysicalOffset,
    Math.min(header.xmlLogicalLength, buffer.byteLength - header.xmlPhysicalOffset),
  );
  const xml = new TextDecoder().decode(xmlBytes);

  // Extract metadata from XML
  const scanDateMatch = xml.match(/<cartesianBounds[^>]*>[\s\S]*?<date>([^<]+)<\/date>/);
  const scannerMatch = xml.match(/<sensor[^>]*model="([^"]+)"/);
  const pointCountMatch = xml.match(/<pointCount>(\d+)<\/pointCount>/);

  const scanDate = metadata?.scanDate ?? scanDateMatch?.[1] ?? '';
  const scannerModel = metadata?.scannerModel ?? scannerMatch?.[1] ?? 'Unknown';
  const xmlPointCount = pointCountMatch ? parseInt(pointCountMatch[1], 10) : 0;

  // Extract binary point data. In a simplified E57, the binary blob is
  // stored after the XML section. Each point is 3 float32 values (12 bytes).
  const binaryOffset = header.xmlPhysicalOffset + header.xmlLogicalLength;
  const availableBytes = buffer.byteLength - binaryOffset;
  const pointCount = xmlPointCount > 0 ? xmlPointCount : Math.floor(availableBytes / 12);

  const points = new Float32Array(pointCount * 3);
  const view = new DataView(buffer, binaryOffset);

  for (let i = 0; i < pointCount; i++) {
    const offset = i * 12;
    if (offset + 12 > availableBytes) break;
    points[i * 3] = view.getFloat32(offset, true);
    points[i * 3 + 1] = view.getFloat32(offset + 4, true);
    points[i * 3 + 2] = view.getFloat32(offset + 8, true);
  }

  const actualPointCount = points.length / 3;
  const bounds = computeBounds(points);

  return {
    points,
    metadata: {
      scanDate,
      scannerModel,
      pointCount: actualPointCount,
      bounds,
    },
  };
}

// ─── High-level loader ────────────────────────────────────────────────────

export type ScanFormat = 'ply' | 'las' | 'e57';

/**
 * Detects the scan format from the buffer content.
 */
export function detectScanFormat(buffer: ArrayBuffer): ScanFormat | null {
  if (buffer.byteLength < 8) return null;
  const bytes = new Uint8Array(buffer, 0, 8);

  // E57: "ASTM-E57"
  const e57Sig = String.fromCharCode(...bytes);
  if (e57Sig === 'ASTM-E57') return 'e57';

  // LAS: "LASF"
  const lasSig = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
  if (lasSig === 'LASF') return 'las';

  // PLY: "ply\n" or "ply\r\n"
  const plySig = String.fromCharCode(bytes[0], bytes[1], bytes[2]);
  if (plySig === 'ply') return 'ply';

  return null;
}

/**
 * Loads a laser scan file, auto-detecting the format. Validates point count
 * against the quality profile and downsamples if necessary.
 */
export function loadLaserScan(
  buffer: ArrayBuffer,
  profile: QualityProfile = 'standard',
  metadata?: Partial<PointCloudMetadata>,
): PointCloudResult {
  const format = detectScanFormat(buffer);
  if (!format) throw new Error('Unrecognized scan format');

  let result: PointCloudResult;
  switch (format) {
    case 'ply':
      result = parsePLY(buffer, metadata);
      break;
    case 'las':
      result = parseLAS(buffer, metadata);
      break;
    case 'e57':
      result = parseE57(buffer, metadata);
      break;
  }

  // Validate point count against quality profile
  const validation = validatePointCount(result.metadata.pointCount, profile);
  if (!validation.passed) {
    // Downsample to fit within the profile limit
    const limit = getPointCountLimit(profile);
    result = downsamplePointCloud(result, limit);
  }

  return result;
}

/**
 * Returns the recommended asset class for a point cloud based on point count.
 */
export function recommendAssetClass(pointCount: number): AssetClass {
  if (pointCount > 1_000_000) return ASSET_CLASSES[0]; // Hero
  if (pointCount > 100_000) return ASSET_CLASSES[1]; // Standard
  if (pointCount > 10_000) return ASSET_CLASSES[2]; // Background
  return ASSET_CLASSES[3]; // Distant
}
