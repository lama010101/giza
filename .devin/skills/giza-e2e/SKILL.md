---
name: GIZA Great Pyramid E2E Testing
description: How to end-to-end test the Vite + React GIZA app, with a focus on the Great Pyramid scene, LOD switching, and geometry verification.
---

# GIZA Great Pyramid E2E Testing

## Devin Secrets Needed

None for local dev-server testing.

## One-time setup

1. Ensure Node >= 20 is available.
2. Run `npm install` from the repo root (this also runs `husky` via `prepare`).
3. Start the dev server: `npm run dev` (Vite serves on `http://localhost:5173`).

## How to run the app and reach the Great Pyramid

1. Open Chrome and navigate to `http://localhost:5173`.
2. The app defaults to `activeMonument = 'great-pyramid'` and `mode = 'Explore'`.
3. The side panel on the right defaults to the **Scene** tab. Primary monument tabs are **Osiris** and **Pyramid**.
4. The 3D scene renders in the left viewport.

## How to switch between LOD0 and LOD1

There is no in-app LOD UI. The current LOD is stored in the Zustand-persisted `giza-session` localStorage key:

```js
localStorage.setItem(
  'giza-session',
  JSON.stringify({ state: { lod: 'LOD1' }, version: 2 })
);
location.reload();
```

Valid values: `'LOD0'`, `'LOD1'`. After reload the scene graph is rebuilt with the selected LOD.

## Recommended camera strategy for interior inspection

- Use `OrbitControls` (left-click drag) to rotate around the target.
- Scroll to zoom in/out.
- To hover interior nodes, the large `pyramid-exterior` box can occlude pointer events. Hide the **Exterior** layer in the side panel, then rotate/zoom and hover.
- The camera mode buttons (orbit / walk / fly / teleport) are only shown in the side panel when the top **Research** tab is active or when the current mode is not orbit.
- Objects embedded inside a passage box (e.g. the `ascending-plug-*` blocks inside the `ascending-passage` box) are occluded for pointer events from most exterior angles. To hover them, zoom very close to the passage lower end or use a temporary debug camera placement in `CameraRig.tsx`.
- If layer toggle clicks are hard to target, set `hiddenLayers` via localStorage and reload:

```js
const s = JSON.parse(localStorage.getItem('giza-session') ?? '{}');
s.state = { ...s.state, hiddenLayers: ['exterior'] };
localStorage.setItem('giza-session', JSON.stringify(s));
location.reload();
```

## How to verify rendered nodes

- Hover over a mesh with the mouse. The `viewport-overlay` at the bottom-left shows `BlockoutNode.name`.
- For LOD1, the generator is in `database/geometry/gp-lod1.ts` and the scene graph is built in `src/scene/greatPyramidSceneGraph.ts`.
- `BlockoutMesh` in `src/scene/GreatPyramidScene.tsx` maps each scene node to a `boxGeometry` and handles hover/click events.

## Known quirks

- `OrbitControls` retains camera state across full page reloads if `cameraTarget` is persisted. To force the default framing, clear or reset `giza-session` and reload, or use a fresh incognito window.
- Very thin shaft geometry (diameter ~0.2 m) is hard to hover from a distance; zoom in or use the Vitest tests for node-count/metadata verification.
- Fly mode (`W`/`S`/`A`/`D`) moves the camera along its current look direction and does **not** require pointer lock for keyboard movement. However, the QC shafts are only ~0.21 m wide, so even small mouse/heading drift will move the camera outside the shaft wall and occlude the far-end blocking stones. For reliable verification of objects at the end of a narrow shaft, place a temporary debug camera on the shaft centerline a short distance from the target.
- Blocking stones placed at the inner end of a shaft (e.g. `qc-north-shaft-door`, `qc-south-shaft-door`, `ascending-plug-*`) should be hovered from inside the shaft on the centerline; the outer surface of the door is the front face visible from the shaft interior.
- The `GrandGalleryMesh` uses a custom corbelled segment group; pointer events on the group may behave differently from `BlockoutMesh`.
- The `AntechamberMesh` is a group of meshes (shell, wainscots, portcullis slots). Pointer events attached to the group fire on any child mesh and highlight the whole `antechamber` node; hover shows `Antechamber` and click opens `EV-100010`.
- To inspect the Antechamber interior, hide the **Exterior** layer, set `cameraTarget` to the antechamber center (`{x:7.22, y:44.8, z:0.72}`), and orbit/zoom in from the side until the wainscots and slots are visible.
- The `SubterraneanChamberMesh` is a group of meshes (translucent shell + four darker inferred recesses). Pointer events on the group highlight the whole `subterranean-chamber` node; hover shows `Subterranean Chamber` and click opens `EV-100006`.
- The subterranean chamber is underground and dark; lift ambient/local lighting via `giza-lighting` and set the camera to an outside-the-box view (e.g. `{x:0, y:-28, z:6}` looking at `{x:0, y:-28, z:-4}`) so the translucent shell and interior recesses are visible. Inside-the-box close-ups are dominated by the recess because the shell uses `FrontSide` only.

  ```js
  localStorage.setItem(
    'giza-lighting',
    JSON.stringify({
      state: {
        ambientIntensity: 8,
        directionalIntensity: 1.2,
        directionalAzimuth: 45,
        directionalElevation: 60,
        localIntensity: 3,
        background: '#0f0f0f',
      },
      version: 0,
    }),
  );
  localStorage.setItem(
    'giza-session',
    JSON.stringify({
      state: {
        activeMonument: 'great-pyramid',
        lod: 'LOD0',
        cameraMode: 'orbit',
        cameraTarget: { x: 0, y: -28, z: -4 },
        hiddenLayers: ['exterior'],
      },
      version: 2,
    }),
  );
  location.reload();
  ```

## Useful smoke commands

```bash
npm run typecheck
npm run lint
npx vitest run src/scene/gp-lod1.test.ts src/scene/greatPyramid.test.ts
```

## Expected positive signals

- No `Something went wrong` error fallback.
- Browser console has no `console.error`/WebGL errors after load.
- Hover overlays show expected names: `Pyramid Exterior (core masonry)`, `Grand Gallery`, `King's Chamber`, `Queen's Chamber`, `Subterranean Chamber`, and relieving/shaft nodes.
