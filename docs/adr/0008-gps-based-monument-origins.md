# ADR-0008: GPS-Based Monument Origins and World Coordinate Anchor

**Status:** Accepted
**Date:** 2026-08-10
**Deciders:** Devin (AI contributor)
**Supersedes:** ADR-0007 (implicit — new camera/world coordinate convention)

## Context

The GIZA scene graph previously placed the Great Pyramid and the Osiris Shaft at the same world origin (`{0,0,0}`) for convenience. The user requirement is to position both monuments at their exact GPS coordinates so the 3D layout matches the real Giza plateau. The existing `MONUMENT_ORIGINS` table in `src/scene/coordinateSystem.ts` was the natural place to inject these offsets, and `SceneGraph.setRootOrigin` propagates them through the node hierarchy.

Coordinate conventions:

- Y-up, right-handed, meters.
- North is `-Z`, East is `+X`.
- Great Pyramid is the current world datum because published GPS coordinates for its apex are the most precise anchor available.

## Decision

1. Anchor the world origin at the Great Pyramid GPS coordinates (`29.9792368 N, 31.1342008 E`).
2. Add a WGS-84 to plateau-meters conversion function (`latLonToPlateauMeters`) using an equirectangular projection at the datum latitude.
3. Compute `MONUMENT_ORIGINS` from published GPS coordinates for each monument.
4. Update `buildGreatPyramidSceneGraph` and `buildOsirisSceneGraph` to call `setRootOrigin` with their respective `MONUMENT_ORIGINS` value.
5. Update camera defaults and `EvidencePanel` object framing to operate in world coordinates by applying the monument origin offset.
6. Bump the Zustand persistence version to 3 and migrate any old local-space Osiris camera coordinates to world space.

## Consequences

- The Great Pyramid and Osiris Shaft now appear at their real-world relative positions (Osiris Shaft ≈ 440 m south of the Great Pyramid).
- Camera targets and measurement markers are consistent across monuments because they use world coordinates.
- Existing bookmarks saved before this ADR with Osiris-local camera coordinates are automatically migrated.
- Khafre and Menkaure origins are also derived from GPS, ready for future scene work.
- The projection is approximate (equirectangular); survey-grade UTM or local grid conversion can replace it later if higher precision is needed.

## Alternatives Considered

- **Keep local origins and apply GPS offsets per render node.** Rejected — it duplicates the transform logic already handled by `SceneGraph` and would require every scene component to know about GPS.
- **Use UTM zone 36N.** Rejected for MVP because the published WGS-84 values are the raw source material, and the extra precision is unnecessary for the current visualization scale.
