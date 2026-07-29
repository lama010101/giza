import { describe, it, expect } from 'vitest';
import { loadAndValidateSeed } from './seed';
import { getEvidenceById, getObjectById, getSourceById } from '@/evidence/repository';

describe('Osiris Shaft seed', () => {
  it('validates every record against Zod schemas', () => {
    const validated = loadAndValidateSeed();
    expect(validated.evidence.length).toBeGreaterThanOrEqual(10);
    expect(validated.objects.length).toBeGreaterThanOrEqual(1);
    expect(validated.sources.length).toBeGreaterThanOrEqual(1);
    expect(validated.locations.length).toBeGreaterThanOrEqual(1);
  });

  it('links evidence to objects and sources', () => {
    const ev = getEvidenceById('EV-000001');
    expect(ev).toBeDefined();
    expect(ev?.objectIds).toContain('OBJ-0001');
    expect(ev?.sourceIds).toContain('SRC-0001');

    const obj = getObjectById('OBJ-0001');
    expect(obj?.evidence).toContain('EV-000001');

    const src = getSourceById('SRC-0001');
    expect(src?.reliability).toBeGreaterThan(0);
  });
});
