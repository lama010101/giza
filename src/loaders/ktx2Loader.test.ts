import { describe, it, expect } from 'vitest';
import {
  detectTranscodeTarget,
  parseKTX2Header,
  estimateVRAMUsage,
  supportsKTX2,
  type KTX2Supercompression,
} from './ktx2Loader';

describe('KTX2 Loader (M04-T10)', () => {
  describe('detectTranscodeTarget', () => {
    it('returns BC7 when BC7 extension is available', () => {
      expect(detectTranscodeTarget(['EXT_texture_compression_bc7'])).toBe('BC7');
    });

    it('returns BC1_BC3 when S3TC extension is available', () => {
      expect(detectTranscodeTarget(['WEBGL_compressed_texture_s3tc'])).toBe('BC1_BC3');
    });

    it('returns ETC1S when ETC1 extension is available', () => {
      expect(detectTranscodeTarget(['WEBGL_compressed_texture_etc1'])).toBe('ETC1S');
    });

    it('returns ASTC_4x4 when ASTC extension is available', () => {
      expect(detectTranscodeTarget(['WEBGL_compressed_texture_astc'])).toBe('ASTC_4x4');
    });

    it('returns RGBA32 fallback when no compressed texture extensions', () => {
      expect(detectTranscodeTarget([])).toBe('RGBA32');
    });
  });

  describe('parseKTX2Header', () => {
    it('returns null for invalid buffer', () => {
      expect(parseKTX2Header(new ArrayBuffer(10))).toBeNull();
    });

    it('returns null for wrong identifier', () => {
      const buffer = new ArrayBuffer(80);
      const view = new Uint8Array(buffer);
      view[0] = 0xff; // Wrong identifier
      expect(parseKTX2Header(buffer)).toBeNull();
    });

    it('parses valid KTX2 header', () => {
      const buffer = new ArrayBuffer(80);
      const view = new DataView(buffer);
      const bytes = new Uint8Array(buffer, 0, 12);
      const identifier = new Uint8Array([
        0xab, 0x4b, 0x54, 0x58, 0x20, 0x32, 0x30, 0xbb, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      for (let i = 0; i < 12; i++) bytes[i] = identifier[i];

      view.setUint32(20, 512, true); // pixelWidth
      view.setUint32(24, 512, true); // pixelHeight
      view.setUint32(40, 1, true); // levelCount

      const header = parseKTX2Header(buffer);
      expect(header).not.toBeNull();
      expect(header?.pixelWidth).toBe(512);
      expect(header?.pixelHeight).toBe(512);
      expect(header?.levelCount).toBe(1);
    });
  });

  describe('supportsKTX2', () => {
    it('returns true when any compressed texture extension is available', () => {
      expect(supportsKTX2(['EXT_texture_compression_bc7'])).toBe(true);
      expect(supportsKTX2(['WEBGL_compressed_texture_s3tc'])).toBe(true);
    });

    it('returns false when no compressed texture extensions', () => {
      expect(supportsKTX2([])).toBe(false);
    });
  });

  describe('estimateVRAMUsage', () => {
    it('returns positive value for a texture', () => {
      const texture = {
        header: {
          identifier: new Uint8Array(12),
          vkFormat: 0,
          typeSize: 1,
          pixelWidth: 512,
          pixelHeight: 512,
          pixelDepth: 0,
          layerCount: 1,
          faceCount: 1,
          levelCount: 1,
          supercompressionScheme: 'etc1s' as KTX2Supercompression,
        },
        levels: [],
        data: new ArrayBuffer(0),
        transcodeTarget: 'BC7' as const,
        isCompressed: true,
        mipmaps: false,
      };

      const vram = estimateVRAMUsage(texture);
      expect(vram).toBeGreaterThan(0);
    });
  });
});
