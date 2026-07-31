import { loadAndValidateSeed } from '@/loaders/seed';
import { version } from '../../package.json';

/**
 * Dataset manifest per GIZA - 08 §1.21 and M03.5-T09.
 *
 * Provides a machine-readable summary of the seed dataset, including
 * counts, ID ranges, source types, confidence distribution, and
 * watermarking with the app version.
 */

export interface DatasetManifest {
  generatedAt: string;
  appVersion: string;
  counts: {
    evidence: number;
    sources: number;
    objects: number;
    locations: number;
  };
  idRanges: {
    evidence: { min: string; max: string };
    sources: { min: string; max: string };
    objects: { min: string; max: string };
    locations: { min: string; max: string };
  };
  evidenceByStatus: Record<string, number>;
  evidenceByCategory: Record<string, number>;
  evidenceByClass: Record<string, number>;
  sourceTypes: Record<string, number>;
  confidenceDistribution: {
    high: number; // 80-100
    medium: number; // 50-79
    low: number; // 0-49
  };
  monuments: string[];
}

export function generateDatasetManifest(): DatasetManifest {
  const seed = loadAndValidateSeed();

  const evidenceIds = seed.evidence.map((e) => e.id).sort();
  const sourceIds = seed.sources.map((s) => s.id).sort();
  const objectIds = seed.objects.map((o) => o.id).sort();
  const locationIds = seed.locations.map((l) => l.id).sort();

  const evidenceByStatus: Record<string, number> = {};
  const evidenceByCategory: Record<string, number> = {};
  const evidenceByClass: Record<string, number> = {};
  const sourceTypes: Record<string, number> = {};

  let high = 0;
  let medium = 0;
  let low = 0;

  for (const ev of seed.evidence) {
    evidenceByStatus[ev.status] = (evidenceByStatus[ev.status] ?? 0) + 1;
    evidenceByCategory[ev.category] = (evidenceByCategory[ev.category] ?? 0) + 1;
    evidenceByClass[ev.primaryClass] = (evidenceByClass[ev.primaryClass] ?? 0) + 1;

    if (ev.confidence >= 80) high++;
    else if (ev.confidence >= 50) medium++;
    else low++;
  }

  for (const src of seed.sources) {
    sourceTypes[src.type] = (sourceTypes[src.type] ?? 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    appVersion: version,
    counts: {
      evidence: seed.evidence.length,
      sources: seed.sources.length,
      objects: seed.objects.length,
      locations: seed.locations.length,
    },
    idRanges: {
      evidence: { min: evidenceIds[0] ?? '', max: evidenceIds[evidenceIds.length - 1] ?? '' },
      sources: { min: sourceIds[0] ?? '', max: sourceIds[sourceIds.length - 1] ?? '' },
      objects: { min: objectIds[0] ?? '', max: objectIds[objectIds.length - 1] ?? '' },
      locations: { min: locationIds[0] ?? '', max: locationIds[locationIds.length - 1] ?? '' },
    },
    evidenceByStatus,
    evidenceByCategory,
    evidenceByClass,
    sourceTypes,
    confidenceDistribution: { high, medium, low },
    monuments: ['osiris', 'great-pyramid', 'giza-plateau-supplementary'],
  };
}

export function exportDatasetManifest(): string {
  return JSON.stringify(generateDatasetManifest(), null, 2);
}
