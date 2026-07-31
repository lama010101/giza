import { describe, it, expect } from 'vitest';
import { loadSeedByMonument, loadAndValidateSeed } from '@/loaders/seed';
import { buildGreatPyramidSceneGraph } from '@/scene/greatPyramidSceneGraph';
import { greatPyramidBlockout } from '@db/blockouts/great-pyramid';

describe('Great Pyramid Seed Data', () => {
  const seed = loadSeedByMonument('great-pyramid');

  it('has 7 sources', () => {
    expect(seed.sources).toHaveLength(7);
  });

  it('has 9 locations', () => {
    expect(seed.locations).toHaveLength(9);
  });

  it('has 26 objects', () => {
    expect(seed.objects).toHaveLength(26);
  });

  it('has 30 evidence records', () => {
    expect(seed.evidence).toHaveLength(30);
  });

  it('every source has a valid ID matching SRC-NNNN', () => {
    for (const src of seed.sources) {
      expect(src.id).toMatch(/^SRC-\d{4}$/);
    }
  });

  it('every location has a valid ID matching LOC-NNN', () => {
    for (const loc of seed.locations) {
      expect(loc.id).toMatch(/^LOC-\d{3}$/);
    }
  });

  it('every object has a valid ID matching OBJ-NNNN', () => {
    for (const obj of seed.objects) {
      expect(obj.id).toMatch(/^OBJ-\d{4}$/);
    }
  });

  it('every evidence has a valid ID matching EV-NNNNNN', () => {
    for (const ev of seed.evidence) {
      expect(ev.id).toMatch(/^EV-\d{6}$/);
    }
  });

  it('every object has evidence linkage', () => {
    for (const obj of seed.objects) {
      expect(obj.evidence.length).toBeGreaterThan(0);
    }
  });

  it('every object has source linkage', () => {
    for (const obj of seed.objects) {
      expect(obj.sourceIds.length).toBeGreaterThan(0);
    }
  });

  it('every evidence has source linkage', () => {
    for (const ev of seed.evidence) {
      expect(ev.sourceIds.length).toBeGreaterThan(0);
    }
  });

  it('every evidence has at least one chronology tag', () => {
    for (const ev of seed.evidence) {
      expect(ev.chronologyTags.length).toBeGreaterThan(0);
    }
  });

  it('every evidence has confidence in valid range', () => {
    for (const ev of seed.evidence) {
      expect(ev.confidence).toBeGreaterThanOrEqual(0);
      expect(ev.confidence).toBeLessThanOrEqual(100);
    }
  });

  it('every object has confidence in valid range', () => {
    for (const obj of seed.objects) {
      expect(obj.confidence).toBeGreaterThanOrEqual(0);
      expect(obj.confidence).toBeLessThanOrEqual(100);
    }
  });

  it('has ≥12 evidence records (hotspot minimum)', () => {
    expect(seed.evidence.length).toBeGreaterThanOrEqual(12);
  });

  it('all evidence source IDs resolve to actual sources', () => {
    const sourceIds = new Set(seed.sources.map((s) => s.id));
    for (const ev of seed.evidence) {
      for (const sid of ev.sourceIds) {
        expect(sourceIds.has(sid)).toBe(true);
      }
    }
  });

  it('all evidence object IDs resolve to actual objects', () => {
    const objectIds = new Set(seed.objects.map((o) => o.id));
    for (const ev of seed.evidence) {
      for (const oid of ev.objectIds) {
        expect(objectIds.has(oid)).toBe(true);
      }
    }
  });

  it('all object evidence IDs resolve to actual evidence', () => {
    const evidenceIds = new Set(seed.evidence.map((e) => e.id));
    for (const obj of seed.objects) {
      for (const eid of obj.evidence) {
        expect(evidenceIds.has(eid)).toBe(true);
      }
    }
  });

  it('all object source IDs resolve to actual sources', () => {
    const sourceIds = new Set(seed.sources.map((s) => s.id));
    for (const obj of seed.objects) {
      for (const sid of obj.sourceIds) {
        expect(sourceIds.has(sid)).toBe(true);
      }
    }
  });
});

describe('Great Pyramid Scene Graph', () => {
  const graph = buildGreatPyramidSceneGraph();

  it('has a root node', () => {
    const all = graph.getAllNodes();
    const root = all.find((n) => n.parentId === null);
    expect(root).toBeDefined();
    expect(root?.name).toBe('Great Pyramid');
  });

  it('has layer group nodes', () => {
    const all = graph.getAllNodes();
    const layerIds = [
      'gp-exterior',
      'gp-passages',
      'gp-subterranean',
      'gp-gallery',
      'gp-kings-complex',
      'gp-queens-complex',
      'gp-relieving',
      'gp-shafts',
    ];
    for (const id of layerIds) {
      expect(all.find((n) => n.id === id)).toBeDefined();
    }
  });

  it('has all blockout nodes', () => {
    const all = graph.getAllNodes();
    for (const blockoutNode of greatPyramidBlockout.nodes) {
      const node = all.find((n) => n.id === blockoutNode.id);
      expect(node).toBeDefined();
      expect(node?.name).toBe(blockoutNode.name);
    }
  });

  it('all blockout nodes have evidence linkage in metadata', () => {
    const all = graph.getAllNodes();
    for (const blockoutNode of greatPyramidBlockout.nodes) {
      if (blockoutNode.evidenceIds && blockoutNode.evidenceIds.length > 0) {
        const node = all.find((n) => n.id === blockoutNode.id);
        expect(node?.metadata.evidenceIds).toBeDefined();
        expect(node?.metadata.evidenceIds?.length).toBeGreaterThan(0);
      }
    }
  });

  it("King's Chamber node exists with correct object ID", () => {
    const all = graph.getAllNodes();
    const kc = all.find((n) => n.name === "King's Chamber");
    expect(kc).toBeDefined();
    expect(kc?.metadata.objectId).toBe('OBJ-0111');
  });

  it('Grand Gallery node exists with correct object ID', () => {
    const all = graph.getAllNodes();
    const gg = all.find((n) => n.name === 'Grand Gallery');
    expect(gg).toBeDefined();
    expect(gg?.metadata.objectId).toBe('OBJ-0109');
  });

  it('Subterranean Chamber node exists with correct object ID', () => {
    const all = graph.getAllNodes();
    const sub = all.find((n) => n.name === 'Subterranean Chamber');
    expect(sub).toBeDefined();
    expect(sub?.metadata.objectId).toBe('OBJ-0106');
  });

  it('all nodes are visible by default', () => {
    const all = graph.getAllNodes();
    for (const node of all) {
      expect(node.visible).toBe(true);
    }
  });

  it('has 26 mesh nodes (excluding root and layer groups)', () => {
    const all = graph.getAllNodes();
    const layerGroupIds = new Set([
      'gp-root',
      'gp-exterior',
      'gp-passages',
      'gp-subterranean',
      'gp-gallery',
      'gp-kings-complex',
      'gp-queens-complex',
      'gp-relieving',
      'gp-shafts',
    ]);
    const meshNodes = all.filter((n) => !layerGroupIds.has(n.id));
    expect(meshNodes).toHaveLength(26);
  });
});

describe('Combined Seed Loading', () => {
  it('loads both monuments with no ID collisions', () => {
    const combined = loadAndValidateSeed();
    const evIds = combined.evidence.map((e) => e.id);
    const srcIds = combined.sources.map((s) => s.id);
    const objIds = combined.objects.map((o) => o.id);
    const locIds = combined.locations.map((l) => l.id);

    expect(new Set(evIds).size).toBe(evIds.length);
    expect(new Set(srcIds).size).toBe(srcIds.length);
    expect(new Set(objIds).size).toBe(objIds.length);
    expect(new Set(locIds).size).toBe(locIds.length);
  });

  it('combined seed has evidence from both monuments', () => {
    const combined = loadAndValidateSeed();
    expect(combined.evidence.length).toBeGreaterThanOrEqual(37);
    expect(combined.sources.length).toBeGreaterThanOrEqual(9);
    expect(combined.objects.length).toBeGreaterThanOrEqual(35);
  });
});
