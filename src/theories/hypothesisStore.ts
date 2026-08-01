/**
 * Hypothesis CRUD store per M05.5-T03.
 *
 * Provides a store for managing hypothesis records (create, read,
 * update, delete). Hypotheses are scientific interpretive frameworks
 * that can be installed as plugins. The store tracks hypothesis
 * metadata, activation state, and versioning.
 */

import type { Hypothesis } from '@/schemas/hypothesis';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CreateHypothesisInput {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  category: 'mainstream' | 'alternative' | 'experimental';
  predictions?: Hypothesis['predictions'];
  visualizationRules?: Hypothesis['visualizationRules'];
  evidenceDependencies?: string[];
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
}

// ─── Hypothesis Store ────────────────────────────────────────────────────────

export class HypothesisStore {
  private hypotheses = new Map<string, Hypothesis>();
  private activeIds = new Set<string>();

  create(input: CreateHypothesisInput): Hypothesis {
    if (this.hypotheses.has(input.id)) {
      throw new Error(`Hypothesis ${input.id} already exists`);
    }
    const hypothesis: Hypothesis = {
      id: input.id,
      name: input.name,
      description: input.description,
      author: input.author,
      version: input.version,
      category: input.category,
      predictions: input.predictions ?? [],
      visualizationRules: input.visualizationRules ?? [],
      evidenceDependencies: input.evidenceDependencies ?? [],
      active: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Hypothesis;
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
    const updated: Hypothesis = {
      ...current,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    } as Hypothesis;
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
    return this.getAll().filter((h) => h.category === category);
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
