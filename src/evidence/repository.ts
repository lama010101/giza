import { evidenceStore, type CreateEvidenceInput, type UpdateEvidenceInput } from './EvidenceStore';
import { computeObjectConfidence } from './confidence';
import type { Evidence } from '@/schemas/evidence';
import type { Location } from '@/schemas/location';
import type { SceneObject } from '@/schemas/object';
import type { Source } from '@/schemas/source';

export type { CreateEvidenceInput, UpdateEvidenceInput };
export { evidenceStore } from './EvidenceStore';

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

export function createEvidence(input: CreateEvidenceInput): Evidence {
  return evidenceStore.create(input);
}

export function updateEvidence(id: string, updates: UpdateEvidenceInput): Evidence | undefined {
  return evidenceStore.update(id, updates);
}

export function deleteEvidence(id: string): Evidence | undefined {
  return evidenceStore.softDelete(id);
}

export function getEvidenceById(id: string): Evidence | undefined {
  return evidenceStore.getById(id);
}

export function getSourceById(id: string): Source | undefined {
  return evidenceStore.getSourceById(id);
}

export function getObjectById(id: string): SceneObject | undefined {
  return evidenceStore.getObjectById(id);
}

export function getLocationById(id: string): Location | undefined {
  return evidenceStore.getLocationById(id);
}

export function getEvidenceByObject(objectId: string): Evidence[] {
  return evidenceStore.getByObject(objectId);
}

export function getEvidenceByLocation(locationId: string): Evidence[] {
  return evidenceStore.getByLocation(locationId);
}

export function getEvidenceBySource(sourceId: string): Evidence[] {
  return evidenceStore.getBySource(sourceId);
}

export function getEvidenceByClass(evidenceClass: Evidence['primaryClass']): Evidence[] {
  return evidenceStore.getByClass(evidenceClass);
}

export function getEvidenceByFilters(filters: SearchFilters): Evidence[] {
  const all = evidenceStore.getAll();
  return all.filter((ev) => {
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
  const base = filters ? getEvidenceByFilters(filters) : evidenceStore.getAll();
  const normalized = query.toLowerCase();
  return base.filter(
    (ev) =>
      ev.title.toLowerCase().includes(normalized) ||
      ev.description.toLowerCase().includes(normalized) ||
      ev.tags.some((tag) => tag.toLowerCase().includes(normalized)),
  );
}

export function getUpstreamEvidence(id: string): Evidence[] {
  return evidenceStore.getUpstream(id);
}

export function getDownstreamEvidence(id: string): Evidence[] {
  return evidenceStore.getDownstream(id);
}

export function getConflictingEvidence(id: string): Evidence[] {
  return evidenceStore.getConflicts(id);
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
  return evidenceStore.getAll();
}

export function getAllSources(): Source[] {
  return evidenceStore.getSources();
}

export function getAllObjects(): SceneObject[] {
  return evidenceStore.getObjects();
}

export function getAllLocations(): Location[] {
  return evidenceStore.getLocations();
}
