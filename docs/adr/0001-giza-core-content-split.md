# ADR-0001: GIZA-Core / GIZA-Content two-repository split

**Status:** Proposed
**Date:** 2026-07-28
**Deciders:** Project maintainer (pending review)
**Supersedes:** —

## Context

The GIZA repository currently combines the specification set, the software engine, and the scientific content (evidence, sources, 3D assets, environment reconstructions) in a single repository. This is appropriate for the initial specification phase (00–10) and the first implementation milestones, because everything is small and tightly coupled.

As the project grows, three pressures emerge:

1. **Asset-heavy commits bloat repository history.** Laser scans, photogrammetry, glTF models, and KTX2 textures are large binary artifacts. Committing them to the engine repository makes the history expensive to clone and index, especially for AI coding agents whose context windows and repo-indexing costs are sensitive to repository size.
2. **Scientific content evolves on a different cadence than the engine.** Evidence records, sources, and environment reconstructions change as new surveys and publications arrive. The engine changes as rendering and simulation features are built. Coupling their release cycles couples unrelated review processes.
3. **The engine is reusable.** The engine (renderer, scene graph, evidence database, simulation framework, UI, asset pipeline) is not specific to the Osiris Shaft or the Great Pyramid. It is intended to be reused for Khafre, Menkaure, the Sphinx, Saqqara, Abu Rawash, and other monuments (see *GIZA - 00 Master Specification* §11, planned specifications 11–16). Keeping the engine in a repository separate from any single monument's content makes reuse explicit.

The current single-repository structure is defined in *GIZA - 00 Master Specification* §4. Any split must be reflected there by editorial decision before it is enacted.

## Decision

It is proposed (not yet decided) to divide the project into two repositories once the engine reaches Internal Alpha (see *GIZA - 15 Implementation Roadmap* §9):

```
GIZA-Core
    engine
    renderer
    database
    simulation
    UI
    asset pipeline (tooling)
    specifications 00–10, 15, 99
    docs/, docs/adr/

GIZA-Content
    Osiris Shaft environment
    Great Pyramid environment
    evidence records (EV-)
    sources (SRC-)
    3D assets (models, textures, materials, scans)
    per-monument theory variants
    per-monument chronology layers
```

The two repositories are linked by:

* a shared specification set (canonical in GIZA-Core, mirrored or submodule-referenced in GIZA-Content);
* the asset manifest API (M06A-T12) and evidence/source APIs (M02, M03), consumed by GIZA-Content;
* compatible versioning: GIZA-Content declares a `peerDependency` range on a GIZA-Core engine version.

## Consequences

**Positive**

* The engine becomes explicitly reusable for Khafre, Saqqara, Abu Rawash, and other monuments.
* Scientific content can evolve independently of engine releases.
* Smaller repositories are easier for AI coding agents to index and reason about (smaller context, faster retrieval).
* Asset-heavy commits do not bloat the engine history; GIZA-Content can use Git LFS or a content-addressable asset store without affecting engine clones.
* Engine releases and content releases can be tagged independently.

**Negative**

* Cross-repository changes (engine feature needed by a content milestone) require coordinated PRs and a compatible-version policy.
* The shared specification set must be kept in sync; the canonical copy lives in GIZA-Core and GIZA-Content must not diverge (enforced by the no-spec-modification rule, *00* §13.1).
* Tooling (CI, doc generation) must be duplicated or factored into a shared workflow.
* Initial migration cost: history rewriting or a clean split at Internal Alpha.

**Neutral**

* The `.devin/` rules and `GIZA - 99 Development Playbook` apply to both repositories; each may carry a copy or reference the canonical version in GIZA-Core.

## Alternatives Considered

1. **Single repository with Git LFS for all large assets.** Keeps the current structure; addresses only the history-bloat pressure, not the reuse or cadence pressures. Reuse remains implicit.
2. **Monorepo with clear top-level packages** (`packages/core`, `packages/content`). Addresses reuse and cadence partially while keeping a single clone; does not address AI-agent indexing cost as strongly as a true split. Viable intermediate option.
3. **Multi-repo per monument** (GIZA-Osiris, GIZA-GreatPyramid, GIZA-Khafre, ...). Maximizes isolation but multiplies governance overhead and risks engine drift across monuments. Rejected in favor of a single content repository that holds all monuments, so the engine has exactly one content consumer to stay compatible with.

## Status

This ADR is **Proposed**. It is recorded here per *GIZA - 15 Implementation Roadmap* milestone M-1 (Repository Governance), task M-1-T07. It does **not** authorize any repository split or any modification to *GIZA - 00 Master Specification* §4. The split, if accepted, will be enacted only after:

1. the engine reaches Internal Alpha (§9),
2. this ADR is moved to **Accepted** by editorial decision,
3. *GIZA - 00 Master Specification* §4 (Repository Organization) is explicitly revised to describe the two-repository structure, and
4. a migration plan is committed as a follow-up ADR.

Until then, the project remains a single repository as defined in *GIZA - 00 Master Specification* §4.
