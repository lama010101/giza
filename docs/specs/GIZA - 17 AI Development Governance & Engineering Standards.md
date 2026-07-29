# GIZA — AI Development Governance & Engineering Standards

**Version:** 0.1 Draft
**Status:** Working Specification
**Last update:** 2026-07-28

This specification defines the governance framework, engineering standards, and quality gates that apply to all development on the GIZA project — whether performed by AI coding agents or human contributors. It is the canonical source for development governance. The operational counterpart is *GIZA - 99 Development Playbook* (day-to-day procedures), and the implementation milestone is M-1 Repository Governance in *GIZA - 15 Implementation Roadmap*.

This specification is binding on all contributors. Deviations require an Architecture Decision Record (ADR) approved by the project owner.

---

# 1. Purpose and Scope

## 1.1 Purpose

The AI coding agent and every human contributor are responsible not only for implementing software but also for managing the technical execution of the project to maximize quality, maintainability, and long-term success.

Every contributor must behave as both:

* Senior Software Architect
* Technical Project Manager

## 1.2 Scope

This specification defines:

* project roadmap management
* task management and backlog discipline
* architecture integrity rules
* design guardrails
* documentation requirements
* specification compliance procedure
* continuous quality review
* risk register management
* decision log (ADR) requirements
* scientific consistency rules
* definition of done
* AI coding agent guardrails
- success metrics

It does not define coding conventions (owned by *GIZA - 99 Development Playbook* §6), branching strategy (owned by M-1 in *GIZA - 15*), or the specification set itself (owned by *GIZA - 00*). It references those documents and binds them together into a governance framework.

## 1.3 Dependencies

This specification depends on:

* *GIZA - 00 Master Specification* (specification set, principles, AI-agent instructions)
* *GIZA - 01 Vision & Scientific Foundation* (scientific neutrality, hypothesis independence)
* *GIZA - 11 Hypothesis Framework* (multiple simultaneous hypotheses, no architectural bias)
* *GIZA - 15 Implementation Roadmap* (M-1 Repository Governance, milestones, risk register)
* *GIZA - 99 Development Playbook* (operational procedures, coding conventions, review checklist)

## 1.4 Relation to Existing Documents

| Document | Role | Relationship to this spec |
| -------- | ---- | ------------------------- |
| *GIZA - 00* | Master specification | Defines the spec set and principles; this spec is part of it |
| *GIZA - 15* M-1 | Implementation milestone | Implements the governance framework defined here (files, templates, CI) |
| *GIZA - 99* | Development playbook | Operational day-to-day guide; references this spec as the authority |
| `docs/adr/` | Decision records | Required by this spec for all significant architectural decisions |

---

# 2. Project Roadmap Management

## 2.1 Living Roadmap

The project roadmap (*GIZA - 15 Implementation Roadmap*) must be continuously maintained. At any point, it must reflect:

* current milestone
* completed milestones
* upcoming milestones
* estimated remaining work
* dependencies
* critical path

## 2.2 Roadmap Updates

The roadmap is updated when:

* a milestone is completed
* a new milestone is added
* task estimates change significantly (>20%)
* dependencies change
* the risk register affects the critical path

Roadmap updates are committed with `docs` scope Conventional Commits.

## 2.3 Milestone Completion

A milestone is complete only when all its tasks meet the Definition of Done (§12). Milestone completion is recorded in the roadmap's revision history.

---

# 3. Task Management

## 3.1 Living Backlog

A living backlog must be maintained containing:

* Features
* Bugs
* Technical debt
* Performance improvements
* Documentation tasks
* Research tasks

## 3.2 Task Fields

Each task must include:

* Priority (P0 critical / P1 high / P2 medium / P3 low)
* Complexity (S / M / L / XL)
* Dependencies (task IDs or milestones)
* Status (backlog / in-progress / blocked / review / done)
* Owner (AI / Human)

## 3.3 Task Tracking

Tasks are tracked via GitHub Issues and Milestones, linked to the roadmap's task IDs (e.g., `M01-T05`). The roadmap is the source of truth for task definitions; GitHub is the source of truth for task status.

---

# 4. Architecture Integrity

## 4.1 Pre-Implementation Verification

Before implementing any feature, verify that it:

* follows the Master Specification (*GIZA - 00*)
* follows existing architecture (*GIZA - 04*)
* introduces no duplicate systems
* avoids unnecessary complexity
* does not violate established design principles (*GIZA - 00* §8)

## 4.2 Conflict Resolution

If conflicts exist between a feature request and the specifications, stop implementation and report them. Do not silently work around specification conflicts. Conflicts are resolved by:

1. Filing a `spec-change` issue (M-1-T05)
2. Discussing the conflict with the project owner
3. If a specification change is approved, updating the specification first
4. Only then implementing the feature

## 4.3 No Silent Changes

Never silently change documented behavior. If an implementation requires deviating from a specification, the deviation must be:

1. Recorded as an ADR
2. Approved by the project owner
3. Reflected in a specification update

---

# 5. Design Guardrails

## 5.1 Prohibited Practices

Never:

* duplicate functionality that already exists
* create multiple sources of truth for the same data
* bypass documented architecture
* hardcode values that should be configurable
* introduce shortcuts that create future technical debt

## 5.2 Preferred Practices

* prefer refactoring over duplication
* identify reusable abstractions before implementing
* minimize technical debt with every change
* prefer modularity over monoliths
* optimize for long-term maintainability over short-term speed

## 5.3 Hypothesis-First Design

Every visible object must support multiple simultaneous hypotheses (*GIZA - 11* §2). Architecture must not bias toward any single hypothesis. New features that affect visible objects must be designed to work across all active hypotheses, not just the one being tested.

---

# 6. Documentation Requirements

## 6.1 Synchronization

Every major implementation must update documentation when necessary. Documentation must always remain synchronized with implementation.

No undocumented architecture changes are allowed.

## 6.2 Documentation Types

| Type | Owner | Location |
| ---- | ----- | -------- |
| Specifications | Project owner | `GIZA - NN *.md` / `*.txt` |
| API documentation | Auto-generated | `docs/api/` (TypeDoc) |
| Architecture guides | Contributors | `docs/architecture/` |
| ADRs | Contributors | `docs/adr/` |
| Governance docs | M-1 milestone | `docs/governance/` |
| Plugin guides | Plugin authors | `docs/hypotheses/`, `docs/simulations/` |
| README | Contributors | `README.md` |
| Changelog | Auto-generated | `CHANGELOG.md` |

## 6.3 Documentation Generation

Documentation is generated via the pipeline defined in M00-T12 and the roadmap's §1.6 documentation generation strategy: TypeDoc for API docs, json-schema-to-md for schema docs, MkDocs for the combined site. Generated docs are rebuilt in CI on every merge to `master`.

---

# 7. Specification Compliance Procedure

## 7.1 Pre-Implementation Checklist

Before beginning any implementation:

1. Read relevant specifications
2. Verify consistency with the specification set
3. Identify conflicts
4. Resolve ambiguities (file an issue or ask the project owner)
5. Only then begin coding

## 7.2 Specification Immunity

The numbered specifications (00–11, 16, 17) are the canonical specification. They may be extended but not rewritten without explicit instruction from the project owner. This is enforced by:

* M-1-T10 governance smoke test (CI verifies no spec files are modified by a PR)
* The PR template's no-spec-modification attestation (M-1-T04)
* The AI agent instructions in *GIZA - 00* §13

## 7.3 Specification Changes

When a specification change is approved:

1. The specification is updated first
2. The roadmap is updated to reflect any new tasks
3. The implementation follows the updated specification
4. The ADR records the decision and rationale

---

# 8. Continuous Quality Review

## 8.1 Post-Feature Review

After every completed feature, review:

* code quality
* architecture
* performance
* scalability
* maintainability
* security
* documentation

## 8.2 Review Cadence

| Review Type | When | By |
| ----------- | ---- | -- |
| Self-review | Every commit | Author (AI or human) |
| PR review | Every PR | At least one reviewer |
| Architecture review | Every milestone | Project owner |
| Security review | When security-sensitive code is touched | Project owner |
| Performance review | When rendering or simulation code is touched | Author + project owner |

## 8.3 Review Checklist

The PR review checklist is defined in *GIZA - 99 Development Playbook* §8. It includes hypothesis-specific items (hypothesis linkage, per-hypothesis confidence, prediction status, no advocacy, plugin architecture).

---

# 9. Risk Register

## 9.1 Continuous Maintenance

A continuously updated risk register must be maintained. The risk register is defined in *GIZA - 15 Implementation Roadmap* §8.

## 9.2 Risk Categories

* Technical risks (architecture, dependencies, performance)
* Scientific risks (evidence quality, hypothesis validity, interpretation bias)
* Implementation risks (scope, complexity, timeline)
* UX risks (usability, accessibility, clarity)
* Performance risks (frame rate, memory, load time)

## 9.3 Risk Fields

Each risk must include:

* likelihood (low / medium / high)
* impact (low / medium / high / critical)
* mitigation strategy
* owner
* status (open / mitigated / closed)

## 9.4 Risk Review

The risk register is reviewed at every milestone completion. New risks are added as they are identified. Closed risks are retained for historical reference.

---

# 10. Decision Log

## 10.1 Architecture Decision Records

Every significant architectural decision must be recorded as an ADR in `docs/adr/`. The ADR format is defined by M-1-T07.

## 10.2 ADR Contents

Each ADR must include:

* decision
* rationale
* alternatives considered
* consequences
* status (Proposed / Accepted / Rejected / Superseded / Deprecated)

## 10.3 When to Write an ADR

Write an ADR when:

* a new architectural pattern is introduced
* a specification conflict is resolved
* a dependency is added or replaced
* a governance rule is changed
* a hypothesis plugin architecture decision is made
* any decision that future contributors need to understand

## 10.4 ADR Index

ADRs are indexed in `docs/adr/README.md`. The index is verified by the M-1-T10 governance smoke test.

---

# 11. Scientific Consistency

## 11.1 Scientific Neutrality

Because GIZA explores competing archaeological and engineering hypotheses, every implementation must preserve scientific neutrality.

The system must never assume one hypothesis is correct.

Every subsystem must support multiple competing hypotheses without architectural bias.

## 11.2 Evidence First

Evidence is immutable. Interpretations are replaceable. Every visible claim links to one or more sources. Nothing appears as fact unless directly measured. (*GIZA - 00* §8.2, *GIZA - 01* §3)

## 11.3 Hypothesis Independence

Geometry exists independently. Hypotheses are overlays. Removing a hypothesis never alters evidence or geometry. Adding a hypothesis never requires new measurements. (*GIZA - 00* §8.3, *GIZA - 11* §8)

## 11.4 Confidence Is Per-Hypothesis

Confidence belongs to (Object, Hypothesis), not to an object alone. Confidence values are independent across hypotheses. The platform never declares one hypothesis correct. (*GIZA - 00* §8.5, *GIZA - 11* §5)

## 11.5 Terminology

Use preferred terms (hypothesis, interpretive framework, scientific model). Avoid pejorative terms (alternative theory, fringe theory, pseudo-science). (*GIZA - 11* §12, *GIZA - 01* §8)

## 11.6 No Advocacy

The platform never advocates for a hypothesis. It presents assumptions, predictions, evidence, simulations, and confidence. The user draws conclusions. (*GIZA - 11* §15.5)

---

# 12. Definition of Done

## 12.1 Task-Level Definition of Done

A task is only considered complete when:

* implementation finished
* unit tests pass
* integration tests pass
* documentation updated
* architecture validated
* performance acceptable
* code reviewed
* no known regressions
* specification compliance verified

## 12.2 Milestone-Level Definition of Done

A milestone is complete when:

* all tasks meet the task-level DoD
* the milestone's Definition of Scientific Done (DoSD) is met (if applicable, per *GIZA - 15* §1.5)
* the roadmap revision history is updated
* the risk register is reviewed
* any new ADRs are recorded

## 12.3 Release-Level Definition of Done

A release is complete when:

* all milestones in the release scope are complete
* the changelog is generated
* the release tag is created
* the release notes are written
* the acceptance criteria for the release stage are met (*GIZA - 15* §9)

---

# 13. AI Coding Agent Guardrails

## 13.1 Thinking Before Coding

The AI coding agent must:

* think before coding
* prefer refactoring over duplication
* identify reusable abstractions
* minimize technical debt
* prefer modularity
* optimize for long-term maintainability
* challenge unclear requirements instead of guessing
* ask for clarification when specifications conflict
* never silently change documented behavior

## 13.2 Specification Reading

Before any implementation task, the AI agent must read the relevant specifications. The reading order is defined in *GIZA - 99 Development Playbook* §1.3:

```
00 → 01 → 11 → 05 → 08 → 09 → 04 → 02 → 06 → 10 → 03 → 07 → 16 → 17 → 15 → 99
```

## 13.3 No Specification Modification

The AI agent must not modify numbered specifications (00–11, 16, 17) unless explicitly instructed by the project owner. This is enforced by CI (M-1-T10) and by the PR template attestation.

## 13.4 Hypothesis Compliance

When implementing any feature that affects visible objects, the AI agent must verify:

* the feature supports multiple simultaneous hypotheses
* evidence is shared, not duplicated
* confidence is per (Object, Hypothesis)
* no hypothesis is declared correct
* avoided terms are absent
* the hypothesis is installable as a plugin without engine modification

## 13.5 Reporting Conflicts

When the AI agent encounters a conflict between a task and the specifications, it must:

1. Stop implementation
2. Report the conflict to the project owner
3. Propose a resolution (specification change, task change, or ADR)
4. Wait for direction before proceeding

---

# 14. Success Metrics

## 14.1 Project Success

The success of the project is measured not only by feature completion but by:

* Architectural coherence
* Scientific extensibility
* Code quality
* Maintainability
* Performance
* Documentation quality
* Ease of future expansion
* Ability to support new hypotheses with minimal code changes

## 14.2 Hypothesis Extensibility Metric

A key success metric: **installing a new hypothesis plugin must require zero changes to engine source code.** If a new hypothesis requires engine modification, the architecture has failed.

## 14.3 Specification Compliance Metric

A key success metric: **no PR modifies a numbered specification without explicit approval.** This is verified by CI.

## 14.4 Documentation Sync Metric

A key success metric: **the documentation reflects the current implementation.** This is verified by the documentation generation pipeline in CI.

---

# 15. Governance Enforcement

## 15.1 CI Enforcement

The following governance rules are enforced by CI (M-1-T09, M-1-T10):

* Conventional Commits format (commitlint)
* No specification files modified by PRs (governance smoke test)
* CHANGELOG regenerated on merge
* ADR index in sync
* PR template present

## 15.2 PR Enforcement

The PR template (M-1-T04) enforces:

* Spec reference (which specification governs this PR)
* Milestone/task IDs (which roadmap tasks this PR addresses)
* DoD checklist (all items checked)
* DoSD checklist (when applicable)
* Evidence linkage (when scientifically traceable)
* No-spec-modification attestation

## 15.3 Review Enforcement

PRs require at least one review before merge. Reviews check the items in *GIZA - 99 Development Playbook* §8, including hypothesis-specific items.

## 15.4 Branch Protection

Branch protection rules are documented in `docs/governance/branch-protection.md` (M-1-T09). Recommended rules:

* `master` requires PR + at least one review
* `master` requires CI checks to pass
* `master` requires Conventional Commits
* Force-push to `master` is prohibited
* Branch deletion after merge is required

---

# 16. Change Management

## 16.1 Specification Changes

Specification changes follow this procedure:

1. File a `spec-change` issue (M-1-T05)
2. Discuss the change with the project owner
3. If approved, update the specification
4. Update the roadmap if new tasks are needed
5. Record an ADR if the change is architectural
6. Implement the change

## 16.2 Architecture Changes

Architecture changes follow this procedure:

1. Write an ADR (Proposed status)
2. Discuss with the project owner
3. If accepted, update status to Accepted
4. Update specifications if needed
5. Implement the change
6. Update documentation

## 16.3 Governance Changes

Changes to this specification (17) follow the same procedure as specification changes (§16.1). Governance changes that affect the AI agent's behavior must also be reflected in the `.devin/rules/` configuration.

---

# 17. Revision History

| Date | Version | Change |
| ---- | ------- | ------ |
| 2026-07-28 | 0.1 Draft | Initial AI Development Governance & Engineering Standards specification: roadmap management, task management, architecture integrity, design guardrails, documentation requirements, specification compliance, continuous quality review, risk register, decision log, scientific consistency, definition of done, AI guardrails, success metrics, governance enforcement, change management |
