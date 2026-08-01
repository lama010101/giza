/**
 * Evidence extraction tooling per M03.5 Scientific Content Pipeline.
 *
 * Scans raw text (from PDFs or plain-text field notes) for *candidate* evidence
 * records using pattern matchers. Extraction is propose-only — every candidate
 * is tagged with a heuristic confidence score and must pass the review workflow
 * before it becomes a canonical `Evidence` record.
 *
 * Related: `docs/architecture/content-pipeline.md`, `src/evidence/reviewWorkflow.ts`
 */

import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────────────

export const EvidenceClass = z.enum(['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8']);
export type EvidenceClass = z.infer<typeof EvidenceClass>;

export const ExtractedEvidenceSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
  evidenceClass: EvidenceClass,
  confidence: z.number().int().min(0).max(100),
  page: z.number().int().min(0).default(0),
  rawText: z.string().default(''),
});

/**
 * A candidate evidence record extracted from raw text.
 *
 * This is NOT a canonical `Evidence` record — it must be reviewed and approved
 * before promotion. See `reviewExtractedEvidence()`.
 */
export interface ExtractedEvidence {
  /** Short human-readable label for the candidate. */
  title: string;
  /** Cleaned snippet surrounding the match. */
  text: string;
  /** Heuristic evidence class (E1–E8). */
  evidenceClass: EvidenceClass;
  /** Heuristic confidence 0–100. */
  confidence: number;
  /** 1-based page number for PDF input; 0 for plain text. */
  page: number;
  /** The exact substring that matched. */
  rawText: string;
}

export const ReviewableEvidenceSchema = z.object({
  draftId: z.string().min(1),
  evidence: ExtractedEvidenceSchema,
  status: z.enum(['pending', 'approved', 'rejected', 'revised']).default('pending'),
  reviewLog: z
    .array(
      z.object({
        reviewer: z.string().default(''),
        decision: z.enum(['approve', 'reject', 'revise']).default('approve'),
        comments: z.string().default(''),
        date: z.string().default(''),
      }),
    )
    .default([]),
  createdAt: z.string().default(''),
});

/**
 * An extracted evidence candidate wrapped in a review envelope.
 */
export interface ReviewableEvidence {
  draftId: string;
  evidence: ExtractedEvidence;
  status: 'pending' | 'approved' | 'rejected' | 'revised';
  reviewLog: {
    reviewer: string;
    decision: 'approve' | 'reject' | 'revise';
    comments: string;
    date: string;
  }[];
  createdAt: string;
}

// ─── Pattern matchers ─────────────────────────────────────────────────────

/**
 * Matches measurements such as "5.24m", "10.47 m", "230.4 cm", "3 cubits".
 */
export const MEASUREMENT_PATTERN = /(\d+(?:\.\d+)?\s?(?:m|cm|mm|km|cubits?)\b)/gi;

/**
 * Matches lat/long coordinates such as "29.9792°N", "31.1342°E", "N29°58' E31°08'".
 */
export const COORDINATE_PATTERN =
  /(\d{1,3}(?:\.\d+)?°[NS]\s*[, ]?\s*\d{1,3}(?:\.\d+)?°[EW]|N\s*\d{1,3}(?:\.\d+)?°?\s*E\s*\d{1,3}(?:\.\d+)?°?)/gi;

/**
 * Matches years from 1600–2099, or "ca. 1883" style dates.
 */
export const DATE_PATTERN = /(\bca\.\s?(1[6-9]\d{2}|20\d{2})\b|\b(?:1[6-9]\d{2}|20\d{2})\b)/gi;

/**
 * Matches author-year citations such as "(Petrie 1883)" or "(Dash and Paulson 2016)".
 */
export const CITATION_PATTERN = /\(((?:[A-Z][a-z]+(?:,? (?:and|&) )?)+\s?\d{4}[a-z]?)\)/g;

interface Matcher {
  pattern: RegExp;
  evidenceClass: EvidenceClass;
  build: (match: string, page: number, context: string) => ExtractedEvidence;
}

function snippetAround(text: string, match: string, radius = 60): string {
  const idx = text.indexOf(match);
  if (idx === -1) return match;
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + match.length + radius);
  return text.slice(start, end).replace(/\s+/g, ' ').trim();
}

function titleFromMatch(match: string, evidenceClass: EvidenceClass): string {
  const prefix: Record<EvidenceClass, string> = {
    E1: 'Coordinate',
    E2: 'Measurement',
    E3: 'Observation',
    E4: 'Inference',
    E5: 'Reconstruction',
    E6: 'Date',
    E7: 'Comparison',
    E8: 'Citation',
  };
  return `${prefix[evidenceClass]}: ${match}`.slice(0, 80);
}

const matchers: Matcher[] = [
  {
    pattern: MEASUREMENT_PATTERN,
    evidenceClass: 'E2',
    build: (match, page, context) => {
      const hasDecimal = /\.\d/.test(match);
      const confidence = hasDecimal ? 80 : 60;
      return {
        title: titleFromMatch(match, 'E2'),
        text: snippetAround(context, match),
        evidenceClass: 'E2',
        confidence,
        page,
        rawText: match,
      };
    },
  },
  {
    pattern: COORDINATE_PATTERN,
    evidenceClass: 'E1',
    build: (match, page, context) => {
      const hasPair = /[NS].*[EW]/.test(match);
      return {
        title: titleFromMatch(match, 'E1'),
        text: snippetAround(context, match),
        evidenceClass: 'E1',
        confidence: hasPair ? 85 : 65,
        page,
        rawText: match,
      };
    },
  },
  {
    pattern: DATE_PATTERN,
    evidenceClass: 'E6',
    build: (match, page, context) => ({
      title: titleFromMatch(match, 'E6'),
      text: snippetAround(context, match),
      evidenceClass: 'E6',
      confidence: 55,
      page,
      rawText: match,
    }),
  },
  {
    pattern: CITATION_PATTERN,
    evidenceClass: 'E8',
    build: (match, page, context) => {
      const hasYear = /\d{4}/.test(match);
      return {
        title: titleFromMatch(match, 'E8'),
        text: snippetAround(context, match),
        evidenceClass: 'E8',
        confidence: hasYear ? 75 : 50,
        page,
        rawText: match,
      };
    },
  },
];

function runMatchers(text: string, page: number): ExtractedEvidence[] {
  const results: ExtractedEvidence[] = [];
  for (const matcher of matchers) {
    // Reset lastIndex because the patterns are global and reused.
    matcher.pattern.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = matcher.pattern.exec(text)) !== null) {
      const matched = m[1] ?? m[0];
      results.push(matcher.build(matched, page, text));
    }
  }
  return results;
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Extracts potential evidence records from raw text using pattern matching
 * (citations, measurements, dates, coordinates).
 *
 * @param text - Raw text to scan.
 * @returns Array of candidate evidence records (page = 0).
 */
export function extractEvidenceFromText(text: string): ExtractedEvidence[] {
  if (!text || text.trim().length === 0) return [];
  return runMatchers(text, 0);
}

/**
 * Extracts potential evidence records from PDF-extracted text. Splits on
 * form-feed (`\f`) page breaks so each candidate carries a 1-based page number.
 *
 * @param pdfText - Text extracted from a PDF (see `pdfIngestion.extractTextFromPDF`).
 * @returns Array of candidate evidence records with page numbers.
 */
export function extractEvidenceFromPDF(pdfText: string): ExtractedEvidence[] {
  if (!pdfText || pdfText.trim().length === 0) return [];
  const pages = pdfText.split('\f');
  const results: ExtractedEvidence[] = [];
  pages.forEach((pageText, index) => {
    if (pageText.trim().length === 0) return;
    results.push(...runMatchers(pageText, index + 1));
  });
  return results;
}

let draftCounter = 0;

function nextDraftId(): string {
  draftCounter += 1;
  return `DRAFT-${String(draftCounter).padStart(4, '0')}`;
}

/**
 * Resets the internal draft counter. Intended for test isolation only.
 */
export function _resetDraftCounterForTests(): void {
  draftCounter = 0;
}

/**
 * Wraps extracted evidence candidates in review envelopes for the review
 * workflow. Each candidate gets a stable `draftId`, a `pending` status, and
 * an empty review log.
 *
 * @param extracted - Candidates produced by `extractEvidenceFromText` / `extractEvidenceFromPDF`.
 * @returns Reviewable evidence envelopes ready for the review workflow.
 */
export function reviewExtractedEvidence(extracted: ExtractedEvidence[]): ReviewableEvidence[] {
  const now = new Date().toISOString();
  return extracted.map((evidence) => ({
    draftId: nextDraftId(),
    evidence,
    status: 'pending',
    reviewLog: [],
    createdAt: now,
  }));
}
