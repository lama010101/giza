import { z } from 'zod';

/**
 * Annotation schema per GIZA - 05 Data Architecture §-11.
 *
 * Annotations are user-generated or editorial notes attached to a location
 * in the scene. Future versions will support collaborative annotations.
 */
export const AnnotationType = z.enum([
  'Research Note',
  'Editorial',
  'Question',
  'Hypothesis Note',
  'Correction',
]);

export type AnnotationType = z.infer<typeof AnnotationType>;

export const AnnotationSchema = z.object({
  id: z.string().regex(/^ANN-\d{4}$/, 'Expected ANN-NNNN'),
  type: AnnotationType,
  author: z.string().min(1),
  text: z.string().default(''),
  location: z.string().min(1),
  visible: z.boolean().default(true),
});

export type Annotation = z.infer<typeof AnnotationSchema>;
