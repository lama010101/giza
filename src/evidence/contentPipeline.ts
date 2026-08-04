/**
 * End-to-end content pipeline integration per M03.5 Scientific Content Pipeline.
 *
 * Wires the ingestion, extraction, review, and hotspot-creation stages into a
 * single orchestrator. Each stage can also be invoked on its own — this module
 * adds no hidden behaviour.
 *
 * Flow: ingest → extract → review → approve → create hotspots
 *
 * Related: `docs/architecture/content-pipeline.md`
 */

import type { IngestedDocument } from './pdfIngestion';
import { ingestPDF, ingestTextFile } from './pdfIngestion';
import type { ExtractedEvidence, ReviewableEvidence } from './evidenceExtraction';
import {
  extractEvidenceFromText,
  extractEvidenceFromPDF,
  reviewExtractedEvidence,
} from './evidenceExtraction';
import type { Vector3, ApprovedHotspot, HotspotDraft } from './hotspotCreation';
import {
  createHotspotFromEvidence,
  validateHotspotDraft,
  approveHotspotDraft,
} from './hotspotCreation';
import type { SceneObject } from '@/schemas/object';
import { detectObjectReferences, type ObjectReference } from './objectLinkage';
import {
  captureSimulationParameters,
  type SimulationParameter,
} from './simulationParameterCapture';

// ─── Types ────────────────────────────────────────────────────────────────

/**
 * A single file input for the pipeline. PDFs may be passed as byte buffers or
 * pre-extracted text; plain-text files are passed as strings with a filename.
 */
export interface PipelineFile {
  /** Filename for the input. */
  filename: string;
  /** Raw PDF bytes (when `isPdf` is true) or plain-text content. */
  content: ArrayBuffer | string;
  /** Whether `content` is a PDF byte buffer. Defaults to false (text). */
  isPdf?: boolean;
}

/**
 * Input for `runContentPipeline`.
 */
export interface PipelineInput {
  /** Files to ingest (PDF or text). */
  files?: PipelineFile[];
  /** Plain-text strings to ingest (filenames auto-generated). */
  texts?: string[];
  /**
   * Map of evidenceId → position for hotspot creation. Only approved evidence
   * whose ID appears in this map will produce a hotspot.
   */
  hotspotPositions?: Record<string, Vector3>;
  /**
   * Test/admin path: when true, candidates are auto-approved (status set to
   * `approved`) without a human reviewer. Never use in production.
   */
  autoApprove?: boolean;
  /**
   * Optional object catalog for extracting object references from text and
   * proposing evidence → object links.
   */
  objectCatalog?: SceneObject[];
  /**
   * Optional simulation ID for extracting candidate simulation parameters from
   * the ingested text.
   */
  simulationId?: string;
}

/**
 * Result of running the content pipeline.
 */
export interface PipelineResult {
  /** Ingested documents. */
  documents: IngestedDocument[];
  /** All extracted evidence candidates. */
  extracted: ExtractedEvidence[];
  /** Reviewable evidence envelopes. */
  reviewed: ReviewableEvidence[];
  /** Evidence IDs that were approved (only when `autoApprove` is set). */
  approved: string[];
  /** Hotspot drafts created from approved evidence. */
  hotspotDrafts: HotspotDraft[];
  /** Approved hotspots ready for the scene. */
  hotspots: ApprovedHotspot[];
  /** Proposed evidence → object links (when `objectCatalog` is provided). */
  objectLinks: (ObjectReference & { evidenceId: string })[];
  /** Candidate simulation parameters (when `simulationId` is provided). */
  simulationParameters: SimulationParameter[];
  /** Non-fatal errors collected per file/stage. */
  errors: string[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function approveReviewable(reviewable: ReviewableEvidence): ReviewableEvidence {
  return {
    ...reviewable,
    status: 'approved',
    reviewLog: [
      ...reviewable.reviewLog,
      {
        reviewer: 'pipeline-auto',
        decision: 'approve',
        comments: 'Auto-approved by content pipeline (autoApprove=true)',
        date: new Date().toISOString(),
      },
    ],
  };
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Runs the full content pipeline: ingest → extract → review → approve →
 * create hotspots.
 *
 * Errors are collected, never thrown — a single bad file does not abort the
 * batch. Hotspots are only created for approved evidence whose ID appears in
 * `input.hotspotPositions`.
 *
 * @param input - Pipeline input (files, texts, hotspot positions, options).
 * @returns Pipeline result with extracted, reviewed, approved, and hotspot data.
 */
export function runContentPipeline(input: PipelineInput): PipelineResult {
  const documents: IngestedDocument[] = [];
  const extracted: ExtractedEvidence[] = [];
  const errors: string[] = [];

  // Stage 1: Ingest
  for (const file of input.files ?? []) {
    try {
      if (file.isPdf) {
        const doc = ingestPDF(file.content, file.filename);
        documents.push(doc);
        // Stage 2: Extract (PDF mode — page-aware)
        extracted.push(...extractEvidenceFromPDF(doc.text));
      } else if (typeof file.content === 'string') {
        const doc = ingestTextFile(file.content, file.filename);
        documents.push(doc);
        extracted.push(...extractEvidenceFromText(doc.text));
      } else {
        errors.push(`${file.filename}: non-PDF file content must be a string`);
      }
    } catch (e) {
      errors.push(`${file.filename}: ingestion failed — ${(e as Error).message}`);
    }
  }

  for (const text of input.texts ?? []) {
    try {
      const doc = ingestTextFile(text, `text-${documents.length + 1}.txt`);
      documents.push(doc);
      extracted.push(...extractEvidenceFromText(doc.text));
    } catch (e) {
      errors.push(`text input: ingestion failed — ${(e as Error).message}`);
    }
  }

  // Stage 3: Review (wrap candidates)
  let reviewed = reviewExtractedEvidence(extracted);

  // Stage 4: Approve (only when autoApprove is set)
  const approved: string[] = [];
  if (input.autoApprove) {
    reviewed = reviewed.map((r) => {
      const updated = approveReviewable(r);
      approved.push(updated.draftId);
      return updated;
    });
  }

  // Stage 5: Create hotspots for approved evidence with a position.
  const hotspotDrafts: HotspotDraft[] = [];
  const hotspots: ApprovedHotspot[] = [];
  const positions = input.hotspotPositions ?? {};

  if (input.autoApprove) {
    for (const reviewable of reviewed) {
      if (reviewable.status !== 'approved') continue;
      // Use the draftId as a stand-in evidence ID when no canonical EV- ID
      // exists yet. The hotspot validator expects EV-NNNNNN, so we skip
      // validation-only IDs here and just create the draft.
      const evidenceId = `EV-${reviewable.draftId.replace(/\D/g, '').padStart(6, '0')}`;
      const position = positions[evidenceId];
      if (!position) continue;

      const draft = createHotspotFromEvidence(evidenceId, position, reviewable.evidence.title);
      hotspotDrafts.push(draft);

      const validation = validateHotspotDraft(draft);
      if (validation.passed) {
        hotspots.push(approveHotspotDraft(draft, reviewable.evidence.confidence));
      } else {
        errors.push(`Hotspot draft ${draft.id} failed validation: ${validation.errors.join('; ')}`);
      }
    }
  }

  // Stage 6: Extract object references and simulation parameters from text.
  const objectLinks: (ObjectReference & { evidenceId: string })[] = [];
  const simulationParameters: SimulationParameter[] = [];

  if (input.autoApprove) {
    const objectCatalog = input.objectCatalog ?? [];
    const simulationId = input.simulationId;

    for (const reviewable of reviewed) {
      if (reviewable.status !== 'approved') continue;
      const evidenceId = `EV-${reviewable.draftId.replace(/\D/g, '').padStart(6, '0')}`;
      const text = `${reviewable.evidence.title} ${reviewable.evidence.text}`;

      if (objectCatalog.length > 0) {
        const refs = detectObjectReferences(text, objectCatalog);
        for (const ref of refs) {
          objectLinks.push({ evidenceId, ...ref });
        }
      }

      if (simulationId) {
        const params = captureSimulationParameters(text, {
          simulationId,
          evidenceIds: [evidenceId],
          provenance: 'Estimated',
        });
        simulationParameters.push(...params);
      }
    }
  }

  return {
    documents,
    extracted,
    reviewed,
    approved,
    hotspotDrafts,
    hotspots,
    objectLinks,
    simulationParameters,
    errors,
  };
}
