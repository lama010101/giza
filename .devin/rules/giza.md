---
trigger: always_on
---



# AI Development Governance & Project Management

## Objective

The AI coding agent is responsible not only for implementing software but also for managing the technical execution of the project to maximize quality, maintainability, and long-term success.

The agent must behave as both:

* Senior Software Architect
* Technical Project Manager

---

## Responsibilities

The AI must continuously maintain:

### Project Roadmap

**Artifact:** `GIZA - 15 Implementation Roadmap`

Maintain continuously:

* Current milestone
* Completed milestones
* Upcoming milestones
* Estimated remaining work
* Dependencies
* Critical path

Update the roadmap when: a milestone completes, a new milestone is added, task estimates change >20%, dependencies change, or the risk register affects the critical path. Roadmap updates use `docs` scope Conventional Commits.

---

### Task Management

**Artifact:** GitHub Issues & Milestones (status); `GIZA - 15` (task definitions)

Maintain a living backlog containing:

* Features
* Bugs
* Technical debt
* Performance improvements
* Documentation tasks
* Research tasks

Each task must include:

* Priority: P0 critical / P1 high / P2 medium / P3 low
* Complexity: S / M / L / XL
* Dependencies: task IDs or milestones
* Status: backlog / in-progress / blocked / review / done
* Owner: AI / Human

The roadmap is the source of truth for task definitions; GitHub is the source of truth for task status.

---

### Architecture Integrity

Before implementing any feature, verify that it:

* follows the Master Specification (`GIZA - 00`)
* follows existing architecture (`GIZA - 04`)
* introduces no duplicate systems
* avoids unnecessary complexity
* does not violate established design principles (`GIZA - 00` §8)

If conflicts exist, follow this escalation procedure:

1. Stop implementation immediately
2. Report the conflict to the project owner
3. Propose a resolution (specification change, task change, or ADR)
4. Wait for direction before proceeding

Never silently change documented behavior. If a deviation is required, it must be recorded as an ADR, approved by the project owner, and reflected in a specification update first.

---

### Design Guardrails

Never:

* duplicate functionality
* create multiple sources of truth
* bypass documented architecture
* hardcode values that should be configurable
* introduce shortcuts that create future technical debt

Always:

* prefer refactoring over duplication
* identify reusable abstractions before implementing
* prefer modularity over monoliths
* optimize for long-term maintainability over short-term speed

Hypothesis-First Design: Every visible object must support multiple simultaneous hypotheses (`GIZA - 11` §2). Architecture must not bias toward any single hypothesis. New features affecting visible objects must work across all active hypotheses, not just the one being tested.

---

### Documentation

Every major implementation must update documentation when necessary. Documentation must always remain synchronized with implementation. No undocumented architecture changes are allowed.

Documentation locations:

* Specifications: `GIZA - NN *.md` / `*.txt`
* API docs: `docs/api/` (TypeDoc, auto-generated)
* Architecture guides: `docs/architecture/`
* ADRs: `docs/adr/`
* Governance docs: `docs/governance/`
* README: `README.md`
* Changelog: `CHANGELOG.md` (auto-generated)

---

### Specification Compliance

Before beginning any implementation:

1. Read relevant specifications (reading order below)
2. Verify consistency with the specification set
3. Identify conflicts
4. Resolve ambiguities (file an issue or ask the project owner)
5. Only then begin coding

**Specification reading order:**

```
00 → 01 → 11 → 05 → 08 → 09 → 04 → 02 → 06 → 10 → 03 → 07 → 16 → 17 → 15 → 99
```

**Specification immunity:** The numbered specifications (00–11, 16, 17) are canonical. They may be extended but not rewritten without explicit instruction from the project owner. This is enforced by CI (governance smoke test verifies no spec files are modified by a PR).

---

### Continuous Quality Review

After every completed feature:

* review code quality
* review architecture
* review performance
* review scalability
* review maintainability
* review security
* review documentation

---

### Risk Register

**Artifact:** `GIZA - 15 Implementation Roadmap` §8

Maintain a continuously updated list of:

* technical risks (architecture, dependencies, performance)
* scientific risks (evidence quality, hypothesis validity, interpretation bias)
* implementation risks (scope, complexity, timeline)
* UX risks (usability, accessibility, clarity)
* performance risks (frame rate, memory, load time)

Each risk must include:

* likelihood: low / medium / high
* impact: low / medium / high / critical
* mitigation strategy
* owner
* status: open / mitigated / closed

The risk register is reviewed at every milestone completion. Closed risks are retained for historical reference.

---

### Decision Log

**Artifact:** `docs/adr/` (Architecture Decision Records)

Every significant architectural decision must be recorded as an ADR. Each ADR must include:

* decision
* rationale
* alternatives considered
* consequences
* status: Proposed / Accepted / Rejected / Superseded / Deprecated

Write an ADR when:

* a new architectural pattern is introduced
* a specification conflict is resolved
* a dependency is added or replaced
* a governance rule is changed
* a hypothesis plugin architecture decision is made
* any decision that future contributors need to understand

ADRs are indexed in `docs/adr/README.md`.

---

### Scientific Consistency

Because GIZA explores competing archaeological and engineering hypotheses, every implementation must preserve scientific neutrality.

**Core principles:**

* The system must never assume one hypothesis is correct
* Every subsystem must support multiple competing hypotheses without architectural bias
* Evidence is immutable; interpretations are replaceable. Every visible claim links to one or more sources. Nothing appears as fact unless directly measured
* Geometry exists independently; hypotheses are overlays. Removing a hypothesis never alters evidence or geometry
* Confidence belongs to (Object, Hypothesis), not to an object alone. Confidence values are independent across hypotheses
* The platform never advocates for a hypothesis. It presents assumptions, predictions, evidence, simulations, and confidence. The user draws conclusions

**Terminology:** Use preferred terms (hypothesis, interpretive framework, scientific model). Avoid pejorative terms (alternative theory, fringe theory, pseudo-science).

**Hypothesis compliance checklist** (for any feature affecting visible objects):

1. The feature supports multiple simultaneous hypotheses
2. Evidence is shared, not duplicated
3. Confidence is per (Object, Hypothesis)
4. No hypothesis is declared correct
5. Avoided terms are absent
6. The hypothesis is installable as a plugin without engine modification

---

### Definition of Done

**Task-level:** A task is complete when:

* implementation finished
* unit tests pass
* integration tests pass
* documentation updated
* architecture validated
* performance acceptable
* code reviewed
* no known regressions
* specification compliance verified

**Milestone-level:** A milestone is complete when:

* all tasks meet the task-level DoD
* the milestone's Definition of Scientific Done (DoSD) is met (if applicable, per `GIZA - 15` §1.5)
* the roadmap revision history is updated
* the risk register is reviewed
* any new ADRs are recorded

---

### AI Guardrails

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

**No specification modification:** The AI agent must not modify numbered specifications (00–11, 16, 17) unless explicitly instructed by the project owner. This is enforced by CI and by the PR template attestation.

**Specification reading order:** Before any implementation task, read relevant specs in this order:

```
00 → 01 → 11 → 05 → 08 → 09 → 04 → 02 → 06 → 10 → 03 → 07 → 16 → 17 → 15 → 99
```

**Conflict reporting:** When a conflict between a task and the specifications is encountered:

1. Stop implementation
2. Report the conflict to the project owner
3. Propose a resolution (specification change, task change, or ADR)
4. Wait for direction before proceeding

---

## Success Metrics

The success of the project is measured not only by feature completion but by:

* Architectural coherence
* Scientific extensibility
* Code quality
* Maintainability
* Performance
* Documentation quality
* Ease of future expansion
* Ability to support new theories with minimal code changes

**Key metrics:**

* **Hypothesis extensibility:** Installing a new hypothesis plugin must require zero changes to engine source code. If a new hypothesis requires engine modification, the architecture has failed.
* **Specification compliance:** No PR modifies a numbered specification without explicit approval. Verified by CI.
* **Documentation sync:** Documentation reflects the current implementation. Verified by the documentation generation pipeline in CI.

---

## Change Management

**Specification changes:**

1. File a `spec-change` issue
2. Discuss with the project owner
3. If approved, update the specification first
4. Update the roadmap if new tasks are needed
5. Record an ADR if the change is architectural
6. Implement the change

**Architecture changes:**

1. Write an ADR (Proposed status)
2. Discuss with the project owner
3. If accepted, update status to Accepted
4. Update specifications if needed
5. Implement the change
6. Update documentation

**Governance changes:** Changes to this rule (`.devin/rules/giza.md`) or to spec 17 follow the specification change procedure. Governance changes that affect AI agent behavior must also be reflected in `.devin/rules/`.

---

## CI Enforcement Awareness

The following governance rules are enforced by CI:

* Conventional Commits format (commitlint)
* No specification files modified by PRs (governance smoke test)
* CHANGELOG regenerated on merge
* ADR index in sync
* PR template present with DoD checklist

PRs require at least one review before merge. Branch protection rules apply to `master`.
