import { describe, it, expect, beforeEach } from 'vitest';
import { ingestTextFile, ingestPDF, extractTextFromPDF } from './pdfIngestion';
import {
  extractEvidenceFromText,
  extractEvidenceFromPDF,
  reviewExtractedEvidence,
  _resetDraftCounterForTests,
} from './evidenceExtraction';
import {
  createHotspotFromEvidence,
  validateHotspotDraft,
  approveHotspotDraft,
} from './hotspotCreation';
import { runContentPipeline, type PipelineInput } from './contentPipeline';

describe('Content Pipeline — PDF Ingestion (M03.5)', () => {
  it('ingestTextFile wraps plain text with metadata', () => {
    const doc = ingestTextFile('The base is 230.4m wide.', 'notes.txt');
    expect(doc.filename).toBe('notes.txt');
    expect(doc.text).toBe('The base is 230.4m wide.');
    expect(doc.pages).toBe(1);
    expect(doc.metadata.title).toBe('notes.txt');
    expect(doc.metadata.producer).toBe('text/plain');
    expect(doc.extractedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('ingestTextFile counts form-feed page breaks', () => {
    const text = 'Page one\fPage two\fPage three';
    const doc = ingestTextFile(text, 'multi.txt');
    expect(doc.pages).toBe(3);
  });

  it('extractTextFromPDF pulls text from BT/ET markers', () => {
    // Minimal PDF-like content stream with two text blocks.
    const pdf = 'BT /F1 12 Tf (The base is 230.4m) Tj ET BT /F1 12 Tf (wide) Tj ET';
    const buffer = new TextEncoder().encode(pdf).buffer as ArrayBuffer;
    const text = extractTextFromPDF(buffer);
    expect(text).toContain('The base is 230.4m');
    expect(text).toContain('wide');
  });

  it('ingestPDF accepts pre-extracted text string', () => {
    const doc = ingestPDF('Pre-extracted text with 5.24m measurement.', 'report.pdf');
    expect(doc.filename).toBe('report.pdf');
    expect(doc.text).toContain('5.24m');
  });
});

describe('Content Pipeline — Evidence Extraction (M03.5)', () => {
  it('extracts measurements from text', () => {
    const extracted = extractEvidenceFromText("The King's Chamber is 10.47m high and 5.24m wide.");
    const measurements = extracted.filter((e) => e.evidenceClass === 'E2');
    expect(measurements.length).toBeGreaterThanOrEqual(2);
    const values = measurements.map((m) => m.rawText);
    expect(values).toContain('10.47m');
    expect(values).toContain('5.24m');
  });

  it('assigns higher confidence to decimal measurements', () => {
    const extracted = extractEvidenceFromText('Height 5.24m and count 3 cubits.');
    const decimal = extracted.find((e) => e.rawText === '5.24m');
    const integer = extracted.find((e) => e.rawText.includes('cubits'));
    expect(decimal!.confidence).toBeGreaterThan(integer!.confidence);
  });

  it('extracts coordinates', () => {
    const extracted = extractEvidenceFromText('The pyramid sits at 29.9792°N, 31.1342°E.');
    const coords = extracted.filter((e) => e.evidenceClass === 'E1');
    expect(coords.length).toBeGreaterThanOrEqual(1);
    expect(coords[0].confidence).toBeGreaterThanOrEqual(80);
  });

  it('extracts author-year citations', () => {
    const extracted = extractEvidenceFromText('The survey (Petrie 1883) established the baseline.');
    const citations = extracted.filter((e) => e.evidenceClass === 'E8');
    expect(citations.length).toBeGreaterThanOrEqual(1);
    expect(citations[0].rawText).toContain('Petrie 1883');
  });

  it('extracts dates', () => {
    const extracted = extractEvidenceFromText('The work was conducted in 1925 and again in 2016.');
    const dates = extracted.filter((e) => e.evidenceClass === 'E6');
    expect(dates.length).toBeGreaterThanOrEqual(2);
  });

  it('extractEvidenceFromPDF assigns page numbers', () => {
    const pdfText = 'Page one has 5.24m\fPage two has (Lehner 1984)';
    const extracted = extractEvidenceFromPDF(pdfText);
    const pageOne = extracted.find((e) => e.rawText === '5.24m');
    const pageTwo = extracted.find((e) => e.evidenceClass === 'E8');
    expect(pageOne?.page).toBe(1);
    expect(pageTwo?.page).toBe(2);
  });

  it('reviewExtractedEvidence wraps candidates with draft IDs', () => {
    const extracted = extractEvidenceFromText('Height 5.24m.');
    const reviewed = reviewExtractedEvidence(extracted);
    expect(reviewed).toHaveLength(extracted.length);
    expect(reviewed[0].draftId).toMatch(/^DRAFT-\d{4}$/);
    expect(reviewed[0].status).toBe('pending');
    expect(reviewed[0].reviewLog).toEqual([]);
  });

  it('returns empty array for empty text', () => {
    expect(extractEvidenceFromText('')).toEqual([]);
    expect(extractEvidenceFromText('   ')).toEqual([]);
  });
});

describe('Content Pipeline — Hotspot Creation (M03.5)', () => {
  it('createHotspotFromEvidence produces a draft', () => {
    const draft = createHotspotFromEvidence('EV-100001', { x: 1, y: 2, z: 3 }, 'King Chamber');
    expect(draft.status).toBe('draft');
    expect(draft.evidenceId).toBe('EV-100001');
    expect(draft.label).toBe('King Chamber');
    expect(draft.id).toMatch(/^hotspot-\d{4}$/);
  });

  it('validateHotspotDraft passes for valid input', () => {
    const draft = createHotspotFromEvidence('EV-100001', { x: 0, y: 0, z: 0 }, 'Base');
    const result = validateHotspotDraft(draft);
    expect(result.passed).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validateHotspotDraft fails for empty label', () => {
    const draft = createHotspotFromEvidence('EV-100001', { x: 0, y: 0, z: 0 }, '');
    const result = validateHotspotDraft(draft);
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('label'))).toBe(true);
  });

  it('validateHotspotDraft fails for bad evidence ID format', () => {
    const draft = createHotspotFromEvidence('bad-id', { x: 0, y: 0, z: 0 }, 'Label');
    const result = validateHotspotDraft(draft);
    expect(result.passed).toBe(false);
    expect(result.errors.some((e) => e.includes('EV-NNNNNN'))).toBe(true);
  });

  it('validateHotspotDraft warns for out-of-bounds position', () => {
    const draft = createHotspotFromEvidence('EV-100001', { x: 9999, y: 0, z: 0 }, 'Far');
    const result = validateHotspotDraft(draft);
    expect(result.passed).toBe(true);
    expect(result.warnings.length).toBeGreaterThanOrEqual(1);
  });

  it('approveHotspotDraft promotes a valid draft', () => {
    const draft = createHotspotFromEvidence('EV-100001', { x: 1, y: 2, z: 3 }, 'Chamber');
    const approved = approveHotspotDraft(draft, 85);
    expect(approved.id).toBe(draft.id);
    expect(approved.confidence).toBe(85);
    expect(approved.approvedAt).toMatch(/^\d{4}-/);
  });

  it('approveHotspotDraft throws for invalid draft', () => {
    const draft = createHotspotFromEvidence('bad', { x: 0, y: 0, z: 0 }, 'Label');
    expect(() => approveHotspotDraft(draft)).toThrow();
  });

  it('approveHotspotDraft clamps confidence to 0–100', () => {
    const draft = createHotspotFromEvidence('EV-100001', { x: 0, y: 0, z: 0 }, 'Label');
    expect(approveHotspotDraft(draft, 150).confidence).toBe(100);
    expect(approveHotspotDraft(draft, -10).confidence).toBe(0);
  });
});

describe('Content Pipeline — End-to-End (M03.5)', () => {
  beforeEach(() => {
    _resetDraftCounterForTests();
  });

  it('runContentPipeline ingests text and extracts evidence', () => {
    const input: PipelineInput = {
      texts: ['The chamber is 5.24m wide (Petrie 1883). Coordinates 29.9792°N, 31.1342°E.'],
    };
    const result = runContentPipeline(input);
    expect(result.documents).toHaveLength(1);
    expect(result.extracted.length).toBeGreaterThanOrEqual(3);
    expect(result.reviewed).toHaveLength(result.extracted.length);
    expect(result.reviewed.every((r) => r.status === 'pending')).toBe(true);
    expect(result.approved).toEqual([]);
    expect(result.hotspots).toEqual([]);
  });

  it('runContentPipeline auto-approves when autoApprove is set', () => {
    const input: PipelineInput = {
      texts: ['Height 5.24m.'],
      autoApprove: true,
    };
    const result = runContentPipeline(input);
    expect(result.reviewed.every((r) => r.status === 'approved')).toBe(true);
    expect(result.approved.length).toBe(result.reviewed.length);
  });

  it('runContentPipeline creates hotspots for approved evidence with positions', () => {
    const text = 'Height 5.24m. Width 10.47m.';
    const input: PipelineInput = {
      texts: [text],
      autoApprove: true,
      hotspotPositions: {
        'EV-000001': { x: 10, y: 20, z: 30 },
      },
    };
    const result = runContentPipeline(input);
    // At least one hotspot should be created for the first approved evidence.
    expect(result.hotspotDrafts.length).toBeGreaterThanOrEqual(1);
    expect(result.hotspots.length).toBeGreaterThanOrEqual(1);
    expect(result.hotspots[0].position).toEqual({ x: 10, y: 20, z: 30 });
    expect(result.hotspots[0].confidence).toBeGreaterThan(0);
  });

  it('runContentPipeline collects errors without aborting', () => {
    const input: PipelineInput = {
      files: [
        { filename: 'bad.pdf', content: new ArrayBuffer(0), isPdf: true },
        { filename: 'good.txt', content: 'Height 5.24m.' },
      ],
    };
    const result = runContentPipeline(input);
    expect(result.documents.length).toBeGreaterThanOrEqual(1);
    expect(result.extracted.length).toBeGreaterThanOrEqual(1);
    // The empty PDF may produce no text but should not throw.
    expect(result.errors).toBeDefined();
  });

  it('runContentPipeline handles empty input gracefully', () => {
    const result = runContentPipeline({});
    expect(result.documents).toEqual([]);
    expect(result.extracted).toEqual([]);
    expect(result.reviewed).toEqual([]);
    expect(result.hotspots).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('runContentPipeline processes multiple text inputs', () => {
    const input: PipelineInput = {
      texts: ['Height 5.24m.', 'Width 10.47m.', 'Depth 3 cubits.'],
    };
    const result = runContentPipeline(input);
    expect(result.documents).toHaveLength(3);
    expect(result.extracted.length).toBeGreaterThanOrEqual(3);
  });
});
