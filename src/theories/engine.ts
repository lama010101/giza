import {
  computeHypothesisConfidenceForObject,
  computeOverallHypothesisConfidence,
} from '@/evidence/confidence';
import type { Evidence } from '@/schemas/evidence';
import type { Hypothesis, VisualizationRule } from '@/schemas/hypothesis';
import type { Source } from '@/schemas/source';
import type { HypothesisContext, HypothesisPlugin } from './types';

export class HypothesisEngine {
  private readonly plugins = new Map<string, HypothesisPlugin>();
  private activeIds = new Set<string>();
  private cachedHypotheses = new Map<string, Hypothesis>();

  register(plugin: HypothesisPlugin): void {
    this.plugins.set(plugin.id, plugin);
  }

  getPluginIds(): string[] {
    return Array.from(this.plugins.keys());
  }

  activate(ids: string[]): void {
    for (const id of ids) {
      if (!this.plugins.has(id)) {
        throw new Error(`Hypothesis plugin ${id} is not registered`);
      }
      this.activeIds.add(id);
    }
    this.cachedHypotheses.clear();
  }

  setActive(ids: string[]): void {
    for (const id of ids) {
      if (!this.plugins.has(id)) {
        throw new Error(`Hypothesis plugin ${id} is not registered`);
      }
    }
    this.activeIds = new Set(ids);
    this.cachedHypotheses.clear();
  }

  deactivate(id: string): void {
    this.activeIds.delete(id);
    this.cachedHypotheses.delete(id);
  }

  isActive(id: string): boolean {
    return this.activeIds.has(id);
  }

  getActiveIds(): string[] {
    return Array.from(this.activeIds);
  }

  getHypothesis(id: string, context: HypothesisContext): Hypothesis {
    if (this.cachedHypotheses.has(id)) {
      return this.cachedHypotheses.get(id)!;
    }

    const plugin = this.plugins.get(id);
    if (!plugin) {
      throw new Error(`Hypothesis plugin ${id} is not registered`);
    }

    const hypothesis = plugin.getHypothesis(context);
    this.cachedHypotheses.set(id, hypothesis);
    return hypothesis;
  }

  getActiveHypotheses(context: HypothesisContext): Hypothesis[] {
    return this.getActiveIds().map((id) => this.getHypothesis(id, context));
  }

  /**
   * Compute per-object confidence for every active hypothesis.
   * Returns a map of hypothesis ID → object ID → confidence.
   */
  computeConfidenceByObject(
    context: HypothesisContext,
    sourceById: (id: string) => Source | undefined,
    ids?: string[],
  ): Record<string, Record<string, number>> {
    const result: Record<string, Record<string, number>> = {};

    for (const id of ids ?? this.getActiveIds()) {
      const hypothesis = this.getHypothesis(id, context);
      const supporting = this.resolveEvidence(hypothesis.supports, context);
      const contradicting = this.resolveEvidence(hypothesis.contradicts, context);
      const required = this.resolveEvidence(hypothesis.requiredEvidence, context);
      const byObject: Record<string, number> = {};

      for (const objectId of hypothesis.affectedStructures) {
        byObject[objectId] = computeHypothesisConfidenceForObject(
          hypothesis,
          supporting,
          contradicting,
          required,
          sourceById,
        );
      }

      result[id] = byObject;
    }

    return result;
  }

  computeOverallConfidence(
    confidenceByObject: Record<string, Record<string, number>>,
  ): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [id, values] of Object.entries(confidenceByObject)) {
      result[id] = computeOverallHypothesisConfidence(values);
    }
    return result;
  }

  getVisualizationRules(objectId: string, context: HypothesisContext): VisualizationRule[] {
    const rules: VisualizationRule[] = [];

    for (const id of this.getActiveIds()) {
      const plugin = this.plugins.get(id);
      if (!plugin) {
        continue;
      }
      if (plugin.getVisualizationRules) {
        rules.push(...plugin.getVisualizationRules(objectId, context));
      } else {
        const hypothesis = this.getHypothesis(id, context);
        rules.push(...hypothesis.visualizationRules.filter((rule) => rule.target === objectId));
      }
    }

    return rules;
  }

  getActiveSimulations(context: HypothesisContext): string[] {
    const ids: string[] = [];
    for (const id of this.getActiveIds()) {
      const hypothesis = this.getHypothesis(id, context);
      ids.push(...hypothesis.simulations);
    }
    return [...new Set(ids)];
  }

  private resolveEvidence(evidenceIds: string[], context: HypothesisContext): Evidence[] {
    return context.evidence.filter((ev) => evidenceIds.includes(ev.id));
  }
}
