import { describe, it, expect } from 'vitest';
import { buildOsirisSceneGraph } from '@/scene/osirisSceneGraph';
import { buildGreatPyramidSceneGraph } from '@/scene/greatPyramidSceneGraph';
import { loadAndValidateSeed } from '@/loaders/seed';

const seed = loadAndValidateSeed();
const evidenceIds = new Set(seed.evidence.map((e) => e.id));

const sceneGraphs = [
  { name: 'Osiris Shaft', graph: buildOsirisSceneGraph() },
  { name: 'Great Pyramid (LOD0)', graph: buildGreatPyramidSceneGraph('LOD0') },
  { name: 'Great Pyramid (LOD1)', graph: buildGreatPyramidSceneGraph('LOD1') },
];

describe('Scientific smoke test: visible node evidence linkage', () => {
  for (const { name, graph } of sceneGraphs) {
    describe(`${name}`, () => {
      const visibleNodes = graph.getAllVisibleNodes();

      it('every visible node with an objectId has at least one evidenceId', () => {
        const violations: string[] = [];
        for (const node of visibleNodes) {
          if (!node.metadata.objectId) continue;
          const evidence = node.metadata.evidenceIds;
          if (!evidence || evidence.length === 0) {
            violations.push(
              `node "${node.id}" has objectId "${node.metadata.objectId}" but no evidenceIds`,
            );
          }
        }
        expect(violations, violations.join('\n')).toEqual([]);
      });

      it('all evidenceIds referenced by visible nodes resolve to seed evidence', () => {
        const violations: string[] = [];
        for (const node of visibleNodes) {
          if (!node.metadata.objectId) continue;
          for (const evId of node.metadata.evidenceIds ?? []) {
            if (!evidenceIds.has(evId)) {
              violations.push(`node "${node.id}" references unknown evidence "${evId}"`);
            }
          }
        }
        expect(violations, violations.join('\n')).toEqual([]);
      });

      it('every visible node with an objectId has a resolvable object in the seed', () => {
        const violations: string[] = [];
        for (const node of visibleNodes) {
          if (!node.metadata.objectId) continue;
          if (!seed.objects.some((o) => o.id === node.metadata.objectId)) {
            violations.push(
              `node "${node.id}" references unknown object "${node.metadata.objectId}"`,
            );
          }
        }
        expect(violations, violations.join('\n')).toEqual([]);
      });
    });
  }
});
