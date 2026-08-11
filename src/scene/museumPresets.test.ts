import { describe, it, expect } from 'vitest';
import { getMuseumPresets } from './museumPresets';
import type { Monument } from '@/store/app';

describe('getMuseumPresets', () => {
  it('returns curated presets for the Great Pyramid', () => {
    const presets = getMuseumPresets('great-pyramid' as Monument);
    expect(presets.length).toBeGreaterThan(0);
    expect(presets.map((p) => p.name)).toContain('Pyramid Exterior');
    expect(presets[0].position).toHaveProperty('x');
    expect(presets[0].position).toHaveProperty('y');
    expect(presets[0].position).toHaveProperty('z');
    expect(presets[0].target).toHaveProperty('x');
    expect(presets[0].target).toHaveProperty('y');
    expect(presets[0].target).toHaveProperty('z');
    expect(presets[0].dwellSeconds).toBeGreaterThan(0);
  });

  it('returns curated presets for the Osiris Shaft', () => {
    const presets = getMuseumPresets('osiris');
    expect(presets.length).toBeGreaterThan(0);
    expect(presets.map((p) => p.name)).toContain('Osiris Shaft Surface');
  });

  it('returns different world-space positions for each monument', () => {
    const gp = getMuseumPresets('great-pyramid');
    const os = getMuseumPresets('osiris');
    expect(gp[0].position.x).not.toBe(os[0].position.x);
    expect(gp[0].position.z).not.toBe(os[0].position.z);
  });
});
