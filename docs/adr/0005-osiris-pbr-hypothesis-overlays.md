# ADR-0005: Osiris PBR Overrides and Hypothesis Geometry Overlays

**Status:** Accepted
**Date:** 2026-08-08
**Deciders:** AI coding agent (Devin)

## Context

`OsirisScene.tsx` was rendering Osiris Shaft blockout geometry with local `meshStandardMaterial` configuration. At the same time, the codebase had a `masterMaterials.ts` catalog (five canonical materials) and a hypothesis visualization rule engine (`src/theories/visibilityRules.ts`) that could alter PBR parameters per object. The M04-T04 task required moving the scene beyond a hardcoded `meshStandardMaterial` and wiring the master-material system so hypothesis rules and material micro-detail could be applied without editing scene code.

M09-T10 required rendering the Northern Conduit as an overlay for the hydraulic hypothesis versus a dead-end for the mainstream hypothesis, while M09-T15 required optional procedural edge erosion, mineral streaks, micro cracks, and dust for limestone surfaces. Both needed to be evidence-linked, hypothesis-aware, and non-destructive to the base blockout geometry.

## Decision

1. **Base material system**: `BlockoutMesh` now pulls PBR overrides and an optional `MicroDetailConfig` from `masterMaterials.ts` via `getPbrForMaterial()` and `getMicroDetailForMaterial()`. The material remains `MeshStandardMaterial` but is extended through `onBeforeCompile` with GLSL injected by `createOsirisStoneOnBeforeCompile()` in `src/scene/osirisStoneMaterial.ts`. The micro-detail is toggled by `microDetailEnabled` in `app.ts` and keyed by material so the renderer can swap shaders when the setting changes.

2. **Hypothesis geometry overlays**: Interpretive geometry (e.g., the Northern Conduit continuation) is produced by hypothesis plugins via `getGeometryNodes()` and rendered by a dedicated `HypothesisGeometryMesh` component. The geometry is transparent, double-sided, depth-write disabled when transparent, and only appears when the parent hypothesis is active. It reuses existing evidence records (e.g., `EV-000009`) and does not modify the base blockout mesh.

3. **Layer taxonomy**: `store/app.ts` defines the eight conceptual layers (Geometry, Modern, Water, Geology, Evidence, Theory, Simulation, Annotations) and a mapping from the existing `SCENE_LAYERS` values. `sceneGraph.ts` propagates `conceptualLayers` metadata without changing the `hiddenLayers` / `LayerPanel` API.

## Consequences

- Positive: All visible Osiris limestone surfaces can receive evidence-linked micro-detail that is toggleable and independent of the base geometry. Hypothesis plugins can add, remove, or alter geometry without touching `OsirisScene.tsx`. The layer taxonomy gives the UI a migration path to the eight conceptual layers while keeping the current panel functional.
- Negative: Micro-detail is currently implemented as `onBeforeCompile` GLSL injected into `MeshStandardMaterial`, which ties the effect to Three.js internals and may require updates if Three.js shader chunks change. The hypothesis geometry overlay is a simple box; future work may replace it with a spline-following tube or CFD-derived mesh.
- Risks: Performance of the onBeforeCompile shader on low-end GPUs is untested; the effect is gated by `microDetailEnabled` so it can be disabled.

## Alternatives Considered

- Custom `ShaderMaterial` replacing `MeshStandardMaterial` entirely. Rejected because it would force us to reimplement PBR lighting, shadows, and fog; `onBeforeCompile` preserves the engine's built-in PBR.
- Instanced geometry or vertex colors for micro-detail. Rejected because the effect is procedural and view-dependent; `onBeforeCompile` gives per-pixel control without adding geometry.
- Modifying the Northern Conduit blockout node for each hypothesis. Rejected because it would duplicate geometry and evidence; the overlay approach keeps base geometry immutable and evidence records shared.
