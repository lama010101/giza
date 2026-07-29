# Phase 1a (Lean MVP) Task Overlay

This document is the operational task overlay for the **Lean MVP** of GIZA. It is derived from:

- `docs/adr/0002-scoped-mvp-roadmap.md`
- `docs/adr/0003-lean-mvp-split.md`
- `docs/mvp-roadmap.md`
- `GIZA - 15 Implementation Roadmap.md`

`GIZA - 15` remains the canonical full roadmap. When its task tables and the overlay below conflict, this overlay governs for Phase 1a.

## Goal

Deliver the core value proposition on one environment (Osiris Shaft): 3D exploration, evidence traceability, hypothesis comparison, and hydraulic simulation.

## Critical Path for Phase 1a

```
M-1 → M00 → M01 → M04 → M05 → M05.5 → M07 → M08 → M09 → M10
```

## Milestone Scope

| Milestone | In Phase 1a | Deferred to Phase 1b | Notes |
| --- | --- | --- | --- |
| M-1 | Full governance, templates, CI smoke test | — | Done |
| M00 | Vite, TS strict, R3F, Rapier, ESLint, Prettier, Vitest, Playwright, Husky, CI, aliases, AGENTS.md | Full docs generation (TypeDoc + json-schema-to-md + MkDocs + data dictionary) | Done |
| M01 | Core Zod schemas: Evidence, Source, Object, Hypothesis, Prediction, Simulation, Location; stub Media/User; complete Bookmark + Measurement | — | Done |
| M02 | CRUD + search + evidence linking; per-object lookup; dependency graph | Review workflow, import/export, conflict resolution, version history, media attachment, audit history | Next |
| M03 | Basic source CRUD + APA citation style | DOI/ISBN/ORCID automation, duplicate detection, 11 bibliography styles, citation engine | Low |
| M03.5 | 20–30 evidence records for Osiris Shaft | PDF ingestion, simulation parameter capture | Done |
| M04 | 3 light layers (ambient + directional + local), basic PBR | Volumetric, bounce, frame pacing | Next |
| M05 | Coordinate system, scene graph, layers, metadata injection | Streaming, LOD manager | Next |
| M05.5 | Plugin registry + hypothesis store + per-object confidence + visualization rules + selector UI + hypothesis panel; 2 sample plugins | Comparison framework (side-by-side), API endpoints, 3rd sample plugin | Done |
| M06A | Basic mesh/metadata/collision validators + publishing; 5 master materials | 17 material library, LOD generation, survey deviation | Medium |
| M06.5 | Published drawing/CAD ingestion; manual reconstruction workflow for Osiris Shaft | Laser scan/photogrammetry ingestion | Medium |
| M06B | Fewer variants (5 rubble, 3 limestone, 2 granite, minimal architectural) | Full asset production library | Medium |
| M07 | Layout shell + Explore + Research modes + basic camera (walk/fly/teleport) | Guided, Documentary, Presentation, Educational, Museum, Developer; session persistence; gamepad | Next |
| M08 | Raycast + hotspots + measurement + search + bookmarks | Cross-section, comparison, screenshot, timeline | Next |
| M08.5 | 3 light layers + 5 master materials + water plane + collision + FPS baseline | 5 light layers + 17 materials | Done (placeholder) |
| M09 | Full Osiris Shaft reconstruction | — | Medium |
| M10 | Hydraulic simulation only | Acoustic solver/visualization/validation, comparison, export, async API, performance modes | Medium |

## Hypotheses for Phase 1a

1. **Hydraulic Hypothesis** — Osiris Shaft as an engineered water feature.
2. **Mainstream Consensus** — Osiris Shaft as a Late Period tomb/ritual structure.

## Exit Criteria

- All Phase 1a milestones meet task-level DoD and DoSD.
- ≥10 evidence hotspots linked to the evidence database.
- Two hypotheses installable and switchable.
- Hydraulic simulation validated on Level 3.
- Performance within the desktop budget defined in `GIZA - 04 §6.27`.

## References

- `docs/mvp-roadmap.md`
- `docs/adr/0003-lean-mvp-split.md`
- `GIZA - 15 Implementation Roadmap.md`
