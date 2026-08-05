import { describe, it, expect } from 'vitest';
import { getVisibilityLayer } from './visibilityLayers';

describe('getVisibilityLayer', () => {
  it('maps overlay nodes to Theory', () => {
    expect(getVisibilityLayer({ id: 'chamber-i-water', layer: 'level-3', overlay: 'water' })).toBe(
      'Theory',
    );
    expect(
      getVisibilityLayer({ id: 'northern-conduit-flow', layer: 'level-3', overlay: 'flow' }),
    ).toBe('Theory');
  });

  it('maps surface geology to Geology', () => {
    expect(getVisibilityLayer({ id: 'surface-bedrock', layer: 'level-0' })).toBe('Geology');
    expect(getVisibilityLayer({ id: 'surface-desert', layer: 'level-0' })).toBe('Geology');
  });

  it('maps surface modern additions to Modern', () => {
    expect(getVisibilityLayer({ id: 'surface-fencing', layer: 'level-0' })).toBe('Modern');
    expect(getVisibilityLayer({ id: 'surface-visitor-path-n', layer: 'level-0' })).toBe('Modern');
    expect(getVisibilityLayer({ id: 'surface-reference-marker-1', layer: 'level-0' })).toBe(
      'Modern',
    );
  });

  it('maps water nodes to Water', () => {
    expect(getVisibilityLayer({ id: 'shaft-a-water', layer: 'shafts' })).toBe('Water');
  });

  it('maps structural nodes to Geometry', () => {
    expect(getVisibilityLayer({ id: 'shaft-a', layer: 'shafts' })).toBe('Geometry');
    expect(getVisibilityLayer({ id: 'chamber-i', layer: 'level-3' })).toBe('Geometry');
  });
});
