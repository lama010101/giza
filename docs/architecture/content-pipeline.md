# Scientific Content Pipeline

> **Milestone:** M03.5 — Scientific Content Pipeline
> **Related specs:** GIZA - 04 §6 (Technical Architecture), GIZA - 08 (Evidence Database Specification)
> **Status:** Active

## Overview

The Scientific Content Pipeline transforms raw scholarly material — PDFs, plain-text
field reports, and structured notes — into reviewed, evidence-linked hotspots that
appear in the 3D scene. The pipeline is deterministic, auditable, and never silently
promotes unreviewed content to a visible claim.

The pipeline has five stages:

```
Ingest ─▶ Extract ─▶ Review ─▶ Approve ─▶ Create Hotspots
```

Each stage is implemented as a small, pure, independently testable module under
`src/evidence/`. The orchestrator (`contentPipeline.ts`) wires the stages together
but does not add hidden behaviour — every stage can be invoked on its own.

## Stage 1 — Ingestion (`pdfIngestion.ts`)

Responsibility: turn a file (PDF or plain text) into an `IngestedDocument` with a
flat text buffer and lightweight metadata.

- `ingestPDF(file: ArrayBuffer | string): IngestedDocument`
  - Accepts a raw PDF byte buffer **or** a pre-extracted text string.
  - Uses `extractTextFromPDF()` to pull text from `BT … ET` content-stream
    markers. This is intentionally a *simple* extractor — it does not reflow
    columns or decode CID fonts. For production scans the text should be
    pre-extracted with an OCR step and passed in as a string.
- `ingestTextFile(text: string, filename: string): IngestedDocument`
  - Wraps plain-text input (field notes, CSV exports, markdown) in the same
    document shape.
- `extractTextFromPDF(buffer: ArrayBuffer): string`
  - Decodes the buffer as Latin-1, then collects every text-showing operator
    between `BT` and `ET` markers (`Tj`, `TJ`, `'`, `"`). Returns a single
    newline-joined string.

`IngestedDocument` fields: `filename`, `text`, `pages`, `metadata`,
`extractedAt`. `pages` is a best-effort count derived from `/Type /Page`
occurrences; for text input it defaults to `1`.

### Design note

We deliberately avoid a heavy PDF dependency in the core pipeline. The
extractor is a fallback; the canonical path is to feed already-OCR'd text.
This keeps the pipeline dependency-free and deterministic in CI.

## Stage 2 — Evidence Extraction (`evidenceExtraction.ts`)

Responsibility: scan an ingested document for *candidate* evidence records
using pattern matchers. Extraction is **propose-only** — every candidate is
tagged with a confidence score and must pass review before it becomes an
`Evidence` record.

Pattern matchers:

| Matcher        | Pattern (regex)                                   | Evidence class |
| -------------- | ------------------------------------------------- | -------------- |
| Measurement    | `\d+(?:\.\d+)?\s?(?:m|cm|mm|cubits?)\b`           | E2 (measured)  |
| Coordinate     | `\d{1,3}(?:\.\d+)?°[NS]` / `°[EW]` or `N\d+ E\d+` | E1 (location)  |
| Date           | `\b(?:1[6-9]\d{2}|20\d{2})\b` or `ca\. \d{4}`     | E6 (chronology)|
| Citation       | `\((?:[A-Z][a-z]+(?:,? (?:and|&) )?)+ \d{4}[a-z]?\)` | E8 (citation) |

`ExtractedEvidence` fields: `title`, `text`, `evidenceClass`, `confidence`,
`page`, `rawText`.

- `extractEvidenceFromText(text: string): ExtractedEvidence[]`
  - Runs all matchers over a plain-text buffer.
- `extractEvidenceFromPDF(pdfText: string): ExtractedEvidence[]`
  - Same matchers, but splits on form-feed (`\f`) page breaks first so each
    candidate carries a `page` number.
- `reviewExtractedEvidence(extracted: ExtractedEvidence[]): ReviewableEvidence[]`
  - Wraps each candidate in a review envelope with a stable draft ID
    (`DRAFT-NNN`), a `status` of `pending`, and an empty `reviewLog`.

Confidence is heuristic: a measurement with a unit and a decimal fraction
scores higher than a bare integer; a coordinate pair scores higher than a
single coordinate; a citation with a year scores higher than one without.

## Stage 3 — Review Workflow Integration

Extracted candidates are **not** `Evidence` records. They are `ReviewableEvidence`
envelopes routed through the existing review workflow (`reviewWorkflow.ts`,
`lifecycleController.ts`).

The pipeline does not bypass the review state machine. A reviewer must:

1. Inspect the candidate's `rawText` and `text`.
2. Approve, reject, or request revision.
3. On approval, the candidate is promoted to a `Draft` `Evidence` record via
   `EvidenceStore.create()` and then advanced through
   `Submitted → In Review → Verified → Published` using the existing
   lifecycle controllers.

This keeps a single source of truth for status transitions and audit
(`auditLog.ts`).

## Stage 4 — Hotspot Creation (`hotspotCreation.ts`)

Responsibility: turn approved evidence into scene hotspots without modifying
geometry.

- `createHotspotFromEvidence(evidenceId, position, label): HotspotDraft`
  - Produces a `HotspotDraft` (id, evidenceId, position, label, status
    `draft`, createdAt). No scene mutation.
- `validateHotspotDraft(draft: HotspotDraft): ValidationResult`
  - Reuses the `ValidationResult` shape from `src/loaders/validators.ts`
    (`{ passed, errors, warnings }`). Checks: non-empty label, finite
    position coordinates, valid evidence ID format, position inside the
    Giza plateau bounding box (warn-only).
- `approveHotspotDraft(draft: HotspotDraft): ApprovedHotspot`
  - Promotes a validated draft to an `ApprovedHotspot`, assigning a
    `hotspot-NNN` id and stamping `approvedAt`. Throws if the draft has
    not passed validation.

`HotspotDraft` and `ApprovedHotspot` are distinct types so the compiler
enforces the approve step — you cannot accidentally place a draft into the
scene.

## Stage 5 — End-to-End Orchestration (`contentPipeline.ts`)

`runContentPipeline(input: PipelineInput): PipelineResult` runs the full flow:

1. **Ingest** every entry in `input.files` (PDF or text) and `input.texts`.
2. **Extract** candidates from each ingested document.
3. **Review** — wrap candidates as `ReviewableEvidence`. If
   `input.autoApprove` is set (test/admin path only), approve them;
   otherwise leave them `pending` for a human reviewer.
4. **Create hotspots** for every approved evidence item that has an entry in
   `input.hotspotPositions` (a map of evidenceId → `Vector3`).

`PipelineResult` reports: `extracted`, `reviewed`, `approved`, `hotspots`,
and `errors`. Errors are collected, never thrown — a single bad file does
not abort the batch.

## End-to-End Flow Diagram

```
          ┌─────────────┐
 files ─▶│  Ingest     │─▶ IngestedDocument
          └──────┬──────┘
                 │
          ┌──────▼──────┐
          │  Extract    │─▶ ExtractedEvidence[]
          └──────┬──────┘
                 │
          ┌──────▼──────┐
          │  Review     │─▶ ReviewableEvidence[]
          │  (workflow) │   (pending → approved)
          └──────┬──────┘
                 │ approved
          ┌──────▼──────┐
          │  Approve    │─▶ Evidence (Draft → Published)
          └──────┬──────┘
                 │
          ┌──────▼──────┐
          │  Hotspot    │─▶ ApprovedHotspot[]
          │  Creation   │
          └─────────────┘
```

## Seed Dataset

The pipeline is bootstrapped from the seed dataset in `database/seeds/`. See
`seed-dataset.md` for the current manifest, record counts, and coverage gaps
against the ≥100 evidence target.

## Conformance

- **No silent promotion:** nothing extracted becomes visible without a
  review decision (GIZA - 08 §1.12).
- **Evidence is immutable; interpretations are replaceable** (GIZA - 00 §8).
  Hotspot drafts reference evidence by ID; deleting a hotspot never touches
  the evidence record.
- **Hypothesis neutrality:** the pipeline does not tag evidence with a
  hypothesis. Hypothesis linkage happens downstream in the confidence
  propagation layer.
- **Auditable:** every approve step records an ISO timestamp; full review
  decisions flow through the existing audit log.
