import { describe, it, expect } from 'vitest';
import { AnnotationSchema, AnnotationType } from './annotation';

const validAnnotation = {
  id: 'ANN-0001',
  type: 'Research Note',
  author: 'Jane Doe',
  text: 'Chamber floor shows water erosion',
  location: 'LOC-001',
  visible: true,
};

describe('AnnotationSchema', () => {
  it('accepts a valid annotation', () => {
    const result = AnnotationSchema.safeParse(validAnnotation);
    expect(result.success).toBe(true);
  });

  it('applies defaults for text and visible', () => {
    const result = AnnotationSchema.safeParse({
      id: 'ANN-0002',
      type: 'Editorial',
      author: 'Editor',
      location: 'LOC-002',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toBe('');
      expect(result.data.visible).toBe(true);
    }
  });

  it('rejects an invalid id format', () => {
    const result = AnnotationSchema.safeParse({ ...validAnnotation, id: 'ANN-001' });
    expect(result.success).toBe(false);
  });

  it('rejects an unknown annotation type', () => {
    const result = AnnotationSchema.safeParse({ ...validAnnotation, type: 'Random' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing author', () => {
    const result = AnnotationSchema.safeParse({ ...validAnnotation, author: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing location', () => {
    const result = AnnotationSchema.safeParse({ ...validAnnotation, location: '' });
    expect(result.success).toBe(false);
  });

  it('exports the AnnotationType enum with 5 values', () => {
    expect(AnnotationType.options).toHaveLength(5);
  });
});
