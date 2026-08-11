# ADR-0009: Osiris Shaft → Great Pyramid Hypothesized Conduit Overlay

**Status:** Accepted
**Date:** 2026-08-10
**Deciders:** Devin (AI contributor)

## Context

`GIZA - 03 Osiris Shaft Specification.txt` §2.15 requires that the Level 3 northern conduit be shown as observed geometry only by default, with optional overlays for "Geological projection" or "Hydraulic hypothesis." The user asked to investigate the conduit leaving the third level of the Osiris Shaft toward the Great Pyramid and to create a visual conduit linking the Osiris Shaft to the Great Pyramid's Subterranean Chamber.

The `THEORY-GP-003` hypothesis plugin already asserts a hydraulic connection between the Osiris Shaft and the Great Pyramid. It lacked geometry, so the natural place to add the interpretive conduit is inside the plugin's `getGeometryNodes` method, keeping the overlay scoped to the hypothesis and removable by disabling the theory.

## Decision

1. Extend `THEORY-GP-003` (`src/theories/plugins/gp-hydraulic-acoustic.ts`) with a `getGeometryNodes` implementation.
2. The geometry starts at the far (NW) end of the surveyed `northern-conduit` node in the Osiris Shaft Level 3 blockout.
3. The geometry ends at the south wall center of the Great Pyramid `subterranean-chamber` blockout.
4. The box is oriented using the Euler rotation that aligns its local `+Z` axis with the start→end vector.
5. The node is rendered with low opacity (`0.25`) and an amber color (`#f59e0b`) to indicate it is interpretive, not surveyed.
6. The node links to evidence `EV-000009` (the northern conduit observation) and includes metadata explaining its hypothetical status.
7. `GreatPyramidScene` and `OsirisScene` render `hypothesisGeometryNodes` through a shared `HypothesisMesh` component whenever the `Theory` visibility layer is active.

## Consequences

- The conduit is only visible when `THEORY-GP-003` is active, preserving the default "observed geometry only" rule.
- The overlay is automatically available in both the Great Pyramid and Osiris Shaft views.
- The geometry is computed from existing blockout data and the GPS-derived monument origins, so it stays synchronized with future survey updates.
- The length and orientation are exposed in the node's metadata for inspection.

## Alternatives Considered

- **Add a permanent blockout node for the conduit.** Rejected — it would violate §2.15 by presenting an inferred continuation as fact.
- **Create a separate hypothesis plugin.** Rejected — it would duplicate the existing hydraulic-acoustic framework and fragment the related evidence.
- **Hard-code the start/end coordinates.** Rejected — the implementation derives them from the surveyed blockouts and monument origins so the overlay stays maintainable.
