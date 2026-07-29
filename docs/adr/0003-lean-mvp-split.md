# ADR-0003: Lean MVP Split — Phase 1a / Phase 1b

**Status:** Accepted
**Date:** 2026-07-28
**Deciders:** CTO (project owner)
**Supersedes:** —

## Context

ADR-0002 compressed the full Implementation Roadmap (448 points, 276 tasks) into three phases. Phase 1 (MVP) was scoped at 280-300 points with a critical path of 13 milestones and an estimated 8-12 weeks with four parallel agents. While ADR-0002 made significant cuts (6 navigation modes, comparison mode, screenshot, timeline, thermal/structural simulation, localization, offline, security), the Phase 1 scope still includes 18 of the 20 milestones with only minor simplifications per milestone.

The project is at the pre-implementation stage — no application code exists. The primary risk is that the MVP is too large to ship before losing momentum or resources. The core value proposition of GIZA — 3D exploration with evidence traceability and hypothesis comparison — can be fully demonstrated on a single environment (Osiris Shaft) with the hypothesis framework and one simulation module (hydraulic). The Great Pyramid (M11, 30 points) and the Hydraulic-Acoustic Hypothesis Plugin (M11.5, 22 points) together account for 52 points (18% of Phase 1) and extend the critical path by 2-3 weeks. They are valuable but not necessary to prove the concept.

A proposal was made to further split Phase 1 into two sub-phases: Phase 1a (Lean MVP) delivering the core value on the Osiris Shaft alone, and Phase 1b (Extended MVP) adding the Great Pyramid, acoustic simulation, the Hydraulic-Acoustic hypothesis plugin, and restoring features trimmed from Phase 1a.

## Decision

Phase 1 is split into Phase 1a (Lean MVP) and Phase 1b (Extended MVP). Phase 2 and Phase 3 remain as defined in ADR-0002.

### Phase 1a — Lean MVP (~170-190 points, ~8-10 weeks with 4 parallel agents)

**Goal:** Deliver the complete core value proposition on a single environment (Osiris Shaft): 3D exploration, evidence traceability, hypothesis comparison, and hydraulic simulation.

**Scope:**

| Milestone | Scope | Points (est.) | Key simplifications vs. ADR-0002 Phase 1 |
|-----------|-------|--------------|------------------------------------------|
| M-1 | Full | 13 | — |
| M00 | Full | 21 | — |
| M01 | Reduced | 18 | Skip Media, User, Bookmark, Measurement schemas (stub with minimal types) |
| M02 | Reduced | 15 | CRUD + search + evidence linking only; skip review workflow, import/export, conflict resolution, version history, media attachment, audit history |
| M03 | Reduced | 8 | Basic CRUD + 1 citation style (APA); skip DOI/ISBN/ORCID automation, duplicate detection, merge, archival URLs, museum refs, video refs, 11 citation styles |
| M03.5 | Reduced | 10 | 20-30 evidence records (not 50); skip PDF ingestion helper, simulation parameter capture |
| M04 | Reduced | 18 | 3 light layers (ambient + directional + local); skip volumetric, bounce; skip frame pacing |
| M05 | Reduced | 18 | Skip scene streaming (Osiris Shaft fits in memory); skip LOD manager (single LOD); keep coordinate system, scene graph, layers, metadata injection |
| M05.5 | Reduced | 15 | Plugin registry + hypothesis store + per-object confidence + visualization rules + selector UI + hypothesis panel; skip comparison framework (side-by-side), skip API endpoints, 2 sample plugins (not 3) |
| M06A | Reduced | 12 | Basic mesh/metadata/collision validators + publishing pipeline; skip LOD generation, survey deviation validator, 17 material library (do 5) |
| M06B | Reduced | 8 | Fewer asset variants (5 rubble, 3 limestone, 2 granite, minimal architectural); 5 master materials (not 17) |
| M07 | Reduced | 12 | Layout shell + Explore mode + basic camera (walk/fly/teleport); skip session persistence, documentary spline, gamepad, error handling philosophy |
| M08 | Reduced | 10 | Raycast + hotspots + measurement + search + bookmarks; skip cross-section, comparison, screenshot, timeline |
| M08.5 | Reduced | 10 | Benchmark with fewer materials/lights; still gates rendering before archaeology |
| M09 | Full | 30 | Osiris Shaft is the showcase — full scope |
| M10 | Reduced | 15 | Hydraulic solver + visualization + validation only; skip acoustic solver/visualization/validation, skip comparison mode, skip export, skip async API, skip performance modes |

**Two hypotheses (not one):**

1. **Hydraulic Hypothesis** — Osiris Shaft as water management / hydraulic structure
2. **Mainstream Consensus** — Osiris Shaft as tomb / ritual structure

A single hypothesis with no counterpoint is a demonstration, not a scientific tool (per ADR-0002).

**What the user can do at Phase 1a release:**

- Explore the Osiris Shaft in 3D (all 4 levels: surface, shaft, excavated space, flooded chamber)
- View evidence hotspots linked to the evidence database
- Switch between Hydraulic and Mainstream Consensus hypotheses
- Run hydraulic simulation on Osiris Shaft Level 3 (water, pressure, flow)
- Visualize pressure, flow, water surface elevation
- See per-object-per-hypothesis confidence
- Use Research mode: measurement, evidence inspection, search, bookmarks

**Release target:** Research Preview — invited Egyptologists + engineers

**Critical path:**

```
M-1 → M00 → M01 → M04 → M05 → M05.5 → M07 → M08 → M09 → M10
```

10 milestones on critical path (down from 13).

**Parallel tracks (after M01):**

1. **Data/Content:** M02 → M03 → M03.5
2. **Frontend:** M04 → M05 → M05.5 → {M07 → M08, M08.5}
3. **Asset:** M06A → M06B
4. **Hypothesis:** M05.5 (architectural centerpiece)

M09 (Osiris Shaft) is the convergence point requiring M05, M05.5, M06A, M06B, M07, M08, M03.5.

### Phase 1b — Extended MVP (after Lean MVP validation, ~80-100 points)

**Goal:** Add the Great Pyramid, acoustic simulation, the Hydraulic-Acoustic hypothesis plugin, and restore features trimmed from Phase 1a.

**Scope:**

| Milestone | Scope | Points (est.) | Notes |
|-----------|-------|--------------|-------|
| M10 (acoustic) | Remaining | ~11 | Acoustic solver + visualization + validation |
| M11 | Included | 30 | Great Pyramid reconstruction (2-3 theory variants per chamber; skip shaft flythrough) |
| M11.5 | Included | 22 | Hydraulic-Acoustic hypothesis plugin (hydraulic + acoustic; no thermal/structural coupling) |
| M12 | Included | 18 | Polish: performance + production build + accessibility + production deployment |
| M02 (restore) | Remaining | ~19 | Review workflow, import/export, conflict resolution, version history, media attachment |
| M03 (restore) | Remaining | ~15 | DOI/ISBN/ORCID, duplicate detection, bibliography generation (11 styles), citation engine |
| M07 (restore) | Remaining | ~16 | Session persistence, documentary camera spline, gamepad input, error handling |
| M08 (restore) | Remaining | ~11 | Cross-section, comparison mode, screenshot, timeline |
| M05.5 (restore) | Remaining | ~11 | Comparison framework (side-by-side), API endpoints, 3rd sample plugin |
| M04 (restore) | Remaining | ~7 | Volumetric + bounce lighting, frame pacing |
| M05 (restore) | Remaining | ~4 | Scene streaming, LOD manager |

**Release target:** Closed Beta → Museum Beta

### Phase 2 — Scientific Credibility (unchanged from ADR-0002)

### Phase 3 — Platform Generalization (unchanged from ADR-0002)

### Architectural principles preserved (non-negotiable)

All five principles from ADR-0002 remain intact:

1. Evidence separated from hypotheses (no `hypothesisId` on evidence records)
2. Immutable geometry (hypotheses are overlays, never modify base mesh)
3. Simulation modules separated from rendering
4. Stable IDs (`EV-NNNNNN`, `SRC-NNNNNN`, `OBJ-NNNN`, etc.)
5. Clean data model (four-layer separation enforced at schema level)

The hypothesis framework architecture is preserved at reduced scope, not reduced architecture. Adding the Great Pyramid and acoustic simulation in Phase 1b requires zero engine changes — just new content and a new simulation module. The plugin architecture remains intact; Phase 1a ships 2 plugins, Phase 1b adds the Hydraulic-Acoustic plugin.

### Specification freeze (unchanged)

No new specification documents. No numbered specifications (00-11, 16, 17) are modified. This ADR and the updated MVP roadmap are operational documents only.

## Consequences

**Positive**

- Focused delivery: core value proposition in ~8-10 weeks (down from ~13-16 weeks)
- 10 milestones on critical path (down from 13)
- ~170-190 points (down from ~280-300)
- Osiris Shaft alone fully demonstrates 3D exploration + evidence + hypotheses + simulation
- Great Pyramid and acoustic simulation added with zero engine changes in Phase 1b
- Earlier feedback from Egyptologists and engineers informs Phase 1b priorities
- Reduced risk of running out of resources before shipping anything
- All architectural principles preserved

**Negative**

- Only one environment at Phase 1a release (Osiris Shaft, not Great Pyramid)
- No acoustic simulation at Phase 1a release
- Evidence DB backend is basic (no review workflow, no import/export, no version history)
- Sources engine is minimal (1 citation style, no DOI automation)
- No session persistence, cross-section, comparison mode, screenshot, or timeline at Phase 1a
- Some features need to be "restored" in Phase 1b rather than built fresh (slight overhead)

**Neutral**

- ADR-0002's three-phase structure is preserved; Phase 1 is internally split into 1a and 1b
- The canonical Implementation Roadmap (GIZA - 15) remains unchanged; this ADR and the MVP roadmap define which milestones are in Phase 1a scope and which are deferred to Phase 1b
- Phase 1b is not a new phase; it is the completion of Phase 1 as originally scoped in ADR-0002

## Alternatives Considered

1. **Keep ADR-0002 Phase 1 as-is (280-300 points).** Rejected — the project owner expressed concern about scope and time to MVP. 13 milestones on the critical path is too many for a first shippable release.

2. **Defer the hypothesis framework entirely.** Rejected — GIZA without the hypothesis framework is a 3D viewer, not a scientific platform (per ADR-0002). The framework is the product. Phase 1a includes it at reduced scope.

3. **Defer the hypothesis framework but keep the Great Pyramid.** Rejected — the Great Pyramid without the hypothesis framework is just a large 3D model. The hypothesis framework on the Osiris Shaft is more valuable than the Great Pyramid without it.

4. **Single environment with single hypothesis.** Rejected — a single hypothesis with no counterpoint is a demonstration, not a scientific tool (per ADR-0002). Two hypotheses are included even in Phase 1a.

5. **Defer M08.5 Benchmark Scene.** Rejected — 10 points of prevention vs. debugging rendering bugs mixed with archaeology bugs. Development accelerator, not overhead (per ADR-0002).

6. **Defer M-1 Repository Governance.** Rejected — governance is 13 points of process that prevents AI coders from silently diverging. The cost of not having it (inconsistent code, broken CI, spec modifications) is higher than the cost of having it.
