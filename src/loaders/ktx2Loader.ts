/**
 * KTX2 texture loader per M04-T10.
 *
 * Provides a loader for KTX2 (Khronos Texture Container 2) format
 * textures with transcode targets for Basis Universal supercompression.
 *
 * KTX2 files support:
 *   - ETC1S (Basis LZ) supercompression — universal compatibility
 *   - UASTC supercompression — higher quality
 *   - Zstandard post-compression
 *
 * The loader transcodes to the optimal GPU format based on device
 * capabilities.
 */

export type KTX2Supercompression = 'etc1s' | 'uastc' | 'zstd' | 'none';

export type TranscodeTarget =
  | 'BC7'
  | 'BC1_BC3'
  | 'ETC1S'
  | 'ETC2_RGBA'
  | 'ASTC_4x4'
  | 'RGBA32'
  | 'R8_UNORM';

export interface KTX2Header {
  identifier: Uint8Array; // 12 bytes
  vkFormat: number;
  typeSize: number;
  pixelWidth: number;
  pixelHeight: number;
  pixelDepth: number;
  layerCount: number;
  faceCount: number;
  levelCount: number;
  supercompressionScheme: KTX2Supercompression;
}

export interface KTX2Level {
  level: number;
  offset: number;
  byteLength: number;
  uncompressedByteLength: number;
}

export interface KTX2Texture {
  header: KTX2Header;
  levels: KTX2Level[];
  data: ArrayBuffer;
  transcodeTarget: TranscodeTarget;
  isCompressed: boolean;
  mipmaps: boolean;
}

/**
 * Detects the best transcode target for the current GPU.
 */
export function detectTranscodeTarget(extensions: string[]): TranscodeTarget {
  if (extensions.includes('EXT_texture_compression_bc7')) return 'BC7';
  if (extensions.includes('EXT_texture_compression_bptc')) return 'BC7';
  if (extensions.includes('WEBGL_compressed_texture_s3tc')) return 'BC1_BC3';
  if (extensions.includes('WEBGL_compressed_texture_etc1')) return 'ETC1S';
  if (extensions.includes('WEBGL_compressed_texture_etc')) return 'ETC2_RGBA';
  if (extensions.includes('WEBGL_compressed_texture_astc')) return 'ASTC_4x4';
  return 'RGBA32'; // Fallback to uncompressed
}

/**
 * Parses a KTX2 header from a buffer.
 */
export function parseKTX2Header(buffer: ArrayBuffer): KTX2Header | null {
  if (buffer.byteLength < 80) return null;

  const bytes = new Uint8Array(buffer, 0, 12);
  const expectedIdentifier = new Uint8Array([
    0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a,
  ]);

  // Check KTX2 identifier
  for (let i = 0; i < 12; i++) {
    if (bytes[i] !== expectedIdentifier[i]) return null;
  }

  const view = new DataView(buffer);
  const vkFormat = view.getUint32(12, true);
  const typeSize = view.getUint32(16, true);
  const pixelWidth = view.getUint32(20, true);
  const pixelHeight = view.getUint32(24, true);
  const pixelDepth = view.getUint32(28, true);
  const layerCount = view.getUint32(32, true);
  const faceCount = view.getUint32(36, true);
  const levelCount = view.getUint32(40, true);
  const supercompressionScheme = view.getUint32(44, true);

  const schemes: KTX2Supercompression[] = ['none', 'etc1s', 'uastc', 'zstd'];
  const scheme = schemes[supercompressionScheme] ?? 'none';

  return {
    identifier: bytes,
    vkFormat,
    typeSize,
    pixelWidth,
    pixelHeight,
    pixelDepth,
    layerCount,
    faceCount,
    levelCount,
    supercompressionScheme: scheme,
  };
}

/**
 * Loads a KTX2 texture from a buffer.
 * In a real implementation, this would use the libktx library.
 * Here we provide the parsing and metadata extraction.
 */
export function loadKTX2Texture(
  buffer: ArrayBuffer,
  extensions: string[] = [],
): KTX2Texture | null {
  const header = parseKTX2Header(buffer);
  if (!header) return null;

  // Parse level index (starts at offset 80 + levelCount * 24)
  const levels: KTX2Level[] = [];
  const view = new DataView(buffer);
  const levelIndexOffset = 80;

  for (let i = 0; i < header.levelCount; i++) {
    const offset = levelIndexOffset + i * 24;
    if (offset + 24 > buffer.byteLength) break;

    levels.push({
      level: i,
      offset: Number(view.getBigUint64(offset, true)),
      byteLength: Number(view.getBigUint64(offset + 8, true)),
      uncompressedByteLength: Number(view.getBigUint64(offset + 16, true)),
    });
  }

  const transcodeTarget = detectTranscodeTarget(extensions);

  return {
    header,
    levels,
    data: buffer,
    transcodeTarget,
    isCompressed: header.supercompressionScheme !== 'none',
    mipmaps: header.levelCount > 1,
  };
}

/**
 * Returns the estimated VRAM usage for a KTX2 texture.
 */
export function estimateVRAMUsage(texture: KTX2Texture): number {
  const { pixelWidth, pixelHeight, levelCount } = texture.header;
  let totalBytes = 0;

  for (let i = 0; i < levelCount; i++) {
    const w = Math.max(1, pixelWidth >> i);
    const h = Math.max(1, pixelHeight >> i);
    const blockSize = texture.transcodeTarget === 'ASTC_4x4' ? 16 : 8;
    const blocksX = Math.ceil(w / 4);
    const blocksY = Math.ceil(h / 4);
    totalBytes += blocksX * blocksY * blockSize;
  }

  return totalBytes;
}

/**
 * Returns true if the GPU supports the KTX2 format natively.
 */
export function supportsKTX2(extensions: string[]): boolean {
  return (
    extensions.includes('EXT_texture_compression_bc7') ||
    extensions.includes('EXT_texture_compression_bptc') ||
    extensions.includes('WEBGL_compressed_texture_s3tc') ||
    extensions.includes('WEBGL_compressed_texture_etc1') ||
    extensions.includes('WEBGL_compressed_texture_etc') ||
    extensions.includes('WEBGL_compressed_texture_astc')
  );
}
