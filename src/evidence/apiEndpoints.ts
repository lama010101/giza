/**
 * Client-side REST API endpoint stubs per M02-T15 and M03-T14.
 *
 * Provides a unified API surface for evidence and source CRUD operations.
 * In production, these would map to REST API endpoints on a backend server;
 * in the current client-only architecture, they operate on the in-memory
 * EvidenceStore via the StorageBackend abstraction.
 *
 * The endpoint signatures are designed to be backend-agnostic — switching
 * to a real REST backend would only require replacing the implementation
 * bodies with `fetch()` calls.
 */

import {
  evidenceStore,
  type EvidenceStore,
  type CreateEvidenceInput,
  type UpdateEvidenceInput,
} from './EvidenceStore';
import type { Evidence } from '@/schemas/evidence';
import type { Source } from '@/schemas/source';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  status: number;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EvidenceQuery {
  status?: Evidence['status'];
  category?: Evidence['category'];
  primaryClass?: Evidence['primaryClass'];
  minConfidence?: number;
  objectId?: string;
  locationId?: string;
  sourceId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface SourceQuery {
  type?: Source['type'];
  search?: string;
  page?: number;
  pageSize?: number;
}

// ─── Evidence API endpoints ──────────────────────────────────────────────────

/**
 * GET /api/evidence — List evidence with optional filtering.
 */
export function listEvidence(
  query: EvidenceQuery = {},
  store: EvidenceStore = evidenceStore,
): PaginatedResponse<Evidence> {
  const {
    status,
    category,
    primaryClass,
    minConfidence = 0,
    objectId,
    locationId,
    sourceId,
    search,
    page = 1,
    pageSize = 20,
  } = query;

  let evidence = store.getAll();

  if (status) evidence = evidence.filter((e) => e.status === status);
  if (category) evidence = evidence.filter((e) => e.category === category);
  if (primaryClass) evidence = evidence.filter((e) => e.primaryClass === primaryClass);
  if (objectId) evidence = evidence.filter((e) => e.objectIds.includes(objectId));
  if (locationId) evidence = evidence.filter((e) => e.locationId === locationId);
  if (sourceId) evidence = evidence.filter((e) => e.sourceIds.includes(sourceId));
  evidence = evidence.filter((e) => e.confidence >= minConfidence);
  if (search) evidence = store.search(search);

  const total = evidence.length;
  const start = (page - 1) * pageSize;
  const paged = evidence.slice(start, start + pageSize);

  return { data: paged, total, page, pageSize };
}

/**
 * GET /api/evidence/:id — Get a single evidence record.
 */
export function getEvidence(
  id: string,
  store: EvidenceStore = evidenceStore,
): ApiResponse<Evidence | null> {
  const evidence = store.getById(id);
  return {
    data: evidence ?? null,
    status: evidence ? 200 : 404,
    error: evidence ? undefined : `Evidence ${id} not found`,
  };
}

/**
 * POST /api/evidence — Create a new evidence record.
 */
export function createEvidence(
  input: CreateEvidenceInput,
  store: EvidenceStore = evidenceStore,
): ApiResponse<Evidence> {
  try {
    const evidence = store.create(input);
    return { data: evidence, status: 201 };
  } catch (e) {
    return {
      data: null as never,
      status: 400,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * PATCH /api/evidence/:id — Update an evidence record.
 */
export function updateEvidence(
  id: string,
  updates: UpdateEvidenceInput,
  store: EvidenceStore = evidenceStore,
): ApiResponse<Evidence | null> {
  try {
    const evidence = store.update(id, updates);
    return {
      data: evidence ?? null,
      status: evidence ? 200 : 404,
      error: evidence ? undefined : `Evidence ${id} not found`,
    };
  } catch (e) {
    return {
      data: null,
      status: 400,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * DELETE /api/evidence/:id — Soft-delete an evidence record.
 */
export function deleteEvidence(
  id: string,
  store: EvidenceStore = evidenceStore,
): ApiResponse<boolean> {
  const result = store.softDelete(id);
  return {
    data: result !== undefined,
    status: result ? 200 : 404,
    error: result ? undefined : `Evidence ${id} not found`,
  };
}

// ─── Source API endpoints (M03-T14) ──────────────────────────────────────────

/**
 * GET /api/sources — List sources with optional filtering.
 */
export function listSources(
  query: SourceQuery = {},
  store: EvidenceStore = evidenceStore,
): PaginatedResponse<Source> {
  const { type, search, page = 1, pageSize = 20 } = query;

  let sources = store.getSources();
  if (type) sources = sources.filter((s) => s.type === type);
  if (search) {
    const lower = search.toLowerCase();
    sources = sources.filter(
      (s) =>
        s.title.toLowerCase().includes(lower) ||
        s.authors.some((a) => a.name.toLowerCase().includes(lower)),
    );
  }

  const total = sources.length;
  const start = (page - 1) * pageSize;
  const paged = sources.slice(start, start + pageSize);

  return { data: paged, total, page, pageSize };
}

/**
 * GET /api/sources/:id — Get a single source.
 */
export function getSource(
  id: string,
  store: EvidenceStore = evidenceStore,
): ApiResponse<Source | null> {
  const source = store.getSourceById(id);
  return {
    data: source ?? null,
    status: source ? 200 : 404,
    error: source ? undefined : `Source ${id} not found`,
  };
}

/**
 * GET /api/sources/:id/evidence — Get evidence linked to a source.
 */
export function getSourceEvidence(
  sourceId: string,
  store: EvidenceStore = evidenceStore,
): ApiResponse<Evidence[]> {
  const evidence = store.getBySource(sourceId);
  return { data: evidence, status: 200 };
}

// ─── Health check ────────────────────────────────────────────────────────────

/**
 * GET /api/health — API health check.
 */
export function healthCheck(store: EvidenceStore = evidenceStore): ApiResponse<{
  status: string;
  evidenceCount: number;
  sourceCount: number;
}> {
  return {
    data: {
      status: 'ok',
      evidenceCount: store.getAll().length,
      sourceCount: store.getSources().length,
    },
    status: 200,
  };
}
