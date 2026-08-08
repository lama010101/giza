# Architecture Decision Records (ADRs)

This directory records architecture decisions for the GIZA project. An ADR is a short document that captures a single decision, its context, its consequences, and its status. ADRs are created by any contributor (human or AI agent) and never deleted; superseded ADRs are marked `Superseded by ADR-NNNN` and retained for history.

## Format

Each ADR file is named `NNNN-<kebab-case-title>.md`, zero-padded, monotonically increasing. The structure is:

```
# ADR-NNNN: <Title>

**Status:** Proposed | Accepted | Rejected | Deprecated | Superseded by ADR-NNNN
**Date:** YYYY-MM-DD
**Deciders:** <names or roles>
**Supersedes:** ADR-NNNN (if any)

## Context
## Decision
## Consequences
## Alternatives Considered
```

## Index

| Number | Title | Status |
| ------ | ----- | ------ |
| 0001 | GIZA-Core / GIZA-Content two-repository split | Accepted |
| 0002 | Scoped MVP Roadmap — Three-Phase Delivery | Accepted |
| 0003 | Lean MVP Split — Phase 1a / Phase 1b | Accepted |
| 0004 | Geometry Pipeline — LOD Architecture | Accepted |
| 0005 | Per-Object Asset Export with Embedded DoSD Metadata | Accepted |
| 0006 | Runtime GLB Asset Loading for Per-Object Scene Geometry | Accepted |
| 0007 | Bookmark Capture and Restore in App Store | Accepted |

## Relation to the Specifications

ADRs record *decisions*; the numbered specifications (00–10) record *what is built*. Where an ADR conflicts with a specification, the specification prevails (see *GIZA - 00 Master Specification* §9) until the ADR is Accepted and the specification is explicitly revised by editorial decision. ADRs that propose changes to the repository structure or governance are recorded here and referenced from *GIZA - 15 Implementation Roadmap* and *GIZA - 99 Development Playbook*.

ADRs are established by *GIZA - 15 Implementation Roadmap* milestone M-1 (Repository Governance), task M-1-T07.
