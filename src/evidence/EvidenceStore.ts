import { EvidenceSchema, type Evidence, type GeometryRef } from '@/schemas/evidence';
import type { Source } from '@/schemas/source';
import type { Location } from '@/schemas/location';
import type { SceneObject } from '@/schemas/object';
import { loadAndValidateSeed } from '@/loaders/seed';

export interface CreateEvidenceInput {
  title: string;
  description?: string;
  category: Evidence['category'];
  primaryClass?: Evidence['primaryClass'];
  secondaryClasses?: Evidence['secondaryClasses'];
  confidence: number;
  confidenceBasis?: string;
  measurementQuality?: number;
  consensus?: number;
  directObservation?: number;
  sourceIds?: string[];
  locationId?: string;
  objectIds?: string[];
  geometryRefs?: GeometryRef[];
  dependencyIds?: string[];
  conflictIds?: string[];
  tags?: string[];
  createdBy?: string;
}

export interface UpdateEvidenceInput {
  title?: string;
  description?: string;
  category?: Evidence['category'];
  primaryClass?: Evidence['primaryClass'];
  secondaryClasses?: Evidence['secondaryClasses'];
  confidence?: number;
  confidenceBasis?: string;
  measurementQuality?: number;
  consensus?: number;
  directObservation?: number;
  status?: Evidence['status'];
  sourceIds?: string[];
  locationId?: string;
  objectIds?: string[];
  geometryRefs?: GeometryRef[];
  dependencyIds?: string[];
  conflictIds?: string[];
  tags?: string[];
  reviewLog?: Evidence['reviewLog'];
  updatedBy?: string;
}

function generateEvidenceId(existing: Evidence[]): string {
  let max = 0;
  for (const ev of existing) {
    const match = ev.id.match(/^EV-(\d{6})$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  }
  return `EV-${String(max + 1).padStart(6, '0')}`;
}

function timestamp(): string {
  return new Date().toISOString();
}

export class EvidenceStore {
  private evidence: Evidence[];
  private sources: Source[];
  private locations: Location[];
  private objects: SceneObject[];

  constructor() {
    const seed = loadAndValidateSeed();
    this.evidence = seed.evidence;
    this.sources = seed.sources;
    this.locations = seed.locations;
    this.objects = seed.objects;
  }

  create(input: CreateEvidenceInput): Evidence {
    const id = generateEvidenceId(this.evidence);
    const now = timestamp();

    const raw: Record<string, unknown> = {
      id,
      title: input.title,
      description: input.description ?? '',
      category: input.category,
      primaryClass: input.primaryClass ?? 'E2',
      secondaryClasses: input.secondaryClasses ?? [],
      confidence: input.confidence,
      confidenceBasis: input.confidenceBasis ?? '',
      measurementQuality: input.measurementQuality,
      consensus: input.consensus,
      directObservation: input.directObservation,
      status: 'Draft',
      sourceIds: input.sourceIds ?? [],
      locationId: input.locationId,
      objectIds: input.objectIds ?? [],
      geometryRefs: input.geometryRefs ?? [],
      mediaIds: [],
      dependencyIds: input.dependencyIds ?? [],
      conflictIds: input.conflictIds ?? [],
      chronologyTags: [],
      tags: input.tags ?? [],
      reviewLog: [],
      version: 1,
      created: now,
      updated: now,
      createdBy: input.createdBy ?? '',
      updatedBy: '',
    };

    const parsed = EvidenceSchema.parse(raw);
    this.evidence.push(parsed);
    return parsed;
  }

  update(id: string, updates: UpdateEvidenceInput): Evidence | undefined {
    const index = this.evidence.findIndex((e) => e.id === id);
    if (index === -1) return undefined;

    const current = this.evidence[index];
    if (current.status === 'Retracted') {
      throw new Error(`Cannot update retracted evidence ${id}`);
    }

    const merged: Record<string, unknown> = {
      ...current,
      ...updates,
      version: current.version + 1,
      updated: timestamp(),
      updatedBy: updates.updatedBy ?? '',
    };

    const parsed = EvidenceSchema.parse(merged);
    this.evidence[index] = parsed;
    return parsed;
  }

  softDelete(id: string): Evidence | undefined {
    return this.update(id, { status: 'Retracted' });
  }

  getById(id: string): Evidence | undefined {
    return this.evidence.find((e) => e.id === id);
  }

  getAll(): Evidence[] {
    return [...this.evidence];
  }

  getActive(): Evidence[] {
    return this.evidence.filter((e) => e.status !== 'Retracted' && e.status !== 'Superseded');
  }

  getByObject(objectId: string): Evidence[] {
    return this.evidence.filter((e) => e.objectIds.includes(objectId));
  }

  getByLocation(locationId: string): Evidence[] {
    return this.evidence.filter((e) => e.locationId === locationId);
  }

  getBySource(sourceId: string): Evidence[] {
    return this.evidence.filter((e) => e.sourceIds.includes(sourceId));
  }

  getByClass(evidenceClass: Evidence['primaryClass']): Evidence[] {
    return this.evidence.filter(
      (e) => e.primaryClass === evidenceClass || e.secondaryClasses.includes(evidenceClass),
    );
  }

  getUpstream(id: string): Evidence[] {
    const ev = this.getById(id);
    if (!ev) return [];
    return ev.dependencyIds.map((depId) => this.getById(depId)).filter(Boolean) as Evidence[];
  }

  getDownstream(id: string): Evidence[] {
    return this.evidence.filter((ev) => ev.dependencyIds.includes(id));
  }

  getConflicts(id: string): Evidence[] {
    const ev = this.getById(id);
    if (!ev) return [];
    return ev.conflictIds
      .map((conflictId) => this.getById(conflictId))
      .filter(Boolean) as Evidence[];
  }

  search(query: string): Evidence[] {
    const normalized = query.toLowerCase();
    return this.evidence.filter(
      (ev) =>
        ev.title.toLowerCase().includes(normalized) ||
        ev.description.toLowerCase().includes(normalized) ||
        ev.tags.some((tag) => tag.toLowerCase().includes(normalized)),
    );
  }

  getSources(): Source[] {
    return [...this.sources];
  }

  getSourceById(id: string): Source | undefined {
    return this.sources.find((s) => s.id === id);
  }

  getObjects(): SceneObject[] {
    return [...this.objects];
  }

  getObjectById(id: string): SceneObject | undefined {
    return this.objects.find((o) => o.id === id);
  }

  getLocations(): Location[] {
    return [...this.locations];
  }

  getLocationById(id: string): Location | undefined {
    return this.locations.find((l) => l.id === id);
  }
}

export const evidenceStore = new EvidenceStore();
