import { describe, it, expect, beforeEach } from 'vitest';
import { DependencyGraph } from './dependencyGraph';
import type { DependencyEdge } from '@/schemas/dependency';
import { _resetAuditLogForTesting } from './auditLog';

function edge(
  from: string,
  to: string,
  relation: DependencyEdge['relation'] = 'supports',
): DependencyEdge {
  return { from, to, relation, strength: 0.8, notes: '' };
}

describe('DependencyGraph', () => {
  let graph: DependencyGraph;

  beforeEach(() => {
    _resetAuditLogForTesting();
    graph = new DependencyGraph();
  });

  it('adds edges and retrieves them', () => {
    graph.addEdge(edge('EV-000001', 'EV-000002', 'validates'));
    graph.addEdge(edge('EV-000001', 'EV-000003', 'supports'));

    const downstream = graph.getDownstream('EV-000001');
    expect(downstream).toHaveLength(2);
    expect(downstream.some((e) => e.to === 'EV-000002')).toBe(true);
    expect(downstream.some((e) => e.to === 'EV-000003')).toBe(true);
  });

  it('retrieves upstream edges', () => {
    graph.addEdge(edge('EV-000001', 'EV-000002'));
    graph.addEdge(edge('EV-000001', 'EV-000003'));

    const upstream = graph.getUpstream('EV-000002');
    expect(upstream).toHaveLength(1);
    expect(upstream[0].from).toBe('EV-000001');
  });

  it('rejects self-dependencies', () => {
    expect(() => graph.addEdge(edge('EV-000001', 'EV-000001'))).toThrow(/Self-dependency/);
  });

  it('rejects direct cycles (A→B→A)', () => {
    graph.addEdge(edge('EV-000001', 'EV-000002'));
    expect(() => graph.addEdge(edge('EV-000002', 'EV-000001'))).toThrow(/Cycle rejected/);
  });

  it('rejects indirect cycles (A→B→C→A)', () => {
    graph.addEdge(edge('EV-000001', 'EV-000002'));
    graph.addEdge(edge('EV-000002', 'EV-000003'));
    expect(() => graph.addEdge(edge('EV-000003', 'EV-000001'))).toThrow(/Cycle rejected/);
  });

  it('allows non-cyclic edges in a DAG', () => {
    graph.addEdge(edge('EV-000001', 'EV-000002'));
    graph.addEdge(edge('EV-000001', 'EV-000003'));
    graph.addEdge(edge('EV-000002', 'EV-000004'));
    graph.addEdge(edge('EV-000003', 'EV-000004'));
    expect(graph.size()).toBe(4);
  });

  it('returns transitive downstream', () => {
    graph.addEdge(edge('EV-000001', 'EV-000002'));
    graph.addEdge(edge('EV-000002', 'EV-000003'));
    graph.addEdge(edge('EV-000003', 'EV-000004'));

    const downstream = graph.getDownstreamTransitive('EV-000001');
    expect(downstream).toContain('EV-000002');
    expect(downstream).toContain('EV-000003');
    expect(downstream).toContain('EV-000004');
  });

  it('returns transitive upstream', () => {
    graph.addEdge(edge('EV-000001', 'EV-000002'));
    graph.addEdge(edge('EV-000002', 'EV-000003'));

    const upstream = graph.getUpstreamTransitive('EV-000003');
    expect(upstream).toContain('EV-000001');
    expect(upstream).toContain('EV-000002');
  });

  it('removes edges', () => {
    graph.addEdge(edge('EV-000001', 'EV-000002'));
    expect(graph.size()).toBe(1);
    expect(graph.removeEdge('EV-000001', 'EV-000002', 'supports')).toBe(true);
    expect(graph.size()).toBe(0);
  });

  it('returns false when removing a non-existent edge', () => {
    expect(graph.removeEdge('EV-000001', 'EV-000002', 'supports')).toBe(false);
  });

  it('rejects duplicate edges', () => {
    graph.addEdge(edge('EV-000001', 'EV-000002', 'supports'));
    expect(() => graph.addEdge(edge('EV-000001', 'EV-000002', 'supports'))).toThrow(/Duplicate/);
  });

  it('allows different relations between same pair', () => {
    graph.addEdge(edge('EV-000001', 'EV-000002', 'supports'));
    graph.addEdge(edge('EV-000001', 'EV-000002', 'contradicts'));
    expect(graph.size()).toBe(2);
  });

  it('returns empty arrays for unknown nodes', () => {
    expect(graph.getDownstream('EV-999999')).toEqual([]);
    expect(graph.getUpstream('EV-999999')).toEqual([]);
    expect(graph.getDownstreamTransitive('EV-999999')).toEqual([]);
  });
});
