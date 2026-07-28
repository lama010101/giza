# GIZA — Implementation Roadmap

**Version:** 0.1 Draft
**Status:** Working Specification
**Last update:** 2026-07-28

This document bridges the GIZA specification set (00–10) to executable work. It decomposes the project into 18 implementation milestones, a dependency graph, per-milestone AI-coder estimates, AI-coder prompts per milestone, a GitHub milestone structure, a Definition of Done (DoD) for every task, a Definition of Scientific Done (DoSD) for every scientifically traceable task, a risk register, and a staged release strategy.

It is the operational counterpart of the specifications. Where the numbered specifications define *what* and *why*, this document defines *how*, *in what order*, and *when a task is finished*. The companion document *GIZA - 99 Development Playbook* defines how development is conducted day to day and should be read alongside this roadmap.

---

## 1. How to Read This Document

### 1.1 Milestones

Each milestone is a coherent, shippable unit of work. Milestones are numbered `M-1` (repository governance, before any code), `M00`–`M12` (the original twelve), plus fractional insertions `M03.5` (scientific content pipeline), `M06A`/`M06B` (the asset pipeline split into tooling and production), `M06.5` (survey acquisition), and `M08.5` (benchmark scene). They follow the specification dependency graph (see *00 Master Specification* §7) so that no milestone depends on a later one. Fractional numbers are stable; they are never renumbered into integers.

### 1.2 Tasks

Each task has:

| Field | Meaning |
| ----- | ------- |
| `ID` | Stable task identifier, format `MNN-TKK` (milestone + task) |
| `Title` | Short description |
| `Effort` | Story points (see §1.3) |
| `Depends on` | Task IDs that must be completed first |
| `Spec ref` | Specification section(s) this task implements |
| `DoD` | Definition of Done — concrete, verifiable acceptance criteria |
| `DoSD` | Definition of Scientific Done — applies only to tasks producing visible/traceable content (§1.5); otherwise "n/a" |

### 1.3 Effort Scale

Per-task effort is expressed in two complementary units. **AI-coder metrics** (§1.3.1) are the primary estimate for AI coding agents and are aggregated per milestone in each milestone header and in §7. **Story points** are retained as a secondary, human-facing relative-size indicator.

| Points | Label | Approx. duration |
| ------: | ----- | ---------------- |
| 1 | XS | 0.5 day |
| 2 | S | 1 day |
| 3 | M | 2–3 days |
| 5 | L | ~1 week |
| 8 | XL | ~2 weeks |
| 13 | XXL | 3–4 weeks |

Estimates are for a single focused engineer or AI coding agent. They exclude review wait time.

### 1.3.1 AI-Coder Metrics

Story points describe human effort. They are weak predictors of AI coding-agent cost. Every milestone therefore carries an **AI-coder estimate** block of the form:

| Metric | Unit | Meaning |
| ------ | ---- | ------- |
| Files | count | New + materially modified source files |
| LOC | lines | Net new lines of production code (excluding tests, generated, and fixtures) |
| Sessions | count | Estimated focused coding sessions for one agent |
| Context | tokens | Approximate context budget the agent must hold (spec + roadmap + neighboring code) |

Example:

```
M05 — AI-coder estimate
  Files:    ~42
  LOC:      ~6,500
  Sessions: 4
  Context:  ~120k tokens
```

These figures are planning estimates, not budgets. They exist so that an AI agent (or its orchestrator) can decide whether to attempt a milestone in one session, split it, or request a context reset. They are refined as milestones are completed.

### 1.4 Definition of Done (Global)

Every task, in addition to its specific DoD, must satisfy:

1. Code is committed to a feature branch and merged via PR.
2. `npm run typecheck` passes with zero errors.
3. `npm run lint` passes with zero errors.
4. `npm run test` passes (new tests added for new logic).
5. No `console.log` or debug-only code remains.
6. Public APIs and shared types are documented with TSDoc.
7. No secrets, keys, or credentials are committed.
8. The change does not modify any existing specification document (00–10).
9. Documentation is regenerated (see §1.6): API docs, schema docs, and any architecture/developer docs touched by the change are rebuilt and committed.
10. Where the task produces or modifies a visible 3D element, the Definition of Scientific Done (§1.5) is also satisfied.

### 1.5 Definition of Scientific Done

The global Definition of Done (§1.4) guarantees engineering quality. It does not guarantee scientific traceability. A task that touches any reconstructed object, geometry, material, hotspot, theory overlay, or simulation parameter is **not done** until it also satisfies the Definition of Scientific Done (DoSD):

1. **Evidence linkage.** Every visible object links to at least one `EV-NNNNNN` evidence record (see *08* §1.17).
2. **Bibliographic linkage.** Every evidence record links to at least one `SRC-NNNNNN` source (see *09*).
3. **Confidence assigned.** Every object and geometry node carries an explicit confidence score 0–100 propagated through the dependency graph (see *08* §1.8).
4. **Reviewed.** The underlying evidence has passed scientific review (state `Verified` or `Published` per *08* §1.3); unreviewed evidence is never presented as established.
5. **Reproducible.** The reconstruction can be regenerated from the linked evidence, sources, and survey data; no geometric claim depends on undocumented manual steps.
6. **Layer separation respected.** Evidence, reconstruction, interpretation, and simulation remain in their respective layers (see *00* §8.2); no interpretive object appears in Scientific Evidence mode.

A task may be engineering-complete (DoD met) and still be scientifically incomplete (DoSD not met). Such a task is merged behind a feature flag and is not eligible for any release beyond Internal Alpha (see §9) until DoSD is satisfied.

### 1.6 Documentation Generation

Documentation is a build artifact, not a manual deliverable. Because AI agents write most of the code, the documentation must be generated automatically from the code and schemas on every merge to `master`.

| Doc type | Generator | Source | Output |
| -------- | --------- | ------ | ------ |
| API reference | TypeDoc | `src/**/*.ts` TSDoc | `docs/api/` |
| Schema reference | `json-schema-to-md` | Zod schemas in `src/evidence/schemas/` | `docs/schema/` |
| Architecture docs | MkDocs Material | `docs/architecture/*.md` + Mermaid diagrams | `docs/site/` |
| Developer docs | MkDocs Material | `AGENTS.md`, `GIZA - 99 Development Playbook.md`, ADRs | `docs/site/` |
| Data dictionary | custom script | `database/migrations/` + Zod schemas | `docs/data-dictionary.md` |

The generation pipeline is established in M00 (task M00-T12) and wired into CI. Each milestone declares its **Documentation outputs** in its header (the doc surfaces that milestone materially updates). The global DoD (§1.4 item 9) requires regeneration on every merge.

---

## 2. Milestone Overview

| Milestone | Title | Depends on | Est. points |
| --------- | ----- | ---------- | ----------: |
| M-1 | Repository Governance | — | 13 |
| M00 | Project Bootstrap & Tooling | M-1 | 21 |
| M01 | Core Type System & Schemas | M00 | 26 |
| M02 | Evidence Database Backend | M01 | 34 |
| M03 | Sources & Bibliography Engine | M01 | 23 |
| M03.5 | Scientific Content Pipeline | M01, M02, M03 | 21 |
| M04 | Application Shell & Rendering Foundation | M00 | 25 |
| M05 | Scene Graph & Coordinate System | M01, M04 | 22 |
| M06A | Asset Pipeline Tooling | M01, M05 | 18 |
| M06.5 | Survey Acquisition & Geometry Validation | M05, M06A | 18 |
| M06B | Asset Production | M06A, M06.5 | 13 |
| M07 | Core UI Shell & Navigation Modes | M04, M05 | 28 |
| M08 | Interaction & Research Tools | M05, M07 | 21 |
| M08.5 | Benchmark Scene | M04, M05, M06A | 13 |
| M09 | Osiris Shaft Reconstruction | M05, M06A, M06B, M06.5, M07, M08, M03.5 | 30 |
| M10 | Simulation Framework MVP | M05, M09 | 26 |
| M11 | Great Pyramid Reconstruction | M09, M10, M06B, M06.5 | 30 |
| M12 | Polish, Performance, Accessibility & Release | M09, M10, M11 | 18 |
| **Total** | | | **400** |

> The total exceeds the sum of any single critical path because the data/content track (M02, M03, M03.5), the asset/survey track (M06A, M06.5, M06B), and the frontend track (M04–M08, M08.5) run in parallel after M01. M-1 (governance) precedes all code. M06 was split into M06A (tooling) and M06B (production) so that artists can begin producing reusable assets (rocks, limestone, granite, stairs, shafts) long before environment coding finishes.

---

## 3. Dependency Graph

```text
M-1 Repository Governance
    │
    ▼
M00 Project Bootstrap
    │
    ▼
M01 Core Type System & Schemas
    │
    ├─────────────────────────────┐
    ▼                             ▼
M02 Evidence DB                M04 App Shell & Rendering
    │                             │
    ▼                             ▼
M03 Sources & Bibliography     M05 Scene Graph & Coords
    │                             │
    ▼                             ├──────────────────────────┐
M03.5 Scientific Content       ▼                          ▼
Pipeline (evidence +         M06A Asset Pipeline         M07 Core UI &
source ingestion,            Tooling                     Navigation
evidence seeding)              │                            │
    │                          ├──────────┐                 ▼
    │                          ▼          ▼               M08 Interaction &
    │                        M06.5       M08.5            Research Tools
    │                        Survey      Benchmark          │
    │                        Acquisition Scene               │
    │                          │                            │
    │                          ▼                            │
    │                        M06B Asset Production           │
    │                          │                            │
    │                          │   (artists: rocks,         │
    │                          │    limestone, granite,      │
    │                          │    stairs, shafts)          │
    │                          │                            │
    └──────────────┬───────────┴────────────────────────────┘
                   ▼
                 M09 Osiris Shaft Reconstruction
                   │
                   ▼
                 M10 Simulation Framework MVP
                   │
                   ▼
                 M11 Great Pyramid Reconstruction
                   │
                   ▼
                 M12 Polish, Performance, Release
```

Critical path: **M-1 → M00 → M01 → M04 → M05 → M07 → M08 → M09 → M10 → M11 → M12**

Three tracks run in parallel after M01:

* **Data & content track:** M02 → M03 → M03.5 (evidence and sources are ingested and ≥100 evidence records seeded before environment coding needs them).
* **Asset & survey track:** M06A → M06.5 → M06B (tooling first, then survey-derived geometry, then artist production). M06B is deliberately long-running and overlaps the frontend track so that reusable assets exist before M09.
* **Frontend track:** M04 → M05 → {M07 → M08, M08.5 benchmark}.

M08.5 (Benchmark Scene) isolates rendering, lighting, PBR, water, shaders, and collisions in a fake scene so that rendering bugs are caught before any archaeology is attached.

---

## 4. GitHub Milestone Structure

Create 18 GitHub Milestones, one per milestone below. Each task becomes a GitHub Issue labeled with:

* `milestone: MNN` (or `M-1`, `M03.5`, `M06A`, `M06B`, `M06.5`, `M08.5`)
* `type: feature` | `type: infra` | `type: tooling` | `type: content` | `type: governance` | `type: survey` | `type: test` | `type: docs`
* `layer: data` | `layer: rendering` | `layer: ui` | `layer: simulation` | `layer: asset` | `layer: survey` | `layer: infra` | `layer: governance` | `layer: docs`
* `effort: XS` | `effort: S` | `effort: M` | `effort: L` | `effort: XL` | `effort: XXL`
* `dosd: required` | `dosd: n/a` (whether the Definition of Scientific Done applies)

Issue body template:

```markdown
**Milestone:** MNN
**Spec ref:** <section>
**Effort:** <points>
**AI-coder estimate:** ~<files> files, ~<loc> LOC, <sessions> sessions
**Depends on:** #<issue>, #<issue>

## Definition of Done
- [ ] <criterion 1>
- [ ] <criterion 2>
...

## Definition of Scientific Done (if `dosd: required`)
- [ ] Evidence linkage (EV-NNNNNN)
- [ ] Bibliographic linkage (SRC-NNNNNN)
- [ ] Confidence assigned (0–100)
- [ ] Reviewed (Verified/Published)
- [ ] Reproducible from evidence + sources + survey
- [ ] Layer separation respected
```

Recommended branch naming: `mNN-tKK-<slug>` (e.g. `m00-t03-eslint`, `m06a-t08-lod`, `m03.5-t02-extract`).

---

## 5. Milestone Details

---

### M-1 — Repository Governance

**Goal:** Establish the repository governance framework before any code is written, so that every subsequent AI coding agent and human contributor works from identical standards and cannot silently diverge. This milestone produces no application code; it produces the rules, templates, automation, and decision records that govern all later milestones.

**Spec ref:** 00 §4 (repo organization), 00 §13 (AI agent instructions), 00 §14 (contributor guidance)
**Depends on:** —
**Parallelizable with:** — (must complete before M00)
**Estimate:** 13 points
**AI-coder estimate:** ~18 files · ~1,200 LOC · 2 sessions · ~40k tokens
**Documentation outputs:** `docs/governance/` (this milestone's own deliverables), ADR index

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M-1-T01 | Define branching strategy (trunk-based: short-lived `mNN-tKK-<slug>` feature branches off `master`; squash-merge; delete branch on merge; `release/*` and `hotfix/*` branches) | 1 | — | 00 §14.2 | `CONTRIBUTING.md` documents the strategy; a diagram is included |
| M-1-T02 | Define semantic versioning policy (`MAJOR.MINOR.PATCH`; pre-release identifiers `alpha`/`beta`/`rc`; spec set versioned separately per 00 §3) | 1 | — | 00 §3 | `VERSIONING.md` defines the policy; package.json `version` follows it |
| M-1-T03 | Adopt Conventional Commits (`feat`/`fix`/`docs`/`refactor`/`test`/`chore`/`infra`/`content`/`governance`; imperative mood; body explains why; footer for breaks and co-authors) | 1 | — | 00 §13.5 | `CONTRIBUTING.md` documents the convention; commitlint enforces it (M-1-T09) |
| M-1-T04 | Create PR template (`.github/pull_request_template.md`: spec ref, milestone/task IDs, DoD checklist, DoSD checklist when applicable, evidence linkage, no-spec-modification attestation) | 1 | — | 00 §14.2 | Template renders on every PR; checklists present |
| M-1-T05 | Create issue templates (`.github/ISSUE_TEMPLATE/`: `bug.md`, `feature.md`, `content-evidence.md`, `spec-change.md`, `adr.md`) | 1 | — | 00 §14.3 | Templates appear in the GitHub issue picker |
| M-1-T06 | Define coding standards document (strict TS, zero `any`, Zod validation, functional React, TSDoc, path aliases, evidence-first, four-layer separation, coordinate/identifier conventions) | 2 | — | 00 §8, §10 | `docs/governance/coding-standards.md` exists; references specs not duplicates |
| M-1-T07 | Establish Architecture Decision Records (ADRs): `docs/adr/`, `0000-use-adrs.md` template, index `docs/adr/README.md`, ADR-0001 proposing the GIZA-Core / GIZA-Content two-repo split (status: Proposed) | 2 | T06 | 00 §9 | ADR directory and index exist; ADR-0001 committed; ADR format documented |
| M-1-T08 | Define release tagging (`vX.Y.Z` tags, signed where possible; spec-set tags `spec-vX.Y` per 00 §3) and changelog generation (`CHANGELOG.md` from Conventional Commits via `standard-version` or equivalent) | 1 | T02, T03 | 00 §3 | `CHANGELOG.md` seeded; release script documented |
| M-1-T09 | Wire governance automation: commitlint + Husky (M00-T11 also installs Husky for lint; here it enforces commit format), PR labeler, stale-issue bot, branch protection recommendations documented in `docs/governance/branch-protection.md` | 2 | T03, T04 | — | A non-Conventional commit is rejected locally; branch protection rules documented |
| M-1-T10 | Write governance smoke test (CI verifies CHANGELOG regenerated, ADR index in sync, PR template present, no spec files 00–10 modified by a PR) | 1 | T07, T08 | 00 §13.4 | CI job passes; a PR that touches a spec file fails this check |

#### AI-Coder Prompt for M-1

```
You are setting up repository governance for the GIZA project BEFORE any
application code exists. Read GIZA - 00 Master Specification.md (§3, §4,
§8, §9, §13, §14) and GIZA - 99 Development Playbook.md.

Produce the governance framework (no application code):
- Branching strategy (trunk-based, short-lived feature branches, squash-merge)
  in CONTRIBUTING.md
- Semantic versioning policy in VERSIONING.md (app version + separate spec-set
  version per 00 §3)
- Conventional Commits convention (scopes incl. governance/content/infra)
- PR template with DoD + DoSD checklists and a no-spec-modification attestation
- Issue templates: bug, feature, content-evidence, spec-change, adr
- Coding standards in docs/governance/coding-standards.md (reference specs,
  do not duplicate)
- ADR framework: docs/adr/ with template + index, and ADR-0001 proposing the
  GIZA-Core / GIZA-Content two-repo split (status: Proposed, not decided)
- Release tagging + changelog generation from Conventional Commits
- Governance automation: commitlint, PR labeler, branch-protection doc
- CI smoke test verifying CHANGELOG, ADR index, PR template, and that no
  spec file 00–10 is modified by a PR

Do NOT modify any specification document (00–10). Do NOT create application
source code. Governance files only.
```

---

### M00 — Project Bootstrap & Tooling

**Goal:** Establish the repository, build tooling, CI, folder structure, and developer documentation so that all subsequent milestones start from a clean, typed, tested baseline.

**Spec ref:** 04 §2 (folder structure), 00 §4 (repo organization)
**Depends on:** M-1
**Parallelizable with:** —
**Estimate:** 21 points
**AI-coder estimate:** ~25 files · ~2,000 LOC · 3 sessions · ~60k tokens
**Documentation outputs:** `docs/api/` scaffold, `docs/schema/` scaffold, `docs/site/` (MkDocs), `AGENTS.md`

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M00-T01 | Initialize Vite + React + TypeScript project | 2 | — | 04 §1 | `npm run dev` serves a blank page; `tsconfig` strict mode on; `package.json` declares Node 20+ engine |
| M00-T02 | Install and configure Three.js, React Three Fiber, `@react-three/drei`, `@react-three/rapier` | 2 | T01 | 04 §1 | A `<Canvas>` renders a default cube; versions pinned in `package.json` |
| M00-T03 | Set up ESLint, Prettier, and TypeScript strict config | 2 | T01 | — | `npm run lint` and `npm run typecheck` pass on a sample file with intentional errors failing |
| M00-T04 | Set up Vitest + React Testing Library + Playwright | 3 | T01 | — | A sample unit test and a sample e2e test pass; coverage reporter configured |
| M00-T05 | Create the canonical folder structure (`src/{app,components,ui,scene,systems,shaders,materials,cameras,physics,audio,evidence,theories,loaders,hooks,utils}`, `assets/{textures,hdr,scans,models,terrain,audio}`, `docs/`, `database/`, `tests/`) | 2 | T01 | 04 §2 | Folders exist with `.gitkeep` files; a README in `src/` describes each folder's purpose |
| M00-T06 | Configure GitHub Actions CI: lint, typecheck, test, build on PR | 3 | T03, T04 | — | CI runs on every PR; a failing check blocks merge; build artifact is uploaded |
| M00-T07 | Configure path aliases (`@/`, `@assets/`, `@db/`) in Vite + TS | 1 | T01, T05 | — | Imports work with `@/components/...` alias |
| M00-T08 | Set up environment variable system (`.env`, `.env.example`, typed `env.ts`) | 2 | T01 | — | `import.meta.env` is typed; missing required vars throw at startup |
| M00-T09 | Add Zustand for state management and configure devtools | 1 | T01 | 02 (state) | A sample store works with devtools in dev mode |
| M00-T10 | Add `AGENTS.md` with build/test/lint commands and conventions | 1 | T06 | — | File exists, lists `npm run dev/build/test/lint/typecheck`, and is referenced in CI |
| M00-T11 | Add Husky pre-commit hook running lint + typecheck | 2 | T03 | — | A commit with a type error is rejected locally |
| M00-T12 | Set up documentation generation pipeline (TypeDoc → `docs/api/`; `json-schema-to-md` → `docs/schema/`; MkDocs Material → `docs/site/` ingesting `AGENTS.md`, `GIZA - 99 Development Playbook.md`, ADRs, architecture docs) and add `npm run docs` + CI regeneration job | 2 | T05, T06 | 00 §13 | `npm run docs` builds all four surfaces; CI regenerates and fails on stale docs |

#### AI-Coder Prompt for M00

```
You are working on the GIZA repository, an interactive scientific visualization
platform for the Giza Plateau. Read GIZA - 00 Master Specification.md and
GIZA - 04 Technical Architecture.txt (§1 and §2) before starting.

Bootstrap the project:
1. Initialize a Vite + React + TypeScript app with strict mode.
2. Install Three.js, @react-three/fiber, @react-three/drei, @react-three/rapier.
   Pin versions published at least 7 days ago. Do not use `latest`.
3. Install ESLint, Prettier, Vitest, React Testing Library, Playwright.
4. Create the exact folder structure from spec 04 §2.
5. Configure GitHub Actions CI running lint, typecheck, test, build.
6. Add Zustand, path aliases, typed env vars, Husky pre-commit, and an
   AGENTS.md documenting all commands.
7. Set up the documentation generation pipeline (M00-T12): TypeDoc →
   docs/api/, json-schema-to-md → docs/schema/, MkDocs Material → docs/site/
   ingesting AGENTS.md, GIZA - 99 Development Playbook.md, and ADRs. Add
   `npm run docs` and a CI regeneration job that fails on stale docs.

Constraints:
- Do NOT modify any existing specification document (00–10).
- Node 20+ required.
- Strict TypeScript, zero `any` in committed code.
- Every task must satisfy the global Definition of Done (§1.4).
```

---

### M01 — Core Type System & Schemas

**Goal:** Translate every entity schema defined in specs 05, 08, and 09 into a validated, typed TypeScript module. This is the foundation for the data backend (M02/M03) and the frontend scene graph (M05).

**Spec ref:** 05 §-17 to §-11, 08 §1.6, 09 §4
**Depends on:** M00
**Parallelizable with:** — (everything downstream needs types)
**Estimate:** 26 points
**AI-coder estimate:** ~22 files · ~3,200 LOC · 3 sessions · ~90k tokens
**Documentation outputs:** `docs/schema/` (Zod → markdown), `docs/api/` (schema barrel)

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M01-T01 | Define `Evidence` type + Zod schema (all fields from 08 §1.6) | 3 | M00 | 08 §1.6 | Schema validates a sample evidence JSON; invalid samples throw; type exported |
| M01-T02 | Define `Source` type + Zod schema (all fields from 09 §4) | 3 | M00 | 09 §4 | Schema validates sample sources for every source type listed in 09 §6 |
| M01-T03 | Define `Location` type + Zod schema | 1 | M00 | 05 §-15 | Hierarchical `parent` field typed; bounding box and center typed |
| M01-T04 | Define `Object` type + Zod schema | 1 | M00 | 05 §-14 | Mesh ref, location, confidence, evidence array typed |
| M01-T05 | Define `Theory` type + Zod schema | 2 | M00 | 05 §-13, 07 §2.32 | `supports`/`contradicts` arrays, `geometryOverrides`, `interpretiveObjects` typed |
| M01-T06 | Define `Simulation` type + Zod schema | 2 | M00 | 05 §-12, 06 §1.5 | Inputs, outputs, parameters, enabled flag typed |
| M01-T07 | Define `Annotation` type + Zod schema | 1 | M00 | 05 §-11 | Type, author, text, location, visible typed |
| M01-T08 | Define `Media` type + Zod schema (was undefined in 05) | 2 | M00 | 08 §1.19 | All media types from 08 §1.19 covered; license required for Published |
| M01-T09 | Define `User`, `Bookmark`, `Measurement` types + Zod schemas (were undefined in 05) | 2 | M00 | 05 §-19, 02 §23.15, 02 §23.16 | Bookmark stores camera, layers, theory, lighting, selected object, notes; measurement stores points, type, value |
| M01-T10 | Define evidence lifecycle states and transitions as a state machine | 2 | T01 | 08 §1.3 | `EvidenceLifecycle` type; invalid transitions throw; unit tests cover all valid/invalid transitions |
| M01-T11 | Define dependency graph edge types and relations | 1 | T01 | 08 §1.10 | `DependencyEdge` type with all 7 relations (validates, supports, contradicts, refines, supersedes, influences, derived_from) |
| M01-T12 | Define conflict record types and resolution states | 1 | T01 | 08 §1.15 | `ConflictRecord`, `ConflictResolution` (unresolved/partial/superseded/contextual) |
| M01-T13 | Define review log and version record types | 1 | T01 | 08 §1.12, §1.14 | `ReviewLog`, `VersionRecord` typed |
| M01-T14 | Define chronology tag type | 1 | T01 | 08 §1.23, 10 §1.18 | `{ period, scope }` structure |
| M01-T15 | Define confidence scale constants and helper | 1 | M00 | 01 §6 | `CONFIDENCE_SCALE` map; `confidenceLabel(score)` returns meaning string |
| M01-T16 | Define evidence class enum (E1–E8) | 1 | M00 | 01 §5 | `EvidenceClass` enum with descriptions |
| M01-T17 | Create a `schemas/` barrel export and a `validateEntity()` utility | 1 | T01–T09 | — | Single import point; `validateEntity(kind, data)` returns typed result |
| M01-T18 | Write unit tests for all schemas with valid + invalid fixtures | 3 | T01–T09 | — | Coverage ≥ 95% on schema files; every invalid fixture throws expected error |

#### AI-Coder Prompt for M01

```
Read GIZA - 05 Data Architecture.txt, GIZA - 08 Evidence Database
Specification.txt, and GIZA - 09 Sources & Bibliography Standard.txt.

Implement the complete TypeScript type system and Zod validation schemas
for every entity defined in those specifications:

- Evidence (08 §1.6 — all 24 fields)
- Source (09 §4 — all 30 fields, with per-type required-field rules)
- Location, Object, Theory, Simulation, Annotation (05)
- Media, User, Bookmark, Measurement (define these — they were listed in
  05 but not given explicit schemas; infer from 08 §1.19, 02 §23.15/16)
- Evidence lifecycle state machine (08 §1.3)
- Dependency edges, conflict records, review logs, version records,
  chronology tags, confidence scale, evidence classes (E1–E8)

Use Zod for runtime validation. Export a barrel from src/evidence/schemas/.
Write unit tests with valid and invalid fixtures for every schema.

Do NOT modify any specification document. Do NOT use `any`.
```

---

### M02 — Evidence Database Backend

**Goal:** Implement the operational evidence engine: lifecycle, review workflow, dependency graph, confidence propagation, versioning, conflict resolution, import/export, and audit history. This is the "knowledge engine" backend.

**Spec ref:** 08 (entire), 05 §-10 to §-6
**Depends on:** M01
**Parallelizable with:** M04
**Estimate:** 34 points
**AI-coder estimate:** ~38 files · ~6,500 LOC · 6 sessions · ~140k tokens
**Documentation outputs:** `docs/api/` (evidence endpoints), `docs/data-dictionary.md`, `docs/schema/`

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M02-T01 | Choose and configure persistence layer (SQLite via better-sqlite3 for dev; schema-portable to Postgres) | 3 | M01 | 05 §-6 | DB file created; migrations framework in place; a sample entity round-trips |
| M02-T02 | Implement evidence CRUD repository | 3 | T01 | 08 §1.6 | Create/read/update/delete evidence; soft-delete only (nothing permanently deleted per 08 §1.14) |
| M02-T03 | Implement evidence lifecycle state machine with auditable transitions | 3 | T02 | 08 §1.3 | All 7 states; forward-only transitions; retracted record cannot return to Published without new ID |
| M02-T04 | Implement review workflow (submit, assign, comment, revise, approve/reject, publish) | 5 | T03 | 08 §1.12 | Review log with ORCID; `revise` blocks transition to Verified; unit tests for full workflow |
| M02-T05 | Implement dependency graph store with cycle detection | 3 | T02 | 08 §1.10 | Edges inserted; cycles rejected at insertion time; DAG queryable upstream/downstream |
| M02-T06 | Implement confidence propagation engine | 5 | T05 | 08 §1.8, 05 §-10 | Object confidence = weighted avg (source reliability 0.35, measurement quality 0.30, consensus 0.20, direct obs 0.15); theory bounded by lowest required evidence; async, eventually consistent; recalc on upstream change |
| M02-T07 | Implement version history (v1→v2→v3, diff, compare) | 3 | T02 | 08 §1.14 | Version records with changeSummary, diff, sourcesAdded/Removed; superseded versions queryable but not default |
| M02-T08 | Implement conflict resolution records and visualization data | 2 | T02 | 08 §1.15 | Conflict records with 4 resolution states; API returns both sides; never silently picks one value |
| M02-T09 | Implement evidence linking (sources, objects, locations, media, geometry) | 2 | T02 | 08 §1.17 | Bidirectional links; breaking a link records audit on both sides |
| M02-T10 | Implement geometry linkage (meshId, relation, confidenceContribution) | 2 | T09 | 08 §1.18 | 5 geometry relations; mesh without evidence linkage flagged and cannot be Verified |
| M02-T11 | Implement media attachment with license enforcement | 2 | T08 | 08 §1.19 | Media without license cannot attach to Published evidence; `All Rights Reserved` excluded from exports |
| M02-T12 | Implement import workflow (CSV/JSON/BibTeX/RIS → validate → dedupe → map → stage → review → publish) | 5 | T04, T07 | 08 §1.20 | Imported records get new EV IDs; original refs preserved in `externalRefs`; no import bypasses review |
| M02-T13 | Implement export workflow (JSON/CSV/BibTeX/RIS/GraphML/CITATION.cff) with manifest | 3 | T07 | 08 §1.21 | Export manifest with all required fields; watermarked with app version |
| M02-T14 | Implement audit history (immutable, exportable) | 2 | T02 | 08 §1.22 | Every modification auditable; entries immutable; exportable as JSON |
| M02-T15 | Implement REST API endpoints (`GET /evidence`, `/:id`, `/:id/versions`, `/:id/audit`, `POST /import`, `POST /export`) | 3 | T02, T07, T13, T14 | 08 §1.25 | Endpoints return typed data; admin endpoints require Editor/Admin role |
| M02-T16 | Implement search across evidence (by class, confidence, location, theory, keyword, period) | 3 | T02 | 08 §1.26 | Returns relationships, not just documents; filters combine with AND |
| M02-T17 | Write integration tests for full evidence lifecycle | 3 | T03–T14 | — | Test covers: create → submit → review → publish → supersede → export; audit trail verified |

#### AI-Coder Prompt for M02

```
Read GIZA - 08 Evidence Database Specification.txt in full. Implement the
complete evidence backend using the types from M01.

Build:
- Persistence layer (SQLite for dev, Postgres-portable schema)
- Evidence CRUD with soft-delete only
- Lifecycle state machine (7 states, forward-only, auditable)
- Review workflow with ORCID, revise/approve/reject
- Dependency graph with cycle detection (DAG)
- Confidence propagation (weights: 0.35/0.30/0.20/0.15), async, eventually
  consistent, recalculates on upstream change
- Version history with diffs
- Conflict resolution (4 states, never silently picks one side)
- Evidence linking (bidirectional, audit on break)
- Geometry linkage (mesh without evidence cannot be Verified)
- Media attachment with license enforcement
- Import workflow (no import bypasses review)
- Export workflow (6 formats + manifest)
- Immutable audit history
- REST API endpoints
- Search with relationship results

Write integration tests covering the full lifecycle. Do NOT modify specs.
```

---

### M03 — Sources & Bibliography Engine

**Goal:** Implement the source management, citation, bibliography generation, duplicate detection, and preservation subsystem.

**Spec ref:** 09 (entire), 05 §1–2
**Depends on:** M01
**Parallelizable with:** M02, M04
**Estimate:** 23 points
**AI-coder estimate:** ~28 files · ~4,200 LOC · 4 sessions · ~110k tokens
**Documentation outputs:** `docs/api/` (source endpoints), `docs/schema/` (Source), bibliography style reference

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M03-T01 | Implement source CRUD repository | 2 | M01 | 09 §4 | All 30 source fields stored; per-type required fields enforced |
| M03-T02 | Implement DOI normalization and validation (resolve to `https://doi.org/...`) | 2 | T01 | 09 §9 | DOI normalized to URL form; validated against resolver on import; never manually edited after validation |
| M03-T03 | Implement ISBN normalization (ISBN-10/13 → ISBN-13) and checksum validation | 2 | T01 | 09 §10 | Both formats accepted; normalized to ISBN-13; checksum validated |
| M03-T04 | Implement ORCID normalization and validation | 1 | T01 | 09 §11 | Normalized to URI form; checksum validated; optional but encouraged |
| M03-T05 | Implement source reliability defaults by type (20 types from 09 §8) | 1 | T01 | 09 §8 | Default reliability table; adjustable per record by Editor with audit justification |
| M03-T06 | Implement duplicate detection (DOI, ISBN, title fuzzy >0.9, author+year, URL) | 5 | T01 | 09 §17 | Runs on import and edit; proposes merge; merges require Editor approval; retain all externalRefs |
| M03-T07 | Implement merge workflow | 3 | T06 | 09 §18 | Editor approval; audit log; both source IDs and migrated links recorded |
| M03-T08 | Implement archival URL handling with "Archive now" action | 2 | T01 | 09 §13 | `archivalUrl` + `archiveDate`; one-click archive submission; non-Personal-Communication sources without archival URL flagged |
| M03-T09 | Implement museum reference handling (accession, collection, relocation) | 1 | T01 | 09 §14 | Accession + collection stored; relocations retain both accession numbers in externalRefs |
| M03-T10 | Implement image licensing (11 license types, rightsHolder, credit) | 2 | T01 | 09 §15 | License stored on Media; no license → cannot attach to Published; All Rights Reserved → display-only, excluded from export |
| M03-T11 | Implement video references with timestamp deep-linking | 1 | T01 | 09 §16 | Duration, timestamp, license, credit stored; deep-link to cited moment |
| M03-T12 | Implement bibliography generation (11 citation styles + BibTeX/RIS export) | 5 | T01 | 09 §12 | APA, Chicago, Harvard, IEEE, MLA, Turabian, SAA, Chicago NB, Chicago AD, BibTeX, RIS; BibTeX key derived from SRC ID; per-user/per-export style |
| M03-T13 | Implement citation engine integration (hover citations, bibliography panel, export footers, screenshot watermarks) | 3 | T12 | 05 §1, 09 §24 | Engine reads Source record, resolves DOI/ISBN/archival URL by context; never reads URLs directly |
| M03-T14 | Implement source API endpoints (`GET /sources`, `/:id`, `/:id/evidence`, `/:id/versions`, `/:id/audit`, `POST /import`, `/export`, `/merge`, `/archive`) | 2 | T01, T06, T12 | 09 §25 | Admin endpoints require Editor/Admin role |
| M03-T15 | Implement source search (author, year, type, reliability, DOI/ISBN/ORCID presence, license, museum, keyword) | 2 | T01 | 09 §26 | All 11 search dimensions supported |
| M03-T16 | Write integration tests for source lifecycle, merge, and bibliography generation | 2 | T01–T13 | — | At least one fixture per citation style; merge preserves links; audit trail verified |

#### AI-Coder Prompt for M03

```
Read GIZA - 09 Sources & Bibliography Standard.txt in full. Implement the
complete sources and bibliography engine using the Source type from M01.

Build:
- Source CRUD with per-type required-field enforcement (17 source types)
- DOI/ISBN/ORCID normalization and validation
- Reliability defaults (20 types) with Editor-adjustable + audit
- Duplicate detection (5 signals) and merge workflow
- Archival URL handling with "Archive now" action
- Museum references, image licensing (11 types), video deep-linking
- Bibliography generation in 11 styles + BibTeX/RIS
- Citation engine integration (hover, panel, footers, watermarks)
- REST API and search (11 dimensions)

Write integration tests. Do NOT modify specs.
```

---

### M03.5 — Scientific Content Pipeline

**Goal:** Define and operationalize the end-to-end pipeline by which scientific content enters the software. The roadmap describes how to build software; this milestone describes how data enters it. It covers the full chain — PDF paper → evidence extraction → evidence review → evidence ID → object linkage → hotspot creation → simulation parameters → publication — and seeds the evidence database with ≥100 real evidence records before environment coding (M09) needs them. Without this milestone, developers eventually stop because they have no data.

**Spec ref:** 08 §1.3 (lifecycle), §1.20 (import), §1.17 (linking); 09 §1–4 (sources); 05 §-17 (evidence); 01 §5 (evidence classes)
**Depends on:** M01, M02, M03
**Parallelizable with:** M04, M05, M06A
**Estimate:** 21 points
**AI-coder estimate:** ~30 files · ~4,500 LOC · 5 sessions · ~130k tokens
**Documentation outputs:** `docs/architecture/content-pipeline.md`, evidence extraction guide, seed dataset manifest

#### Pipeline Stages

```text
PDF / scan / field report
        │
        ▼
Evidence extraction (structured capture: dimension, photo, observation)
        │
        ▼
Evidence review (submit → assign → revise → approve → publish, per 08 §1.12)
        │
        ▼
Evidence ID assigned (EV-NNNNNN, immutable)
        │
        ▼
Object linkage (EV → OBJ-NNNN, geometry linkage per 08 §1.18)
        │
        ▼
Hotspot creation (3D marker linked to EV, per 04 §6.16)
        │
        ▼
Simulation parameters (where applicable: SIM-NNN with provenance, per 06 §1.6)
        │
        ▼
Publication (evidence Published; object eligible for release beyond Internal Alpha)
```

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M03.5-T01 | Document the content pipeline end-to-end (the diagram above; per-stage inputs/outputs/roles; published as `docs/architecture/content-pipeline.md`) | 2 | M02, M03 | 08 §1.3 | Document exists; each stage has inputs, outputs, owner role, and acceptance criteria |
| M03.5-T02 | Build evidence extraction tooling (semi-structured form / CLI that captures: source PDF/ref, evidence class E1–E8, observed value, units, confidence basis, photos, location) and writes a staged evidence JSON | 3 | M01 | 01 §5, 08 §1.6 | Tool produces staged evidence JSON validated by M01 schemas; class E1–E8 enforced |
| M03.5-T03 | Build PDF/text ingestion helper (extract dimensions, coordinates, and figure references from archaeological papers; assist, not replace, human extraction) | 3 | T02 | 09 §4 | Helper extracts candidate fields from a sample PDF; human confirms before staging |
| M03.5-T04 | Wire extraction output into the M02 review workflow (staged JSON → submit → review → publish) | 2 | T02, M02-T04 | 08 §1.12 | Extracted evidence enters review workflow; no bypass to Published |
| M03.5-T05 | Implement object linkage tooling (link EV-NNNNNN to OBJ-NNNN with geometry relation and confidence contribution per *08* §1.18) | 2 | M02-T09, M02-T10 | 08 §1.17, §1.18 | Bidirectional links created; mesh without evidence flagged |
| M03.5-T06 | Implement hotspot creation tooling (place 3D marker in scene → link to EV → store camera, label, media refs per *04* §6.16) | 2 | M05, M08-T02 | 04 §6.16 | Hotspots placed and linked; clickable; metadata stored |
| M03.5-T07 | Implement simulation-parameter capture (where evidence feeds a simulation: capture as SIM-NNN parameter with provenance class per *06* §1.6) | 2 | M10 | 06 §1.5, §1.6 | Parameters captured with provenance (Measured/Published/Estimated); linked to EV |
| M03.5-T08 | Seed the evidence database with ≥100 real evidence records for the Osiris Shaft and Great Pyramid (dimensions, observations, photos from published sources) | 5 | T04, M03 | 08 §1.20 | ≥100 EV records Published or in review; ≥40 sources (SRC) linked; coverage spans Osiris levels and Pyramid chambers |
| M03.5-T09 | Produce seed dataset manifest (list of seeded EV/SRC, coverage map vs M06.5 survey gaps, published as `docs/architecture/seed-dataset.md`) | 1 | T08 | — | Manifest generated; gaps explicit; drives M09/M11 evidence hotspot scope |
| M03.5-T10 | Write content-pipeline integration test (extract → review → publish → link to object → hotspot → export) | 2 | T01–T07 | — | End-to-end test passes in CI |

#### AI-Coder Prompt for M03.5

```
Read GIZA - 08 Evidence Database Specification.txt (§1.3, §1.12, §1.17,
§1.18, §1.20), GIZA - 09 Sources & Bibliography Standard.txt (§1–4),
GIZA - 05 Data Architecture.txt (Evidence), and GIZA - 01 Vision &
Scientific Foundation.txt (§5 evidence classes). Build the scientific
content pipeline that gets real data into the software.

Build:
- Content pipeline documentation (PDF → extraction → review → EV ID →
  object linkage → hotspot → simulation params → publication)
- Evidence extraction tooling (structured capture, E1–E8, confidence basis)
- PDF/text ingestion helper (assists extraction from archaeological papers;
  human confirms)
- Wire extraction into the M02 review workflow (no bypass to Published)
- Object linkage tooling (EV ↔ OBJ, geometry relation, confidence)
- Hotspot creation tooling (3D marker → EV link, per 04 §6.16)
- Simulation-parameter capture (SIM-NNN with provenance per 06 §1.6)
- Seed ≥100 real evidence records for Osiris Shaft + Great Pyramid,
  ≥40 sources linked
- Seed dataset manifest (coverage vs M06.5 survey gaps)
- End-to-end integration test

This milestone is what prevents developers from stopping for lack of data.
Do NOT modify specs.
```

---

### M04 — Application Shell & Rendering Foundation

**Goal:** Stand up the React Three Fiber application shell, rendering pipeline, performance monitoring, and debug mode. This is the empty stage on which all environments are built.

**Spec ref:** 04 §1, §7, §6.25–6.27
**Depends on:** M00
**Parallelizable with:** M01, M02, M03
**Estimate:** 25 points
**AI-coder estimate:** ~24 files · ~3,800 LOC · 4 sessions · ~100k tokens
**Documentation outputs:** `docs/api/` (rendering systems), `docs/architecture/rendering.md`

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M04-T01 | Create `<App>` and `<SceneManager>` shell with R3F `<Canvas>` | 2 | M00 | 04 §6.2 | Canvas mounts; FPS counter visible; resize works |
| M04-T02 | Implement rendering pipeline scaffolding (scene graph → visibility → LOD → render) | 3 | T01 | 04 §7.2 | Pipeline stages exist as composable systems; a placeholder mesh flows through |
| M04-T03 | Implement adaptive quality manager (detect hardware, set desktop/mobile profile) | 3 | T01 | 04 §7.1 | Detects GPU tier; sets quality preset; logs selected profile |
| M04-T04 | Implement PBR material base shader system | 3 | T01 | 04 §6.6 | Common base shader; one sample material (Dry Limestone) renders correctly |
| M04-T05 | Implement layered lighting system (ambient + directional + local + bounce + volumetric, each toggleable) | 3 | T01 | 04 §6.11 | 5 light layers; each independently enabled; scene lit with all 5 |
| M04-T06 | Implement shadow strategy (CSM desktop, single map mobile, baked AO distant) | 3 | T05 | 04 §6.12 | CSM on desktop; single map on mobile; distant objects use baked AO |
| M04-T07 | Implement debug mode overlay (FPS, draw calls, triangles, GPU memory, bounding boxes, normals, wireframe, colliders, streaming, evidence IDs, confidence) | 3 | T01 | 04 §6.25 | All 11 debug displays toggleable; overlay does not block interaction |
| M04-T08 | Implement performance budget enforcer (triangles, draw calls, texture memory, materials, lights, probes per platform) | 2 | T03 | 04 §6.27 | Budgets from 04 §6.27 enforced; warnings logged when exceeded |
| M04-T09 | Implement frame pacing prioritization | 2 | T01 | 04 §6.26 | Frame time variance measured; pacing prioritized over peak FPS |
| M04-T10 | Implement KTX2 texture loader | 1 | T01 | 04 §5 | `.ktx2` textures load and display |
| M04-T11 | Implement glTF loader with node extras metadata extraction | 2 | T01 | 10 §1.18 | `.glb` loads; `extras.giza` metadata extracted and available |
| M04-T12 | Write render foundation smoke tests (Playwright: canvas mounts, debug overlay toggles, no console errors) | 2 | T07, T11 | — | E2E test passes in CI |

#### AI-Coder Prompt for M04

```
Read GIZA - 04 Technical Architecture.txt (§1, §6.6, §6.11, §6.12, §6.25,
§6.26, §6.27, §7.1, §7.2) and GIZA - 10 Asset Production Pipeline.txt
(§1.17, §1.18).

Build the rendering foundation:
- <App> + <SceneManager> shell with R3F <Canvas>
- Rendering pipeline scaffolding (scene graph → visibility → LOD → render)
- Adaptive quality manager (hardware detection, desktop/mobile profiles)
- PBR base shader system with one sample material (Dry Limestone)
- 5-layer lighting (ambient, directional, local, bounce, volumetric)
- Shadow strategy (CSM desktop, single map mobile, baked AO distant)
- Debug overlay (11 displays from §6.25)
- Performance budget enforcer (§6.27 budgets)
- Frame pacing
- KTX2 loader, glTF loader with extras.giza extraction

Write e2e smoke tests. Do NOT modify specs.
```

---

### M05 — Scene Graph & Coordinate System

**Goal:** Implement the hierarchical scene graph, the layered coordinate system, scene streaming, and the layer manager data model. This is the spatial backbone for every environment.

**Spec ref:** 04 §3, §4, §6.3, §6.4, §6.5, §6.21; 10 §1.5, §1.6
**Depends on:** M01, M04
**Parallelizable with:** M02, M03
**Estimate:** 22 points
**AI-coder estimate:** ~30 files · ~5,000 LOC · 4 sessions · ~120k tokens
**Documentation outputs:** `docs/api/` (scene graph), `docs/architecture/coordinates.md`

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M05-T01 | Implement scene graph node structure (UUID, name, type, metadata, references, confidence, parent, children) | 2 | M01, M04 | 04 §3 | Nodes create/attach/detach; tree traversal works; metadata typed |
| M05-T02 | Implement world coordinate system (Y up, X east-west, Z north-south, meters) | 1 | T01 | 04 §4 | Coordinate constants exported; a point at (0,0,0) renders at origin |
| M05-T03 | Implement layered coordinate transforms (object→room→monument→plateau→world) | 5 | T02 | 10 §1.5, §1.6 | 4×4 matrix chain; `worldPoint = plateauToWorld * monumentToPlateau * roomToMonument * objectToRoom * objectPoint`; transforms stored per node |
| M05-T04 | Implement scene streaming system (load/unload by proximity, pin/unpin) | 5 | T01 | 04 §6.3 | Initial load set configurable; assets unload when distant unless pinned; streaming status visible in debug |
| M05-T05 | Implement scene layers (Geometry, Modern, Water, Geology, Evidence, Theory, Simulation, Annotations — each toggleable) | 2 | T01 | 04 §6.21 | 8 layers; each independently visible/hidden; layer state in store |
| M05-T06 | Implement object metadata injection from glTF extras (no hardcoded archaeology in components) | 2 | M04-T11 | 04 §6.5 | Object metadata (uuid, name, category, confidence, evidenceIds, material, visible, interactive) populated from glTF extras, not code |
| M05-T07 | Implement LOD manager (LOD0–LOD3, Hausdorff distance thresholds, imperceptible transitions) | 3 | T04 | 04 §7.2, 10 §1.16 | LODs swap by distance; transitions imperceptible; silhouette preserved |
| M05-T08 | Implement visibility manager (frustum culling, occlusion hints) | 2 | T01 | 04 §7.2 | Off-screen objects culled; debug shows culled count |
| M05-T09 | Write scene graph unit tests (tree ops, coordinate transforms, streaming) | 2 | T01–T08 | — | Coverage ≥ 90% on scene graph module |

#### AI-Coder Prompt for M05

```
Read GIZA - 04 Technical Architecture.txt (§3, §4, §6.3, §6.4, §6.5,
§6.21, §7.2) and GIZA - 10 Asset Production Pipeline.txt (§1.5, §1.6,
§1.16).

Build the spatial backbone:
- Scene graph nodes (UUID, name, type, metadata, references, confidence,
  parent, children)
- World coordinate system (Y up, X E-W, Z N-S, meters)
- Layered coordinate transforms: object→room→monument→plateau→world
  with 4×4 matrix composition
- Scene streaming (proximity load/unload, pin/unpin)
- 8 toggleable scene layers
- Object metadata injected from glTF extras.giza (no hardcoded archaeology)
- LOD manager (LOD0–3, Hausdorff thresholds: 2mm/10mm/50mm)
- Visibility manager (frustum culling)

Write unit tests. Do NOT modify specs.
```

---

### M06A — Asset Pipeline Tooling

**Goal:** Build the validation, publishing, and metadata tooling that enforces the asset production pipeline. This ensures every glTF entering the scene is validated, budgeted, and linked to evidence. M06A is the tooling half of the former M06; it must complete before any asset is produced (M06B) or survey-derived geometry is validated (M06.5).

**Spec ref:** 10 (entire)
**Depends on:** M01, M05
**Parallelizable with:** M07
**Estimate:** 18 points
**AI-coder estimate:** ~30 files · ~5,200 LOC · 4 sessions · ~120k tokens
**Documentation outputs:** `docs/api/` (asset endpoints), `docs/architecture/asset-pipeline.md`, material library reference

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M06A-T01 | Create asset directory structure (`assets/{source,working,master,export,metadata,validation}/...`) | 1 | M00 | 10 §1.3 | Directories exist with READMEs explaining each |
| M06A-T02 | Implement naming convention validator (`<monument>-<location>-<object>-<lod>.glb`, monument codes GP/OS/KF/MK/PL) | 2 | T01 | 10 §1.4 | Validator accepts valid names, rejects invalid; unit tested |
| M06A-T03 | Implement mesh budget validator (Hero/Standard/Background × LOD0–3 triangle limits) | 2 | T01 | 10 §1.14 | Validates triangle counts against all 12 budget cells; rejects over-budget |
| M06A-T04 | Implement texel density validator (2048/1024/512/128 px/m by asset class) | 2 | T01 | 10 §1.11 | Validates texel density; reports violations |
| M06A-T05 | Implement glTF export validator (Y up, -Z forward, PBR, KTX2, no cameras/lights, node hierarchy PlateauRoot→MonumentRoot→LocationRoot→ObjectRoot→Mesh) | 3 | T01 | 10 §1.17 | Validates export settings; rejects non-conforming glTFs |
| M06A-T06 | Implement scientific metadata validator (asset.extras.giza with all 13 fields, node.extras.giza with 4 fields) | 2 | T01 | 10 §1.18 | Validates all required metadata fields present; rejects assets missing evidenceIds |
| M06A-T07 | Implement collision mesh validator (`<objectName>_COL`, not rendered, Rapier-compatible) | 2 | T01 | 10 §1.15 | Collision nodes detected and validated; excluded from render |
| M06A-T08 | Implement LOD generation pipeline (LOD0→LOD1→LOD2→LOD3→Billboard) | 5 | T03 | 10 §1.16 | Generates LODs from master mesh; Hausdorff distance within thresholds; UVs preserved where possible |
| M06A-T09 | Implement survey deviation validator (<1cm green, 1–5cm yellow, >5cm red) | 2 | T01 | 10 §1.25 | Compares mesh to survey data; color-coded report; red threshold blocks Verified status |
| M06A-T10 | Implement validation report generator (JSON with checks, warnings, errors, approved) | 2 | T03–T09 | 10 §1.19 | Report contains all check results; errors block publish; warnings allow Editor approval |
| M06A-T11 | Implement publishing pipeline (validate → manifest → copy to export/ → register → tag → update scene registry) | 3 | T10 | 10 §1.20 | Full pipeline runs; manifest with LODs, materials, collision, evidence, confidence, validation report |
| M06A-T12 | Implement asset manifest store and API (`GET /assets`, `/:id`, `/:id/manifest`, `/:id/versions`, `/:id/validation`, `POST /validate`, `/publish`, `/supersede`) | 2 | T11 | 10 §1.27 | Endpoints return typed manifests; supersession retains prior versions |
| M06A-T13 | Implement PBR material library (17 master materials as JSON descriptors) | 2 | M01 | 10 §1.13 | All 17 materials from §1.13 defined as JSON; sample renders for 3 |
| M06A-T14 | Write pipeline integration test (ingest a sample mesh → validate → publish → load in scene) | 2 | T11, T13 | — | End-to-end test passes in CI |

#### AI-Coder Prompt for M06A

```
Read GIZA - 10 Asset Production Pipeline.txt in full. Build the asset
pipeline tooling that validates and publishes every 3D asset.

Build:
- Asset directory structure (§1.3)
- Naming convention validator (§1.4, monument codes GP/OS/KF/MK/PL)
- Mesh budget validator (Hero/Standard/Background × LOD0–3, §1.14)
- Texel density validator (§1.11)
- glTF export validator (§1.17: Y up, -Z forward, PBR, KTX2, node hierarchy)
- Scientific metadata validator (§1.18: asset.extras.giza 13 fields,
  node.extras.giza 4 fields)
- Collision mesh validator (§1.15)
- LOD generation pipeline (§1.16, Hausdorff 2/10/50mm)
- Survey deviation validator (§1.25: <1cm green, 1–5cm yellow, >5cm red)
- Validation report generator (§1.19)
- Publishing pipeline with manifest (§1.20)
- Asset API (§1.27)
- PBR material library: 17 master materials as JSON (§1.13)

Write an end-to-end integration test. Do NOT modify specs.
```

---

### M06.5 — Survey Acquisition & Geometry Validation

**Goal:** Establish where geometry comes from before any environment is built. Acquire, ingest, and validate survey sources (laser scans, photogrammetry, published CAD, manual reconstruction) so that M09 and M11 start from measured geometry rather than magic. This milestone is the bridge between raw survey data and the asset pipeline; it produces no final game-ready assets (that is M06B) but produces the validated reference geometry and coverage map that M06B and the environment milestones consume.

**Spec ref:** 10 §1.21–1.26 (survey integration), 08 §1.18 (geometry linkage), 03 §2.6, 07 §2.6
**Depends on:** M05, M06A
**Parallelizable with:** M07, M08
**Estimate:** 18 points
**AI-coder estimate:** ~22 files · ~3,800 LOC · 4 sessions · ~110k tokens
**Documentation outputs:** `docs/architecture/survey-sources.md`, survey coverage map, geometry confidence reference

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M06.5-T01 | Define survey source registry (laser scan, photogrammetry, published CAD, manual reconstruction) with per-source provenance, license, and reliability per *09* | 2 | M06A | 09 §8, 10 §1.21 | Registry stores source type, date, operator, equipment, license, reliability; queryable |
| M06.5-T02 | Ingest laser scan data (point clouds in `assets/scans/`; E57/LAS/PLY loaders; reference, not render, geometry) | 3 | T01 | 10 §1.22 | Sample scan loads; point cloud visible as reference overlay; metadata captured |
| M06.5-T03 | Ingest photogrammetry data (mesh + textures in `assets/source/photogrammetry/`; provenance preserved) | 2 | T01 | 10 §1.23 | Sample photogrammetry mesh loads as reference; not retopologized yet |
| M06.5-T04 | Ingest published CAD and architectural drawings (Petrie, Maragioglio & Rinaldi, Leclant, Dormion, etc.) with scale and datum metadata | 2 | T01 | 09 §8 | Drawings registered to Local Plateau Coordinates; dimensions extractable |
| M06.5-T05 | Define manual reconstruction workflow for unmeasured elements (documented assumptions, evidence class E7–E8, confidence ≤ 50, never presented as measured) | 2 | T01 | 01 §5, 08 §1.6 | Workflow documented; manual elements flagged `reconstruction: manual` with confidence cap |
| M06.5-T06 | Implement survey-to-mesh deviation validation (reuse M06A-T09; produce per-mesh deviation report) | 2 | M06A-T09 | 10 §1.25 | Deviation report generated for sample mesh; color-coded; red blocks Verified |
| M06.5-T07 | Assign geometry confidence from survey source quality (measured > photogrammetry > CAD > manual; propagated per *08* §1.8) | 2 | T01, M02 | 08 §1.8 | Confidence assigned per geometry node; visible in debug mode; propagated |
| M06.5-T08 | Produce survey coverage map (per monument: measured / inferred / unknown regions; published as `docs/architecture/survey-coverage.md`) | 2 | T02–T05 | — | Coverage map generated; gaps explicit; drives M09/M11 scope |
| M06.5-T09 | Write survey ingestion integration test (ingest scan + CAD → validate → confidence → coverage map entry) | 1 | T02, T04, T06 | — | Test passes in CI |

#### AI-Coder Prompt for M06.5

```
Read GIZA - 10 Asset Production Pipeline.txt (§1.21–1.26), GIZA - 08
Evidence Database Specification.txt (§1.8, §1.18), and GIZA - 09 Sources
& Bibliography Standard.txt (§8). Establish where geometry comes from.

Build:
- Survey source registry (laser scan, photogrammetry, published CAD,
  manual reconstruction) with provenance, license, reliability
- Laser scan ingestion (point clouds as reference, not render geometry)
- Photogrammetry ingestion (mesh + textures as reference)
- Published CAD ingestion (Petrie, Maragioglio & Rinaldi, Dormion, etc.)
  registered to Local Plateau Coordinates
- Manual reconstruction workflow (E7–E8, confidence ≤ 50, flagged)
- Survey-to-mesh deviation validation (reuse M06A-T09)
- Geometry confidence assignment from source quality, propagated
- Survey coverage map (measured / inferred / unknown per monument)
- Integration test

No environment is built here. This milestone produces validated reference
geometry and a coverage map. Do NOT modify specs.
```

---

### M06B — Asset Production

**Goal:** Produce the reusable 3D asset libraries that environment milestones (M09, M11) consume. This is the artist-facing half of the former M06, deliberately scheduled so that rocks, limestone, granite, stairs, and shaft components exist long before environment coding finishes. Every produced asset passes through the M06A pipeline and is linked to evidence (DoSD required).

**Spec ref:** 10 (entire), 03 §2 (Osiris materials), 07 §2 (Pyramid materials)
**Depends on:** M06A, M06.5
**Parallelizable with:** M07, M08, M08.5
**Estimate:** 13 points
**AI-coder estimate:** ~80 asset files · ~1,500 LOC (validators/configs) · 6 sessions (artist + AI) · ~60k tokens
**Documentation outputs:** asset catalog (`docs/architecture/asset-catalog.md`), material sample sheet

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M06B-T01 | Produce reusable rock and limestone rubble asset set (multiple LODs, PBR, collision) | 2 | M06A, M06.5 | 10 §1.13 | ≥10 rubble variants; all LODs; pass M06A validation; evidence-linked |
| M06B-T02 | Produce limestone bedrock and strata asset set (modular, tileable, with stratigraphy metadata) | 2 | M06A, M06.5 | 10 §1.13, 03 §2.16 | Bedrock modules tileable; stratigraphy metadata present; validated |
| M06B-T03 | Produce granite asset set (Aswan red granite, fine-grained variants; for sarcophagi, King's Chamber) | 1 | M06A, M06.5 | 10 §1.13, 07 §2 | ≥4 granite variants; PBR; validated; evidence-linked |
| M06B-T04 | Produce stair and shaft component asset set (modular stair segments, shaft sections, lintels) | 2 | M06A, M06.5 | 03 §2.9, 07 §2 | Modular components assemble to ≥5m runs; collision present; validated |
| M06B-T05 | Produce modular architectural components (doorways, corridors, ceiling blocks, corbel elements) | 2 | M06A, M06.5 | 07 §2 | Components modular; validated; evidence-linked |
| M06B-T06 | Render and publish the 17 master PBR materials as sample asset instances | 1 | M06A-T13 | 10 §1.13 | All 17 materials rendered as samples; published to export/ |
| M06B-T07 | Validate every produced asset through the M06A pipeline and publish to `assets/export/` | 2 | T01–T05, M06A-T11 | 10 §1.19, §1.20 | 100% of produced assets pass validation; manifests generated; published |
| M06B-T08 | Link every produced asset to evidence (EV-) and sources (SRC-); assign confidence; satisfy DoSD | 1 | T01–T05, M03.5 | 08 §1.17, §1.18 | Every asset has ≥1 EV and ≥1 SRC; confidence assigned; DoSD met |

#### AI-Coder Prompt for M06B

```
Read GIZA - 10 Asset Production Pipeline.txt in full and the material
sections of GIZA - 03 Osiris Shaft Specification.txt (§2) and GIZA - 07
Great Pyramid Specification.txt (§2). Produce the reusable asset libraries
that M09 and M11 will consume.

Produce (each asset: PBR, LOD0–3, collision mesh, glTF extras.giza metadata,
evidence-linked, confidence-assigned):
- Rock and limestone rubble set (≥10 variants)
- Limestone bedrock / strata modules (tileable, stratigraphy metadata)
- Granite set (Aswan red granite, fine-grained, ≥4 variants)
- Stair and shaft components (modular, assemblable to ≥5m runs)
- Modular architectural components (doorways, corridors, ceiling blocks,
  corbel elements)
- 17 master PBR materials rendered as sample instances

Validate every asset through the M06A pipeline (M06A-T11) and publish to
assets/export/. Link every asset to ≥1 EV- and ≥1 SRC- and assign confidence
(Definition of Scientific Done applies). Do NOT modify specs.
```

---

### M07 — Core UI Shell & Navigation Modes

**Goal:** Build the application UI shell (top bar, bottom toolbar, left and right panels) and all navigation modes (Explore, Guided, Research, Documentary, Presentation, Educational, Museum, Developer). Mode switching never reloads the scene.

**Spec ref:** 02 (entire)
**Depends on:** M04, M05
**Parallelizable with:** M06A, M06B, M08 (partially)
**Estimate:** 28 points
**AI-coder estimate:** ~42 files · ~6,500 LOC · 5 sessions · ~130k tokens
**Documentation outputs:** `docs/api/` (UI shell, modes), `docs/architecture/ux.md`

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M07-T01 | Implement top bar, bottom toolbar, left panel, right panel layout shell | 3 | M04 | 02 §11 | Layout matches spec; panels slide-over; responsive on tablet/mobile |
| M07-T02 | Implement visual language (Stone, Sand, Copper, Dark slate, Soft blue palette; museum-grade aesthetic) | 2 | T01 | 02 §12 | Color tokens defined; no game-like HUD; museum-grade presentation |
| M07-T03 | Implement navigation mode state machine (Explore, Guided, Research, Documentary, Presentation, Educational, Museum, Developer) | 2 | T01 | 02 §23.2 | Mode switching never reloads scene; only UI behavior changes |
| M07-T04 | Implement Explore mode (free movement, walk/fly/teleport, inspect, measure, bookmark, theory switch, layer reveal) | 3 | T03 | 02 §23.3 | All Explore actions functional; no narration, no forced sequence |
| M07-T05 | Implement Guided mode (curated stops with narration, evidence, photos, citations, optional animations; user may leave anytime) | 3 | T03 | 02 §23.4 | Stop system with all listed content; exit at any moment |
| M07-T06 | Implement Research mode (measurements, cross-sections, layer isolation, source inspection, metadata browser, confidence viz, geometry stats, export screenshots) | 3 | T03 | 02 §23.5 | All Research tools accessible; slow precise camera with orthographic support |
| M07-T07 | Implement Documentary mode (scripted camera, narration, synchronized overlays, animated cutaways, timeline transitions, evidence highlighting; user can pause) | 5 | T03 | 02 §23.6 | Cinematic camera paths; pause works; chapters independently loadable |
| M07-T08 | Implement Presentation mode (museum/kiosk: large fonts, laser-pointer, slide-like nav, presenter notes, camera presets, offline) | 3 | T03 | 02 §23.24 | All features functional; offline-capable |
| M07-T09 | Implement Educational mode (simplified vocabulary, progressive disclosure, quizzes, achievements, teacher notes) | 3 | T03 | 02 §23.19 | All features functional |
| M07-T10 | Implement Museum mode (auto-looping, auto-navigation, large type, no keyboard, touch-friendly, idle attract mode) | 2 | T03 | 02 §23.20 | Fully automated loop; idle attract mode triggers |
| M07-T11 | Implement Developer mode (debug overlays, scene graph, bounding boxes, LOD, performance, wireframe, physics) | 1 | T03, M04-T07 | 02 §9 | Debug displays toggleable |
| M07-T12 | Implement camera modes (Explorer, Guided, Documentary, Research, Inspection) with movement constraints, collision, slope limits, acceleration, inertia, adjustable FOV, minimized near clip | 3 | T03 | 04 §6.13, §6.14 | All 5 camera modes; constraints enforced; no clipping in narrow passages |
| M07-T13 | Implement documentary camera spline system (splines stored separately from scene objects) | 2 | T07 | 04 §6.15 | Splines load from data; camera follows; smooth transitions |
| M07-T14 | Implement input system (keyboard, mouse, touch, gamepad; navigation logic independent of camera implementation) | 2 | T03 | 04 §6.23 | All 4 input methods work; logic decoupled from camera |
| M07-T15 | Implement session persistence (camera, bookmarks, visible layers, selected theory, measurements, notes, visited evidence; restore <1s) | 2 | T03 | 02 §23.21, 04 §6.24 | Session saves to localStorage/IndexedDB; restores in <1s; geometry never stores user state |
| M07-T16 | Implement error handling philosophy (missing data never interrupts exploration; present uncertainty instead of errors) | 1 | T01 | 02 §23.26 | Missing evidence shows uncertainty UI, not error modal |

#### AI-Coder Prompt for M07

```
Read GIZA - 02 Information Architecture & UX.txt in full and GIZA - 04
Technical Architecture.txt (§6.13–6.15, §6.23, §6.24).

Build the complete UI shell and navigation system:
- Layout: top bar, bottom toolbar (Camera/Layers/Evidence/Measure/Theory/
  Settings), left panel (scene hierarchy, bookmarks, navigation), right
  panel (evidence, sources, images, metadata)
- Visual language: Stone/Sand/Copper/Dark slate/Soft blue, museum-grade
- 8 navigation modes (Explore, Guided, Research, Documentary, Presentation,
  Educational, Museum, Developer) — switching never reloads the scene
- 5 camera modes with constraints, collision, slope limits, inertia
- Documentary camera spline system (splines separate from scene)
- Input: keyboard, mouse, touch, gamepad (decoupled from camera)
- Session persistence (<1s restore, geometry never stores user state)
- Error handling: present uncertainty, never block exploration

Do NOT modify specs.
```

---

### M08 — Interaction & Research Tools

**Goal:** Implement the interaction system (raycasting, hover, focus, inspect), measurement tool, cross-section mode, evidence overlay, search, bookmarks, comparison mode, and screenshot mode.

**Spec ref:** 04 §6.16–6.20; 02 §23.12–23.18, §23.23
**Depends on:** M05, M07
**Parallelizable with:** —
**Estimate:** 21 points
**AI-coder estimate:** ~30 files · ~4,400 LOC · 4 sessions · ~110k tokens
**Documentation outputs:** `docs/api/` (interaction tools), `docs/architecture/research-tools.md`

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M08-T01 | Implement raycasting interaction system (hover, focus, inspect, evidence view, theory view) | 3 | M05, M07 | 04 §6.17 | All interactions via raycasting; hover highlights; focus centers; inspect opens panel |
| M08-T02 | Implement evidence hotspots (position, radius, priority, evidence IDs, title, description, images, publications, confidence; click never pauses rendering) | 3 | T01 | 04 §6.16 | Hotspots render as halos; click opens evidence panel without pausing |
| M08-T03 | Implement evidence overlay color system (green=high, blue=measured, orange=interpretation, purple=simulation, red=contradictory) | 1 | T02 | 04 §6.20 | 5 colors mapped to confidence/type; overlay toggleable |
| M08-T04 | Implement measurement tool (distance, angles, height, surface area, volume; never modifies geometry; references exact geometry version) | 3 | T01 | 04 §6.18, 02 §23.16 | All 5 measurement types; save/annotate/export/compare; geometry untouched |
| M08-T05 | Implement cross-section mode (vertical, horizontal, custom clipping planes; GPU shaders; no duplicate geometry) | 3 | M05 | 04 §6.19, 02 §23.17 | 3 plane types; works in GPU shaders; no geometry duplication |
| M08-T06 | Implement search (across location, evidence, sources, theory refs, simulation, bookmarks; smooth camera to result) | 2 | T01 | 02 §23.14 | All 6 result types; camera animates to selected result |
| M08-T07 | Implement bookmarks (camera, layers, theory, lighting, selected object, notes; export as URL or JSON) | 2 | T01 | 02 §23.15 | Bookmark stores all 6 fields; URL and JSON export work |
| M08-T08 | Implement comparison mode (split screen, synchronized cameras, side-by-side theories or simulations) | 3 | T01 | 02 §23.18 | Split-screen works; cameras synchronized; theories/simulations comparable |
| M08-T09 | Implement screenshot mode (hide UI, transparent bg, high res, orthographic, scale bar, north arrow, citation watermark; PNG/WebP) | 2 | T01 | 02 §23.23 | All options functional; PNG and WebP export |
| M08-T10 | Implement timeline navigation slider (Old Kingdom, Late Period, Roman, Modern; filter knowledge by date) | 2 | T01 | 02 §23.12, 05 §3 | Slider with 4 phases; date filter shows only knowledge available at that date |
| M08-T11 | Write interaction integration tests (raycast hit, measurement accuracy, cross-section, bookmark round-trip) | 2 | T01–T09 | — | Tests pass in CI |

#### AI-Coder Prompt for M08

```
Read GIZA - 04 Technical Architecture.txt (§6.16–6.20) and GIZA - 02
Information Architecture & UX.txt (§23.12–23.18, §23.23).

Build the interaction and research tools:
- Raycasting interaction (hover, focus, inspect, evidence view, theory view)
- Evidence hotspots (halos, click never pauses rendering)
- Evidence overlay colors (green/blue/orange/purple/red)
- Measurement tool (distance, angles, height, surface area, volume;
  never modifies geometry; references exact geometry version)
- Cross-section mode (vertical/horizontal/custom; GPU shaders; no dupes)
- Search (6 result types; smooth camera to result)
- Bookmarks (6 fields; URL + JSON export)
- Comparison mode (split screen, synced cameras)
- Screenshot mode (all options, PNG/WebP)
- Timeline slider (4 phases; date-based knowledge filter)

Write integration tests. Do NOT modify specs.
```

---

### M08.5 — Benchmark Scene

**Goal:** Build a fake, archaeology-free scene that exercises the full rendering and interaction stack — lighting, shadows, PBR, water, shaders, collisions, and FPS — in isolation. This isolates rendering bugs from archaeology bugs before M09 attaches any real content. The benchmark scene is retained as a regression target for every subsequent milestone.

**Spec ref:** 04 §6.6–6.12, §6.26, §6.27; 03 §2.12 (water features, applied to a fake pool)
**Depends on:** M04, M05, M06A
**Parallelizable with:** M07, M08
**Estimate:** 13 points
**AI-coder estimate:** ~24 files · ~3,200 LOC · 3 sessions · ~90k tokens
**Documentation outputs:** `docs/architecture/benchmark.md`, performance baseline report

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M08.5-T01 | Build a fake scene module (`<BenchmarkScene>`) with a known set of PBR primitives (cubes, spheres, planes, stairs, a shaft, a flooded pool) using M06B reusable assets where available | 2 | M04, M05, M06A | 04 §6.2 | Scene loads; all primitives present; no archaeological claims made |
| M08.5-T02 | Exercise all 5 lighting layers and 3 light modes (Documentary, Exploration, Scientific Inspection) on the fake scene | 1 | M04-T05, M04-T06 | 04 §6.11, §6.12 | All layers and modes toggleable; no lighting artifacts on primitives |
| M08.5-T03 | Exercise the PBR material system with the 17 master materials applied to labeled sample blocks | 1 | M06A-T13 | 04 §6.6, 10 §1.13 | All 17 materials render correctly on sample blocks; screenshot sheet generated |
| M08.5-T04 | Exercise water rendering in the fake pool (planar reflections, SSR, Fresnel, refraction, ripples; configurable elevation/turbidity) | 2 | M04 | 03 §2.12, 04 §6.9 | All water features functional on fake pool; parameters configurable |
| M08.5-T05 | Exercise shadow strategy (CSM desktop, single map mobile, baked AO distant) on the fake scene | 1 | M04-T06 | 04 §6.12 | Shadows correct on all primitives; no acne/peter-panning |
| M08.5-T06 | Exercise collisions and physics (Rapier) on the fake scene (walk the stairs, fall into the shaft, collide with walls) | 2 | M04 | 04 §6.23 | Player collides correctly; no clipping through stairs/shaft walls |
| M08.5-T07 | Establish FPS baseline and capture a performance report (desktop standard/high-end, mobile mid/high-end vs §6.27 budgets) | 2 | M04-T08 | 04 §6.26, §6.27 | Report captured; baseline stored as `docs/architecture/benchmark-baseline.md`; within budget |
| M08.5-T08 | Write benchmark regression test (load scene, assert FPS ≥ budget, assert no console errors, assert all material/water/light toggles work) | 2 | T01–T07 | — | E2E test passes in CI; runs on every PR affecting rendering |

#### AI-Coder Prompt for M08.5

```
Read GIZA - 04 Technical Architecture.txt (§6.6–6.12, §6.26, §6.27) and
GIZA - 03 Osiris Shaft Specification.txt (§2.12 water features). Build a
fake, archaeology-free benchmark scene that isolates rendering from
archaeology.

Build <BenchmarkScene> with PBR primitives (cubes, spheres, planes, stairs,
a shaft, a flooded pool) using M06B reusable assets where available. Then
exercise, on this fake scene:
- All 5 lighting layers + 3 light modes (Documentary, Exploration,
  Scientific Inspection)
- The 17 master PBR materials on labeled sample blocks (screenshot sheet)
- Water rendering (planar reflections, SSR, Fresnel, refraction, ripples)
- Shadow strategy (CSM desktop, single map mobile, baked AO distant)
- Collisions and physics (walk stairs, fall into shaft, collide with walls)
- FPS baseline vs §6.27 budgets (desktop standard/high-end, mobile)

Write a benchmark regression e2e test that runs on every PR affecting
rendering. This scene makes no archaeological claims. Do NOT modify specs.
```

---

### M09 — Osiris Shaft Reconstruction

**Goal:** Build the first fully explorable environment — the Osiris Shaft — as the reference implementation for all subsequent environments. Includes all levels, water, island, sarcophagus, conduit, geology, evidence hotspots, and chronology layers.

**Spec ref:** 03 (entire), 04 §6.1–6.10
**Depends on:** M05, M06A, M06B, M06.5, M07, M08, M03.5
**Parallelizable with:** M02, M03 (backend feeds in)
**Estimate:** 30 points
**AI-coder estimate:** ~55 files · ~9,000 LOC · 8 sessions · ~180k tokens
**Documentation outputs:** `docs/api/` (Osiris scene), `docs/architecture/osiris.md`, evidence hotspot catalog

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M09-T01 | Create Osiris Shaft scene module (`<OsirisScene>` with all subsystems from 04 §6.2) | 2 | M05, M07 | 04 §6.1, §6.2 | Scene module loads; all subsystem components present |
| M09-T02 | Implement hierarchical coordinate nodes (World → OsirisShaft → Level1/2/3) with position, rotation, scale, bounding box, survey reference | 2 | T01 | 03 §2.6 | 4-level hierarchy; each node stores all 5 fields |
| M09-T03 | Build Level 0 — Surface (limestone bedrock, desert, excavation perimeter, entrance, modern fencing, visitor paths, terrain undulations, reference markers) | 3 | T02 | 03 §2.8 | All listed elements visible; modern vs ancient visually distinct |
| M09-T04 | Build Level 1 — Vertical shaft (narrow, rough limestone, modern access infrastructure, limited light, increasing humidity) | 3 | T02 | 03 §2.9 | Shaft conveys depth, scale, confinement; humidity fog increases |
| M09-T05 | Build Level 2 — Larger excavated space (excavation geometry, vertical/horizontal circulation relationship, lower temp, less light, more sediment) | 2 | T02 | 03 §2.10 | Geometry and environmental changes match spec |
| M09-T06 | Build Level 3 — Flooded chamber (water, central island, sarcophagus, limestone walls, water reflections, northern conduit entrance) | 3 | T02 | 03 §2.11 | All principal elements present; archaeological significance conveyed without narration |
| M09-T07 | Implement water rendering (planar reflections, SSR desktop, Fresnel, depth coloration, underwater attenuation, soft ripples, refraction; configurable elevation/transparency/turbidity) | 3 | T06 | 03 §2.12, 04 §6.9 | All water features; parameters configurable; physically plausible |
| M09-T08 | Implement central island (static geometry, collision, shadow reception, wet edges, sediment accumulation, environmental decals for water fluctuations) | 2 | T06 | 03 §2.13 | All island properties match spec |
| M09-T09 | Implement sarcophagus evidence object (metadata: ID, classification, dimensions, material, confidence, bibliography, photos, 3D refs; interactions: rotate panel, highlight measurements, compare photos, show excavation notes, toggle overlays; never movable) | 3 | T06 | 03 §2.14 | All metadata fields populated; all interactions work; immovability enforced |
| M09-T10 | Implement northern conduit (default: observed geometry only, measured dimensions, accessible extent, survey refs, no assumed continuation; optional overlays: surveyed path, geological projection, hydraulic hypothesis, alternative interpretations; visually distinguish surveyed vs inferred) | 3 | T06 | 03 §2.15 | Default and overlay modes; surveyed/inferred visually distinct |
| M09-T11 | Implement geological visualization modes (photorealistic, simplified stratigraphy, cutaway, semi-transparent, cross-sectional engineering — same geometry) | 2 | T06 | 03 §2.16 | 5 modes share geometry; switch instant |
| M09-T12 | Implement environmental rendering (moisture gradients, mineral staining, calcite deposits, surface roughness, dust accumulation, airborne particles, dripping; NO fantasy cave elements) | 2 | T04, T06 | 03 §2.17 | All features present; no decorative fantasy elements |
| M09-T13 | Implement three-mode lighting (Documentary: balanced archaeological photography; Exploration: low ambient + user light; Scientific Inspection: even neutral, minimal shadows) | 2 | T01 | 03 §2.18 | 3 modes; physically plausible; configurable without altering materials |
| M09-T14 | Implement wet surface system (procedural wetness from distance/humidity/dripping/orientation → roughness reduction, specular increase, darkened albedo) | 2 | T07 | 04 §6.8 | Wetness computed procedurally; supports future dynamic water levels |
| M09-T15 | Implement limestone shader (albedo, normal, roughness, AO, height, moisture mask, calcite mask; procedural edge erosion, mineral streaks, micro cracks, dust; no baked dirt) | 3 | M04-T04 | 04 §6.7 | All inputs and procedural additions; no baked dirt textures |
| M09-T16 | Implement fog system (surface: minimal; lower levels: humidity fog; Level 3: localized volumetric; density preserves scientific visibility) | 1 | T04, T06 | 04 §6.10 | 3 fog volumes; density low enough for visibility |
| M09-T17 | Implement chronology layers (Old Kingdom 55, Middle Kingdom 50, Late Period 90, Roman 95, Modern 100; toggleable; geometry continuous, only occupation layers and movable objects change) | 2 | T01 | 03 §2.3 | 5 chronology layers with confidence; geometry continuity preserved |
| M09-T18 | Implement object classification (5 classes: Original Architecture, Modern Installations, Environmental, Archaeological Finds, Interpretive Objects; movement restrictions; Interpretive Objects never in Scientific Evidence mode) | 2 | T01 | 03 §2.5 | 5 classes enforced; Interpretive Objects hidden in Scientific Evidence mode |
| M09-T19 | Implement geometry confidence tagging (entrance 98, chambers 96, stairs 92, water level variable, fractures 80, conduit 85, hidden continuation unknown) | 1 | T02 | 03 §2.7 | Confidence tags on all geometry; visible in debug mode |
| M09-T20 | Implement audio environment (water drip, echo, footsteps, wind surface, silence; no cinematic music during exploration; documentary may have narration/soundtrack) | 1 | T01 | 04 §6.22 | All ambient sounds; no music in Explore; documentary optional narration |
| M09-T21 | Seed evidence hotspots and link to evidence DB (at least 10 hotspots across all levels with evidence IDs, sources, confidence) | 2 | M08-T02 | 03 §1, 04 §6.16 | ≥10 hotspots; all linked to evidence records; clickable |
| M09-T22 | Write Osiris Shaft acceptance test (load scene, traverse all levels, verify hotspots, verify chronology toggle, verify performance budget) | 2 | T01–T21 | — | E2E test passes; performance within 04 §6.27 desktop budget |

#### AI-Coder Prompt for M09

```
Read GIZA - 03 Osiris Shaft Specification.txt in full and GIZA - 04
Technical Architecture.txt (§6.1–6.10, §6.22).

Build the Osiris Shaft as the first fully explorable environment and
reference implementation for all future environments.

Build:
- <OsirisScene> module with all subsystems
- Hierarchical coordinates (World → OsirisShaft → Level1/2/3)
- Level 0 (surface), Level 1 (shaft), Level 2 (excavated), Level 3 (flooded)
- Water rendering (planar reflections, SSR, Fresnel, refraction, ripples)
- Central island (static, collision, wet edges, sediment)
- Sarcophagus (full metadata, interactions, never movable)
- Northern conduit (observed default + 4 overlays; surveyed vs inferred
  visually distinct)
- 5 geological visualization modes (shared geometry)
- Environmental rendering (moisture, staining, calcite, dust, dripping;
  NO fantasy cave elements)
- 3-mode lighting (Documentary, Exploration, Scientific Inspection)
- Procedural wet surface system
- Limestone shader (7 inputs + 4 procedural additions, no baked dirt)
- 3-volume fog system
- 5 chronology layers (confidence: 55/50/90/95/100)
- 5 object classes (Interpretive Objects hidden in Scientific Evidence)
- Geometry confidence tagging
- Audio environment (no music in Explore)
- ≥10 evidence hotspots linked to evidence DB

Write an acceptance test verifying traversal, hotspots, chronology, and
performance budget. Do NOT modify specs.
```

---

### M10 — Simulation Framework MVP

**Goal:** Implement the simulation subsystem infrastructure and the two MVP simulation modules: Hydraulic and Acoustic. Includes lifecycle, parameter provenance, visualization, validation, time control, comparison, export, and the mandatory scientific transparency disclaimer.

**Spec ref:** 06 (entire)
**Depends on:** M05, M09
**Parallelizable with:** M11 (partially)
**Estimate:** 26 points
**AI-coder estimate:** ~40 files · ~7,200 LOC · 5 sessions · ~150k tokens
**Documentation outputs:** `docs/api/` (simulation), `docs/architecture/simulation.md`, parameter provenance reference

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M10-T01 | Implement simulation architecture (Evidence→Geometry→Materials→Parameters→Solver→Visualization; each stage independent) | 2 | M05 | 06 §1.2 | Pipeline composable; no simulation modifies archaeological model |
| M10-T02 | Implement simulation lifecycle state machine (Idle→Parameter Selection→Validation→Simulation→Visualization→Analysis→Export) | 2 | T01 | 06 §1.4 | All 7 states; scene remains interactive throughout |
| M10-T03 | Implement parameter set store (versioned, shareable, JSON format) | 1 | T01 | 06 §1.5 | Parameters stored as spec example; versioned; shareable |
| M10-T04 | Implement parameter provenance classification (Measured, Published, Estimated, User-defined, Experimental) | 1 | T03 | 06 §1.6 | Every parameter classified; users see which are measurements vs assumptions |
| M10-T05 | Implement simulation metadata (ID, software version, date, parameters, author, geometry version, theory context, random seed) | 1 | T03 | 06 §1.21 | All metadata recorded per run; reproducibility ensured |
| M10-T06 | Implement mandatory scientific transparency disclaimer (shown whenever a simulation begins) | 1 | T02 | 06 §1.22 | Disclaimer text from spec displays on simulation start |
| M10-T07 | Implement time control (pause, resume, step forward, step backward via recorded states, variable speed) | 2 | T02 | 06 §1.19 | All controls; replay from recorded states (not reverse solver) |
| M10-T08 | Implement comparison mode (two simulations side-by-side, quantitative differences) | 2 | T02 | 06 §1.20 | Side-by-side; differences highlighted quantitatively |
| M10-T09 | Implement export formats (CSV, JSON, images, MP4, parameter sets, simulation logs) | 2 | T02 | 06 §1.23 | All 6 formats export; future formats (VTK, glTF anim, HDF5) stubbed |
| M10-T10 | Implement async API integration (Client→Queue→Engine→Results→Visualization; long-running sims don't block interaction) | 2 | T02 | 06 §1.24 | Async queue; UI remains responsive during simulation |
| M10-T11 | Implement performance modes (Preview, Standard, Research, Offline) | 1 | T01 | 06 §1.25 | 4 modes; mobile uses Preview/Standard; research workflows preserved |
| M10-T12 | Implement hydraulic solver (standing water, gravity flow, pressure, filling, emptying, surface elevation, velocity, simplified turbulence, conduit connectivity; incompressible Newtonian) | 5 | T01 | 06 §1.7 | All 9 modeled behaviors; inputs from §1.8; outputs from §1.9 |
| M10-T13 | Implement hydraulic visualization (streamlines, velocity arrows, pressure heatmaps, surface animation, particle tracers; multiple overlays simultaneously) | 3 | T12 | 06 §1.10 | All 5 layers; multiple simultaneous; scientific units displayed |
| M10-T14 | Implement hydraulic validation (mass conservation, boundary conditions, numerical stability; compare to measured water levels, chamber elevations, survey geometry, geological constraints; report mismatches) | 2 | T12 | 06 §1.11 | Validation runs before acceptance; mismatches reported not hidden |
| M10-T15 | Implement acoustic solver (resonant frequencies, standing waves, reflection paths, reverberation, energy decay, wave interference; linear acoustics) | 5 | T01 | 06 §1.12 | All 6 evaluated; inputs from §1.13; outputs from §1.14 |
| M10-T16 | Implement acoustic visualization (pressure isosurfaces, heatmaps, animated wavefronts, particle motion, frequency spectrum; scientific units) | 2 | T15 | 06 §1.15 | All 5 visualizations; units displayed |
| M10-T17 | Implement acoustic validation (energy conservation, mesh resolution adequacy, frequency convergence) | 1 | T15 | 06 §1.15 | All 3 metrics; results before acceptance |
| M10-T18 | Integrate hydraulic simulation with Osiris Shaft Level 3 (water in flooded chamber) | 2 | M09, T12 | 06 §1.7 | Simulation runs on Osiris Shaft geometry; results visualized in-scene |
| M10-T19 | Write simulation integration tests (hydraulic on Osiris Shaft, acoustic on a chamber, lifecycle, export, comparison) | 2 | T12–T18 | — | Tests pass; exports verified; disclaimer shown |

#### AI-Coder Prompt for M10

```
Read GIZA - 06 Simulation Framework.txt in full.

Build the simulation framework MVP with Hydraulic and Acoustic modules.

Infrastructure:
- Architecture: Evidence→Geometry→Materials→Parameters→Solver→Visualization
- Lifecycle: Idle→Selection→Validation→Simulation→Visualization→Analysis→Export
- Parameter sets (versioned, shareable, JSON)
- Parameter provenance (5 classes)
- Simulation metadata (reproducibility)
- Mandatory scientific transparency disclaimer on every simulation start
- Time control (pause/resume/step/variable speed; replay from recorded states)
- Comparison mode (side-by-side, quantitative diffs)
- Export (CSV, JSON, images, MP4, parameter sets, logs)
- Async API (queue; UI stays responsive)
- 4 performance modes (Preview/Standard/Research/Offline)

Hydraulic module:
- Solver: standing water, gravity flow, pressure, filling/emptying,
  surface elevation, velocity, simplified turbulence, conduit connectivity
- Visualization: streamlines, velocity arrows, pressure heatmaps, surface
  animation, particle tracers (multiple simultaneous)
- Validation: mass conservation, boundary conditions, stability; compare
  to measured data; report mismatches

Acoustic module:
- Solver: resonant frequencies, standing waves, reflection paths,
  reverberation, energy decay, wave interference (linear acoustics)
- Visualization: pressure isosurfaces, heatmaps, wavefronts, particle
  motion, frequency spectrum
- Validation: energy conservation, mesh resolution, frequency convergence

Integrate hydraulic with Osiris Shaft Level 3. Write integration tests.
Do NOT modify specs.
```

---

### M11 — Great Pyramid Reconstruction

**Goal:** Build the second fully explorable environment — the Great Pyramid — at monument scale. All chambers, passages, shafts, relieving chambers, theory variants, chronology layers, and the shaft flythrough interaction.

**Spec ref:** 07 (entire)
**Depends on:** M09, M10, M06B, M06.5
**Parallelizable with:** M12 (partially)
**Estimate:** 30 points
**AI-coder estimate:** ~70 files · ~12,000 LOC · 10 sessions · ~220k tokens
**Documentation outputs:** `docs/api/` (Great Pyramid scene), `docs/architecture/great-pyramid.md`, theory-variant catalog

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M11-T01 | Create Great Pyramid scene module with monument-scale coordinate node | 2 | M09 | 07 §2.6 | Scene loads; monument-local origin at center; chamber-local geometry authored in Room Coordinates |
| M11-T02 | Build external architecture (core masonry, casing stones north face/lower courses, casing debris, corner sockets, enclosure wall traces, pyramidion) | 3 | T01 | 07 §2.8–2.11 | All external elements; casing confidence 95, pyramidion confidence 40 |
| M11-T03 | Build original entrance + modern entrance (Al-Mamun tunnel, tourist entrance) | 1 | T02 | 07 §2.8 | Both entrances; modern vs ancient distinct |
| M11-T04 | Build Descending Passage (slope 26°31′, 1.2×1.0m, ~96m, masonry→bedrock transition, mummy pit, modern vent shaft) | 2 | T01 | 07 §2.12 | Dimensions match; finish rougher in bedrock; confidence 96 |
| M11-T05 | Build Subterranean Chamber (rough-hewn, central pit, southern niche, 3 blind passages, horizontal connecting passage, rough floor/ceiling) | 2 | T04 | 07 §2.13 | All elements; confidence 90; appears unfinished |
| M11-T06 | Build Ascending Passage (slope 26°02′, 1.0×1.2m, ~39m, Tura limestone, 3 granite plug blocks, Al-Mamun bypass) | 2 | T01 | 07 §2.14 | Dimensions match; plug blocks present; confidence 95 |
| M11-T07 | Build Grand Gallery (height ~8.5m, length ~47m, slope 26°02′, corbelled walls, side benches with notches, ramp slots, corbelled roof, Well Shaft entrance) | 3 | T06 | 07 §2.15 | All elements; confidence 96; indirect bounce lighting reveals corbelling |
| M11-T08 | Build King's Chamber (10.5×5.2m, height ~5.8m, Aswan granite walls/floor/ceiling, broken sarcophagus, N/S shaft entrances, wall joints, stress fractures) | 3 | T07 | 07 §2.16 | All elements; confidence 97; granite grain visible with bounce lighting |
| M11-T09 | Build 5 Relieving Chambers (Davison, Wellington, Lady Arbuthnot, Nelson, Campbell; lower 4 rough granite, Campbell with cartouches, limestone gable above; virtual flythrough access) | 3 | T08 | 07 §2.17 | All 5 chambers; cartouches in Campbell; flythrough access; confidence 90 |
| M11-T10 | Build Antechamber (granite-lined, portcullis slots, half-width wainscots, bypass channel) | 1 | T07 | 07 §2.18 | All elements; confidence 95 |
| M11-T11 | Build Queen's Chamber (5.8×5.2m, ~6.2m to apex, limestone walls, gabled roof, east-wall niche, N/S shaft entrances, 1872 Dixon vent hole) | 2 | T07 | 07 §2.19 | All elements; confidence 95 |
| M11-T12 | Build Queen's Chamber Shafts (0.20×0.20m, horizontal then upward, terminate before exterior, "door"/blocking stones; lower 92, upper 80 confidence) | 2 | T11 | 07 §2.20 | Geometry matches; confidence split lower/upper; blocking stones present |
| M11-T13 | Build King's Chamber Shafts (0.14×0.20m, slope 7°–9°, exit N/S faces, northern bend + "door") | 2 | T08 | 07 §2.21 | Geometry matches; confidence 93; door feature present |
| M11-T14 | Build Well Shaft + Grotto (irregular vertical/inclined, ~30m drop, Grotto cavity, rough finish; confidence 85/80) | 2 | T05, T07 | 07 §2.22, §2.23 | Connects Descending Passage to Grand Gallery; Grotto present |
| M11-T15 | Implement shaft flythrough interaction (select any of 4 shafts, automated camera follows surveyed path, pauses at doors, inferred segments wireframe/dashed, not traversable beyond surveyed extent) | 3 | T12, T13 | 07 §2.29 | All 4 shafts; camera flythrough; pauses at doors; inferred style distinct |
| M11-T16 | Implement scene streaming for pyramid (initial: plateau + exterior LOD2 + entrance + UI; then Descending+Subterranean; then Ascending+Gallery; finally King's+Relieving+Queen's+shafts on demand; one chamber resident unless pinned) | 2 | T01 | 07 §2.33 | Streaming matches spec; memory: one principal chamber resident unless pinned |
| M11-T17 | Implement chronology layers (Old Kingdom Construction 95, Completion 92, Late Period 55, Roman 80, Medieval 95, Early Modern 90, Modern Excavation 100, Contemporary Survey 100) | 2 | T01 | 07 §2.30 | 8 layers with confidence; visible changes per spec table |
| M11-T18 | Implement theory-independent reconstruction (geometry identical across theories; theories as overlays) | 2 | T01 | 07 §2.31 | Removing a theory never alters geometry or evidence |
| M11-T19 | Implement theory variants (Subterranean: 4 theories; Grand Gallery: 4; King's Chamber: 5; Antechamber: 3; Queen's niche: 3; Queen's shafts: 4; King's shafts: 4; Well Shaft: 3; Internal ramp 30, Hydraulic 35) | 3 | T18 | 07 §2.32 | All theory variants with supporting/contradicting evidence, unknowns, simulation links, bibliography |
| M11-T20 | Implement interpretive objects (granite plugs in transit, counterweight assemblies, portcullis systems, hydraulic seals, acoustic resonator arrays, internal ramp segments; only visible when theory active; never in Scientific Evidence mode) | 2 | T19 | 07 §2.32 | All objects; visibility tied to theory; hidden in Scientific Evidence |
| M11-T21 | Seed evidence hotspots (≥12 hotspots from 07 §2.28 priority table with evidence IDs, sources, confidence) | 2 | M08-T02 | 07 §2.28 | ≥12 hotspots; priorities 1–3; all linked to evidence DB |
| M11-T22 | Implement pyramid-specific lighting (Grand Gallery + King's Chamber bounce lighting; Subterranean dark by default, ambient lift only in Scientific Inspection; shaft interiors unlit, require inspection/robot lights) | 1 | T07, T08 | 07 §2.27 | All pyramid-specific lighting rules enforced |
| M11-T23 | Implement materials (local limestone, Tura limestone, Aswan granite, basalt, mortar, gypsum, bedrock, modern wood/steel) | 1 | T02 | 07 §2.25 | All materials from M06A library applied correctly |
| M11-T24 | Implement environmental rendering (dust, salt efflorescence, smoke blackening, roughness variation, micro cracks, airborne dust, humidity gradients; no fantasy tomb elements) | 1 | T01 | 07 §2.26 | All features; no decorative fantasy elements |
| M11-T25 | Integrate acoustic simulation with King's Chamber and Grand Gallery | 2 | M10, T08 | 07 §2.36 | Acoustic sim runs on chamber geometry; results visualized |
| M11-T26 | Write Great Pyramid acceptance test (load, traverse all chambers, shaft flythrough, theory switch, chronology toggle, performance budget) | 2 | T01–T25 | — | E2E test passes; performance within desktop budget |

#### AI-Coder Prompt for M11

```
Read GIZA - 07 Great Pyramid Specification.txt in full.

Build the Great Pyramid as the second fully explorable environment and
first monument-scale reconstruction. Reuse the framework from M09 (Osiris
Shaft) — do not reimplement scene graph, streaming, or interaction.

Build all geometry (use the specific measurements from the spec):
- External architecture (core, casing, pyramidion, sockets, enclosure)
- Original + modern (Al-Mamun) entrances
- Descending Passage (26°31′, 1.2×1.0m, ~96m)
- Subterranean Chamber (pit, niche, 3 blind passages)
- Ascending Passage (26°02′, 1.0×1.2m, ~39m, 3 granite plugs)
- Grand Gallery (8.5m high, 47m long, corbelled, benches, ramp slots)
- King's Chamber (10.5×5.2m, 5.8m, Aswan granite, broken sarcophagus)
- 5 Relieving Chambers (Davison→Campbell, cartouches in Campbell)
- Antechamber (portcullis slots, wainscots, bypass)
- Queen's Chamber (5.8×5.2m, niche, gabled roof)
- Queen's Chamber Shafts (0.20×0.20m, doors)
- King's Chamber Shafts (0.14×0.20m, 7°–9°, northern door)
- Well Shaft + Grotto (~30m drop)

Implement:
- Shaft flythrough interaction (4 shafts, camera follows surveyed path,
  pauses at doors, inferred segments wireframe, not traversable beyond
  surveyed extent)
- Scene streaming (initial set → chambers on demand; one chamber resident
  unless pinned)
- 8 chronology layers (confidence: 95/92/55/80/95/90/100/100)
- Theory-independent reconstruction (geometry identical, theories as
  overlays)
- All theory variants from §2.32 (Subterranean 4, Grand Gallery 4, King's
  5, Antechamber 3, Queen's niche 3, Queen's shafts 4, King's shafts 4,
  Well Shaft 3, Internal ramp 30, Hydraulic 35)
- Interpretive objects (only when theory active, never in Scientific
  Evidence mode)
- ≥12 evidence hotspots from §2.28 priority table
- Pyramid-specific lighting (bounce in Gallery/King's; Subterranean dark;
  shafts unlit)
- Environmental rendering (no fantasy tomb elements)
- Acoustic simulation integration with King's Chamber and Grand Gallery

Write an acceptance test. Do NOT modify specs.
```

---

### M12 — Polish, Performance, Accessibility & Release

**Goal:** Final polish pass: accessibility, localization, offline support, performance optimization across platforms, and release readiness.

**Spec ref:** 02 §13, §23.25; 05 §4, §5, §6; 04 §6.26, §6.27
**Depends on:** M09, M10, M11
**Parallelizable with:** —
**Estimate:** 18 points
**AI-coder estimate:** ~28 files · ~3,600 LOC · 3 sessions · ~100k tokens
**Documentation outputs:** `docs/api/` (a11y, i18n, security), `docs/architecture/release.md`, release runbook

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M12-T01 | Implement accessibility (keyboard nav, screen reader, high contrast, large text, colorblind palettes, adjustable movement speed, motion reduction) | 5 | M07, M09, M11 | 02 §13, §23.25 | All 7 accessibility features; verified with axe-core audit |
| M12-T02 | Implement localization (English, French initial; externalized text; scientific identifiers language-independent) | 3 | M07 | 05 §4 | All UI text externalized; EN + FR complete; identifiers untranslated |
| M12-T03 | Implement offline support (downloadable scene packages: geometry, textures, evidence, sources, images, bibliography, metadata; large videos stream only online) | 3 | M09, M11 | 05 §5 | Scene package downloads; works offline; videos stream only online |
| M12-T04 | Implement security model (roles: Visitor, Researcher, Editor, Administrator; enforced at API and client) | 2 | M02, M03 | 05 §6 | 4 roles; permissions enforced at both layers |
| M12-T05 | Optimize desktop performance to 60 FPS standard / 120 FPS high-end (within §6.27 budgets) | 3 | M09, M11 | 04 §6.26, §6.27 | Profiling shows 60 FPS standard, 120 high-end; within all budgets |
| M12-T06 | Optimize mobile performance to 30–45 FPS mid-range / 60 high-end | 2 | T05 | 04 §6.26 | Profiling shows targets met on target devices |
| M12-T07 | Implement production build and deployment pipeline (Vite production build, CDN asset hosting, env-based config) | 2 | M00 | — | Production build < 2MB JS gzipped; assets on CDN; deploy script documented |
| M12-T08 | Write end-to-end smoke test for full application (load, explore Osiris Shaft, run hydraulic sim, explore Great Pyramid, switch theories, export) | 2 | M09, M10, M11 | — | E2E test passes in CI on production build |

#### AI-Coder Prompt for M12

```
Read GIZA - 02 Information Architecture & UX.txt (§13, §23.25), GIZA - 05
Data Architecture.txt (§4, §5, §6), and GIZA - 04 Technical Architecture.txt
(§6.26, §6.27).

Final polish and release:
- Accessibility: keyboard nav, screen reader, high contrast, large text,
  colorblind palettes, adjustable movement speed, motion reduction
  (verify with axe-core)
- Localization: English + French, externalized text, scientific identifiers
  language-independent
- Offline support: downloadable scene packages (geometry, textures,
  evidence, sources, images, bibliography, metadata); large videos
  stream only online
- Security: 4 roles (Visitor, Researcher, Editor, Administrator), enforced
  at API and client
- Performance optimization: 60 FPS desktop standard, 120 high-end,
  30–45 FPS mobile mid-range, 60 high-end; within §6.27 budgets
- Production build + deployment pipeline
- Full e2e smoke test

Do NOT modify specs.
```

---

## 6. Task Index by Layer

| Layer | Milestones | Task count |
| ----- | ---------- | ---------: |
| Governance | M-1 | 10 |
| Infra | M00, M12 | 20 |
| Data | M01, M02, M03 | 51 |
| Content pipeline | M03.5 | 10 |
| Rendering | M04, M05, M08.5 | 29 |
| Asset | M06A, M06B | 22 |
| Survey | M06.5 | 9 |
| UI | M07, M08 | 27 |
| Content/Environment | M09, M11 | 48 |
| Simulation | M10 | 19 |
| **Total** | | **245** |

---

## 7. Effort Summary

| Milestone | Points | Approx. engineer-weeks |
| --------- | -----: | ---------------------: |
| M-1 | 13 | 2.6 |
| M00 | 21 | 4.2 |
| M01 | 26 | 5.2 |
| M02 | 34 | 6.8 |
| M03 | 23 | 4.6 |
| M03.5 | 21 | 4.2 |
| M04 | 25 | 5.0 |
| M05 | 22 | 4.4 |
| M06A | 18 | 3.6 |
| M06.5 | 18 | 3.6 |
| M06B | 13 | 2.6 |
| M07 | 28 | 5.6 |
| M08 | 21 | 4.2 |
| M08.5 | 13 | 2.6 |
| M09 | 30 | 6.0 |
| M10 | 26 | 5.2 |
| M11 | 30 | 6.0 |
| M12 | 18 | 3.6 |
| **Total** | **400** | **80.0** |

With three parallel tracks after M01 (data/content M02→M03→M03.5; asset/survey M06A→M06.5→M06B; frontend M04→M05→{M07→M08, M08.5}), the effective critical-path duration is approximately **48 engineer-weeks** for a single agent, or ~18 weeks with three agents (one per track) plus integration. M06B (artist production) overlaps the frontend track so that reusable assets exist before M09.

Per-milestone AI-coder estimates (files, LOC, sessions, context) are stated in each milestone header and explained in §1.3.1. They complement story points and are the primary planning figure for AI coding agents.

---

## 8. Risk Register

Large scientific projects carry known risks. Each risk has an owner layer, a likelihood, an impact, and a mitigation that maps to a milestone or specification section. Risks are reviewed at every release gate (§9).

| ID | Risk | Likelihood | Impact | Mitigation |
| -- | ---- | ---------- | ------ | ---------- |
| R1 | Missing or incomplete laser scans for key chambers | High | High | M06.5 survey coverage map makes gaps explicit; manual reconstruction workflow (M06.5-T05) with confidence ≤ 50; scope M09/M11 to surveyed regions first |
| R2 | Licensing issues on scans, photos, or museum images | Medium | High | M03-T10 image licensing (11 types); `All Rights Reserved` display-only and excluded from export (09 §1.15); archival URLs required (09 §1.13) |
| R3 | Unknown / disputed monument dimensions | High | Medium | Theory independence (00 §8.3); theory variants as overlays (07 §2.32); confidence propagation (08 §1.8); conflict records (08 §1.15) never silently resolved |
| R4 | Browser GPU limits (memory, draw calls, texture budget) | Medium | High | Performance budgets enforced (04 §6.27); adaptive quality manager (M04-T03); LOD + scene streaming (M05); benchmark scene (M08.5) gates rendering before archaeology |
| R5 | Mobile performance below 30 FPS | High | Medium | Mobile profile in M04-T03; mobile budgets in 04 §6.27; M12-T06 mobile optimization; KTX2 textures (M04-T10) |
| R6 | Evidence disagreements between scholars | High | Medium | Conflict records with 4 resolution states (08 §1.15); both sides presented; never silently pick one value; theory overlays let users compare |
| R7 | AI coders silently diverging in style/structure | High | Medium | M-1 Repository Governance (branching, commits, coding standards, ADRs); PR template; CI governance smoke test (M-1-T10) |
| R8 | Developers blocked for lack of data | High | High | M03.5 Scientific Content Pipeline seeds ≥100 evidence records before M09; seed dataset manifest (M03.5-T09) |
| R9 | Rendering bugs mistaken for archaeology bugs | Medium | Medium | M08.5 Benchmark Scene isolates rendering in a fake scene; regression test on every rendering PR |
| R10 | Spec drift / contradictions between specs | Low | High | Conflict resolution rules (00 §9); ADRs (M-1-T07); CI check that no spec 00–10 is modified by a PR (M-1-T10) |
| R11 | Asset-heavy commits bloat repository history | Medium | Low | Git LFS for scans/models; M06A asset directory structure; ADR-0001 proposes GIZA-Core / GIZA-Content split to isolate asset history |
| R12 | Fantasy / decorative archaeology elements introduced | Medium | High | Limestone shader "no baked dirt" (M09-T15); environmental rendering "NO fantasy cave elements" (M09-T12); review checklist in *GIZA - 99 Development Playbook* §8 |
| R13 | Loss of scientific traceability over time | Medium | High | Definition of Scientific Done (§1.5) enforced; evidence linkage required for release beyond Internal Alpha; audit history immutable (08 §1.22) |
| R14 | Dependency supply-chain compromise | Low | High | Versions pinned, ≥7 days old, no `latest` (M00-T02, M-1-T06); lockfile committed; reviewed on every update |

---

## 9. Release Strategy

The roadmap does not end at a single release. Releases are staged, each with explicit acceptance criteria. A release may ship a subset of milestones; nothing reaches a later stage until its DoSD (§1.5) is satisfied for every visible element it contains.

```text
Internal Alpha
      │
      ▼
Research Preview
      │
      ▼
Closed Beta
      │
      ▼
Museum Beta
      │
      ▼
Public Release
      │
      ▼
Scientific Release
```

| Stage | Audience | Content scope | Acceptance criteria |
| ----- | -------- | ------------- | ------------------- |
| Internal Alpha | Project team only | M00–M05 + M08.5 benchmark + partial M09 | DoD met; benchmark FPS within budget; no crash on full Osiris traversal; DoSD not required (internal only) |
| Research Preview | Invited Egyptologists + engineers | M09 Osiris Shaft complete + M02/M03 backend + M03.5 seed data | DoSD met for all visible Osiris elements; ≥10 evidence hotspots linked; scholar feedback round closed |
| Closed Beta | NDA external researchers | M09 + M10 simulation MVP + partial M11 | DoSD met; hydraulic + acoustic sims validated; performance within desktop budget on reference hardware |
| Museum Beta | Partner museums (kiosk/Presentation mode) | M09 + M11 + M07 Presentation/Museum modes | DoSD met; museum-mode auto-loop verified; offline scene packages work; accessibility audit passed |
| Public Release | Open web access | Full M09 + M11 + M12 polish | DoSD met; 60 FPS desktop / 30–45 FPS mobile; localization EN+FR; security model enforced; e2e smoke test green |
| Scientific Release | Citation-ready | Public Release + exportable evidence/sources + CITATION.cff + DOI | Full export (08 §1.21) validated; bibliography generated in 11 styles; archival URLs present; reproducible from evidence + sources + survey |

Release tagging follows `vX.Y.Z` per M-1-T08; spec-set tags `spec-vX.Y` track the specification version independently (00 §3). Each release produces a changelog entry from Conventional Commits.

---

## 10. Revision History

| Date | Version | Change |
| ---- | ------- | ------ |
| 2026-07-28 | 0.1 Draft | Initial roadmap: 13 milestones, ~203 tasks, dependency graph, AI-coder prompts, GitHub structure, DoD |
| 2026-07-28 | 0.2 Draft | Added M-1 Repository Governance; M03.5 Scientific Content Pipeline (≥100 seeded evidence records); split M06 into M06A (tooling) + M06.5 (survey acquisition) + M06B (asset production); added M08.5 Benchmark Scene; added AI-coder estimates (files/LOC/sessions/context) per milestone; added Definition of Scientific Done (§1.5); added documentation generation strategy (§1.6) and per-milestone Documentation outputs; added Risk Register (§8) and staged Release Strategy (§9); updated dependency graph, task index (245 tasks), and effort summary (400 points). Companion document *GIZA - 99 Development Playbook* added. |
