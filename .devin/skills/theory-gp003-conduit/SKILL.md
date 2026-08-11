---
name: GIZA THEORY-GP-003 conduit simulation/geometry verification
description: How to end-to-end verify that the Osiris→Great Pyramid hydraulic-acoustic conduit and SIM-201 parameters are derived from the shared getConduitParameters() helper.
---

## Devin Secrets Needed

None for local dev-server testing.

## Environment

- Repo: `/home/ubuntu/repos/giza`
- Dev server: `npm run dev` → `http://localhost:5173`
- Coordinate system: +X east, +Y up, +Z south, origin at Great Pyramid centre

## What to verify

- `getConduitParameters()` in `src/theories/plugins/gp-hydraulic-acoustic.ts` derives the conduit from `osirisBlockout.nodes['northern-conduit']` and `greatPyramidBlockout.nodes['subterranean-chamber']`.
- Expected `SIM-201` parameters: `conduitLength: 415.99`, `conduitSlope: 0.29`, `conduitDiameter: 0.6`, `chamberVolume: 414.74`.
- `SIM-202` and `SIM-203` use `GP_KINGS_CHAMBER.height` (`5.84 m`).
- The hypothesis geometry is a single amber (`#f59e0b`, opacity `0.25`) `HypothesisGeometryNode` with id `hyp-osiris-northern-conduit-to-gp-subterranean` and `size.z: 415.99`.

## UI path

1. Open `http://localhost:5173`.
2. The side panel on the right shows tabs. Open the **Simulation** tab.
3. In `HypothesisSelector`, check `Hydraulic-Acoustic System Hypothesis` (`THEORY-GP-003`).
4. Open the **Scene** tab and make sure the `Theory overlays` visibility layer is enabled.

## Camera presets

- World-space midpoint of the conduit is approximately `{x: 14.64, y: -29.26, z: 216.84}`.
- Full-length side view (Great Pyramid scene): `cameraPosition {x: 375, y: -28, z: 217}` looking at the midpoint.
- Osiris-end close-up (works in both Great Pyramid and Osiris scenes): `cameraPosition {x: 60, y: -25, z: 424}` looking toward `{x: 14.64, y: -29.26, z: 300}`.
- Hide occluders: in the Great Pyramid scene disable the **Exterior** layer; in the Osiris scene disable **monument**, **level-1**, **level-2**, and **shafts** layers.

## Playwright / programmatic verification

- Import `gpHydraulicAcousticPlugin` from `/src/theories/plugins/gp-hydraulic-acoustic.ts` in a Vite-aware `page.evaluate()` and call `getSimulations()` to read `SIM-201`/`SIM-202`/`SIM-203` parameters directly.
- Import `hypothesisEngine` from `/src/theories/engineInstance.ts` and call `getGeometryNodes({})` to confirm exactly one `HypothesisGeometryNode` for `THEORY-GP-003`.
- Read `useAppStore.getState().activeHypothesisIds` to confirm `THEORY-GP-003` is active.

## Before/after capture

- Toggle `activeHypothesisIds` between `['THEORY-GP-003']` and `[]` (or toggle `Theory overlays` on/off) and capture the canvas with `page.screenshot()`.
- Compare captures with ImageMagick `compare -metric RMSE` or Python PIL. The amber conduit is a faint yellow/orange line; the OFF capture should be almost black where the conduit was.
- To hide UI during capture, add `body.screenshot-mode` to `document.body.classList` before the screenshot and remove it after.

## Known UI gap

- `src/ui/SimulationPanel.tsx` does not display `SIM-201` parameter values when `THEORY-GP-003` is active; it only shows Osiris hydraulic controls when `THEORY-OSIRIS-001` is active. Confirm the derived values through the plugin API or targeted unit tests (`src/theories/plugins/gp-hydraulic-acoustic.test.ts`) instead.

## Useful commands

- `npm run typecheck`
- `npm run lint`
- `npx vitest run src/theories/plugins/gp-hydraulic-acoustic.test.ts`
- `npx vitest run src/scene/gp-lod1.test.ts src/scene/greatPyramid.test.ts`
