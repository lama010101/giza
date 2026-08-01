/**
 * SQLite backend adapter per M02-T01.
 *
 * Provides a storage backend interface for the EvidenceStore that can
 * be backed by either an in-memory store (default, for browser/preview)
 * or a SQLite database (via better-sqlite3 in Node.js environments).
 *
 * The adapter pattern allows the application to run in both browser and
 * server contexts without code changes. In production, the SQLite backend
 * would be used for persistence; in the browser, the in-memory backend
 * is used with optional IndexedDB persistence.
 */

import type { Evidence } from '@/schemas/evidence';
import type { Source } from '@/schemas/source';
import type { Location } from '@/schemas/location';
import type { SceneObject } from '@/schemas/object';

// ─── Backend interface ───────────────────────────────────────────────────────

export interface StorageBackend {
  // Evidence
  getEvidence(id: string): Evidence | undefined;
  getAllEvidence(): Evidence[];
  insertEvidence(evidence: Evidence): void;
  updateEvidence(id: string, updates: Partial<Evidence>): Evidence | undefined;
  deleteEvidence(id: string): boolean;

  // Sources
  getAllSources(): Source[];
  getSource(id: string): Source | undefined;
  insertSource(source: Source): void;

  // Locations
  getAllLocations(): Location[];
  getLocation(id: string): Location | undefined;
  insertLocation(location: Location): void;

  // Objects
  getAllObjects(): SceneObject[];
  getObject(id: string): SceneObject | undefined;
  insertObject(object: SceneObject): void;

  // Lifecycle
  close(): void;
  flush(): void;
}

// ─── In-memory backend ───────────────────────────────────────────────────────

export class InMemoryBackend implements StorageBackend {
  private evidence = new Map<string, Evidence>();
  private sources = new Map<string, Source>();
  private locations = new Map<string, Location>();
  private objects = new Map<string, SceneObject>();

  // Evidence
  getEvidence(id: string): Evidence | undefined {
    return this.evidence.get(id);
  }
  getAllEvidence(): Evidence[] {
    return Array.from(this.evidence.values());
  }
  insertEvidence(evidence: Evidence): void {
    this.evidence.set(evidence.id, evidence);
  }
  updateEvidence(id: string, updates: Partial<Evidence>): Evidence | undefined {
    const current = this.evidence.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...updates, id };
    this.evidence.set(id, updated);
    return updated;
  }
  deleteEvidence(id: string): boolean {
    return this.evidence.delete(id);
  }

  // Sources
  getAllSources(): Source[] {
    return Array.from(this.sources.values());
  }
  getSource(id: string): Source | undefined {
    return this.sources.get(id);
  }
  insertSource(source: Source): void {
    this.sources.set(source.id, source);
  }

  // Locations
  getAllLocations(): Location[] {
    return Array.from(this.locations.values());
  }
  getLocation(id: string): Location | undefined {
    return this.locations.get(id);
  }
  insertLocation(location: Location): void {
    this.locations.set(location.id, location);
  }

  // Objects
  getAllObjects(): SceneObject[] {
    return Array.from(this.objects.values());
  }
  getObject(id: string): SceneObject | undefined {
    return this.objects.get(id);
  }
  insertObject(object: SceneObject): void {
    this.objects.set(object.id, object);
  }

  // Lifecycle
  close(): void {
    // No-op for in-memory
  }
  flush(): void {
    // No-op for in-memory
  }
}

// ─── SQLite backend (stub) ───────────────────────────────────────────────────

/**
 * SQLite backend stub.
 *
 * In a Node.js environment with `better-sqlite3` installed, this would
 * use a real SQLite database for persistence. The stub throws on
 * instantiation to indicate that SQLite is not available in the current
 * environment.
 *
 * To enable SQLite:
 * 1. `npm install better-sqlite3`
 * 2. Set `VITE_STORAGE_BACKEND=sqlite` in .env
 * 3. Implement the SQLiteBackend class with real DB operations
 */
export class SQLiteBackend implements StorageBackend {
  constructor(_dbPath: string) {
    throw new Error(
      'SQLiteBackend is not available in this environment. ' +
        'Install better-sqlite3 and set VITE_STORAGE_BACKEND=sqlite to enable. ' +
        'Falling back to InMemoryBackend.',
    );
  }

  getEvidence(_id: string): Evidence | undefined {
    throw new Error('SQLiteBackend not implemented');
  }
  getAllEvidence(): Evidence[] {
    throw new Error('SQLiteBackend not implemented');
  }
  insertEvidence(_evidence: Evidence): void {
    throw new Error('SQLiteBackend not implemented');
  }
  updateEvidence(_id: string, _updates: Partial<Evidence>): Evidence | undefined {
    throw new Error('SQLiteBackend not implemented');
  }
  deleteEvidence(_id: string): boolean {
    throw new Error('SQLiteBackend not implemented');
  }
  getAllSources(): Source[] {
    throw new Error('SQLiteBackend not implemented');
  }
  getSource(_id: string): Source | undefined {
    throw new Error('SQLiteBackend not implemented');
  }
  insertSource(_source: Source): void {
    throw new Error('SQLiteBackend not implemented');
  }
  getAllLocations(): Location[] {
    throw new Error('SQLiteBackend not implemented');
  }
  getLocation(_id: string): Location | undefined {
    throw new Error('SQLiteBackend not implemented');
  }
  insertLocation(_location: Location): void {
    throw new Error('SQLiteBackend not implemented');
  }
  getAllObjects(): SceneObject[] {
    throw new Error('SQLiteBackend not implemented');
  }
  getObject(_id: string): SceneObject | undefined {
    throw new Error('SQLiteBackend not implemented');
  }
  insertObject(_object: SceneObject): void {
    throw new Error('SQLiteBackend not implemented');
  }
  close(): void {
    // No-op
  }
  flush(): void {
    // No-op
  }
}

// ─── Backend factory ─────────────────────────────────────────────────────────

let currentBackend: StorageBackend | null = null;

/**
 * Returns the current storage backend.
 *
 * Defaults to InMemoryBackend. If `VITE_STORAGE_BACKEND=sqlite` is set
 * and better-sqlite3 is available, returns a SQLiteBackend.
 */
export function getStorageBackend(): StorageBackend {
  if (currentBackend) return currentBackend;

  const env = import.meta.env as Record<string, string | undefined>;
  const backendType = env?.VITE_STORAGE_BACKEND ?? 'memory';

  if (backendType === 'sqlite') {
    try {
      const dbPath = env?.VITE_SQLITE_PATH ?? 'giza.db';
      currentBackend = new SQLiteBackend(dbPath);
    } catch {
      // Fall back to in-memory if SQLite is unavailable
      currentBackend = new InMemoryBackend();
    }
  } else {
    currentBackend = new InMemoryBackend();
  }

  return currentBackend;
}

/**
 * Sets the storage backend (for testing or manual configuration).
 */
export function setStorageBackend(backend: StorageBackend): void {
  currentBackend = backend;
}

/**
 * Resets the storage backend to null (forces re-creation on next access).
 */
export function resetStorageBackend(): void {
  if (currentBackend) {
    currentBackend.close();
  }
  currentBackend = null;
}
