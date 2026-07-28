# GIZA — Implementation Roadmap

**Version:** 0.1 Draft
**Status:** Working Specification
**Last update:** 2026-07-28

This document bridges the GIZA specification set (00–10) to executable work. It decomposes the project into 13 implementation milestones, 199 development tasks, a dependency graph, effort estimates, AI-coder prompts per milestone, a GitHub milestone structure, and a Definition of Done (DoD) for every task.

It is the operational counterpart of the specifications. Where the numbered specifications define *what* and *why*, this document defines *how*, *in what order*, and *when a task is finished*.

---

## 1. How to Read This Document

### 1.1 Milestones

Each milestone is a coherent, shippable unit of work. Milestones are numbered `M00`–`M12`. They follow the specification dependency graph (see *00 Master Specification* §7) so that no milestone depends on a later one.

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

### 1.3 Effort Scale

| Points | Label | Approx. duration |
| ------: | ----- | ---------------- |
| 1 | XS | 0.5 day |
| 2 | S | 1 day |
| 3 | M | 2–3 days |
| 5 | L | ~1 week |
| 8 | XL | ~2 weeks |
| 13 | XXL | 3–4 weeks |

Estimates are for a single focused engineer or AI coding agent. They exclude review wait time.

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

---

## 2. Milestone Overview

| Milestone | Title | Depends on | Est. points |
| --------- | ----- | ---------- | ----------: |
| M00 | Project Bootstrap & Tooling | — | 21 |
| M01 | Core Type System & Schemas | M00 | 26 |
| M02 | Evidence Database Backend | M01 | 34 |
| M03 | Sources & Bibliography Engine | M01 | 23 |
| M04 | Application Shell & Rendering Foundation | M00 | 25 |
| M05 | Scene Graph & Coordinate System | M01, M04 | 22 |
| M06 | Asset Pipeline Tooling | M01, M05 | 24 |
| M07 | Core UI Shell & Navigation Modes | M04, M05 | 28 |
| M08 | Interaction & Research Tools | M05, M07 | 21 |
| M09 | Osiris Shaft Reconstruction | M05, M06, M07, M08 | 30 |
| M10 | Simulation Framework MVP | M05, M09 | 26 |
| M11 | Great Pyramid Reconstruction | M09, M10 | 30 |
| M12 | Polish, Performance, Accessibility & Release | M09, M10, M11 | 18 |
| **Total** | | | **328** |

> The total exceeds the sum of any single critical path because milestones M02/M03 (data backend) and M04–M08 (frontend) run in parallel after M01.

---

## 3. Dependency Graph

```text
M00 Project Bootstrap
    │
    ▼
M01 Core Type System & Schemas
    │
    ├──────────────┐
    ▼              ▼
M02 Evidence DB  M04 App Shell & Rendering
    │              │
    ▼              ▼
M03 Sources &    M05 Scene Graph & Coords
Bibliography       │
    │              ├──────────────┐
    │              ▼              ▼
    │            M06 Asset       M07 Core UI &
    │            Pipeline        Navigation
    │              │              │
    │              │              ▼
    │              │            M08 Interaction &
    │              │            Research Tools
    │              │              │
    │              ▼              ▼
    │            M09 Osiris Shaft Reconstruction
    │              │
    │              ▼
    │            M10 Simulation Framework MVP
    │              │
    │              ▼
    │            M11 Great Pyramid Reconstruction
    │              │
    │              ▼
    │            M12 Polish, Performance, Release
```

Critical path: **M00 → M01 → M04 → M05 → M07 → M08 → M09 → M10 → M11 → M12**

M02 and M03 (data backend) can proceed in parallel with the frontend track (M04–M08) and feed into M09 when the first environment is assembled.

---

## 4. GitHub Milestone Structure

Create 13 GitHub Milestones, one per milestone below. Each task becomes a GitHub Issue labeled with:

* `milestone: MNN`
* `type: feature` | `type: infra` | `type: tooling` | `type: content` | `type: test`
* `layer: data` | `layer: rendering` | `layer: ui` | `layer: simulation` | `layer: asset` | `layer: infra`
* `effort: XS` | `effort: S` | `effort: M` | `effort: L` | `effort: XL` | `effort: XXL`

Issue body template:

```markdown
**Milestone:** MNN
**Spec ref:** <section>
**Effort:** <points>
**Depends on:** #<issue>, #<issue>

## Definition of Done
- [ ] <criterion 1>
- [ ] <criterion 2>
...
```

Recommended branch naming: `mNN-tKK-<slug>`.

---

## 5. Milestone Details

---

### M00 — Project Bootstrap & Tooling

**Goal:** Establish the repository, build tooling, CI, folder structure, and developer documentation so that all subsequent milestones start from a clean, typed, tested baseline.

**Spec ref:** 04 §2 (folder structure), 00 §4 (repo organization)
**Depends on:** —
**Parallelizable with:** —
**Estimate:** 21 points

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

### M04 — Application Shell & Rendering Foundation

**Goal:** Stand up the React Three Fiber application shell, rendering pipeline, performance monitoring, and debug mode. This is the empty stage on which all environments are built.

**Spec ref:** 04 §1, §7, §6.25–6.27
**Depends on:** M00
**Parallelizable with:** M01, M02, M03
**Estimate:** 25 points

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

### M06 — Asset Pipeline Tooling

**Goal:** Build the validation, publishing, and metadata tooling that enforces the asset production pipeline. This ensures every glTF entering the scene is validated, budgeted, and linked to evidence.

**Spec ref:** 10 (entire)
**Depends on:** M01, M05
**Parallelizable with:** M07
**Estimate:** 24 points

#### Tasks

| ID | Title | Effort | Depends on | Spec ref | DoD |
| -- | ----- | -----: | ---------- | -------- | --- |
| M06-T01 | Create asset directory structure (`assets/{source,working,master,export,metadata,validation}/...`) | 1 | M00 | 10 §1.3 | Directories exist with READMEs explaining each |
| M06-T02 | Implement naming convention validator (`<monument>-<location>-<object>-<lod>.glb`, monument codes GP/OS/KF/MK/PL) | 2 | T01 | 10 §1.4 | Validator accepts valid names, rejects invalid; unit tested |
| M06-T03 | implement mesh budget validator (Hero/Standard/Background × LOD0–3 triangle limits) | 2 | T01 | 10 §1.14 | Validates triangle counts against all 12 budget cells; rejects over-budget |
| M06-T04 | Implement texel density validator (2048/1024/512/128 px/m by asset class) | 2 | T01 | 10 §1.11 | Validates texel density; reports violations |
| M06-T05 | Implement glTF export validator (Y up, -Z forward, PBR, KTX2, no cameras/lights, node hierarchy PlateauRoot→MonumentRoot→LocationRoot→ObjectRoot→Mesh) | 3 | T01 | 10 §1.17 | Validates export settings; rejects non-conforming glTFs |
| M06-T06 | Implement scientific metadata validator (asset.extras.giza with all 13 fields, node.extras.giza with 4 fields) | 2 | T01 | 10 §1.18 | Validates all required metadata fields present; rejects assets missing evidenceIds |
| M06-T07 | Implement collision mesh validator (`<objectName>_COL`, not rendered, Rapier-compatible) | 2 | T01 | 10 §1.15 | Collision nodes detected and validated; excluded from render |
| M06-T08 | Implement LOD generation pipeline (LOD0→LOD1→LOD2→LOD3→Billboard) | 5 | T03 | 10 §1.16 | Generates LODs from master mesh; Hausdorff distance within thresholds; UVs preserved where possible |
| M06-T09 | Implement survey deviation validator (<1cm green, 1–5cm yellow, >5cm red) | 2 | T01 | 10 §1.25 | Compares mesh to survey data; color-coded report; red threshold blocks Verified status |
| M06-T10 | Implement validation report generator (JSON with checks, warnings, errors, approved) | 2 | T03–T09 | 10 §1.19 | Report contains all check results; errors block publish; warnings allow Editor approval |
| M06-T11 | Implement publishing pipeline (validate → manifest → copy to export/ → register → tag → update scene registry) | 3 | T10 | 10 §1.20 | Full pipeline runs; manifest with LODs, materials, collision, evidence, confidence, validation report |
| M06-T12 | Implement asset manifest store and API (`GET /assets`, `/:id`, `/:id/manifest`, `/:id/versions`, `/:id/validation`, `POST /validate`, `/publish`, `/supersede`) | 2 | T11 | 10 §1.27 | Endpoints return typed manifests; supersession retains prior versions |
| M06-T13 | Implement PBR material library (17 master materials as JSON descriptors) | 2 | M01 | 10 §1.13 | All 17 materials from §1.13 defined as JSON; sample renders for 3 |
| M06-T14 | Write pipeline integration test (ingest a sample mesh → validate → publish → load in scene) | 2 | T11, T13 | — | End-to-end test passes in CI |

#### AI-Coder Prompt for M06

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

### M07 — Core UI Shell & Navigation Modes

**Goal:** Build the application UI shell (top bar, bottom toolbar, left and right panels) and all navigation modes (Explore, Guided, Research, Documentary, Presentation, Educational, Museum, Developer). Mode switching never reloads the scene.

**Spec ref:** 02 (entire)
**Depends on:** M04, M05
**Parallelizable with:** M06, M08 (partially)
**Estimate:** 28 points

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

### M09 — Osiris Shaft Reconstruction

**Goal:** Build the first fully explorable environment — the Osiris Shaft — as the reference implementation for all subsequent environments. Includes all levels, water, island, sarcophagus, conduit, geology, evidence hotspots, and chronology layers.

**Spec ref:** 03 (entire), 04 §6.1–6.10
**Depends on:** M05, M06, M07, M08
**Parallelizable with:** M02, M03 (backend feeds in)
**Estimate:** 30 points

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
**Depends on:** M09, M10
**Parallelizable with:** M12 (partially)
**Estimate:** 30 points

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
| M11-T23 | Implement materials (local limestone, Tura limestone, Aswan granite, basalt, mortar, gypsum, bedrock, modern wood/steel) | 1 | T02 | 07 §2.25 | All materials from M06 library applied correctly |
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
| Infra | M00, M12 | 19 |
| Data | M01, M02, M03 | 51 |
| Rendering | M04, M05 | 17 |
| Asset | M06 | 14 |
| UI | M07, M08 | 27 |
| Content/Environment | M09, M11 | 48 |
| Simulation | M10 | 19 |
| Polish | M12 | 8 |
| **Total** | | **199** |

---

## 7. Effort Summary

| Milestone | Points | Approx. engineer-weeks |
| --------- | -----: | ---------------------: |
| M00 | 21 | 4.2 |
| M01 | 26 | 5.2 |
| M02 | 34 | 6.8 |
| M03 | 23 | 4.6 |
| M04 | 25 | 5.0 |
| M05 | 22 | 4.4 |
| M06 | 24 | 4.8 |
| M07 | 28 | 5.6 |
| M08 | 21 | 4.2 |
| M09 | 30 | 6.0 |
| M10 | 26 | 5.2 |
| M11 | 30 | 6.0 |
| M12 | 18 | 3.6 |
| **Total** | **328** | **65.6** |

With two parallel tracks (data backend M02/M03 and frontend M04–M08), the effective critical-path duration is approximately **40 engineer-weeks** for a single agent, or ~20 weeks with two agents (one per track) plus integration.

---

## 8. Revision History

| Date | Version | Change |
| ---- | ------- | ------ |
| 2026-07-28 | 0.1 Draft | Initial roadmap: 13 milestones, ~203 tasks, dependency graph, AI-coder prompts, GitHub structure, DoD |
