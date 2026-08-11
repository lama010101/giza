# GIZA MVP Roadmap — Delivery Plan

**Status:** Accepted (per ADR-0002, ADR-0003)
**Date:** 2026-07-28

This document is the operational execution plan derived from ADR-0002 and ADR-0003. It compresses the full Implementation Roadmap (GIZA - 15) into phases, with Phase 1 internally split into Phase 1a (Lean MVP) and Phase 1b (Extended MVP). For full task details, dependencies, and DoD criteria, refer to the canonical roadmap.

---

## Phase 1a — Lean MVP (~8–10 weeks with 4 parallel agents)

**Goal:** Deliver the complete core value proposition on a single environment (Osiris Shaft): 3D exploration, evidence traceability, hypothesis comparison, and hydraulic simulation. Something people can use and scientists can evaluate.

### Milestones in Scope

| Milestone | Title | Scope | Simplifications |
|-----------|-------|-------|-----------------|
| M-1 | Repository Governance | Full | — |
| M00 | Dev Infrastructure | Full | — |
| M01 | Database Schemas | Reduced | Core schemas (Evidence, Source, Object, Theory/Hypothesis, Simulation, Location); stub Media, User; **complete Bookmark and Measurement schemas** (required by M08 in Phase 1a) |
| M02 | Evidence DB API | Reduced | CRUD + search + evidence linking; skip review workflow, import/export, conflict resolution, version history, media attachment, audit history |
| M03 | Sources & Bibliography | Reduced | Basic CRUD + 1 citation style (APA); skip DOI/ISBN/ORCID automation, duplicate detection, merge, archival URLs, museum refs, video refs |
| M03.5 | Content Pipeline | Reduced | 20–30 evidence records; skip PDF ingestion helper, simulation parameter capture |
| M04 | Rendering Foundation | Reduced | 3 light layers (ambient + directional + local); skip volumetric, bounce, frame pacing |
| M05 | Scene Graph & Coordinates | Reduced | Coordinate system, scene graph, layers, metadata injection; skip scene streaming, LOD manager |
| M05.5 | Hypothesis Framework | **Reduced architecture** | Plugin registry + hypothesis store + per-object confidence + visualization rules + selector UI + hypothesis panel; skip comparison framework (side-by-side), API endpoints; 2 sample plugins (not 3) |
| M06A | Asset Tooling | Reduced | Basic mesh/metadata/collision validators + publishing; skip LOD generation, survey deviation, 17 material library (do 5) |
| M06.5 | Survey Acquisition | **Reduced** | Published CAD/drawing ingestion (Hawass 2007); manual reconstruction workflow (primary path for Osiris Shaft); survey coverage map; skip laser scan/photogrammetry ingestion (no data available for Osiris Shaft) |
| M06B | Asset Production | Reduced | Fewer variants (5 rubble, 3 limestone, 2 granite, minimal architectural); 5 master materials |
| M07 | UI Shell & Navigation | Reduced | Layout shell + **Explore + Research modes** + basic camera (walk/fly/teleport); skip Guided, Documentary, Presentation, Educational, Museum, Developer modes; skip session persistence, gamepad |
| M08 | Interaction & Research Tools | Reduced | Raycast + hotspots + measurement + search + bookmarks + screenshot; skip cross-section, comparison, timeline |
| M08.5 | Benchmark Scene | Reduced | Exercise 3 light layers (not 5) and 5 master materials (not 17); water + collision + FPS baseline; still gates rendering |
| M09 | Osiris Shaft | **Full** | — |
| M10 | Simulation MVP | Reduced | **Hydraulic only**; skip acoustic solver/visualization/validation, comparison mode, export, async API, performance modes |

### Two Hypotheses (Not One)

1. **Hydraulic Hypothesis** — Osiris Shaft as water management / hydraulic structure
2. **Mainstream Consensus** — Osiris Shaft as tomb / ritual structure

### What the User Can Do at Phase 1a Release

- Explore the Osiris Shaft in 3D (all 4 levels: surface, shaft, excavated space, flooded chamber)
- View evidence hotspots linked to the evidence database
- Switch between Hydraulic and Mainstream Consensus hypotheses
- Run hydraulic simulation on Osiris Shaft Level 3 (water, pressure, flow)
- Visualize pressure, flow, water surface elevation
- See per-object-per-hypothesis confidence
- Use Research mode: measurement, evidence inspection, search, bookmarks, screenshot

### Release Target

**Research Preview** — invited Egyptologists + engineers

### Phase 1a Exit Criteria

- All Phase 1a milestones meet task-level DoD (GIZA - 15 §1.4)
- DoSD met for all visible Osiris Shaft elements (GIZA - 15 §1.5)
- ≥10 evidence hotspots linked to evidence database
- Two hypotheses (Hydraulic + Mainstream Consensus) installable and switchable
- Hydraulic simulation validated on Osiris Shaft Level 3
- Performance within desktop budget on reference hardware (04 §6.27)
- Scholar feedback round completed

### Critical Path

```
M-1 → M00 → M01 → M04 → M05 → M05.5 → M07 → M08 → M09 → M10
```

10 milestones on critical path.

### Parallel Tracks (after M01)

1. **Data/Content:** M02 → M03 → M03.5
2. **Frontend:** M04 → M05 → M05.5 → {M07 → M08, M08.5}
3. **Asset/Survey:** M06A → M06.5 → M06B
4. **Hypothesis:** M05.5 (architectural centerpiece)

M09 (Osiris Shaft) is the convergence point requiring M05, M05.5, M06A, M06.5, M06B, M07, M08, M03.5.

---

## Phase 1b — Extended MVP (after Lean MVP validation, ~4–6 weeks)

**Goal:** Add the Great Pyramid, acoustic simulation, the Hydraulic-Acoustic hypothesis plugin, and restore features trimmed from Phase 1a.

### Milestones in Scope

| Milestone | Title | Scope | Notes |
|-----------|-------|-------|-------|
| M10 (acoustic) | Acoustic Simulation | Remaining acoustic tasks | Solver + visualization + validation |
| M11 | Great Pyramid | Included | 2–3 theory variants per chamber; skip shaft flythrough |
| M11.5 | Hydraulic-Acoustic Plugin | Included | Hydraulic + acoustic only; no thermal/structural coupling |
| M12 | Polish | Included | Performance + production build + accessibility + deployment + **basic offline support** (scene packages for Museum Beta) |
| M02 (restore) | Evidence DB (full) | Restore deferred features | Review workflow, import/export, conflict resolution, version history, media attachment |
| M03 (restore) | Sources (full) | Restore deferred features | DOI/ISBN/ORCID, duplicate detection, bibliography (11 styles), citation engine |
| M07 (restore) | UI (full) | Restore deferred features | Session persistence, documentary spline, gamepad, error handling, **Presentation + Museum modes** (required for Museum Beta release) |
| M08 (restore) | Interaction (full) | Restore deferred features | Cross-section, comparison mode, timeline |
| M05.5 (restore) | Hypothesis (full) | Restore deferred features | Comparison framework (side-by-side), API endpoints, 3rd sample plugin |
| M04 (restore) | Rendering (full) | Restore deferred features | Volumetric + bounce lighting, frame pacing |
| M05 (restore) | Scene Graph (full) | Restore deferred features | Scene streaming, LOD manager |
| M06.5 (restore) | Survey Acquisition (full) | Restore deferred features | Laser scan/photogrammetry ingestion for Great Pyramid (Petrie, Cole, Dash, Gantenbrink data); full survey coverage map |

### What the User Can Do at Phase 1b Release

- Everything from Phase 1a, plus:
- Explore the Great Pyramid in 3D (all chambers, passages, shafts)
- Run acoustic simulation on King's Chamber / Grand Gallery
- Switch between Mainstream Consensus and Hydraulic-Acoustic hypotheses on the Great Pyramid
- Compare hypothesis predictions against simulation outputs
- Use cross-section, comparison mode, screenshot, timeline
- Session persistence (restore on reload)

### Release Target

**Closed Beta → Museum Beta**

### Phase 1b Critical Path

```
M06.5 (restore) → M11 → M11.5 → M12
```

M10 (acoustic) runs in parallel (depends on M05 + M09 from Phase 1a). Feature restores (M02, M03, M04, M05, M05.5, M07, M08) run in parallel with the main track.

---

## Phase 2 — Scientific Credibility (after MVP validation)

- Better meshes, more evidence records, more survey data
- Thermal + structural simulation coupling (full M11.5 scope)
- All theory variants for Great Pyramid chambers
- Shaft flythrough interaction
- Additional navigation modes (Documentary, Presentation)
- Comparison mode (split-screen), screenshot/export, timeline navigation
- Performance optimization to full desktop/mobile budgets

**Release target:** Closed Beta → Museum Beta

---

## Phase 3 — Platform Generalization (after value proven)

- Plugin SDK exposed publicly
- Additional monuments beyond Osiris Shaft + Great Pyramid
- Community hypothesis submissions
- Theory marketplace
- Multi-site architecture
- Full localization, offline support, security model
- Scientific Release with CITATION.cff + DOI

**Release target:** Public Release → Scientific Release

---

## Specification Freeze

No new specification documents. The 17 existing specs (~13,700 lines) are sufficient. Gaps discovered during implementation are addressed with targeted spec amendments, not new documents.

## Architectural Principles (Non-Negotiable)

1. Evidence separated from hypotheses
2. Immutable geometry
3. Simulation modules separated from rendering
4. Stable IDs
5. Clean data model (four-layer separation)

---

## References

- **Canonical roadmap:** GIZA - 15 Implementation Roadmap (milestone details, task-level DoD, AI-coder estimates, risk register §8, release strategy §9)
- **Measurement data:** `docs/architecture/osiris-shaft-measurements.md` (M09), `docs/architecture/great-pyramid-measurements.md` (M11)
- **ADRs:** ADR-0002 (three-phase delivery), ADR-0003 (lean MVP split)
- **DoSD:** GIZA - 15 §1.5 — applies to all visible Osiris Shaft elements in Phase 1a
- **Hypothesis compliance:** GIZA - 11 §2.2 — Phase 1a ships 2 sample plugins (Hydraulic + Mainstream Consensus); Phase 1b adds Hydraulic-Acoustic
