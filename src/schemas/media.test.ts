import { describe, it, expect } from 'vitest';
import { MediaSchema, MediaType, MediaId } from './media';

const validMedia = {
  id: 'MED-0421',
  type: 'Photograph',
  url: 'https://example.com/photo.jpg',
  license: 'CC-BY-4.0',
  credit: 'Jane Doe',
  capturedDate: '2024-03-15',
  capturedBy: 'Jane Doe',
  evidenceIds: ['EV-000143'],
};

describe('MediaSchema', () => {
  it('accepts valid media', () => {
    const result = MediaSchema.safeParse(validMedia);
    expect(result.success).toBe(true);
  });

  it('applies defaults for empty strings', () => {
    const result = MediaSchema.safeParse({
      id: 'MED-0001',
      type: 'Video',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.url).toBe('');
      expect(result.data.license).toBe('');
      expect(result.data.evidenceIds).toEqual([]);
    }
  });

  it('rejects an invalid id', () => {
    const result = MediaSchema.safeParse({ ...validMedia, id: 'MEDIA-0421' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown media type', () => {
    const result = MediaSchema.safeParse({ ...validMedia, type: 'Hologram' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid evidence ID in evidenceIds', () => {
    const result = MediaSchema.safeParse({
      ...validMedia,
      evidenceIds: ['EV-001'],
    });
    expect(result.success).toBe(false);
  });

  it('exports all 8 media types', () => {
    expect(MediaType.options).toHaveLength(8);
    expect(MediaType.options).toContain('3D capture');
  });

  it('MediaId validates the MED-NNNN format', () => {
    expect(MediaId.safeParse('MED-0001').success).toBe(true);
    expect(MediaId.safeParse('MED-001').success).toBe(false);
    expect(MediaId.safeParse('MED-00001').success).toBe(false);
  });
});
