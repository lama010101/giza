import { describe, it, expect } from 'vitest';
import {
  extractAssetExtras,
  extractNodeExtras,
  validateAssetExtras,
  validateNodeExtras,
  parseGlTFMetadata,
  AssetGizaExtrasSchema,
} from './gltfExtras';

const VALID_ASSET_EXTRAS = {
  asset: {
    generator: 'GIZA Asset Pipeline',
    version: '2.0',
    extras: {
      giza: {
        assetId: 'GP-KingsChamber-Sarcophagus',
        version: 3,
        monumentId: 'MON-GP-001',
        locationId: 'LOC-GP-KC',
        objectId: 'OBJ-0012',
        evidenceIds: ['EV-000143', 'EV-000144'],
        sourceIds: ['SRC-0102', 'SRC-0118'],
        chronologyTags: [{ period: 'Old Kingdom', scope: 'construction' }],
        confidence: 97,
        confidenceBasis: 'Direct measurement, multiple surveys.',
        coordinateLayer: 'Room',
        author: '',
        approvedBy: '',
        approvedDate: '',
      },
    },
  },
};

const VALID_NODE_EXTRAS = {
  name: 'SarcophagusLid',
  extras: {
    giza: {
      evidenceIds: ['EV-000144'],
      confidence: 95,
      interactive: true,
    },
  },
};

describe('glTF extras.giza extraction (M04-T11)', () => {
  describe('extractAssetExtras', () => {
    it('extracts valid asset extras', () => {
      const result = extractAssetExtras(VALID_ASSET_EXTRAS);
      expect(result).not.toBeNull();
      expect(result!.assetId).toBe('GP-KingsChamber-Sarcophagus');
      expect(result!.objectId).toBe('OBJ-0012');
      expect(result!.evidenceIds).toEqual(['EV-000143', 'EV-000144']);
      expect(result!.confidence).toBe(97);
    });

    it('returns null for missing extras', () => {
      expect(extractAssetExtras({ asset: { version: '2.0' } })).toBeNull();
    });

    it('returns null for missing giza block', () => {
      expect(extractAssetExtras({ asset: { extras: {} } })).toBeNull();
    });

    it('returns null for non-object input', () => {
      expect(extractAssetExtras(null)).toBeNull();
      expect(extractAssetExtras('string')).toBeNull();
    });
  });

  describe('extractNodeExtras', () => {
    it('extracts valid node extras', () => {
      const result = extractNodeExtras(VALID_NODE_EXTRAS);
      expect(result).not.toBeNull();
      expect(result!.evidenceIds).toEqual(['EV-000144']);
      expect(result!.confidence).toBe(95);
      expect(result!.interactive).toBe(true);
    });

    it('returns null for missing extras', () => {
      expect(extractNodeExtras({ name: 'test' })).toBeNull();
    });

    it('defaults interactive to false', () => {
      const result = extractNodeExtras({
        extras: { giza: { evidenceIds: ['EV-001'] } },
      });
      expect(result).not.toBeNull();
      expect(result!.interactive).toBe(false);
    });
  });

  describe('validateAssetExtras', () => {
    it('validates a complete asset extras block', () => {
      const result = validateAssetExtras(VALID_ASSET_EXTRAS);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects missing extras.giza block', () => {
      const result = validateAssetExtras({ asset: { extras: {} } });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('rejects empty evidenceIds', () => {
      const invalid = {
        asset: {
          extras: {
            giza: {
              ...VALID_ASSET_EXTRAS.asset.extras.giza,
              evidenceIds: [],
            },
          },
        },
      };
      const result = validateAssetExtras(invalid);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('evidenceIds'))).toBe(true);
    });

    it('rejects missing required fields', () => {
      const result = validateAssetExtras({
        asset: { extras: { giza: { assetId: 'test' } } },
      });
      expect(result.valid).toBe(false);
    });
  });

  describe('validateNodeExtras', () => {
    it('validates a node with valid giza extras', () => {
      const result = validateNodeExtras(VALID_NODE_EXTRAS);
      expect(result.valid).toBe(true);
    });

    it('passes for nodes without extras (optional)', () => {
      const result = validateNodeExtras({ name: 'test' });
      expect(result.valid).toBe(true);
    });

    it('passes for nodes with extras but no giza block (optional)', () => {
      const result = validateNodeExtras({ name: 'test', extras: {} });
      expect(result.valid).toBe(true);
    });
  });

  describe('parseGlTFMetadata', () => {
    it('parses a full glTF with asset and node extras', () => {
      const gltf = {
        asset: VALID_ASSET_EXTRAS.asset,
        nodes: [VALID_NODE_EXTRAS, { name: 'NoExtras' }],
      };
      const result = parseGlTFMetadata(gltf);
      expect(result.asset).not.toBeNull();
      expect(result.asset!.assetId).toBe('GP-KingsChamber-Sarcophagus');
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[0].name).toBe('SarcophagusLid');
      expect(result.nodes[0].giza).not.toBeNull();
      expect(result.nodes[1].name).toBe('NoExtras');
      expect(result.nodes[1].giza).toBeNull();
    });

    it('handles glTF without nodes', () => {
      const result = parseGlTFMetadata({ asset: VALID_ASSET_EXTRAS.asset });
      expect(result.asset).not.toBeNull();
      expect(result.nodes).toEqual([]);
    });

    it('handles null input', () => {
      const result = parseGlTFMetadata(null);
      expect(result.asset).toBeNull();
      expect(result.nodes).toEqual([]);
    });
  });

  describe('AssetGizaExtrasSchema', () => {
    it('parses the canonical spec example', () => {
      const parsed = AssetGizaExtrasSchema.parse(VALID_ASSET_EXTRAS.asset.extras.giza);
      expect(parsed.assetId).toBe('GP-KingsChamber-Sarcophagus');
      expect(parsed.version).toBe(3);
      expect(parsed.chronologyTags).toHaveLength(1);
      expect(parsed.chronologyTags[0].period).toBe('Old Kingdom');
    });
  });
});
