import { describe, it, expect } from 'vitest';
import { selectManifestLOD } from './lodSelection';

describe('selectManifestLOD', () => {
  it('returns LOD0 for a close object when given an LOD0 asset ID', () => {
    const result = selectManifestLOD('OS-Level3-ChamberI-LOD0', 0.5, 1080);
    expect(result).toBeDefined();
    expect(result?.assetId).toBe('OS-Level3-ChamberI-LOD0');
    expect(result?.lod).toBe('LOD0');
  });

  it('returns LOD0 for a close object when given a base asset ID', () => {
    const result = selectManifestLOD('OS-Level3-ChamberI', 0.5, 1080);
    expect(result?.assetId).toBe('OS-Level3-ChamberI-LOD0');
  });

  it('selects a lower LOD for a distant object', () => {
    const result = selectManifestLOD('OS-Level3-ChamberI-LOD0', 10000, 1080);
    expect(result?.assetId).toBe('OS-Level3-ChamberI-LOD3');
  });

  it('falls back to the last available LOD if the ideal level is missing', () => {
    const result = selectManifestLOD('OS-Level3-NorthernConduit-LOD0', 10000, 1080);
    expect(result?.assetId).toBe('OS-Level3-NorthernConduit-LOD1');
  });

  it('returns undefined for an unknown asset', () => {
    expect(selectManifestLOD('UNKNOWN-LOD0', 1, 1080)).toBeUndefined();
  });
});
