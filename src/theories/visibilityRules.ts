/**
 * Visibility rules evaluator per M11-T20.
 *
 * Evaluates visibility rules for hypothesis-specific geometry nodes
 * to determine when interpretive objects should be shown.
 */

import type { HypothesisGeometryNode, VisibilityRule } from './types';

export type { VisibilityRule } from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface VisibilityContext {
  /** Current active layer. */
  activeLayer?: string;
  /** Current chronology period. */
  chronologyPeriod?: string;
  /** Current LOD level (0 = highest detail). */
  lodLevel?: number;
  /** Evidence count for the object. */
  evidenceCount?: number;
  /** Whether the hypothesis is active. */
  hypothesisActive?: boolean;
}

// ─── Rule evaluation ─────────────────────────────────────────────────────────

/**
 * Evaluates a single visibility rule against the context.
 */
export function evaluateRule(rule: VisibilityRule, context: VisibilityContext): boolean {
  if (rule.layer !== undefined && context.activeLayer !== undefined) {
    if (rule.layer !== context.activeLayer) return false;
  }
  if (rule.chronologyPeriod !== undefined && context.chronologyPeriod !== undefined) {
    if (rule.chronologyPeriod !== context.chronologyPeriod) return false;
  }
  if (rule.minEvidenceCount !== undefined && context.evidenceCount !== undefined) {
    if (context.evidenceCount < rule.minEvidenceCount) return false;
  }
  if (rule.minLOD !== undefined && context.lodLevel !== undefined) {
    if (context.lodLevel > rule.minLOD) return false;
  }
  return true;
}

/**
 * Evaluates all visibility rules for a node. Returns true if the node
 * should be visible given the context. All rules must pass (AND logic).
 */
export function evaluateVisibility(
  node: HypothesisGeometryNode,
  context: VisibilityContext,
): boolean {
  // If hypothesis is not active, node is not visible
  if (context.hypothesisActive === false) return false;

  // If no rules, default to visible
  if (!node.visibilityRules || node.visibilityRules.length === 0) {
    return true;
  }

  // All rules must pass (AND logic)
  for (const rule of node.visibilityRules) {
    if (!evaluateRule(rule, context)) {
      return false;
    }
  }

  // All rules passed — check default visibility
  const hasDefaultFalse = node.visibilityRules.find((r) => r.defaultVisible === false);
  return !hasDefaultFalse;
}

/**
 * Batch-evaluates visibility for multiple nodes.
 */
export function evaluateBatchVisibility(
  nodes: HypothesisGeometryNode[],
  context: VisibilityContext,
): { node: HypothesisGeometryNode; visible: boolean }[] {
  return nodes.map((node) => ({ node, visible: evaluateVisibility(node, context) }));
}

/**
 * Filters nodes to only those visible in the given context.
 */
export function filterVisibleNodes(
  nodes: HypothesisGeometryNode[],
  context: VisibilityContext,
): HypothesisGeometryNode[] {
  return nodes.filter((node) => evaluateVisibility(node, context));
}

/**
 * Creates a visibility rule for a specific layer.
 */
export function createLayerRule(layer: string, defaultVisible = true): VisibilityRule {
  return { layer, defaultVisible };
}

/**
 * Creates a visibility rule for a chronology period.
 */
export function createChronologyRule(period: string, defaultVisible = true): VisibilityRule {
  return { chronologyPeriod: period, defaultVisible };
}

/**
 * Creates a visibility rule requiring minimum evidence.
 */
export function createEvidenceRule(minCount: number, defaultVisible = true): VisibilityRule {
  return { minEvidenceCount: minCount, defaultVisible };
}
