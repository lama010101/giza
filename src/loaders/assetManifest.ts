/**
 * Asset manifest loader per M06B-T01 through M06B-T07.
 *
 * Provides programmatic access to the asset manifest (assets/asset-manifest.json),
 * allowing the application to query available assets, their status, and file
 * paths. This is the bridge between the asset production pipeline and the
 * runtime asset loading system.
 */

import assetManifestData from '../../assets/asset-manifest.json';

// ─── Types ───────────────────────────────────────────────────────────────────

export type AssetCategory =
  | 'rubble'
  | 'bedrock'
  | 'granite'
  | 'stairs'
  | 'materials'
  | 'export'
  | 'objects';
export type AssetStatus = 'pending' | 'in_production' | 'published' | 'failed';

export interface ManifestAsset {
  assetId: string;
  baseAssetId?: string;
  lod?: string;
  name: string;
  format: string;
  status: AssetStatus;
  filePath: string;
}

export interface ManifestCategory {
  taskId: string;
  assets: ManifestAsset[];
}

export interface AssetManifest {
  version: string;
  generatedAt: string;
  description: string;
  categories: Record<AssetCategory, ManifestCategory>;
}

// ─── Manifest access ─────────────────────────────────────────────────────────

const manifest = assetManifestData as AssetManifest;

/**
 * Returns the full asset manifest.
 */
export function getAssetManifest(): AssetManifest {
  return manifest;
}

/**
 * Returns all assets in a given category.
 */
export function getAssetsByCategory(category: AssetCategory): ManifestAsset[] {
  return manifest.categories[category]?.assets ?? [];
}

/**
 * Returns all assets across all categories.
 */
export function getAllManifestAssets(): ManifestAsset[] {
  return Object.values(manifest.categories).flatMap((cat) => cat.assets);
}

/**
 * Finds an asset by its ID across all categories.
 */
export function findManifestAsset(assetId: string): ManifestAsset | undefined {
  return getAllManifestAssets().find((a) => a.assetId === assetId);
}

function baseAssetId(assetId: string): string {
  return assetId.replace(/-LOD\d+$/, '') || assetId;
}

/**
 * Returns the base asset ID for a manifest entry, preferring the explicit
 * `baseAssetId` field when present.
 */
export function getManifestBaseAssetId(asset: ManifestAsset): string {
  return asset.baseAssetId ?? baseAssetId(asset.assetId);
}

/**
 * Returns all manifest entries that belong to the same base asset (all LODs).
 */
export function getManifestLODAssets(baseId: string): ManifestAsset[] {
  return getAllManifestAssets()
    .filter((a) => getManifestBaseAssetId(a) === baseAssetId(baseId))
    .sort((a, b) => a.assetId.localeCompare(b.assetId));
}

/**
 * Returns all assets with a given status.
 */
export function getAssetsByStatus(status: AssetStatus): ManifestAsset[] {
  return getAllManifestAssets().filter((a) => a.status === status);
}

/**
 * Returns manifest statistics.
 */
export function getManifestStats(): {
  total: number;
  pending: number;
  inProduction: number;
  published: number;
  failed: number;
  byCategory: Record<string, number>;
} {
  const all = getAllManifestAssets();
  const byCategory: Record<string, number> = {};
  for (const [cat, data] of Object.entries(manifest.categories)) {
    byCategory[cat] = data.assets.length;
  }
  return {
    total: all.length,
    pending: all.filter((a) => a.status === 'pending').length,
    inProduction: all.filter((a) => a.status === 'in_production').length,
    published: all.filter((a) => a.status === 'published').length,
    failed: all.filter((a) => a.status === 'failed').length,
    byCategory,
  };
}

/**
 * Returns the task IDs covered by the manifest.
 */
export function getManifestTaskIds(): string[] {
  return Object.values(manifest.categories).map((cat) => cat.taskId);
}
