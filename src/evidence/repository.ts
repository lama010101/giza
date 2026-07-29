import { loadAndValidateSeed } from '@/loaders/seed';
import { computeObjectConfidence } from './confidence';
import type { Evidence } from '@/schemas/evidence';
import type { Location } from '@/schemas/location';
import type { SceneObject } from '@/schemas/object';
import type { Source } from '@/schemas/source';

const seed = loadAndValidateSeed();

export interface EvidencePanelData {
  evidence: Evidence;
  sources: Source[];
  objects: SceneObject[];
  locations: Location[];
  upstream: Evidence[];
  downstream: Evidence[];
  conflicts: Evidence[];
}

export interface SearchFilters {
  status?: Evidence['status'];
  primaryClass?: Evidence['primaryClass'];
  category?: Evidence['category'];
  objectId?: string;
  locationId?: string;
  sourceId?: string;
}

export function getEvidenceById(id: string): Evidence | undefined {
  return seed.evidence.find((e) => e.id === id);
}

export function getSourceById(id: string): Source | undefined {
  return seed.sources.find((s) => s.id === id);
}

export function getObjectById(id: string): SceneObject | undefined {
  return seed.objects.find((o) => o.id === id);
}

export function getLocationById(id: string): Location | undefined {
  return seed.locations.find((l) => l.id === id);
}

export function getEvidenceByObject(objectId: string): Evidence[] {
  return seed.evidence.filter((e) => e.objectIds.includes(objectId));
}

export function getEvidenceByLocation(locationId: string): Evidence[] {
  return seed.evidence.filter((e) => e.locationId === locationId);
}

export function getEvidenceBySource(sourceId: string): Evidence[] {
  return seed.evidence.filter((e) => e.sourceIds.includes(sourceId));
}

export function getEvidenceByClass(evidenceClass: Evidence['primaryClass']): Evidence[] {
  return seed.evidence.filter(
    (e) => e.primaryClass === evidenceClass || e.secondaryClasses.includes(evidenceClass),
  );
}

export function getEvidenceByFilters(filters: SearchFilters): Evidence[] {
  return seed.evidence.filter((ev) => {
    if (filters.status && ev.status !== filters.status) return false;
    if (
      filters.primaryClass &&
      ev.primaryClass !== filters.primaryClass &&
      !ev.secondaryClasses.includes(filters.primaryClass)
    )
      return false;
    if (filters.category && ev.category !== filters.category) return false;
    if (filters.objectId && !ev.objectIds.includes(filters.objectId)) return false;
    if (filters.locationId && ev.locationId !== filters.locationId) return false;
    if (filters.sourceId && !ev.sourceIds.includes(filters.sourceId)) return false;
    return true;
  });
}

export function searchEvidence(query: string, filters?: SearchFilters): Evidence[] {
  const normalized = query.toLowerCase();
  const base = filters ? getEvidenceByFilters(filters) : seed.evidence;
  return base.filter(
    (ev) =>
      ev.title.toLowerCase().includes(normalized) ||
      ev.description.toLowerCase().includes(normalized) ||
      ev.tags.some((tag) => tag.toLowerCase().includes(normalized)),
  );
}

export function getUpstreamEvidence(id: string): Evidence[] {
  const ev = getEvidenceById(id);
  if (!ev) return [];
  return ev.dependencyIds.map((depId) => getEvidenceById(depId)).filter(Boolean) as Evidence[];
}

export function getDownstreamEvidence(id: string): Evidence[] {
  return seed.evidence.filter((ev) => ev.dependencyIds.includes(id));
}

export function getConflictingEvidence(id: string): Evidence[] {
  const ev = getEvidenceById(id);
  if (!ev) return [];
  return ev.conflictIds
    .map((conflictId) => getEvidenceById(conflictId))
    .filter(Boolean) as Evidence[];
}

export function getEvidencePanelData(id: string): EvidencePanelData | undefined {
  const evidence = getEvidenceById(id);
  if (!evidence) return undefined;

  return {
    evidence,
    sources: evidence.sourceIds.map((sid) => getSourceById(sid)).filter(Boolean) as Source[],
    objects: evidence.objectIds.map((oid) => getObjectById(oid)).filter(Boolean) as SceneObject[],
    locations: evidence.locationId
      ? ([getLocationById(evidence.locationId)].filter(Boolean) as Location[])
      : [],
    upstream: getUpstreamEvidence(id),
    downstream: getDownstreamEvidence(id),
    conflicts: getConflictingEvidence(id),
  };
}

export function getObjectConfidence(objectId: string): number {
  const object = getObjectById(objectId);
  if (!object) return 0;

  const evidence = getEvidenceByObject(objectId);
  return computeObjectConfidence(evidence, getSourceById);
}

export function getAllEvidence(): Evidence[] {
  return seed.evidence;
}

export function getAllSources(): Source[] {
  return seed.sources;
}

export function getAllObjects(): SceneObject[] {
  return seed.objects;
}

export function getAllLocations(): Location[] {
  return seed.locations;
}
