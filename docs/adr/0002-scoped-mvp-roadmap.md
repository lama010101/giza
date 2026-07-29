# ADR-0002: Scoped MVP Roadmap — Three-Phase Delivery

**Status:** Accepted
**Date:** 2026-07-28
**Deciders:** CTO (project owner)
**Supersedes:** —

## Context

The original Implementation Roadmap (GIZA - 15, v0.5 Draft) defines 21 milestones, 276 tasks, and 448 story points (~89.6 engineer-weeks for a single agent). While architecturally sound and internally consistent, this scope is too large for a first public release. The project is at the pre-implementation stage — no application code exists.

A proposal was made to compress the roadmap into three phases, postponing all platform-generalization features (plugin SDK, external hypothesis API, multi-site architecture, theory marketplace, community submissions, generic monument engine, universal scientific framework) until after the MVP has demonstrated value.

The proposal recommended postponing the entire Hypothesis Framework (M05.5). The CTO rejected this — the hypothesis framework is the product's reason for existing. Without it, GIZA is a 3D viewer, not a scientific hypothesis exploration platform.

## Decision

The roadmap is compressed into three phases. Phase 1 delivers a focused MVP; Phases 2 and 3 are deferred until value is proven.

### Phase 1 — MVP (8–12 weeks, ~280–300 points)

**Scope:**
- Repository governance (M-1, full)
- Dev infrastructure (M00, full)
- Database schemas (M01, full)
- Evidence DB API (M02, basic CRUD + search)
- Sources/bibliography (M03, basic citation)
- Content pipeline (M03.5, ≥50 evidence records)
- Rendering foundation (M04, 8 material presets vs 17, simpler lighting)
- Scene graph (M05, full)
- **Hypothesis framework (M05.5, full architecture — no plugin SDK, no dynamic loading)**
- Asset tooling (M06A, simplified validation)
- Survey acquisition (M06.5, Osiris Shaft + Great Pyramid only)
- Asset production (M06B, limited to two environments)
- UI shell (M07, **Explore + Research modes only** — skip 6 other modes)
- Interaction tools (M08, raycast + evidence overlay + measurement + search + bookmarks — skip comparison, screenshot, timeline)
- **Benchmark scene (M08.5, full)**
- Osiris Shaft (M09, full)
- Simulation MVP (M10, **hydraulic + acoustic only** — skip thermal/structural)
- Great Pyramid (M11, **2–3 theory variants per chamber** — skip shaft flythrough)
- **Hydraulic-Acoustic hypothesis plugin (M11.5, hydraulic + acoustic only — no thermal/structural coupling)**
- Polish (M12, performance + production build only — skip localization, offline, security model)

**Two hypotheses required (not one):**
1. Hydraulic-Acoustic Hypothesis (THEORY-GP-003) — full simulation, visualization, predictions
2. Mainstream Consensus (THEORY-GP-001) — default archaeological interpretation, evidence overlays, no simulation

A single hypothesis with no counterpoint is a demonstration, not a scientific tool. The mainstream consensus requires minimal additional work (base geometry + evidence hotspots) but transforms the product from "look at this theory" to "compare competing interpretations."

**Release target:** Research Preview (invited Egyptologists + engineers)

### Phase 2 — Scientific Credibility (after MVP validation)
- Better meshes, more evidence records, more survey data
- Thermal + structural simulation coupling (full M11.5 scope)
- All theory variants for Great Pyramid chambers
- Shaft flythrough interaction
- Additional navigation modes (Documentary, Presentation)
- Comparison mode (split-screen), screenshot/export, timeline navigation
- Performance optimization to full desktop/mobile budgets

**Release target:** Closed Beta → Museum Beta

### Phase 3 — Platform Generalization (after value proven)
- Plugin SDK exposed publicly
- Additional monuments beyond Osiris Shaft + Great Pyramid
- Community hypothesis submissions
- Theory marketplace
- Multi-site architecture
- Full localization, offline support, security model
- Scientific Release with CITATION.cff + DOI

**Release target:** Public Release → Scientific Release

### Architectural principles preserved (non-negotiable)
These are inexpensive now and very costly to change later:
1. Evidence separated from hypotheses (no `hypothesisId` on evidence records)
2. Immutable geometry (hypotheses are overlays, never modify base mesh)
3. Simulation modules separated from rendering
4. Stable IDs (`EV-NNNNNN`, `SRC-NNNNNN`, `OBJ-NNNN`, etc.)
5. Clean data model (four-layer separation enforced at schema level)

### Specification freeze
No new specification documents. Implement from existing specs. Gaps discovered during implementation are addressed with targeted spec amendments, not new documents.

## Consequences

**Positive**
- Focused delivery: something people can use in 8–12 weeks
- Hypothesis framework architecture preserved at minimal cost
- Two-hypothesis comparison demonstrates the platform's core value proposition
- Benchmark scene gates rendering quality before archaeology is attached
- Clear phase boundaries prevent scope creep
- Specification freeze prevents analysis paralysis

**Negative**
- Reduced scope means some spec features are deferred (6 navigation modes, timeline, comparison mode, screenshot, localization, offline, security)
- Thermal/structural simulation coupling postponed to Phase 2
- Theory variants reduced from full set to 2–3 per chamber
- Evidence record target reduced from 100 to 50 for Phase 1

**Neutral**
- The existing roadmap (GIZA - 15) remains the canonical reference for all milestones; this ADR defines which milestones are in Phase 1 scope and which are deferred
- ADR-0001 (repository split) is accepted; the split executes at Internal Alpha as originally proposed

## Alternatives Considered

1. **Full roadmap as-is (448 points).** Rejected — too large for first release, risks never shipping.
2. **Postpone entire hypothesis framework (original proposal).** Rejected — GIZA without hypothesis framework is a 3D viewer, not a scientific platform. The framework is the product.
3. **Single hypothesis only (original proposal).** Rejected — a single hypothesis with no counterpoint is a demonstration, not a scientific tool. Minimal cost to add mainstream consensus.
4. **Skip benchmark scene (original proposal).** Rejected — 13 points of prevention vs. debugging rendering bugs mixed with archaeology bugs. Development accelerator, not overhead.
5. **Write additional specifications before implementing.** Rejected — 17 documents (~13,700 lines) are sufficient. Gaps will surface during implementation and produce better specs than anticipating every future requirement.
