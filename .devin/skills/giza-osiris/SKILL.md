---
name: GIZA Osiris Shaft E2E Testing
description: How to end-to-end test the Osiris Shaft scene, blockout metadata, hypothesis overlays, micro-detail, and layer toggles.
---

# GIZA Osiris Shaft E2E Testing

## Devin Secrets Needed

None for local dev-server testing.

## One-time setup

1. Ensure Node >= 20 is available.
2. Run `npm install` from the repo root (this also runs `husky` via `prepare`).
3. Start the dev server: `npm run dev` (Vite serves on `http://localhost:5173`).

## How to reach the Osiris Shaft

1. Open Chrome and navigate to `http://localhost:5173`.
2. The app defaults to `activeMonument = 'great-pyramid'`.
3. Switch to the Osiris monument by setting the persisted `giza-session` localStorage key:

```js
localStorage.setItem(
  'giza-session',
  JSON.stringify({
    state: {
      activeMonument: 'osiris',
      cameraTarget: { x: -1.4, y: -15, z: -7 },
      cameraMode: 'orbit',
      hiddenLayers: [],
      activeHypothesisIds: [],
      microDetailEnabled: false,
      sidePanelTab: 'scene',
    },
    version: 2,
  }),
);
location.reload();
```

**Note:** Seeding only `activeMonument: 'osiris'` without `cameraTarget` may leave the camera pointing at the default Great Pyramid target (`{x:0, y:70, z:0}`) and produce a blank or off-target viewport. Always seed `cameraTarget` for Osiris tests.

## Osiris scene layers and conceptual taxonomy

- Monument layers: `shafts`, `level-1`, `level-2`, `level-3`, `monument`.
- Conceptual layers (`Geometry`, `Modern`, `Water`, `Geology`, `Evidence`, `Theory`, `Simulation`, `Annotations`) are defined in `src/store/app.ts` and propagated to scene-graph metadata, but there is **no UI toggle for conceptual layers**. Use `hiddenLayers` to toggle the monument-level layers that map to them.

## How to verify blockout metadata and clicking

1. The `Basalt Sarcophagus` blockout node carries `objectId: 'OBJ-0008'`, `evidenceIds: ['EV-000008']`, `sourceIds: ['SRC-0001', 'SRC-0002']`, and `confidence: 95`.
2. The `Northern Conduit` blockout node carries `objectId: 'OBJ-0009'`, `evidenceIds: ['EV-000009']`, `sourceIds: ['SRC-0001']`, and `confidence: 85`.
3. To click a small object reliably from a normal camera distance, either zoom in close or seed selection directly in `giza-session`:

```js
const s = JSON.parse(localStorage.getItem('giza-session') ?? '{}');
s.state = {
  ...s.state,
  selectedObjectId: 'OBJ-0008',
  selectedEvidenceId: 'EV-000008',
  sidePanelTab: 'evidence',
};
localStorage.setItem('giza-session', JSON.stringify(s));
location.reload();
```

4. The Evidence panel shows the evidence title, confidence percentage, source *titles*, and linked object names. It does **not** currently render raw `EV-` or `SRC-` identifiers, even though they are stored in the blockout metadata.

## How to toggle hypotheses

1. Open the right side panel and click the **Simulation** tab. The `HypothesisSelector` lists all registered hypotheses as checkboxes.
2. If the checkboxes do not respond to mouse clicks, toggle state directly in `giza-session`:

```js
const s = JSON.parse(localStorage.getItem('giza-session') ?? '{}');
s.state = {
  ...s.state,
  activeHypothesisIds: ['THEORY-OSIRIS-001'], // hydraulic
  // activeHypothesisIds: ['THEORY-OSIRIS-002'], // mainstream
};
localStorage.setItem('giza-session', JSON.stringify(s));
location.reload();
```

3. `THEORY-OSIRIS-001` (Hydraulic Functionality) also enables a water plane and a `WaterMesh` in Chamber I.
4. `THEORY-OSIRIS-001` adds a translucent dark-blue (`#0a4a6b`, opacity `0.3`) box extending the northern conduit to `{x:-9.46, y:-30.3, z:-16.31}` (size z `6.0`).
5. `THEORY-OSIRIS-002` (Mainstream Funerary) adds a translucent gray (`#9ca3af`, opacity `0.4`) dead-end box at `{x:-9.3, y:-30.3, z:-16.1}` (size z `1.2`).
6. The overlays are rendered by `HypothesisGeometryMesh` and are narrow. At the default camera distance they may not be visually obvious; zoom in on the northern-conduit end or use local tests to confirm the nodes are mounted.

## How to toggle micro-detail

1. There is **no in-app UI toggle** for `microDetailEnabled`; it is store-only.
2. Seed it in `giza-session`:

```js
const s = JSON.parse(localStorage.getItem('giza-session') ?? '{}');
s.state = { ...s.state, activeMonument: 'osiris', microDetailEnabled: true };
localStorage.setItem('giza-session', JSON.stringify(s));
location.reload();
```

3. Verify the scene still renders and that the browser console shows no WebGL shader-compile errors. The visual change (edge erosion, mineral streaks, micro cracks, dust) can be subtle; a before/after screenshot comparison is recommended.

## How to trigger the debug overlay

1. There is **no React UI or keyboard shortcut** currently wired to `DebugOverlayManager` in the running app.
2. Run the smoke test to exercise the debug overlay manager:

```bash
npx vitest run src/scene/smoke.spec.ts
```

3. The test should report `setEnabled`, `enableAll`, `disableAll`, and `stats/evidence coverage` lines.

## Useful smoke commands

```bash
npm run typecheck
npm run lint
npx vitest run src/scene/smoke.spec.ts
```

## Expected positive signals

- No `Something went wrong` error fallback.
- Browser console has no `console.error` / WebGL errors after load.
- The Osiris shaft geometry is visible in the main viewport.
- Toggling a hypothesis changes the scene (water plane for hydraulic, narrow overlay geometry for either hypothesis).
- Clicking or selecting an object opens the Evidence panel with the correct confidence and source titles.
