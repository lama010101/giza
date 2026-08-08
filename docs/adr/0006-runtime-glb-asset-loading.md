# ADR-0006: Runtime GLB Asset Loading for Per-Object Scene Geometry

**Status:** Accepted
**Date:** 2026-08-08
**Deciders:** AI agent (scene rendering)

## Context

The M06B asset pipeline now publishes a dedicated `.glb` file for every `AssetDefinition` under `assets/export/glB/objects/`. Each file contains the surveyed blockout geometry for a single logical object and embeds DoSD metadata (`EV-`, `SRC-`, confidence, material, LODs). However, the scene components (`OsirisScene`, `GreatPyramidScene`) continued to render only generated `BlockoutMesh` primitives, so the published production assets were not visible at runtime.

The scene graph is the source of truth for visibility, layers, hypotheses, and interactions. The runtime loader must therefore honor the scene graph while swapping the blockout primitive for the published GLB when a matching per-object asset exists.

## Decision

Introduce a single `GLTFAssetMesh` component that loads a published per-object GLB at runtime with `three.js GLTFLoader`. The loader is skipped in non-browser and test environments, falling back to the existing `BlockoutMesh`.

`OsirisScene` and `GreatPyramidScene` resolve a published GLB URL for each visible node using `resolveAssetUrlForNode`, which matches either:

- Great Pyramid nodes by `objectId` (`GP-OBJ-NNNN-LOD0` asset IDs); or
- Osiris nodes by node name (since Osiris asset IDs do not encode `objectId`).

To avoid duplicate geometry when multiple scene nodes share the same `objectId` (e.g., a passage split into sloped and horizontal segments), the scene components deduplicate by `objectId` and render the GLB once for the first visible node of that object. Nodes whose geometry is handled by special components (`grand-gallery`, `antechamber`, `subterranean-chamber`, `kings-chamber`, `queens-chamber`, `GreatPyramidExteriorMesh`) and the `pyramid-exterior` cone are excluded from GLB substitution.

`GLTFAssetMesh` clones the loaded scene so each instance is independent, applies `BlockoutLike` color, opacity, roughness, metalness, and hover emissive state to all `MeshStandardMaterial` instances, and re-uses the existing `useSceneObjectClick` handlers so evidence/theory interactions continue unchanged.

## Consequences

- The production GLB assets are now rendered in the running application, not only validated by scripts.
- Per-object GLBs appear with the same hover, highlight, and click behavior as blockout meshes.
- Great Pyramid object IDs that map to multiple scene nodes render the aggregate GLB exactly once, avoiding overlap and z-fighting.
- The loader falls back to `BlockoutMesh` on load failure, preserving scene usability if a production asset is missing or network is unavailable.
- Unit tests continue to render the fallback blockout meshes because `GLTFLoader` is disabled in test mode.

## Alternatives Considered

- **Use `@react-three/drei/useGLTF` with Suspense:** rejected because `useGLTF` requires a Suspense boundary and would trigger Suspense in every node swap; the manual `GLTFLoader` approach keeps the existing render flow and provides a clean fallback path.
- **Load aggregate monument GLBs and filter per node:** rejected because aggregate files require parsing and clipping at runtime, reintroducing the coarse-grained problem that per-object export solved.
- **Replace special components (Grand Gallery, Kings Chamber, etc.) with their GLB proxies:** rejected because the special components carry additional procedural detail (corbel segments, relieving chambers, casing geometry) that the blockout-derived GLBs do not yet reproduce.
