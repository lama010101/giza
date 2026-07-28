# GIZA — Development Playbook

**Version:** 0.1 Draft
**Status:** Working Specification
**Last update:** 2026-07-28

This document is the operational guide for everyone who touches the GIZA repository — AI coding agents (Devin, Claude Code, Copilot, GLM) and human developers alike. It defines *how* development is conducted: the order in which to read specifications and tackle milestones, the workflow an AI agent follows for each task, reusable prompt templates, git and branching conventions, coding standards, testing strategy, review checklists, common mistakes, recovery procedures, a repository map, and an onboarding guide. It does not redefine *what* is built; the *what* lives in the numbered specifications (00–10) and the implementation roadmap (*GIZA - 15 Implementation Roadmap*).

---

## Relation to the Specifications

This document is operational and meta-architectural. It complements the numbered specifications; it does not override them. Where this document appears to conflict with any specification 00–10, the numbered specifications prevail (see *GIZA - 00 Master Specification* §9). This document may be extended, but it must never alter the architectural principles, identifier namespaces, coordinate system, or terminology defined in *GIZA - 00 Master Specification* §8 and §10.

The specifications 00–10 are canonical and must not be modified by any developer or AI agent unless explicitly instructed (see *GIZA - 00 Master Specification* §13.1 and `.devin/rules/giza.md`).

---

# 1. Development Order

The recommended sequence combines the reading order from *GIZA - 00 Master Specification* §6 with the milestone dependency graph from *GIZA - 15 Implementation Roadmap* §3. A developer or AI agent should read specifications and tackle milestones in the following order.

### 1.1 Pre-Project Governance (M-1)

Before any code is written, repository governance is established. This pre-milestone step (referred to as M-1 in the roadmap sequence) defines the branching strategy, contributor access, branch protection rules, CI gating, and the Conventional Commits policy. The authoritative git and branching rules are recorded in §4 and §5 of this document. No implementation milestone begins until governance is in place.

### 1.2 Bootstrap (M00)

Read *GIZA - 00 Master Specification* §4 (repository organization) and *GIZA - 04 Technical Architecture* §1–§2. Execute milestone M00 (Project Bootstrap & Tooling) to establish Vite + React + TypeScript, the folder structure, CI, lint, typecheck, and test harness.

### 1.3 Core Types (M01)

Read *GIZA - 05 Data Architecture*, *GIZA - 08 Evidence Database Specification*, and *GIZA - 09 Sources & Bibliography Standard*. Execute milestone M01 (Core Type System & Schemas). Every downstream milestone depends on these types.

> **Reading order note.** The Hypothesis Framework (spec 11) is a core engine specification and should be read early — after *GIZA - 01 Vision & Scientific Foundation* and before the environment specifications (03, 07). The recommended reading order is: 00 → 01 → 11 → 05 → 08 → 09 → 04 → 02 → 06 → 10 → 03 → 07 → 15 → 99. Spec 11 formalizes the theory-independence principle from 01 §7 into a plugin architecture with predictions and per-hypothesis confidence; reading it before the environment specs ensures that reconstruction work is hypothesis-aware from the start.

### 1.4 Two Parallel Tracks

After M01, development proceeds along two parallel tracks. The tracks converge at M09.

```
Track A — Data Backend                Track B — Frontend & Rendering
─────────────────────────             ──────────────────────────────
M02 Evidence Database Backend         M04 Application Shell & Rendering
    ↓                                     ↓
M03 Sources & Bibliography Engine     M05 Scene Graph & Coordinate System
                                          ↓
                                      M06 Asset Pipeline Tooling
                                          ↓
                                      M07 Core UI Shell & Navigation
                                          ↓
                                      M08 Interaction & Research Tools
                                          ↓
                                      ────────────────────────
                                              ↓
                                         M09 (convergence)
```

Track A (M02, M03) builds the evidence and sources backend. Track B (M04 → M05 → M06 → M07 → M08) builds the rendering, scene graph, asset pipeline, UI, and interaction layers. A single agent may work both tracks sequentially; two agents may work them in parallel.

### 1.5 Content Pipeline (M03.5)

Between M03 and M06, a content pipeline sub-phase (M03.5) prepares the survey and evidence ingestion tooling that feeds asset production. This includes survey data import, evidence seeding, and source registration. It runs in parallel with Track B milestones M04 and M05.

### 1.6 Asset Production (M06A / M06.5 / M06B)

M06 decomposes into three sub-phases:

| Sub-phase | Title | Purpose |
| --------- | ----- | ------- |
| M06A | Pipeline tooling | Validators, LOD generation, publishing pipeline |
| M06.5 | Survey integration | Survey deviation validator, scan-to-mesh workflow |
| M06B | Asset production | Actual mesh, texture, and material production for M09 and M11 |

M06A and M06.5 are engineering tasks. M06B is an asset-production task that depends on M06A and M06.5 and feeds into M09.

### 1.7 Benchmark (M08.5)

Before the first environment is assembled, a performance benchmark milestone (M08.5) verifies that the rendering pipeline, scene graph, streaming, and LOD system meet the performance budgets defined in *GIZA - 04 Technical Architecture* §6.27. This gate prevents environment work from proceeding on a non-performant foundation.

### 1.8 Environments and Release

```
M09 Osiris Shaft Reconstruction
    ↓
M10 Simulation Framework MVP
    ↓
M11 Great Pyramid Reconstruction
    ↓
M12 Polish, Performance, Accessibility & Release
```

M09 is the reference environment. M10 adds simulation. M11 scales to monument size. M12 is the release pass.

### 1.9 Full Sequence

```
M-1 Governance
    ↓
M00 Bootstrap
    ↓
M01 Core Types
    ↓
    ├──────────────────┐
    ↓                  ↓
M02 Evidence DB     M04 App Shell
    ↓                  ↓
M03 Sources         M05 Scene Graph
    ↓                  ↓
M03.5 Content          ↓
Pipeline             M06A Pipeline
    ↓                  ↓
                     M06.5 Survey
                       ↓
                     M06B Asset Production
                       ↓
                     M07 Core UI
                       ↓
                     M08 Interaction
                       ↓
                     M08.5 Benchmark
                       ↓
                     M09 Osiris Shaft
                       ↓
                     M10 Simulation
                       ↓
                     M11 Great Pyramid
                       ↓
                     M12 Release
```

---

# 2. AI Workflow

This section defines the step-by-step workflow an AI coding agent follows for every task. The workflow applies to all agents: Devin, Claude Code, Copilot, GLM, and any future agent.

### 2.1 Step-by-Step Checklist

1. **Read the relevant specification section.** Identify which spec(s) the task implements. Read the cited sections in full. Do not skim.
2. **Read the roadmap milestone and AI-coder prompt.** Open *GIZA - 15 Implementation Roadmap*, locate the milestone, read its goal, task table, and AI-coder prompt. Note the spec refs and DoD.
3. **Read this playbook.** Confirm the coding conventions (§6), testing strategy (§7), and common mistakes (§9) for the task type.
4. **Create a feature branch.** Branch from `master` using the naming convention in §5: `mNN-tKK-<slug>`.
5. **Write tests first (TDD where possible).** For logic, schemas, state machines, and algorithms, write a failing test before implementing. For UI components, write component tests that assert behavior, not implementation details.
6. **Implement.** Write code that satisfies the spec and passes the tests. Follow the coding conventions in §6.
7. **Self-verify against the DoD.** Check every criterion in the task's DoD and the global DoD (*GIZA - 15 Implementation Roadmap* §1.4).
8. **Self-verify against the Definition of Scientific Done.** Every visible 3D element links to evidence. Every confidence value is assigned. No interpretive element appears in Scientific Evidence mode. No fantasy or decorative archaeology elements are present.
9. **Run lint, typecheck, and tests.**
   ```
   npm run lint
   npm run typecheck
   npm run test
   npm run test:e2e   # if e2e tests exist for this area
   ```
10. **Commit one logical unit per commit.** Each commit is a single coherent change. Follow the commit convention in §4.
11. **Open a pull request.** PR title follows the commit convention. PR body references the task ID, spec ref, and DoD checklist.
12. **Address review feedback.** Respond to every comment. Push fixes as new commits. Do not force-push during review unless explicitly requested.

### 2.2 Definition of Scientific Done

In addition to the global DoD, every task that produces a visible 3D element or a data record must satisfy:

* Every visible object links to at least one evidence record (`EV-NNNNNN`).
* Every evidence record links to at least one source (`SRC-NNNNNN`).
* Every confidence value is explicitly assigned (0–100), never defaulted silently.
* Interpretive objects are hidden in Scientific Evidence mode.
* No fantasy, decorative, or invented archaeological elements are present.
* The four-layer separation (Evidence → Reconstruction → Interpretation → Simulation) is respected.
* Theory independence is preserved: removing a theory never alters geometry or evidence.

---

# 3. Prompt Templates

The following templates are reusable prompts an AI agent uses to start a task. Each template has slots for the spec reference, milestone/task ID, DoD, and constraints. The style mirrors the AI-coder prompts in *GIZA - 15 Implementation Roadmap* §5.

### 3.1 Feature Task Prompt

```
You are working on the GIZA repository, an interactive scientific
visualization platform for the Giza Plateau.

Read the following before starting:
- GIZA - 00 Master Specification.md (§8 architectural principles, §10 conventions)
- GIZA - <NN> <Spec Title>.<ext> (§<chapter>)
- GIZA - 15 Implementation Roadmap.md (milestone M<NN>, task M<NN>-T<KK>)

Task: <MNN-TKK> <task title>

Spec ref: <NN> §<chapter>
DoD:
- <criterion 1>
- <criterion 2>
- <criterion 3>

Constraints:
- Strict TypeScript, zero `any`.
- Zod for runtime validation where schemas are involved.
- Evidence-first: every visible object links to evidence.
- Do NOT modify any specification document (00–10).
- Do NOT use `latest` for dependencies. Pin versions ≥7 days old.
- No console.log in committed code.
- No secrets committed.

Write tests first (TDD). Run `npm run lint`, `npm run typecheck`,
`npm run test` before committing. Commit one logical unit per commit
following Conventional Commits. Open a PR referencing the task ID.
```

### 3.2 Bug Fix Prompt

```
You are fixing a bug in the GIZA repository.

Read the relevant specification:
- GIZA - <NN> <Spec Title>.<ext> (§<chapter>)

Bug: <description>
Task ID: <MNN-TKK> (or "unplanned" if no task exists)
Reproduction: <steps or test that fails>

DoD:
- A failing test is added that reproduces the bug.
- The fix makes the test pass.
- No existing tests are broken.
- The fix does not modify any specification document.
- The fix does not introduce `any` or weaken type safety.

Constraints:
- Same as §3.1 constraints.
- Every bug fix starts with a failing test (see §7).
```

### 3.3 Spec-Implementation Prompt

```
You are implementing a specification section in the GIZA repository.

Read in full:
- GIZA - <NN> <Spec Title>.<ext>

Implement §<chapter>: <section title>

Spec ref: <NN> §<chapter>
Milestone: M<NN>
DoD (from roadmap):
- <criterion 1>
- <criterion 2>

Constraints:
- Translate every field, state, rule, and relationship from the spec
  into typed TypeScript + Zod schemas.
- Do not omit fields. Do not invent fields.
- Use the identifier namespaces from 00 §10.3.
- Use the coordinate system from 00 §10.4.
- Do NOT modify the specification. If the spec is ambiguous, record an
  issue and ask (see §10.8).

Write unit tests with valid and invalid fixtures. Run lint, typecheck,
and tests before committing.
```

### 3.4 Refactor Prompt

```
You are refactoring code in the GIZA repository.

Target: <file or module>
Reason: <why the refactor is needed — not cosmetic>

DoD:
- All existing tests pass without modification.
- No behavior change is observable from the public API.
- Type safety is improved or maintained, never weakened.
- No `any` is introduced.
- No specification is modified.

Constraints:
- Same as §3.1 constraints.
- Commit the refactor separately from any feature or fix.
- If the refactor spans multiple files, split into multiple commits,
  each a single logical step.
```

### 3.5 Test-Writing Prompt

```
You are writing tests for existing code in the GIZA repository.

Target: <file or module>
Spec ref: <NN> §<chapter>
Coverage target: ≥ 95% for schema/core logic, ≥ 80% for components

DoD:
- Tests cover valid and invalid inputs.
- Tests cover edge cases (empty, boundary, null where applicable).
- Tests assert behavior, not implementation details.
- No snapshot tests unless explicitly requested.
- Tests run in CI without additional infrastructure.

Constraints:
- Use Vitest for units, React Testing Library for components,
  Playwright for e2e.
- Do NOT modify the code under test unless it has a bug (then use §3.2).
- Do NOT modify any specification.
```

---

# 4. Git Workflow

### 4.1 Branching Strategy

The repository uses trunk-based development. All work happens on short-lived feature branches off `master` and merges back to `master` via pull request.

* `master` is always deployable. CI must pass on `master`.
* No direct pushes to `master`. All changes arrive via PR.
* Feature branches are short-lived: hours to days, never weeks.
* Squash-merge is the default merge strategy. The squash commit message follows the commit convention (§4.3).
* After merge, the feature branch is deleted.

### 4.2 Branch Naming

See §5 for the full naming convention.

### 4.3 Commit Convention

Commits follow Conventional Commits with a GIZA-specific scope.

```
<type>(<scope>): <imperative summary>
```

| Type | Use |
| ---- | --- |
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `docs` | Documentation change (not specs 00–10) |
| `refactor` | Code restructuring with no behavior change |
| `test` | Test additions or corrections |
| `chore` | Tooling, config, dependency updates |
| `infra` | CI, build pipeline, deployment |
| `content` | Evidence, source, or asset data additions |

Rules:

* The summary is in imperative mood: "Add evidence schema" not "Added evidence schema".
* The summary focuses on *why*, not *what*. The diff shows *what*.
* One logical change per commit. A commit that adds a schema and also fixes an unrelated bug is two commits.
* The body (when present) explains the rationale and references the task ID.
* No `console.log`, debug code, or secrets in any commit.
* Include the co-author trailer when an AI agent authored the commit.

Example:

```
feat(evidence): add evidence lifecycle state machine

Implements the 7-state forward-only lifecycle from 08 §1.3.
Invalid transitions throw. Unit tests cover all valid and
invalid paths.

Task: M01-T10
```

### 4.4 Pull Request Rules

* PR title follows the commit convention.
* PR body references the task ID, spec ref, and DoD checklist.
* CI must pass before merge.
* At least one review approval is required for merge (enforced by branch protection, see M-1 governance).
* Squash-merge. Delete the branch after merge.

### 4.5 Governance Reference

The authoritative repository governance rules — branch protection, required reviews, CI gating, status checks — are established in the M-1 governance milestone. This document records the conventions; M-1 enforces them in GitHub settings.

---

# 5. Branching

### 5.1 Branch Types

| Branch type | Pattern | Purpose |
| ----------- | ------- | ------- |
| Feature | `mNN-tKK-<slug>` | Implementation of a single task |
| Release | `release/vX.Y.Z` | Stabilization for a release |
| Hotfix | `hotfix/vX.Y.Z` | Urgent fix to a released version |

### 5.2 Feature Branches

```
master
  │
  ├── m01-t10-evidence-lifecycle
  ├── m04-t07-debug-overlay
  └── m09-t07-water-rendering
```

* Branch from `master`.
* Name: `mNN-tKK-<slug>` where `NN` is the milestone number, `KK` is the task number, and `<slug>` is a short kebab-case description.
* Merge back to `master` via squash-merge PR.
* Delete after merge.

### 5.3 Release Branches

* Branch from `master` when a release is feature-complete.
* Name: `release/vX.Y.Z`.
* Only bug fixes and polish commits land here.
* Merge back to `master` and tag the release.

### 5.4 Hotfix Branches

* Branch from the release tag.
* Name: `hotfix/vX.Y.Z`.
* Fix the bug, merge to both `master` and the release branch.
* Tag a patch release.

### 5.5 When to Branch

* Branch at the start of a task, not before.
* Rebase on `master` before opening a PR if `master` has advanced.
* Do not branch from another feature branch. Always branch from `master` (or a release branch for hotfixes).

---

# 6. Coding Conventions

### 6.1 TypeScript

* Strict mode is on. `tsconfig` has `strict: true`.
* Zero `any`. Use `unknown` with type guards, or define a proper type.
* No `@ts-ignore` or `@ts-expect-error` without a comment explaining why.
* Zod schemas are the source of truth for runtime data shapes. Types are inferred from schemas (`z.infer<typeof schema>`).

### 6.2 React

* Functional and declarative. No class components for UI.
* Hooks for state and side effects. Custom hooks live in `src/hooks/`.
* Zustand for global state. No prop drilling beyond one level; use a store.
* Components are small and composable. One responsibility per component.

### 6.3 Documentation

* TSDoc on all public APIs and shared types.
* No `console.log` in committed code. Use the debug overlay (see *GIZA - 04 Technical Architecture* §6.25) for runtime diagnostics.
* No secrets, keys, or credentials in code or config. Use `.env` (see M00-T08).

### 6.4 Path Aliases

| Alias | Resolves to |
| ----- | ----------- |
| `@/` | `src/` |
| `@assets/` | `assets/` |
| `@db/` | `database/` |

### 6.5 Evidence-First Architecture

Every visible 3D element must be traceable to archaeological evidence. This is the core principle of the project (see *GIZA - 00 Master Specification* §8.1).

* Every visible object links to at least one `EV-NNNNNN` evidence record.
* Every evidence record links to at least one `SRC-NNNNNN` source record.
* No geometry is hardcoded in components. Object metadata is injected from glTF `extras.giza` (see *GIZA - 04 Technical Architecture* §6.5).
* No fantasy or decorative archaeology elements. No baked dirt textures. No invented chambers or passages.
* Hypothesis-first: every visible object must support multiple simultaneous hypotheses. Geometry never changes between hypotheses. Use the `THEORY-NNN` identifier namespace for hypotheses. Confidence belongs to (Object, Hypothesis). See *GIZA - 11 Hypothesis Framework*.

### 6.6 Four-Layer Separation

```
Observed Evidence
    ↓
Measured Reconstruction
    ↓
Interpretation
    ↓
Simulation
```

These layers never mix (see *GIZA - 00 Master Specification* §8.2). Code must enforce the boundary: evidence records are immutable, reconstructions reference evidence, interpretations are overlays, simulations consume reconstructions but never modify them.

### 6.7 Theory Independence

Geometry exists independently of theories. Theories are overlays. Removing a theory must never alter evidence or geometry (see *GIZA - 00 Master Specification* §8.3, *GIZA - 07 Great Pyramid Specification* §2.31, *GIZA - 08 Evidence Database Specification* §1.24).

### 6.8 Coordinate System

All code uses the layered coordinate system defined in *GIZA - 04 Technical Architecture* §4 and extended in *GIZA - 10 Asset Production Pipeline* §1.5.

| Property | Value |
| -------- | ----- |
| Y axis | Vertical (up) |
| X axis | East-west |
| Z axis | North-south |
| Units | Meters |
| Scale | 1.0 = 1 meter |

### 6.9 Identifier Namespaces

All identifiers use the namespaces defined in *GIZA - 00 Master Specification* §10.3.

| Namespace | Format | Owner |
| --------- | ------ | ----- |
| Evidence | `EV-NNNNNN` | 08 §1.4 |
| Source | `SRC-NNNNNN` | 09 §1.4 |
| Object | `OBJ-NNNN` | 05 §-14 |
| Location | `LOC-NNN` | 05 §-15 |
| Theory | `THEORY-NNN` | 05 §-13 |
| Simulation | `SIM-NNN` | 05 §-12 |
| Media | `MED-NNNN` | 08 §1.19 |
| Mesh | `MESH-...` | 10 §1.4 |
| Material | `MAT_...` | 10 §1.13 |
| Monument | `MON-...` | 07 §2.6 |

Identifiers are stable, opaque, never reused, and never renamed. Do not invent identifiers. If an identifier does not exist, create it through the proper workflow (see *GIZA - 08 Evidence Database Specification* §1.4).

### 6.10 Specification Protection

Do not modify specifications 00–10. This is the single most important rule. If a spec is wrong or ambiguous, record an issue and escalate (see §10.8). Never silently rewrite a spec.

### 6.11 Dependencies

* Pin all dependency versions in `package.json`. Do not use `latest`.
* Pin versions published at least 7 days ago (per *GIZA - 15 Implementation Roadmap* M00-T02).
* Node 20+ is required. The engine field in `package.json` enforces this.

---

# 7. Testing Strategy

### 7.1 Test Pyramid

```
        ┌─────────┐
        │   e2e   │   Playwright — few, slow, whole-app
        ├─────────┤
        │component│   React Testing Library — moderate, fast
        ├─────────┤
        │  unit   │   Vitest — many, instant
        └─────────┘
```

Unit tests dominate. Component tests cover behavior. E2e tests verify critical user paths.

### 7.2 Tools

| Layer | Tool | Scope |
| ----- | ---- | ----- |
| Unit | Vitest | Pure functions, schemas, state machines, algorithms |
| Component | React Testing Library + Vitest | React components, hooks, stores |
| E2E | Playwright | Full application paths in a browser |
| Accessibility | axe-core | WCAG compliance audits |
| Performance | CI budgets | Frame rate, triangle count, draw calls, memory |

### 7.3 Coverage Targets

| Area | Minimum coverage |
| ---- | ---------------: |
| Schema / core logic | 95% |
| State machines | 95% |
| Components | 80% |
| Utilities | 90% |

Coverage is enforced in CI. A drop below the threshold fails the build.

### 7.4 TDD

Test-driven development is required for logic, schemas, state machines, and algorithms:

1. Write a failing test.
2. Implement the minimum code to pass.
3. Refactor.

For UI components, write component tests that assert behavior (what the user sees and can do), not implementation details (internal state, private methods).

### 7.5 Bug Fix Discipline

Every bug fix starts with a failing test that reproduces the bug. The fix makes the test pass. No exception.

### 7.6 Performance Budgets

Performance budgets from *GIZA - 04 Technical Architecture* §6.27 are verified in CI. A regression that exceeds a budget fails the build. The benchmark milestone (M08.5) establishes the baseline.

### 7.7 Accessibility

Accessibility is verified with axe-core audits in CI (see *GIZA - 15 Implementation Roadmap* M12-T01). WCAG compliance is a release gate, not a post-release task.

### 7.8 Pipeline Integration Tests

Evidence and asset validation pipelines have end-to-end integration tests:

* Evidence pipeline: ingest → validate → dedupe → review → publish → export (see M02-T17).
* Asset pipeline: ingest mesh → validate → publish → load in scene (see M06-T14).

### 7.9 Commands

```
npm run test          # unit + component tests
npm run test:e2e      # Playwright e2e tests
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run build         # Vite production build
npm run dev           # Vite dev server
npm run docs          # Regenerate documentation
```

---

# 8. Review Checklist

Every PR must pass this checklist before merge. Reviewers (human or AI) verify each item.

### 8.1 Build and CI

- [ ] `npm run typecheck` passes with zero errors.
- [ ] `npm run lint` passes with zero errors.
- [ ] `npm run test` passes with zero failures.
- [ ] `npm run test:e2e` passes (if e2e tests exist for this area).
- [ ] CI is green on the PR.

### 8.2 Definition of Done

- [ ] All task-specific DoD criteria are met.
- [ ] Global DoD (*GIZA - 15 Implementation Roadmap* §1.4) is met.
- [ ] Definition of Scientific Done (§2.2) is met for visible elements.

### 8.3 Code Quality

- [ ] No `any` anywhere in the diff.
- [ ] No `@ts-ignore` or `@ts-expect-error` without justification.
- [ ] No `console.log` or debug-only code.
- [ ] No secrets, keys, or credentials.
- [ ] TSDoc present on all new public APIs and shared types.
- [ ] Path aliases (`@/`, `@assets/`, `@db/`) used consistently.

### 8.4 Specification Compliance

- [ ] No specification document (00–10) was modified.
- [ ] Cross-references to spec chapters resolve to real chapters.
- [ ] Identifier formats match *GIZA - 00 Master Specification* §10.3.
- [ ] Coordinate conventions respect *GIZA - 00 Master Specification* §10.4.

### 8.5 Scientific Integrity

- [ ] Every visible 3D element links to evidence (`EV-NNNNNN`).
- [ ] Every evidence record links to a source (`SRC-NNNNNN`).
- [ ] Confidence is explicitly assigned (0–100), not silently defaulted.
- [ ] Interpretive objects are hidden in Scientific Evidence mode.
- [ ] No fantasy or decorative archaeology elements.
- [ ] No baked dirt or invented textures in shaders.
- [ ] Four-layer separation is respected.
- [ ] Theory independence is preserved.
- [ ] Hypothesis linkage: if the PR adds or modifies a visible object, does it support multiple hypotheses? Is evidence shared, not duplicated?
- [ ] Per-hypothesis confidence: is confidence assigned per (Object, Hypothesis), not per object alone?
- [ ] Prediction status: if the PR adds a hypothesis, does it define predictions with testable status?
- [ ] No advocacy: does the PR avoid declaring one hypothesis correct? Are avoided terms ('alternative theory', 'fringe theory', 'pseudo-science') absent?
- [ ] Plugin architecture: is the hypothesis installable without engine modification?

### 8.6 Tests

- [ ] Tests are added for new logic.
- [ ] Tests cover valid and invalid inputs.
- [ ] Tests assert behavior, not implementation details.
- [ ] Coverage threshold is met or exceeded.

### 8.7 Documentation

- [ ] Docs are regenerated if API surfaces changed (`npm run docs`).
- [ ] ADRs are added for architectural decisions.

---

# 9. Common Mistakes

The following is a catalog of mistakes AI coders make on this project. Read this before starting any task.

### 9.1 Modifying Specifications 00–10

The specifications are canonical. Modifying them is the most frequent and most serious mistake. If a spec is wrong, record an issue (see §10.8). Do not edit the spec.

### 9.2 Using `any`

`any` disables type safety. Use `unknown` with type guards, or define a proper type. If a third-party type is missing, write a declaration file.

### 9.3 Inventing Evidence IDs

Evidence IDs (`EV-NNNNNN`) are assigned through the evidence database workflow (*GIZA - 08 Evidence Database Specification* §1.4). Do not fabricate IDs in code or test fixtures. Test fixtures use clearly synthetic IDs (e.g., `EV-000001` in a test fixture file) and are not published.

### 9.4 Baking Dirt or Fantasy Elements into Shaders

Shaders must not contain baked dirt, decorative weathering, or fantasy cave/tomb elements (see *GIZA - 03 Osiris Shaft Specification* and M09-T15). Weathering is procedural and evidence-linked, not painted into textures.

### 9.5 Mixing Interpretation with Evidence

Interpretation is an overlay. Evidence is immutable. Code that stores an interpretation inside an evidence record, or renders an interpretive object as evidence, violates the four-layer separation (§6.6).

### 9.6 Hardcoding Geometry That Should Come from Survey Data

Geometry dimensions come from survey data and the specification, not from arbitrary constants in components. Object metadata is injected from glTF `extras.giza` (see *GIZA - 04 Technical Architecture* §6.5).

### 9.7 Using `latest` for Dependencies

Dependencies are pinned to specific versions published at least 7 days ago (see M00-T02). `latest` introduces unreproducible builds.

### 9.8 Committing Secrets

No secrets, API keys, or credentials in code, config, or commits. Use `.env` and `.env.example` (see M00-T08). `.env` is gitignored.

### 9.9 Skipping Confidence Assignment

Every visible object and every evidence record has a confidence value (0–100). Skipping the assignment or silently defaulting to 100 violates *GIZA - 01 Vision & Scientific Foundation* §6 and *GIZA - 08 Evidence Database Specification* §1.8.

### 9.10 Breaking Theory Independence

Removing a theory must never alter geometry or evidence (see *GIZA - 00 Master Specification* §8.3). Code that mutates geometry when a theory is toggled violates this principle.

### 9.11 Adding Narrative or Music in Explore Mode

Explore mode has no narration, no forced sequence, and no cinematic music (see *GIZA - 02 Information Architecture & UX* §23.3 and M09-T20). Music and narration are confined to Documentary mode.

### 9.12 Using Story Points Instead of AI-Coder Metrics

Effort estimates in the roadmap use story points (*GIZA - 15 Implementation Roadmap* §1.3). AI coding agents should track actual completion time and token usage, not re-estimate in story points. Do not change the estimates in the roadmap.

### 9.13 Forgetting to Regenerate Docs

When API surfaces change, run `npm run docs` and commit the regenerated documentation. Stale docs are a review failure (§8.7).

### 9.14 Assigning Confidence to an Object Instead of (Object, Hypothesis)

Confidence is per-hypothesis. Assigning a single confidence value to an object, without regard to which hypothesis is being evaluated, violates *GIZA - 11 Hypothesis Framework* §5. Use `confidenceByObject` so that each (Object, Hypothesis) pair has its own score.

### 9.15 Duplicating Evidence Per Hypothesis

Evidence is shared; hypotheses reference evidence. Duplicating evidence records per hypothesis violates *GIZA - 11 Hypothesis Framework* §6 and the theory-independence principle (*GIZA - 08 Evidence Database Specification* §1.24). Evidence is immutable and hypothesis-agnostic; hypotheses point to the same evidence records.

### 9.16 Modifying Geometry When a Hypothesis Changes

Geometry is hypothesis-independent; only overlays change (see *GIZA - 11 Hypothesis Framework* §2 and *GIZA - 00 Master Specification* §8.3). Code that mutates geometry when a hypothesis is toggled or swapped violates this principle. Geometry is measured reconstruction; hypotheses are interpretive overlays.

### 9.17 Using Avoided Terms

The terms 'alternative theory', 'fringe theory', and 'pseudo-science' are avoided (see *GIZA - 11 Hypothesis Framework* §8). Use 'hypothesis', 'interpretive framework', or 'scientific model'. The platform is scientifically neutral and does not label hypotheses pejoratively.

### 9.18 Hardcoding a Hypothesis Into the Engine

Hypotheses are plugins; install without engine modification (see *GIZA - 11 Hypothesis Framework* §3 and §9). A hypothesis that requires changes to core engine code to load or run violates the plugin architecture. The engine must remain hypothesis-agnostic.

### 9.19 Declaring One Hypothesis Correct

The platform is neutral; present data, let users conclude (see *GIZA - 11 Hypothesis Framework* §2.3 and *GIZA - 01 Vision & Scientific Foundation* §7). Code or UI that declares one hypothesis the correct or authoritative interpretation violates scientific neutrality. All hypotheses are presented with their evidence, predictions, and confidence; the user draws conclusions.

---

# 10. Recovery Procedures

### 10.1 Typecheck Fails

1. Read the error messages. TypeScript errors are usually precise.
2. Fix the type error at the source. Do not suppress with `any` or `@ts-ignore`.
3. If a third-party type is missing, add a declaration in `src/types/`.
4. Re-run `npm run typecheck`.
5. Commit the fix.

### 10.2 Tests Fail

1. Read the test output. Identify the failing assertion.
2. Determine whether the test is wrong or the code is wrong.
3. If the code is wrong, fix it. If the test is wrong, update the test and explain why in the commit body.
4. Re-run `npm run test`.
5. Commit the fix.

### 10.3 CI Is Red

1. Reproduce the failure locally: `npm ci && npm run lint && npm run typecheck && npm run test && npm run build`.
2. If the failure is environment-specific (e.g., Playwright browser missing), document the setup step.
3. Fix the issue on the feature branch.
4. Push and let CI re-run.
5. Do not merge a red PR.

### 10.4 Merge Conflict

1. Rebase the feature branch on `master`: `git rebase master`.
2. Resolve conflicts manually. Do not blindly accept either side.
3. Run `npm run typecheck && npm run test` after resolving.
4. Force-push the rebased branch (force-push is acceptable during rebase, not during review).
5. Confirm CI passes.

### 10.5 Bad Commit Was Pushed

1. If no one has pulled the branch, amend the commit: `git commit --amend` and force-push.
2. If the commit is on `master`, do not rewrite history. Add a revert commit: `git revert <sha>`.
3. Never force-push to `master`.

### 10.6 Dependency Broke

1. Pin the previous working version in `package.json`.
2. Record the breakage as an issue with the dependency name, version, and error.
3. Run `npm ci` and verify the build.
4. Commit the pin and the issue reference.

### 10.7 Spec Contradiction Found

1. Do not modify either spec.
2. Record the contradiction as a GitHub issue with both spec references and the conflicting text.
3. Escalate to maintainers for editorial decision.
4. Follow the conflict resolution rules in *GIZA - 00 Master Specification* §9: the more specific spec prevails; the earlier-numbered spec prevails on foundational matters.
5. Do not silently rewrite a spec.

### 10.8 Evidence Disagreement

1. Do not silently pick one side.
2. Record the disagreement as a conflict record per *GIZA - 08 Evidence Database Specification* §1.15.
3. The conflict record has one of four resolution states: unresolved, partial, superseded, contextual.
4. Both sides remain visible in the platform. The user sees the conflict, not a hidden choice.
5. Escalate to an Editor for review if the conflict is new.

### 10.9 Performance Budget Exceeded

1. Identify the budget that was exceeded (triangles, draw calls, texture memory, materials, lights, probes — see *GIZA - 04 Technical Architecture* §6.27).
2. Profile the scene in debug mode (see §6.25).
3. Reduce geometry (LOD), reduce draw calls (instancing), reduce texture memory (KTX2 compression), or reduce materials.
4. Do not reduce geometric accuracy to meet a budget (see *GIZA - 00 Master Specification* §8.4). If the budget cannot be met without sacrificing accuracy, record an issue and escalate.
5. Re-run the benchmark (M08.5) to confirm.

---

# 11. Repository Map

### 11.1 Specification Files

```
giza/
├── GIZA - 00 Master Specification.md          Entry point; meta-architecture, conventions, AI instructions
├── GIZA - 01 Vision & Scientific Foundation.txt   Mission, principles, evidence classes, confidence scale
├── GIZA - 02 Information Architecture & UX.txt    IA, navigation modes, panels, accessibility, sessions
├── GIZA - 03 Osiris Shaft Specification.txt       First environment; reference reconstruction methodology
├── GIZA - 04 Technical Architecture.txt           Stack, folder structure, scene graph, rendering, performance
├── GIZA - 05 Data Architecture.txt                Core data model, confidence propagation, API, search, security
├── GIZA - 06 Simulation Framework.txt             Simulation categories, lifecycle, validation, transparency
├── GIZA - 07 Great Pyramid Specification.txt      Second environment; monument-scale reconstruction
├── GIZA - 08 Evidence Database Specification.txt  Evidence lifecycle, identifiers, review, conflicts, audit
├── GIZA - 09 Sources & Bibliography Standard.txt  Citation rules, source reliability, DOI/ISBN/ORCID, licensing
├── GIZA - 10 Asset Production Pipeline.txt        Asset directory, naming, validation, glTF extras, publishing
├── GIZA - 11 Hypothesis Framework.md              Hypothesis framework: plugin architecture, predictions, per-hypothesis confidence, comparison
├── GIZA - 15 Implementation Roadmap.md            Milestones M00–M12, tasks, dependency graph, AI-coder prompts
└── GIZA - 99 Development Playbook.md              This document; operational guide for development
```

### 11.2 Source Folder Structure

From *GIZA - 04 Technical Architecture* §2.

```
src/
    app/           Application shell, root components, providers
    components/    Shared React components
    ui/            UI panels, toolbars, overlays (non-3D)
    scene/         Scene modules, environment definitions
    systems/       Rendering pipeline, streaming, LOD, visibility
    shaders/       GLSL shaders and shader material definitions
    materials/     PBR material library and material descriptors
    cameras/       Camera modes, controls, splines
    physics/       Rapier physics, collision setup
    audio/         Ambient audio, spatial audio, narration playback
    evidence/      Evidence schemas, repositories, API client
    theories/      Theory variant definitions, overlay management
    loaders/       glTF, KTX2, and custom asset loaders
    hooks/         Custom React hooks
    utils/         Shared utilities, math, coordinate transforms
```

### 11.3 Assets Structure

From *GIZA - 10 Asset Production Pipeline* §1.3 and *GIZA - 04 Technical Architecture* §2.

```
assets/
    source/            Read-only source data (scans, surveys, reference)
        scans/
            photogrammetry/
            laser/
            muon/
        surveys/
        reference/
            photos/
            plans/
            drawings/
    working/           Editable artist files (Blender, ZBrush, Substance)
    master/            Approved, versioned high-poly and low-poly meshes
    export/            Validated, publish-ready glTF and KTX2
        gltf/
        ktx2/
    metadata/          Manifests linking exports to evidence
        manifests/
        provenance/
    validation/        Automated and manual validation reports
        reports/
        diffs/
    textures/          Runtime textures
    hdr/               HDR environment maps
    scans/             Runtime scan data
    models/            Runtime models
    terrain/           Terrain data
    audio/             Runtime audio assets
```

### 11.4 Other Directories

```
database/              SQLite dev database, migrations, seed data
hypotheses/            Hypothesis plugins (one package per hypothesis, see *GIZA - 11 Hypothesis Framework* §9)
tests/                 Test configuration, fixtures, e2e specs
docs/                  Architecture Decision Records (ADRs)
.devin/                Devin configuration and project rules
    config.json        Devin settings
    rules/
        giza.md        Project rules (always-on)
```

---

# 12. Onboarding Guide

A new contributor or AI agent follows these steps before writing any code.

### 12.1 Read

1. Read *GIZA - 00 Master Specification* in full. Note §8 (architectural principles), §10 (conventions), §13 (AI instructions), §14 (contributor guidance), §15 (glossary).
2. Read this document (*GIZA - 99 Development Playbook*) in full.
3. Read *GIZA - 01 Vision & Scientific Foundation*. Note the evidence classes (E1–E8), confidence scale, and theory independence.
4. Read the specification relevant to your task (see *GIZA - 00 Master Specification* §6 for reading order by role).
5. Read the roadmap milestone and AI-coder prompt for your task in *GIZA - 15 Implementation Roadmap* §5.

### 12.2 Setup

6. Clone the repository.
7. Install dependencies:
   ```
   npm ci
   ```
8. Start the dev server:
   ```
   npm run dev
   ```

### 12.3 Develop

9. Create a feature branch:
   ```
   git checkout -b mNN-tKK-<slug>
   ```
10. Implement with TDD (see §2 and §7). Write tests first, then implement.
11. Verify DoD and Definition of Scientific Done (§2.2).

### 12.4 Verify

12. Run all checks:
    ```
    npm run lint
    npm run typecheck
    npm run test
    npm run test:e2e
    npm run build
    ```
13. Regenerate docs if API surfaces changed:
    ```
    npm run docs
    ```

### 12.5 Submit

14. Commit one logical unit per commit (see §4.3).
15. Push the branch and open a PR referencing the task ID, spec ref, and DoD checklist.
16. Address review feedback (see §2.1 step 12).

### 12.6 Command Reference

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Start Vite dev server |
| `npm run build` | Vite production build |
| `npm run typecheck` | `tsc --noEmit` strict type check |
| `npm run lint` | ESLint |
| `npm run test` | Vitest unit + component tests |
| `npm run test:e2e` | Playwright e2e tests |
| `npm run docs` | Regenerate documentation |

---

# 13. Revision History

| Date | Version | Change |
| ---- | ------- | ------ |
| 2026-07-28 | 0.1 Draft | Initial Development Playbook |
