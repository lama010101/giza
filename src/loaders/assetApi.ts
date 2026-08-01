/**
 * Asset API endpoints (client-side) per M06A-T12.
 *
 * Provides a unified API for querying, listing, and retrieving published
 * assets. In production, these would map to REST API endpoints; in the
 * current client-only architecture, they query the in-memory asset
 * registry and the publishing pipeline history.
 */

import { getPublishingHistory, type PipelineResult } from '@/loaders/publishingPipeline';
import { validateAsset, type AssetInput } from '@/loaders/publishingPipeline';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AssetRecord {
  assetId: string;
  version: number;
  monumentId: string;
  locationId?: string;
  objectId?: string;
  status: 'published' | 'pending' | 'failed';
  publishedAt?: string;
  fileSize?: number;
  format: 'glTF' | 'GLB' | 'OBJ' | 'PLY';
  lodLevels?: number;
  evidenceIds: string[];
  confidence: number;
  author: string;
  approvedBy?: string;
}

export interface AssetListResponse {
  assets: AssetRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AssetQuery {
  monumentId?: string;
  objectId?: string;
  status?: AssetRecord['status'];
  format?: AssetRecord['format'];
  minConfidence?: number;
  page?: number;
  pageSize?: number;
}

export interface AssetDetailResponse {
  asset: AssetRecord;
  pipelineResult?: PipelineResult;
  downloadUrl?: string;
  metadata: Record<string, unknown>;
}

// ─── In-memory asset store ───────────────────────────────────────────────────

const assetStore = new Map<string, AssetRecord>();

// ─── API functions ───────────────────────────────────────────────────────────

/**
 * Lists published assets with optional filtering and pagination.
 * GET /api/assets
 */
export function listAssets(query: AssetQuery = {}): AssetListResponse {
  const {
    monumentId,
    objectId,
    status,
    format,
    minConfidence = 0,
    page = 1,
    pageSize = 20,
  } = query;

  let assets = Array.from(assetStore.values());

  // Also include assets from publishing history
  const history = getPublishingHistory();
  for (const h of history) {
    if (!assetStore.has(h.assetId)) {
      assetStore.set(h.assetId, pipelineResultToRecord(h));
    }
  }
  assets = Array.from(assetStore.values());

  // Apply filters
  if (monumentId) assets = assets.filter((a) => a.monumentId === monumentId);
  if (objectId) assets = assets.filter((a) => a.objectId === objectId);
  if (status) assets = assets.filter((a) => a.status === status);
  if (format) assets = assets.filter((a) => a.format === format);
  assets = assets.filter((a) => a.confidence >= minConfidence);

  // Sort by publishedAt descending
  assets.sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''));

  // Paginate
  const total = assets.length;
  const start = (page - 1) * pageSize;
  const paged = assets.slice(start, start + pageSize);

  return { assets: paged, total, page, pageSize };
}

/**
 * Gets a single asset by ID.
 * GET /api/assets/:assetId
 */
export function getAsset(assetId: string): AssetDetailResponse | null {
  const asset = assetStore.get(assetId);
  if (!asset) return null;

  const history = getPublishingHistory();
  const pipelineResult = history.find((h) => h.assetId === assetId);

  return {
    asset,
    pipelineResult,
    downloadUrl: `/assets/export/${asset.format.toLowerCase()}/${asset.assetId}.${asset.format.toLowerCase()}`,
    metadata: {
      ...asset,
      ...((pipelineResult?.optimization as Record<string, unknown> | undefined) ?? {}),
    },
  };
}

/**
 * Validates an asset before publishing.
 * POST /api/assets/validate
 */
export function validateAssetEndpoint(asset: AssetInput): {
  valid: boolean;
  errors: string[];
} {
  const result = validateAsset(asset);
  return {
    valid: result.status === 'completed',
    errors: result.errors,
  };
}

/**
 * Registers a published asset in the store.
 * POST /api/assets
 */
export function registerAsset(record: AssetRecord): AssetRecord {
  assetStore.set(record.assetId, record);
  return record;
}

/**
 * Deletes an asset from the store.
 * DELETE /api/assets/:assetId
 */
export function deleteAsset(assetId: string): boolean {
  return assetStore.delete(assetId);
}

/**
 * Gets assets for a specific monument.
 * GET /api/monuments/:monumentId/assets
 */
export function getMonumentAssets(monumentId: string): AssetRecord[] {
  return listAssets({ monumentId, pageSize: 1000 }).assets;
}

/**
 * Gets assets for a specific object.
 * GET /api/objects/:objectId/assets
 */
export function getObjectAssets(objectId: string): AssetRecord[] {
  return listAssets({ objectId, pageSize: 1000 }).assets;
}

/**
 * Gets asset statistics.
 * GET /api/assets/stats
 */
export function getAssetStats(): {
  total: number;
  published: number;
  pending: number;
  failed: number;
  byFormat: Record<string, number>;
  byMonument: Record<string, number>;
  averageConfidence: number;
} {
  const assets = Array.from(assetStore.values());
  const byFormat: Record<string, number> = {};
  const byMonument: Record<string, number> = {};
  let confidenceSum = 0;

  for (const a of assets) {
    byFormat[a.format] = (byFormat[a.format] ?? 0) + 1;
    byMonument[a.monumentId] = (byMonument[a.monumentId] ?? 0) + 1;
    confidenceSum += a.confidence;
  }

  return {
    total: assets.length,
    published: assets.filter((a) => a.status === 'published').length,
    pending: assets.filter((a) => a.status === 'pending').length,
    failed: assets.filter((a) => a.status === 'failed').length,
    byFormat,
    byMonument,
    averageConfidence: assets.length > 0 ? confidenceSum / assets.length : 0,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pipelineResultToRecord(result: PipelineResult): AssetRecord {
  const publish = result.publish as { fileSize?: number } | undefined;
  const manifest = result.manifest as { lodCount?: number } | undefined;
  return {
    assetId: result.assetId,
    version: 1,
    monumentId: 'unknown',
    status: result.success ? 'published' : 'failed',
    publishedAt: result.completedAt,
    fileSize: publish?.fileSize,
    format: 'GLB',
    lodLevels: manifest?.lodCount,
    evidenceIds: [],
    confidence: 80,
    author: 'GIZA Pipeline',
  };
}

// ─── Clear store (for testing) ───────────────────────────────────────────────

export function clearAssetStore(): void {
  assetStore.clear();
}
