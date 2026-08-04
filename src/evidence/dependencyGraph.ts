import type { DependencyEdge } from '@/schemas/dependency';
import { recordAudit, AuditAction } from './auditLog';

/**
 * Dependency graph store per GIZA - 08 §1.10.
 *
 * Evidence forms an explicit directed acyclic graph. Cycles are rejected
 * at insertion time. The graph is queryable upstream and downstream.
 */

export class DependencyGraph {
  private edges = new Map<string, DependencyEdge>();
  private adjacencyOut = new Map<string, Set<string>>();
  private adjacencyIn = new Map<string, Set<string>>();

  /**
   * Adds a dependency edge. Throws if the edge would create a cycle.
   */
  addEdge(edge: DependencyEdge, actor = ''): void {
    if (edge.from === edge.to) {
      throw new Error(
        `Self-dependency rejected: ${edge.from} cannot depend on itself (GIZA - 08 §1.10).`,
      );
    }

    const edgeKey = `${edge.from}->${edge.to}:${edge.relation}`;
    if (this.edges.has(edgeKey)) {
      throw new Error(`Duplicate edge: ${edgeKey}`);
    }

    // Cycle detection: check if `to` can already reach `from`
    if (this.canReach(edge.to, edge.from)) {
      throw new Error(
        `Cycle rejected: adding ${edge.from} → ${edge.to} would create a cycle ` +
          '(GIZA - 08 §1.10). Cycles are rejected at insertion time.',
      );
    }

    this.edges.set(edgeKey, edge);

    if (!this.adjacencyOut.has(edge.from)) this.adjacencyOut.set(edge.from, new Set());
    this.adjacencyOut.get(edge.from)!.add(edge.to);

    if (!this.adjacencyIn.has(edge.to)) this.adjacencyIn.set(edge.to, new Set());
    this.adjacencyIn.get(edge.to)!.add(edge.from);

    recordAudit(edge.from, AuditAction.DEPENDENCY_ADDED, actor, {
      to: edge.to,
      relation: edge.relation,
      strength: edge.strength,
    });
  }

  /**
   * Removes a dependency edge.
   */
  removeEdge(from: string, to: string, relation: string, actor = ''): boolean {
    const edgeKey = `${from}->${to}:${relation}`;
    const existed = this.edges.delete(edgeKey);
    if (existed) {
      this.adjacencyOut.get(from)?.delete(to);
      this.adjacencyIn.get(to)?.delete(from);
      recordAudit(from, AuditAction.DEPENDENCY_REMOVED, actor, { to, relation });
    }
    return existed;
  }

  /**
   * Returns all edges where `id` is the source (downstream dependencies).
   */
  getDownstream(id: string): DependencyEdge[] {
    const targets = this.adjacencyOut.get(id);
    if (!targets) return [];
    return [...this.edges.values()].filter((e) => e.from === id);
  }

  /**
   * Returns all edges where `id` is the target (upstream dependencies).
   */
  getUpstream(id: string): DependencyEdge[] {
    const sources = this.adjacencyIn.get(id);
    if (!sources) return [];
    return [...this.edges.values()].filter((e) => e.to === id);
  }

  /**
   * Returns all evidence IDs reachable downstream from `id` (transitive).
   */
  getDownstreamTransitive(id: string): string[] {
    const visited = new Set<string>();
    const queue = [id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const targets = this.adjacencyOut.get(current);
      if (!targets) continue;
      for (const target of targets) {
        if (!visited.has(target)) {
          visited.add(target);
          queue.push(target);
        }
      }
    }
    return [...visited];
  }

  /**
   * Returns all evidence IDs reachable upstream from `id` (transitive).
   */
  getUpstreamTransitive(id: string): string[] {
    const visited = new Set<string>();
    const queue = [id];
    while (queue.length > 0) {
      const current = queue.shift()!;
      const sources = this.adjacencyIn.get(current);
      if (!sources) continue;
      for (const source of sources) {
        if (!visited.has(source)) {
          visited.add(source);
          queue.push(source);
        }
      }
    }
    return [...visited];
  }

  /**
   * Returns true if `from` can reach `to` via any path (BFS).
   */
  private canReach(from: string, to: string): boolean {
    if (from === to) return true;
    const visited = new Set<string>();
    const queue = [from];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === to) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      const targets = this.adjacencyOut.get(current);
      if (!targets) continue;
      for (const target of targets) {
        if (!visited.has(target)) queue.push(target);
      }
    }
    return false;
  }

  /**
   * Returns all edges in the graph.
   */
  getAllEdges(): DependencyEdge[] {
    return [...this.edges.values()];
  }

  /**
   * Returns the number of edges in the graph.
   */
  size(): number {
    return this.edges.size;
  }

  /**
   * Clears the graph. Intended for testing only.
   */
  _resetForTesting(): void {
    this.edges.clear();
    this.adjacencyOut.clear();
    this.adjacencyIn.clear();
  }
}

export const dependencyGraph = new DependencyGraph();
