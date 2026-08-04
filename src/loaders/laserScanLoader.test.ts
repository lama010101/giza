import { describe, it, expect } from 'vitest';
import {
  parsePLY,
  parseLAS,
  parseE57,
  parseLasHeader,
  parseE57Header,
  detectScanFormat,
  downsamplePointCloud,
  validatePointCount,
  loadLaserScan,
  recommendAssetClass,
  getPointCountLimit,
  type PointCloudResult,
  type QualityProfile,
} from './laserScanLoader';

// ─── PLY helpers ──────────────────────────────────────────────────────────

function makeAsciiPly(): string {
  return [
    'ply',
    'format ascii 1.0',
    'comment scanner: Faro Focus S350',
    'comment date: 2025-03-15',
    'element vertex 3',
    'property float x',
    'property float y',
    'property float z',
    'property float nx',
    'property float ny',
    'property float nz',
    'property uchar red',
    'property uchar green',
    'property uchar blue',
    'end_header',
    '0.0 0.0 0.0 0 1 0 255 0 0',
    '1.0 0.0 0.0 0 1 0 0 255 0',
    '0.0 1.0 0.0 0 1 0 0 0 255',
  ].join('\n');
}

function makeBinaryPly(): ArrayBuffer {
  const headerLines = [
    'ply',
    'format binary_little_endian 1.0',
    'element vertex 2',
    'property float x',
    'property float y',
    'property float z',
    'property uchar red',
    'property uchar green',
    'property uchar blue',
    'end_header\n',
  ];
  const headerText = headerLines.join('\n');
  const headerBytes = new TextEncoder().encode(headerText);
  // 2 vertices × (3 floats + 3 uchars) = 2 × 15 = 30 bytes
  const dataBytes = new ArrayBuffer(30);
  const view = new DataView(dataBytes);
  // Vertex 0: (0, 0, 0) color (255, 0, 0)
  view.setFloat32(0, 0.0, true);
  view.setFloat32(4, 0.0, true);
  view.setFloat32(8, 0.0, true);
  view.setUint8(12, 255);
  view.setUint8(13, 0);
  view.setUint8(14, 0);
  // Vertex 1: (1, 2, 3) color (0, 128, 255)
  view.setFloat32(15, 1.0, true);
  view.setFloat32(19, 2.0, true);
  view.setFloat32(23, 3.0, true);
  view.setUint8(27, 0);
  view.setUint8(28, 128);
  view.setUint8(29, 255);

  const buffer = new ArrayBuffer(headerBytes.length + dataBytes.byteLength);
  new Uint8Array(buffer).set(headerBytes, 0);
  new Uint8Array(buffer, headerBytes.length, dataBytes.byteLength).set(new Uint8Array(dataBytes));
  return buffer;
}

// ─── LAS helpers ──────────────────────────────────────────────────────────

function makeLasBuffer(pointCount: number): ArrayBuffer {
  // LAS 1.2 header is 227 bytes, point data record format 0 is 20 bytes
  const headerSize = 227;
  const pointRecordLength = 20;
  const totalSize = headerSize + pointCount * pointRecordLength;
  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // File signature "LASF"
  view.setUint8(0, 0x4c); // L
  view.setUint8(1, 0x41); // A
  view.setUint8(2, 0x53); // S
  view.setUint8(3, 0x46); // F

  // Version 1.2
  view.setUint16(24, 1, true); // major
  view.setUint16(26, 2, true); // minor

  // Point data offset
  view.setUint32(96, headerSize, true);

  // Point data format 0, record length 20
  view.setUint8(104, 0);
  view.setUint16(105, pointRecordLength, true);

  // Point count
  view.setUint32(107, pointCount, true);

  // Scale and offset
  view.setFloat64(131, 0.001, true); // scaleX
  view.setFloat64(139, 0.001, true); // scaleY
  view.setFloat64(147, 0.001, true); // scaleZ
  view.setFloat64(155, 100.0, true); // offsetX
  view.setFloat64(163, 200.0, true); // offsetY
  view.setFloat64(171, 50.0, true); // offsetZ

  // Write point records
  for (let i = 0; i < pointCount; i++) {
    const offset = headerSize + i * pointRecordLength;
    // Raw coordinates (will be scaled): x=1000*i, y=2000*i, z=3000*i
    view.setInt32(offset, 1000 * i, true);
    view.setInt32(offset + 4, 2000 * i, true);
    view.setInt32(offset + 8, 3000 * i, true);
    view.setUint16(offset + 12, 100 + i, true); // intensity
    view.setUint8(offset + 15, i % 4); // classification
  }

  return buffer;
}

// ─── E57 helpers ──────────────────────────────────────────────────────────

function makeE57Buffer(pointCount: number): ArrayBuffer {
  const xml = [
    '<?xml version="1.0"?>',
    '<e57Root>',
    '  <data3D>',
    '    <vectorChild>',
    `      <pointCount>${pointCount}</pointCount>`,
    '      <sensor model="Leica BLK360"/>',
    '      <cartesianBounds>',
    '        <date>2025-06-01</date>',
    '      </cartesianBounds>',
    '    </vectorChild>',
    '  </data3D>',
    '</e57Root>',
  ].join('\n');

  const xmlBytes = new TextEncoder().encode(xml);
  const headerSize = 48;
  const xmlOffset = headerSize;
  const binaryOffset = xmlOffset + xmlBytes.length;
  const binarySize = pointCount * 12; // 3 × float32 per point
  const totalSize = binaryOffset + binarySize;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);

  // File signature "ASTM-E57"
  const sig = 'ASTM-E57';
  for (let i = 0; i < 8; i++) {
    view.setUint8(i, sig.charCodeAt(i));
  }

  view.setUint32(8, 1, true); // major version
  view.setUint32(12, 0, true); // minor version
  view.setUint32(16, totalSize, true); // file physical length
  // xmlPhysicalOffset (64-bit)
  view.setBigUint64(24, BigInt(xmlOffset), true);
  // xmlLogicalLength (64-bit)
  view.setBigUint64(32, BigInt(xmlBytes.length), true);
  view.setUint32(40, 1024, true); // page size

  // Write XML
  new Uint8Array(buffer, xmlOffset, xmlBytes.length).set(xmlBytes);

  // Write binary point data
  const binView = new DataView(buffer, binaryOffset);
  for (let i = 0; i < pointCount; i++) {
    binView.setFloat32(i * 12, i * 1.0, true);
    binView.setFloat32(i * 12 + 4, i * 2.0, true);
    binView.setFloat32(i * 12 + 8, i * 3.0, true);
  }

  return buffer;
}

// ─── Tests ────────────────────────────────────────────────────────────────

describe('Laser Scan Loader (M06.5-T02)', () => {
  describe('PLY parsing', () => {
    it('parses ASCII PLY with positions, normals, and colors', () => {
      const ply = makeAsciiPly();
      const result = parsePLY(ply);

      expect(result.metadata.pointCount).toBe(3);
      expect(result.points.length).toBe(9);
      expect(result.points[0]).toBe(0.0);
      expect(result.points[3]).toBe(1.0);

      // Normals
      expect(result.normals).toBeDefined();
      expect(result.normals!.length).toBe(9);
      expect(result.normals![1]).toBe(1.0); // ny of first point

      // Colors (normalised 0-1)
      expect(result.colors).toBeDefined();
      expect(result.colors![0]).toBeCloseTo(1.0); // red=255 → 1.0
      expect(result.colors![4]).toBeCloseTo(1.0); // green=255 → 1.0
    });

    it('extracts scanner model and date from PLY comments', () => {
      const ply = makeAsciiPly();
      const result = parsePLY(ply);

      expect(result.metadata.scannerModel).toBe('Faro Focus S350');
      expect(result.metadata.scanDate).toBe('2025-03-15');
    });

    it('parses binary PLY format', () => {
      const buffer = makeBinaryPly();
      const result = parsePLY(buffer);

      expect(result.metadata.pointCount).toBe(2);
      expect(result.points[0]).toBe(0.0);
      expect(result.points[3]).toBe(1.0);
      expect(result.points[4]).toBe(2.0);
      expect(result.points[5]).toBe(3.0);

      // Colors
      expect(result.colors).toBeDefined();
      expect(result.colors![0]).toBeCloseTo(1.0); // red=255
      expect(result.colors![5]).toBeCloseTo(1.0); // blue=255
    });

    it('computes correct bounds from point data', () => {
      const ply = makeAsciiPly();
      const result = parsePLY(ply);

      expect(result.metadata.bounds.min).toEqual([0, 0, 0]);
      expect(result.metadata.bounds.max).toEqual([1, 1, 0]);
    });
  });

  describe('LAS parsing', () => {
    it('parses LAS header correctly', () => {
      const buffer = makeLasBuffer(5);
      const header = parseLasHeader(buffer);

      expect(header).not.toBeNull();
      expect(header?.fileSignature).toBe('LASF');
      expect(header?.versionMajor).toBe(1);
      expect(header?.versionMinor).toBe(2);
      expect(header?.pointCount).toBe(5);
      expect(header?.pointDataFormat).toBe(0);
    });

    it('parses LAS point records with scale and offset', () => {
      const buffer = makeLasBuffer(3);
      const result = parseLAS(buffer);

      expect(result.metadata.pointCount).toBe(3);
      // Point 0: raw=0, scale=0.001, offset=100 → 0*0.001+100 = 100
      expect(result.points[0]).toBe(100);
      expect(result.points[1]).toBe(200);
      expect(result.points[2]).toBe(50);
      // Point 1: raw=1000, scale=0.001, offset=100 → 1000*0.001+100 = 101
      expect(result.points[3]).toBe(101);
      expect(result.points[4]).toBe(202);
      expect(result.points[5]).toBe(53);
    });

    it('returns null for invalid LAS header', () => {
      const buffer = new ArrayBuffer(100);
      expect(parseLasHeader(buffer)).toBeNull();
    });
  });

  describe('E57 parsing', () => {
    it('parses E57 header correctly', () => {
      const buffer = makeE57Buffer(3);
      const header = parseE57Header(buffer);

      expect(header).not.toBeNull();
      expect(header?.fileSignature).toBe('ASTM-E57');
      expect(header?.majorVersion).toBe(1);
    });

    it('parses E57 point cloud with metadata from XML', () => {
      const buffer = makeE57Buffer(4);
      const result = parseE57(buffer);

      expect(result.metadata.pointCount).toBe(4);
      expect(result.metadata.scannerModel).toBe('Leica BLK360');
      expect(result.metadata.scanDate).toBe('2025-06-01');

      // Point 0: (0, 0, 0)
      expect(result.points[0]).toBe(0.0);
      // Point 1: (1, 2, 3)
      expect(result.points[3]).toBe(1.0);
      expect(result.points[4]).toBe(2.0);
      expect(result.points[5]).toBe(3.0);
    });
  });

  describe('downsampling', () => {
    it('reduces point count to target', () => {
      const points = new Float32Array(3000); // 1000 points
      for (let i = 0; i < 1000; i++) {
        points[i * 3] = i;
        points[i * 3 + 1] = i * 2;
        points[i * 3 + 2] = i * 3;
      }

      const cloud: PointCloudResult = {
        points,
        metadata: {
          scanDate: '2025-01-01',
          scannerModel: 'Test',
          pointCount: 1000,
          bounds: { min: [0, 0, 0], max: [999, 1998, 2997] },
        },
      };

      const downsampled = downsamplePointCloud(cloud, 100);
      expect(downsampled.metadata.pointCount).toBeLessThanOrEqual(100);
      expect(downsampled.metadata.pointCount).toBeGreaterThan(0);
      expect(downsampled.points.length).toBe(downsampled.metadata.pointCount * 3);
    });

    it('returns original when already under target', () => {
      const points = new Float32Array(9);
      const cloud: PointCloudResult = {
        points,
        metadata: {
          scanDate: '',
          scannerModel: 'Test',
          pointCount: 3,
          bounds: { min: [0, 0, 0], max: [0, 0, 0] },
        },
      };

      const result = downsamplePointCloud(cloud, 100);
      expect(result.metadata.pointCount).toBe(3);
    });
  });

  describe('validation', () => {
    it('validates point count against quality profile', () => {
      expect(validatePointCount(1000, 'draft').passed).toBe(true);
      expect(validatePointCount(600_000, 'draft').passed).toBe(false);
      expect(validatePointCount(600_000, 'standard').passed).toBe(true);
    });

    it('returns correct point count limits per profile', () => {
      expect(getPointCountLimit('draft')).toBe(500_000);
      expect(getPointCountLimit('standard')).toBe(5_000_000);
      expect(getPointCountLimit('archive')).toBe(50_000_000);
    });
  });

  describe('format detection', () => {
    it('detects PLY format', () => {
      const ply = new TextEncoder().encode('ply\nformat ascii 1.0');
      expect(detectScanFormat(ply.buffer)).toBe('ply');
    });

    it('detects LAS format', () => {
      const buffer = makeLasBuffer(1);
      expect(detectScanFormat(buffer)).toBe('las');
    });

    it('detects E57 format', () => {
      const buffer = makeE57Buffer(1);
      expect(detectScanFormat(buffer)).toBe('e57');
    });

    it('returns null for unknown format', () => {
      const buffer = new ArrayBuffer(20);
      expect(detectScanFormat(buffer)).toBeNull();
    });
  });

  describe('loadLaserScan', () => {
    it('auto-detects and parses PLY format', () => {
      const ply = makeAsciiPly();
      const buffer = new TextEncoder().encode(ply).buffer;
      const result = loadLaserScan(buffer, 'standard');

      expect(result.metadata.pointCount).toBe(3);
      expect(result.points[0]).toBe(0.0);
    });

    it('downsamples when exceeding quality profile limit', () => {
      const profile: QualityProfile = 'draft';
      const limit = getPointCountLimit(profile);
      // Create a PLY with more points than the draft limit
      const lines = [
        'ply',
        'format ascii 1.0',
        `element vertex ${limit + 100}`,
        'property float x',
        'property float y',
        'property float z',
        'end_header',
      ];
      for (let i = 0; i < limit + 100; i++) {
        lines.push(`${i}.0 0.0 0.0`);
      }
      const ply = lines.join('\n');
      const buffer = new TextEncoder().encode(ply).buffer;
      const result = loadLaserScan(buffer, profile);

      expect(result.metadata.pointCount).toBeLessThanOrEqual(limit);
    });
  });

  describe('recommendAssetClass', () => {
    it('recommends Hero for very large point counts', () => {
      expect(recommendAssetClass(2_000_000)).toBe('Hero');
    });

    it('recommends Standard for medium point counts', () => {
      expect(recommendAssetClass(200_000)).toBe('Standard');
    });

    it('recommends Distant for small point counts', () => {
      expect(recommendAssetClass(100)).toBe('Distant');
    });
  });
});
