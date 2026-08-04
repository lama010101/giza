/**
 * Content pipeline review bridge per M03.5-T04.
 *
 * Wires the evidence extraction output into the formal review workflow
 * (src/evidence/reviewWorkflow.ts). Extracted evidence candidates are
 * converted into Evidence records, submitted to the evidence store,
 * and routed through the review workflow (assign → comment → decide →
 * publish).
 */

import type { EvidenceClass } from '@/schemas/evidence';
import type { SceneObject } from '@/schemas/object';
import { evidenceStore, type EvidenceStore } from './EvidenceStore';
import { assignReviewer, recordReviewDecision, allReviewsApproved } from './reviewWorkflow';
import { submitEvidence, verifyEvidence, publishEvidence } from './lifecycleController';
import type { ReviewableEvidence } from './evidenceExtraction';
import { detectObjectReferences, linkEvidenceToObjects } from './objectLinkage';
import {
  captureSimulationParameters,
  type SimulationParameter,
} from './simulationParameterCapture';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SubmissionResult {
  evidenceId: string;
  status: 'submitted' | 'failed';
  error?: string;
}

export interface ReviewRoutingResult {
  evidenceId: string;
  assignedReviewers: string[];
  status: 'in_review' | 'failed';
  error?: string;
}

export interface ObjectLinkResult {
  evidenceId: string;
  objectId: string;
  objectName: string;
  confidence: number;
}

export interface PipelineReviewResult {
  submissions: SubmissionResult[];
  routing: ReviewRoutingResult[];
  published: string[];
  objectLinks: ObjectLinkResult[];
  simulationParameters: SimulationParameter[];
  errors: string[];
}

export interface PipelineReviewOptions {
  /** Default reviewer to assign (ORCID or name). */
  defaultReviewer: string;
  /** Editor who initiates the review. */
  editor: string;
  /** Auto-publish when all reviews are approved. */
  autoPublish?: boolean;
  /** Optional object catalog for auto-linking published evidence to objects. */
  objectCatalog?: SceneObject[];
  /** Optional simulation ID for auto-capture of parameters from evidence text. */
  simulationId?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Maps an evidence class string from the extraction module to the
 * EvidenceClass enum used by the Evidence schema.
 */
function mapEvidenceClass(raw: string): EvidenceClass {
  const mapping: Record<string, EvidenceClass> = {
    E1: 'E1',
    E2: 'E2',
    E3: 'E3',
    E4: 'E4',
    E5: 'E5',
    E6: 'E6',
    E7: 'E7',
    E8: 'E8',
  };
  return mapping[raw] ?? 'E3';
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Converts extracted reviewable evidence into Evidence records and
 * submits them to the evidence store.
 */
export function submitExtractedEvidence(
  reviewables: ReviewableEvidence[],
  store: EvidenceStore = evidenceStore,
): SubmissionResult[] {
  const results: SubmissionResult[] = [];

  for (const r of reviewables) {
    try {
      // Use the store's create() method which handles schema validation
      // and auto-generates a unique EV- ID.
      const created = store.create({
        title: r.evidence.title,
        description: r.evidence.text,
        category: 'Measurement',
        primaryClass: mapEvidenceClass(r.evidence.evidenceClass),
        confidence: r.evidence.confidence,
        createdBy: 'content-pipeline',
      });

      // Transition Draft → Submitted so it can enter the review workflow
      submitEvidence(created.id, 'content-pipeline', store);

      results.push({ evidenceId: created.id, status: 'submitted' });
    } catch (e) {
      results.push({
        evidenceId: r.draftId,
        status: 'failed',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return results;
}

/**
 * Routes submitted evidence through the review workflow by assigning
 * a reviewer.
 */
export function routeToReview(
  submissions: SubmissionResult[],
  options: PipelineReviewOptions,
  store: EvidenceStore = evidenceStore,
): ReviewRoutingResult[] {
  const results: ReviewRoutingResult[] = [];

  for (const sub of submissions) {
    if (sub.status !== 'submitted') continue;
    try {
      assignReviewer(
        {
          evidenceId: sub.evidenceId,
          reviewer: options.defaultReviewer,
          editor: options.editor,
        },
        store,
      );
      results.push({
        evidenceId: sub.evidenceId,
        assignedReviewers: [options.defaultReviewer],
        status: 'in_review',
      });
    } catch (e) {
      results.push({
        evidenceId: sub.evidenceId,
        assignedReviewers: [],
        status: 'failed',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return results;
}

/**
 * Processes a review decision for a pipeline-submitted evidence record.
 * If autoPublish is enabled and all reviews are approved, the evidence
 * is automatically published.
 */
export function processPipelineReviewDecision(
  evidenceId: string,
  decision: 'approve' | 'reject' | 'revise',
  comment: string,
  reviewer: string,
  options: PipelineReviewOptions,
  store: EvidenceStore = evidenceStore,
): { published: boolean; status: string } {
  recordReviewDecision({ evidenceId, reviewer, decision, comment }, store);

  if (decision === 'approve' && options.autoPublish) {
    if (allReviewsApproved(evidenceId, store)) {
      // Lifecycle: In Review → Verified → Published
      verifyEvidence(evidenceId, options.editor, store);
      publishEvidence(evidenceId, options.editor, store);
      return { published: true, status: 'Published' };
    }
  }

  return { published: false, status: store.getById(evidenceId)?.status ?? 'Unknown' };
}

/**
 * Runs the full review bridge: submit extracted evidence → assign
 * reviewer → (optionally) auto-approve and publish.
 *
 * This is the main entry point for wiring content pipeline extraction
 * output into the formal review workflow.
 */
export function runPipelineReviewBridge(
  reviewables: ReviewableEvidence[],
  options: PipelineReviewOptions,
  store: EvidenceStore = evidenceStore,
): PipelineReviewResult {
  const errors: string[] = [];

  // Stage 1: Submit extracted evidence to the store
  const submissions = submitExtractedEvidence(reviewables, store);
  for (const s of submissions) {
    if (s.status === 'failed' && s.error) {
      errors.push(`Submission ${s.evidenceId} failed: ${s.error}`);
    }
  }

  // Stage 2: Route to review
  const routing = routeToReview(submissions, options, store);
  for (const r of routing) {
    if (r.status === 'failed' && r.error) {
      errors.push(`Routing ${r.evidenceId} failed: ${r.error}`);
    }
  }

  // Stage 3: Auto-approve and publish (if enabled)
  const published: string[] = [];
  if (options.autoPublish) {
    for (const r of routing) {
      if (r.status !== 'in_review') continue;
      try {
        const result = processPipelineReviewDecision(
          r.evidenceId,
          'approve',
          'Auto-approved by pipeline review bridge',
          options.defaultReviewer,
          options,
          store,
        );
        if (result.published) {
          published.push(r.evidenceId);
        }
      } catch (e) {
        errors.push(
          `Auto-approval ${r.evidenceId} failed: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }
  }

  // Stage 4: Object linkage and simulation parameter capture on published evidence.
  const objectLinks: ObjectLinkResult[] = [];
  const simulationParameters: SimulationParameter[] = [];

  for (const evidenceId of published) {
    const evidence = store.getById(evidenceId);
    if (!evidence) continue;

    const evidenceText = `${evidence.title} ${evidence.description}`;

    if (options.objectCatalog && options.objectCatalog.length > 0) {
      const refs = detectObjectReferences(evidenceText, options.objectCatalog);
      if (refs.length > 0) {
        try {
          linkEvidenceToObjects(evidenceId, refs, { relation: 'measured_from' }, store);
          objectLinks.push(...refs.map((ref) => ({ evidenceId, ...ref })));
        } catch (e) {
          errors.push(
            `Object linking ${evidenceId} failed: ${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    }

    if (options.simulationId) {
      const params = captureSimulationParameters(evidenceText, {
        simulationId: options.simulationId,
        evidenceIds: [evidenceId],
        provenance: 'Estimated',
      });
      simulationParameters.push(...params);
    }
  }

  return { submissions, routing, published, objectLinks, simulationParameters, errors };
}
