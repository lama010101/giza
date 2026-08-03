/**
 * Hypothesis CRUD store per M05.5-T03.
 *
 * Provides a store for managing hypothesis records (create, read,
 * update, delete). Hypotheses are scientific interpretive frameworks
 * that can be installed as plugins. The store tracks hypothesis
 * metadata, activation state, and versioning.
 */

import type { Hypothesis, HypothesisStatus } from '@/schemas/hypothesis';
import type { EvidenceId, ObjectId, SimulationId, SourceId } from '@/schemas/identifiers';

// ─── Types ───────────────────────────────────────────────────────────────────

interface StoredHypothesis extends Hypothesis {
  /** Stored category (not yet in the canonical Hypothesis schema). */
  category: 'mainstream' | 'alternative' | 'experimental';
  /** Free-form version string. */
  version: string;
  /** Whether the hypothesis is active. */
  active: boolean;
  /** Creation timestamp. */
  createdAt: string;
  /** Last update timestamp. */
  updatedAt: string;
}

export interface CreateHypothesisInput {
  id: string;
  name: string;
  description: string;
  author?: string;
  authors?: Hypothesis['authors'];
  version: string;
  category: 'mainstream' | 'alternative' | 'experimental';
  predictions?: Hypothesis['predictions'];
  visualizationRules?: Hypothesis['visualizationRules'];
  evidenceDependencies?: string[];
  confidence?: number;
  references?: SourceId[];
  status?: HypothesisStatus;
  tags?: string[];
  historicalBackground?: string;
  scientificAssumptions?: string[];
  affectedStructures?: ObjectId[];
  supports?: EvidenceId[];
  contradicts?: EvidenceId[];
  requiredEvidence?: EvidenceId[];
  simulations?: SimulationId[];
  confidenceByObject?: Record<ObjectId, number>;
  confidenceModel?: Hypothesis['confidenceModel'];
  bibliography?: SourceId[];
  plugin?: Hypothesis['plugin'];
}

export interface UpdateHypothesisInput {
  name?: string;
  description?: string;
  version?: string;
  category?: 'mainstream' | 'alternative' | 'experimental';
  predictions?: Hypothesis['predictions'];
  visualizationRules?: Hypothesis['visualizationRules'];
  evidenceDependencies?: string[];
  active?: boolean;
  confidence?: number;
  references?: SourceId[];
  status?: HypothesisStatus;
  tags?: string[];
  historicalBackground?: string;
  scientificAssumptions?: string[];
  affectedStructures?: ObjectId[];
  supports?: EvidenceId[];
  contradicts?: EvidenceId[];
  requiredEvidence?: EvidenceId[];
  simulations?: SimulationId[];
  confidenceByObject?: Record<ObjectId, number>;
  confidenceModel?: Hypothesis['confidenceModel'];
  bibliography?: SourceId[];
  plugin?: Hypothesis['plugin'];
}

// ─── Hypothesis Store ────────────────────────────────────────────────────────

export class HypothesisStore {
  private hypotheses = new Map<string, StoredHypothesis>();
  private activeIds = new Set<string>();

  create(input: CreateHypothesisInput): Hypothesis {
    if (this.hypotheses.has(input.id)) {
      throw new Error(`Hypothesis ${input.id} already exists`);
    }
    const now = new Date().toISOString();
    const hypothesis: StoredHypothesis = {
      id: input.id,
      name: input.name,
      description: input.description,
      authors: input.authors ?? [{ name: input.author ?? 'Unknown' }],
      historicalBackground: input.historicalBackground ?? '',
      scientificAssumptions: input.scientificAssumptions ?? [],
      predictions: input.predictions ?? [],
      affectedStructures: input.affectedStructures ?? [],
      supports: input.supports ?? [],
      contradicts: input.contradicts ?? [],
      requiredEvidence: input.requiredEvidence ?? input.evidenceDependencies ?? [],
      simulations: input.simulations ?? [],
      visualizationRules: input.visualizationRules ?? [],
      confidence: input.confidence ?? 0,
      confidenceByObject: input.confidenceByObject ?? {},
      confidenceModel: input.confidenceModel,
      references: input.references ?? [],
      bibliography: input.bibliography ?? [],
      plugin: input.plugin,
      status: input.status ?? 'draft',
      tags: input.tags ?? [],
      category: input.category,
      version: input.version,
      active: false,
      createdAt: now,
      updatedAt: now,
    };
    this.hypotheses.set(input.id, hypothesis);
    return hypothesis;
  }

  getById(id: string): Hypothesis | undefined {
    return this.hypotheses.get(id);
  }

  getAll(): Hypothesis[] {
    return Array.from(this.hypotheses.values());
  }

  getActive(): Hypothesis[] {
    return this.getAll().filter((h) => this.activeIds.has(h.id));
  }

  update(id: string, updates: UpdateHypothesisInput): Hypothesis | undefined {
    const current = this.hypotheses.get(id);
    if (!current) return undefined;

    const { active, evidenceDependencies, ...rest } = updates;
    if (active !== undefined) {
      if (active) this.activeIds.add(id);
      else this.activeIds.delete(id);
    }

    const updated: StoredHypothesis = {
      ...current,
      ...rest,
      requiredEvidence: rest.requiredEvidence ?? evidenceDependencies ?? current.requiredEvidence,
      id,
      updatedAt: new Date().toISOString(),
    };
    this.hypotheses.set(id, updated);
    return updated;
  }

  delete(id: string): boolean {
    this.activeIds.delete(id);
    return this.hypotheses.delete(id);
  }

  activate(id: string): boolean {
    if (!this.hypotheses.has(id)) return false;
    this.activeIds.add(id);
    this.update(id, { active: true });
    return true;
  }

  deactivate(id: string): boolean {
    if (!this.hypotheses.has(id)) return false;
    this.activeIds.delete(id);
    this.update(id, { active: false });
    return true;
  }

  isActive(id: string): boolean {
    return this.activeIds.has(id);
  }

  getByCategory(category: 'mainstream' | 'alternative' | 'experimental'): Hypothesis[] {
    return this.getAll().filter((h) => (h as StoredHypothesis).category === category);
  }

  clear(): void {
    this.hypotheses.clear();
    this.activeIds.clear();
  }

  get count(): number {
    return this.hypotheses.size;
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let globalStore: HypothesisStore | null = null;

export function getHypothesisStore(): HypothesisStore {
  if (!globalStore) {
    globalStore = new HypothesisStore();
  }
  return globalStore;
}

export function resetHypothesisStore(): void {
  globalStore = null;
}
