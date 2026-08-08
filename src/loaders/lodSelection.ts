import {
  findManifestAsset,
  getManifestLODAssets,
  getManifestBaseAssetId,
  type ManifestAsset,
} from './assetManifest';
import { selectLODLevel } from '@/scene/lodManager';

/**
 * Selects the manifest entry for the LOD level that best matches the given
 * viewing distance and screen size.
 *
 * Accepts either a base asset ID (e.g. `OS-Level3-ChamberI`) or a concrete
 * LOD asset ID (e.g. `OS-Level3-ChamberI-LOD0`). Returns `undefined` when the
 * asset is unknown or no LODs are published.
 */
export function selectManifestLOD(
  assetId: string,
  distance: number,
  screenSize: number,
  pixelError = 1,
): ManifestAsset | undefined {
  const seed = findManifestAsset(assetId) ?? getManifestLODAssets(assetId)[0];
  if (!seed) return undefined;

  const lods = getManifestLODAssets(seed.assetId);
  if (lods.length === 0) return undefined;

  const selection = selectLODLevel(distance, screenSize, pixelError);
  return (
    lods.find((lod) => lod.assetId === `${getManifestBaseAssetId(seed)}-${selection.level}`) ??
    lods[lods.length - 1]
  );
}
