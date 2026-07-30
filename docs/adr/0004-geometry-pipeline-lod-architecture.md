# ADR-0004: Geometry Pipeline — LOD Architecture

**Status:** Accepted
**Date:** 2025-01-20
**Deciders:** AI Agent, Project Owner

## Context

The Great Pyramid geometry was initially rendered from a single LOD0 blockout file (`database/blockouts/great-pyramid.ts`) containing hardcoded coordinates. This approach has several limitations:

1. **No measurement provenance** — positions and sizes are manual values with no link to survey data.
2. **No LOD switching** — the renderer cannot trade visual fidelity for performance.
3. **No hypothesis geometry** — hypothesis-specific 3D objects (e.g., the ScanPyramids "Big Void") have no rendering path.
4. **No derivation chain** — impossible to audit how a position was computed from raw measurements.

The geometry pipeline needs to support multiple levels of detail, measurement-driven geometry, and hypothesis-specific overlays without modifying the engine for each new hypothesis.

## Decision

### 1. LOD Architecture

Introduce a `LODLevel` type (`LOD0`–`LOD3`) in `src/loaders/validators.ts`. The app store (`src/store/app.ts`) holds the current `lod` state and a `setLOD` action.

The scene graph builder (`buildGreatPyramidSceneGraph`) accepts an `lod` parameter and selects between:
- **LOD0** — existing blockout nodes (hardcoded coordinates, backward compatible)
- **LOD1** — measurement-derived nodes from `database/geometry/gp-lod1.ts`

`GreatPyramidScene.tsx` reads `lod` from the store and dynamically builds the scene graph and block map.

### 2. Measurement-Driven Geometry (LOD1)

Created two new files under `database/geometry/`:
- `gp-geometry-utils.ts` — pure functions: `degToRad`, `slopedEndpoint`, `slopedBoxCenter`, `slopedBoxRotation`, `chamberCenterY`, etc.
- `gp-lod1.ts` — `generateGreatPyramidLOD1()` produces `BlockoutNodeLOD1[]` with positions calculated from constants in `database/measurements/great-pyramid-measurements.ts`.

Each LOD1 node includes a `derivation` field (`measured`, `calculated`, `inferred`, `placeholder`) indicating how its position was derived.

### 3. Hypothesis Geometry Support

Extended the hypothesis plugin system:
- `HypothesisGeometryNode` interface in `src/theories/types.ts` — defines 3D nodes specific to a hypothesis (e.g., detected voids, proposed chambers).
- `getGeometryNodes?(context)` method on `HypothesisPlugin` — plugins optionally provide geometry nodes.
- `HypothesisEngine.getGeometryNodes(context)` — aggregates nodes from all active plugins.
- `GreatPyramidScene.tsx` renders these nodes via `HypothesisMesh` component.

Created `gp-scanpyramids.ts` plugin as the first hypothesis providing geometry nodes (the "Big Void" above the Grand Gallery).

### 4. TypeScript Path Configuration

Added `database` to `tsconfig.json` `include` array so that `@db/*` path aliases resolve for type-checking.

## Consequences

- **Positive:** LOD switching is runtime-controllable via the app store. New LOD levels can be added without changing the renderer. Hypothesis plugins can provide 3D geometry without engine modification. Measurement provenance is traceable.
- **Negative:** Slightly increased complexity in the scene graph builder and renderer. LOD1 generation is a pure function call per render (memoized in React).
- **Risk:** LOD1 positions calculated from measurements may differ slightly from LOD0 hardcoded values. This is expected — LOD1 is measurement-derived and more accurate. Tests verify both LODs produce valid scene graphs.

## Alternatives Considered

1. **Single LOD with measurement provenance only** — rejected because it doesn't address performance scaling for future LODs (e.g., high-detail meshes).
2. **Separate renderers per LOD** — rejected as over-engineering; the current approach uses a single renderer with dynamic node selection.
3. **Hypothesis geometry as blockout overlays** — rejected because it would pollute the blockout data with hypothesis-specific nodes, violating the principle that evidence is shared and hypotheses are overlays.
