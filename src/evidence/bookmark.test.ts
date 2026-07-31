import { describe, it, expect } from 'vitest';
import {
  createBookmark,
  bookmarkToJSON,
  bookmarkFromJSON,
  bookmarkToBase64,
  bookmarkFromBase64,
  bookmarkToURL,
  bookmarkFromURL,
  BookmarkSchema,
} from './bookmark';

function makeBookmarkInput() {
  return {
    id: 'bm-001',
    name: "King's Chamber View",
    camera: {
      position: { x: 0, y: 43, z: 0 },
      target: { x: 0, y: 43, z: 5 },
      mode: 'orbit',
    },
    visibleLayers: ['kings-complex'] as const,
    hiddenLayers: ['exterior', 'passages'] as const,
    activeHypothesisIds: ['hydraulic'],
    lighting: { ambient: 0.3, directional: 0.7, local: 0.5 },
    selectedObjectId: 'OBJ-0111',
    selectedEvidenceId: 'EV-100011',
    notes: 'Notable relieving chambers above',
  };
}

describe('Bookmark System (M08-T07)', () => {
  it('creates a bookmark with all 6 fields', () => {
    const bm = createBookmark(makeBookmarkInput());
    expect(bm.id).toBe('bm-001');
    expect(bm.name).toBe("King's Chamber View");
    expect(bm.camera.position.y).toBe(43);
    expect(bm.visibleLayers).toEqual(['kings-complex']);
    expect(bm.hiddenLayers).toEqual(['exterior', 'passages']);
    expect(bm.activeHypothesisIds).toEqual(['hydraulic']);
    expect(bm.lighting?.ambient).toBe(0.3);
    expect(bm.selectedObjectId).toBe('OBJ-0111');
    expect(bm.selectedEvidenceId).toBe('EV-100011');
    expect(bm.notes).toBe('Notable relieving chambers above');
    expect(bm.createdAt).toBeTruthy();
  });

  it('defaults notes to empty string', () => {
    const input = makeBookmarkInput();
    delete (input as Partial<typeof input>).notes;
    const bm = createBookmark(input);
    expect(bm.notes).toBe('');
  });

  it('defaults selectedObjectId to null', () => {
    const input = makeBookmarkInput();
    delete (input as Partial<typeof input>).selectedObjectId;
    const bm = createBookmark(input);
    expect(bm.selectedObjectId).toBeNull();
  });

  it('round-trips through JSON', () => {
    const bm = createBookmark(makeBookmarkInput());
    const json = bookmarkToJSON(bm);
    const restored = bookmarkFromJSON(json);
    expect(restored).toEqual(bm);
  });

  it('round-trips through base64', () => {
    const bm = createBookmark(makeBookmarkInput());
    const encoded = bookmarkToBase64(bm);
    const restored = bookmarkFromBase64(encoded);
    expect(restored).toEqual(bm);
  });

  it('encodes as URL with bm query param', () => {
    const bm = createBookmark(makeBookmarkInput());
    const url = bookmarkToURL(bm, 'https://giza.example.com');
    expect(url).toContain('?bm=');
    expect(url.startsWith('https://giza.example.com?bm=')).toBe(true);
  });

  it('decodes from URL', () => {
    const bm = createBookmark(makeBookmarkInput());
    const url = bookmarkToURL(bm, 'https://giza.example.com');
    const restored = bookmarkFromURL(url);
    expect(restored).toEqual(bm);
  });

  it('returns null for URL without bookmark param', () => {
    expect(bookmarkFromURL('https://giza.example.com')).toBeNull();
  });

  it('validates bookmark schema', () => {
    const bm = createBookmark(makeBookmarkInput());
    expect(() => BookmarkSchema.parse(bm)).not.toThrow();
  });

  it('rejects bookmark without required camera field', () => {
    expect(() =>
      BookmarkSchema.parse({
        id: 'bm-1',
        name: 'Test',
        createdAt: '2026-01-01',
        visibleLayers: [],
        hiddenLayers: [],
        activeHypothesisIds: [],
      }),
    ).toThrow();
  });
});
