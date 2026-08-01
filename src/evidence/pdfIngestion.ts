/**
 * PDF / text ingestion helper per M03.5 Scientific Content Pipeline.
 *
 * Turns a file (PDF byte buffer or plain text) into an `IngestedDocument` with
 * a flat text buffer and lightweight metadata. The extractor is intentionally
 * simple — for production scans, pre-extracted OCR text should be fed in
 * directly via `ingestTextFile`.
 *
 * Related: `docs/architecture/content-pipeline.md`, `src/evidence/evidenceExtraction.ts`
 */

import { z } from 'zod';

// ─── Types ────────────────────────────────────────────────────────────────

export const DocumentMetadataSchema = z.object({
  title: z.string().default(''),
  author: z.string().default(''),
  pageCount: z.number().int().min(0).default(0),
  producer: z.string().default(''),
});

/**
 * Lightweight metadata captured during ingestion.
 */
export interface DocumentMetadata {
  title: string;
  author: string;
  pageCount: number;
  producer: string;
}

export const IngestedDocumentSchema = z.object({
  filename: z.string().min(1),
  text: z.string(),
  pages: z.number().int().min(0).default(1),
  metadata: DocumentMetadataSchema,
  extractedAt: z.string(),
});

/**
 * A document that has been ingested and is ready for evidence extraction.
 */
export interface IngestedDocument {
  filename: string;
  text: string;
  pages: number;
  metadata: DocumentMetadata;
  extractedAt: string;
}

// ─── PDF text extraction ──────────────────────────────────────────────────

/**
 * Extracts text from a PDF byte buffer by collecting text-showing operators
 * between `BT` and `ET` markers (`Tj`, `TJ`, `'`, `"`).
 *
 * This is a deliberately simple extractor: it does not reflow columns or
 * decode CID-keyed fonts. It is sufficient for text-based PDFs (reports,
 * journal articles) and serves as a fallback when no OCR layer is available.
 *
 * @param buffer - Raw PDF bytes.
 * @returns Concatenated text content, pages separated by form-feed (`\f`).
 */
export function extractTextFromPDF(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Latin-1 preserves byte values 1:1 — PDF content streams are ASCII-safe.
  let raw = '';
  for (const byte of bytes) {
    raw += String.fromCharCode(byte);
  }

  const pages: string[] = [];
  // Split on page boundaries via /Type /Page (not /Pages).
  const pageSplit = raw.split(/\/Type\s*\/Page[^s]/);
  // The first chunk is the header; the rest are page bodies.
  for (let i = 1; i < pageSplit.length; i++) {
    pages.push(extractTextBlock(pageSplit[i]));
  }

  if (pages.length === 0) {
    // Fallback: treat the whole document as one page.
    return extractTextBlock(raw);
  }

  return pages.join('\f');
}

/**
 * Extracts text from a single content block by scanning `BT … ET` ranges
 * and pulling string operands of `Tj`, `TJ`, `'`, and `"`.
 */
function extractTextBlock(block: string): string {
  const lines: string[] = [];
  const btEtPattern = /BT([\s\S]*?)ET/g;
  let btMatch: RegExpExecArray | null;
  while ((btMatch = btEtPattern.exec(block)) !== null) {
    const segment = btMatch[1];
    if (!segment) continue;
    // Match `(` parenthesised strings `)` optionally preceded by an array `[ ... ]`.
    const stringPattern = /\(((?:\\.|[^\\()])*)\)/g;
    let sMatch: RegExpExecArray | null;
    while ((sMatch = stringPattern.exec(segment)) !== null) {
      const decoded = decodePdfString(sMatch[1] ?? '');
      if (decoded.trim().length > 0) {
        lines.push(decoded);
      }
    }
  }
  return lines.join('\n');
}

/**
 * Decodes PDF string escape sequences.
 */
function decodePdfString(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\b/g, '\b')
    .replace(/\\f/g, '\f')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\(\d{1,3})/g, (_m, oct: string) => String.fromCharCode(parseInt(oct, 8)));
}

// ─── Metadata extraction ──────────────────────────────────────────────────

function extractMetadata(raw: string, fallbackPages: number): DocumentMetadata {
  const titleMatch = raw.match(/\/Title\s*\(([^)]*)\)/);
  const authorMatch = raw.match(/\/Author\s*\(([^)]*)\)/);
  const producerMatch = raw.match(/\/Producer\s*\(([^)]*)\)/);
  const pageCountMatch = raw.match(/\/Count\s+(\d+)/);

  return {
    title: titleMatch ? decodePdfString(titleMatch[1] ?? '') : '',
    author: authorMatch ? decodePdfString(authorMatch[1] ?? '') : '',
    pageCount: pageCountMatch ? parseInt(pageCountMatch[1] ?? '0', 10) : fallbackPages,
    producer: producerMatch ? decodePdfString(producerMatch[1] ?? '') : '',
  };
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Parses PDF content into an `IngestedDocument`.
 *
 * Accepts either a raw PDF byte buffer or a pre-extracted text string. When a
 * string is passed, it is treated as already-extracted text (page breaks
 * preserved via form-feed).
 *
 * @param file - PDF bytes (`ArrayBuffer`) or pre-extracted text.
 * @param filename - Optional filename; defaults to `document.pdf` or `document.txt`.
 * @returns Ingested document ready for evidence extraction.
 */
export function ingestPDF(file: ArrayBuffer | string, filename = 'document.pdf'): IngestedDocument {
  const isBuffer = typeof file !== 'string';
  const text = isBuffer ? extractTextFromPDF(file) : file;
  const rawForMeta = isBuffer
    ? Array.from(new Uint8Array(file))
        .map((b) => String.fromCharCode(b))
        .join('')
    : text;

  const pageBreaks = (text.match(/\f/g) ?? []).length;
  const pages = pageBreaks > 0 ? pageBreaks + 1 : 1;
  const metadata = extractMetadata(rawForMeta, pages);
  // Prefer the metadata page count when available and greater.
  const finalPages = metadata.pageCount > 0 ? metadata.pageCount : pages;

  return {
    filename,
    text,
    pages: finalPages,
    metadata,
    extractedAt: new Date().toISOString(),
  };
}

/**
 * Parses plain text into an `IngestedDocument`. Form-feed characters in the
 * text are treated as page breaks.
 *
 * @param text - Plain text content.
 * @param filename - Filename for the document.
 * @returns Ingested document ready for evidence extraction.
 */
export function ingestTextFile(text: string, filename: string): IngestedDocument {
  const pageBreaks = (text.match(/\f/g) ?? []).length;
  const pages = pageBreaks > 0 ? pageBreaks + 1 : 1;

  return {
    filename,
    text,
    pages,
    metadata: {
      title: filename,
      author: '',
      pageCount: pages,
      producer: 'text/plain',
    },
    extractedAt: new Date().toISOString(),
  };
}
