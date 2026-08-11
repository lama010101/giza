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

## Testing the shared `BlockoutMesh` and thin-shaft hit tolerance

`src/scene/BlockoutMesh.tsx` is now the single component used by both `GreatPyramidScene.tsx` and `OsirisScene.tsx`. For any block whose smallest dimension is below 0.3 m it renders an invisible larger hit volume alongside the visual mesh and attaches pointer events to that volume.

Practical impact:
- Thin shafts such as `QC South Shaft` (~0.21 m cross-section) and `KC South Shaft` can now be hovered and clicked from a normal zoomed-in viewport angle.
- Existing chamber nodes (`King's Chamber`, `Queen's Chamber`, `Grand Gallery`, `Subterranean Chamber`, `Campbell's Chamber`) continue to hover/click as before.

To verify a shaft:
1. Switch to `LOD1`.
2. Hide the **Exterior** layer.
3. Set `cameraTarget` to the shaft midpoint, e.g. `{x:0, y:46.5, z:32.3}` for `QC South Shaft`.
4. Scroll to zoom in until the shaft band is a thick diagonal line, then move the cursor over it.
5. The overlay should read `QC South Shaft`; clicking it opens the Evidence panel.

If the viewport angle is awkward, a temporary `?cam=px,py,pz,tx,ty,tz` URL parser can be added to `src/scene/CameraRig.tsx` for one-shot placement and reverted after testing.

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
- The `GrandGalleryMesh` now includes inferred interior details: 25 darker side-bench notches per side and 4 darker transverse floor ramp slots. They are subtle because the segments share the same low opacity as the rest of the gallery; verify them from inside the gallery near the north/upper end looking south, with all non-`gallery` layers hidden and `giza-lighting` ambient/local intensity raised. A useful temporary debug-camera preset is `{7.42, 42.46, -3.85}` → `{7.77, 42.08, -5.07}`.
- The `AntechamberMesh` is a group of meshes (shell, wainscots, portcullis slots). Pointer events attached to the group fire on any child mesh and highlight the whole `antechamber` node; hover shows `Antechamber` and click opens `EV-100010`.
- To inspect the Antechamber interior, hide the **Exterior** layer, set `cameraTarget` to the antechamber center (`{x:7.22, y:44.8, z:0.72}`), and orbit/zoom in from the side until the wainscots and slots are visible.
- The `GreatPyramidExteriorMesh` renders the `exterior-detail` node as a group of meshes: surviving casing on the south/east/west lower faces, a translucent casing-debris field around the base, four darker corner foundation sockets, a square enclosure-wall ring ~30 m beyond the base, and a transparent pyramidion capstone. Pointer events on the group highlight the whole `exterior-detail` node; hover shows `Exterior Detail (casing, sockets, wall, pyramidion)` and click opens `EV-100002`.
- The casing-stone slabs generated for `exterior-detail` (and the existing `casing-north` blockout node) are placed inside the `pyramid-exterior` core-masonry box, so from outside the core they are occluded for pointer events and the overlay reads `Pyramid Exterior (core masonry)`. To hover/click `exterior-detail` from outside, aim at the enclosure wall, corner sockets, or pyramidion. To inspect the casing bands themselves, place the camera just inside the core masonry on the face side (e.g. `{0, 6, 109}` looking at `{0, 6, 111}` for the south face) with non-`exterior` layers hidden and `giza-lighting` ambient raised.
- The `SubterraneanChamberMesh` is a group of meshes (translucent shell + four darker inferred recesses). Pointer events on the group highlight the whole `subterranean-chamber` node; hover shows `Subterranean Chamber` and click opens `EV-100006`.
- The subterranean chamber is underground and dark; lift ambient/local lighting via `giza-lighting` and set the camera to an outside-the-box view (e.g. `{x:0, y:-28, z:6}` looking at `{x:0, y:-28, z:-4}`) so the translucent shell and interior recesses are visible. Inside-the-box close-ups are dominated by the recess because the shell uses `FrontSide` only.
- The `KingsChamberMesh` is a group of meshes (translucent shell + floor/ceiling slabs, four inner wall panels, course joints, stress fractures, and north/south shaft entrance markers). Pointer events on the group highlight the whole `kings-chamber` node; hover shows `King's Chamber` and click opens `EV-100011`.
- To inspect the King's Chamber interior, hide the **Exterior** and **Relieving** layers, set `cameraTarget` to the chamber center (`{x:7.22, y:45.94, z:8.43}`), and orbit/zoom in from the side until the floor/ceiling slabs, wall joints, and shaft markers are visible.
- A useful temporary debug-camera preset is `{x:7.22, y:45.94, z:6.0}` looking at `{x:7.22, y:45.94, z:8.43}`. Add a `DebugCamera` component to `src/scene/CameraRig.tsx` that sets `camera.position` and `controls.target` once on the first frame when `window.location.search` includes `?debug=kings-chamber`, then revert it after testing.

  ```js
  localStorage.setItem(
    'giza-session',
    JSON.stringify({
      state: {
        activeMonument: 'great-pyramid',
        lod: 'LOD0',
        cameraMode: 'orbit',
        cameraTarget: { x: 7.22, y: 45.94, z: 8.43 },
        hiddenLayers: ['exterior', 'relieving'],
      },
      version: 2,
    }),
  );
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
  location.assign('http://localhost:5173/?debug=kings-chamber');
  ```
- The `QueensChamberMesh` is a group of meshes (translucent shell + two gabled roof panels, north/south shaft entrance markers, and the 1872 Dixon vent hole marker). Pointer events on the group highlight the whole `queens-chamber` node; hover shows `Queen's Chamber` and click opens `EV-100018`.
- To inspect the Queen's Chamber interior, hide the **Exterior** layer, set `cameraTarget` to the chamber center (`{x:0, y:24.3, z:6.32}`), and orbit/zoom in from the side until the gabled roof, shaft markers, and Dixon vent marker are visible.
- A useful temporary debug-camera preset is `{x:0, y:24.3, z:3.5}` looking at `{x:0, y:24.3, z:6.32}` (`?debug=queens-chamber`).

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
        cameraTarget: { x: 0, y: 24.3, z: 6.32 },
        hiddenLayers: ['exterior'],
      },
      version: 2,
    }),
  );
  location.assign('http://localhost:5173/?debug=queens-chamber');
  ```

## Temporary `?cam=` debug camera URL

If `OrbitControls` persists the camera position across reloads, the fastest way to frame a chamber or shaft is to add a temporary parser to `src/scene/CameraRig.tsx` and revert it after testing.

Snippet to insert inside `CameraRig` (or as `useDebugCamera`):

```tsx
function useDebugCamera(): void {
  const { camera } = useThree();
  const setCameraTarget = useAppStore((s) => s.setCameraTarget);
  useEffect(() => {
    const cam = new URLSearchParams(window.location.search).get('cam');
    if (cam) {
      const [px, py, pz, tx, ty, tz] = cam.split(',').map(Number);
      camera.position.set(px, py, pz);
      setCameraTarget({ x: tx, y: ty, z: tz });
    }
  }, [camera, setCameraTarget]);
}
```

Usage: `http://localhost:5173/?cam=15,45.94,20,7.22,45.94,8.43` places the camera at `{15,45.94,20}` looking at the King's Chamber center.

## Verifying lighting modes and the Subterranean Chamber

- The `Lighting` dropdown is in the top-right header. It opens a popover with a `Mode` `<select>` (`Documentary`, `Exploration`, `Scientific Inspection`).
- Default `Exploration` keeps the Subterranean Chamber dark (only ambient + directional light).
- `Scientific Inspection` enables a local point light for the `subterranean` layer in `GreatPyramidLighting.tsx`, making the chamber visibly brighter.
- To test the toggle:
  1. Hide all layers except **Subterranean**.
  2. Place the camera outside the box (e.g. `?cam=6,-26,-1,0,-28.02,-4.205194157548073`).
  3. Open **Lighting** → select **Scientific Inspection**.
  4. The chamber should brighten compared to the default `Exploration` view.

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

## Testing camera modes and Osiris overlays

- The `orbit` / `walk` / `fly` / `teleport` buttons only appear in the right side panel when the top mode is **Research** or when the current camera mode is not `orbit`.
- Clicking a mode button updates the active class and `aria-pressed`; `teleport` shows the hint `Double-click to teleport`, and `walk`/`fly` show `Click to lock pointer · WASD to move`.
- In `walk`/`fly` mode, `W`/`A`/`S`/`D` (and `Space` for fly) move the camera. If the side panel has an `<input>` focused, key presses may also type into that input while still moving the camera; defocus any input before long key-press tests.
- Walk/fly use acceleration/deceleration helpers from `src/scene/cameraConstraints.ts`; a short key hold followed by release should show a brief coast before stopping.
- `teleport` reverts the camera mode back to `orbit` after a double-click and sets the target to the raycast point.
- In the **Osiris** scene, switch to the **Simulation** tab and check `Hydraulic Functionality Hypothesis (Osiris Shaft)` (`THEORY-OSIRIS-001`). The `SimulationPanel` should render the **Hydraulic Simulation** controls (Water Level, Inflow Rate, Outflow Rate, Channel Width), and blue overlays should appear:
  - Chamber I water plane (`Chamber I Water` overlay)
  - Northern conduit flow (`Northern Conduit Flow Overlay`)
- Unchecking the hypothesis removes the overlays (regression check).
- Clicking `Basalt Sarcophagus` or `Northern Conduit` in the scene hierarchy (or hovering/clicking in the viewport) opens the **Evidence** panel with the corresponding evidence item.

## Explore / Research side-panel tools (PR #17)

- Select an object from the **left Explorer hierarchy** to populate the new right-panel tools. Viewport clicks set `selectedObjectId` only when an active hypothesis is present, so the hierarchy is the most reliable way to test Explore/Research tools in a neutral state.
- In **Explore** mode the side panel shows `Inspect`, `Switch theory`, and `Reveal layer`.
  - `Inspect` is disabled until an object is selected.
  - `Switch theory` rotates `activeHypothesisIds` through the hypotheses for the current monument.
  - `Reveal layer` is only enabled when the selected object's layer is currently hidden; clicking it removes that layer from `hiddenLayers`.
- In **Research** mode the side panel shows a **Selected object** metadata card and **Scene stats**.
  - `Isolate layer` hides every layer except the selected object's layer.
  - `Reset layers` clears `hiddenLayers`.
  - `Screenshot` triggers a PNG download (`giza-screenshot-<timestamp>.png` in `~/Downloads`). Verify by checking the file appears and starts with the PNG magic bytes (`8950 4e47`).
- A **Confidence by theory** card appears in Research only when the selected object's `objectId` is in an active hypothesis's `affectedStructures`. If the card is missing, check whether the object is listed in the hypothesis plugin.

## Screenshot export verification

- Click the `Screenshot` button in either Great Pyramid or Osiris scene.
- Wait ~1 second, then run in a shell:
  ```bash
  ls -la ~/Downloads/giza-screenshot-*.png
  head -c 4 ~/Downloads/giza-screenshot-<timestamp>.png | xxd
  ```
- The file should exist and start with `8950 4e47` (`.PNG`).

## Osiris hydraulic overlay framing

- After checking `Hydraulic Functionality Hypothesis (Osiris Shaft)` (`THEORY-OSIRIS-001`) in the **Simulation** tab, the **Hydraulic Simulation** controls appear.
- The blue Chamber I water plane and Northern Conduit flow overlay are present in the render graph but may be out of the default camera frame.
- To see them, orbit/zoom toward Chamber I or use the left **Navigation** → `Level 3 — Chamber I` and rotate the view.
- The water overlay remains visible at the default `Water Level` (0.50 m). The simulation slider value is controlled by React state; dragging the slider handle is more reliable than setting `.value` from the console.

## Environment permission workarounds

On some test boxes `node_modules/.vite` and `dist` are owned by root, causing `EACCES` errors for Vite's optimizer cache and the build output. If `npm run dev` fails with a permission error or if `npm run build` cannot write to `dist`:
- Use `cacheDir: '/tmp/vite-cache'` in `vite.config.ts` for the dev server and revert the line before committing.
- Build to a writable directory: `npx vite build --outDir /tmp/giza-dist`.
- Vitest may also fail to write `node_modules/.vite/vitest/results.json`; this is an environment artifact and does not indicate failing tests.

## Valid persisted state values

`localStorage.setItem('giza-session', JSON.stringify({ state: { ... }, version: 2 }))` should use known keys. In particular:
- `activeMonument` must be `'great-pyramid'` or `'osiris'`. Persisting an unknown value now renders an empty layer list (a guard in `LayerPanel` prevents a crash), but the correct monument layers will not appear.

## Testing virtual touch controls

- The `VirtualControls` overlay only renders when `cameraMode` is `walk` or `fly`.
- `fly` adds `Fly up` / `Fly down` buttons at the bottom-right.
- `orbit` and `teleport` hide the overlay.
- On a non-touch device the joystick and buttons may not drive camera movement because `touchControls.ts` attaches only to `pointerType === 'touch'`. The buttons and joystick still render and the Vitest `VirtualControls`/`touchControls` suites verify the logic.
- To force a mobile viewport, use Chrome DevTools Device Toolbar or resize the window to a narrow width; the overlay visibility is governed by `cameraMode`, not viewport size.

## Testing runtime per-object GLB loading

- `GLTFAssetMesh` (`src/scene/GLTFAssetMesh.tsx`) loads per-object GLBs at runtime via `three/examples/jsm/loaders/GLTFLoader.js` and returns an R3F `<primitive>`.
- Verify GLB files are actually fetched from `assets/export/glB/objects/` with `performance.getEntriesByType('resource')` and filtering for `.glb`.
- To check that GLBs render in the correct world positions, hide occluding `Geometry` / `Geology` / `Modern` visibility layers and focus a known object from the **Evidence** tab or left Explorer hierarchy.
- **Pointer-event verification is critical:** the `<primitive>` may not propagate `onClick`/`onPointerOver` to the GLB meshes in all R3F versions. A positive hover signal is:
  1. Cursor changes to `pointer`.
  2. `viewport-overlay` at the bottom-left shows the object name.
  3. Clicking changes the side panel to the matching evidence or theory record.
- If hover/click works for `BlockoutMesh` but not for `GLTFAssetMesh`, the issue is in how events are wired to the GLB scene, not in `useSceneObjectClick`.
- For deep inspection, hide surface/terrain layers and focus the object (e.g. `Basalt Sarcophagus` with `cameraTarget: {x:-1.4, y:-28.425, z:-6.5}` or `Original Entrance` with `{x:7.29, y:16.97, z:-101.85}`).

## Vitest cache permission workaround

- If Vitest fails after all tests pass with `EACCES: permission denied, open '/.../node_modules/.vite/vitest/results.json'`, re-run with `--cache=false`:
  ```bash
  npx vitest run --cache=false src/loaders/lodSelection.test.ts src/loaders/assetManifest.test.ts src/loaders/gltfLoader.test.ts src/materials/assetDefinitions.test.ts src/loaders/assetPipelineE2E.test.ts
  ```

## Testing Bookmarks, Search, and Measurement

- The **Bookmarks** section is in the left panel under `Scene Hierarchy`. Enter a name and optional notes, then click `Save current view`.
- Verify restoration by changing camera mode, hiding a layer, activating a hypothesis, then clicking the saved bookmark. `localStorage` key `giza-session` persists `bookmarks`, `cameraMode`, `hiddenLayers`, and `activeHypothesisIds`.
- The **Search** secondary tab accepts a query and type filters; clicking a result routes to `evidence`, `scene`, or `theory` and updates `selectedEvidenceId`/`selectedObjectId`/`activeHypothesisIds`.
- **Measurement** is in the right `Scene` tab. Toggle `Measure`, then click two points in the viewport. A numeric distance appears once two hits are recorded. The `Annotations` visibility layer must be on for the red `MeasurementMarker` spheres to render.
- In Playwright, the R3F `<canvas>` can intercept normal `locator.click()` actions on UI panels. Use `locator.dispatchEvent('click')` for UI controls and `page.mouse.click()` / `page.mouse.wheel()` for canvas interaction.
- The `pyramid-exterior` `BlockoutMesh` is only rendered within the scene streamer's `loadDistance`. If measurement clicks do not register, orbit/zoom toward the target or switch to `orbit` and un-hide the `Exterior` layer so the mesh is in the camera frustum.
- The `Measure` toggle reveals a type selector with `Distance`, `Height`, `Angle`, `Area`, and `Volume`. Each mode needs the corresponding number of canvas hits before the numeric result appears.
- The **Share** button next to a bookmark copies `bookmarkToURL(bookmark, baseUrl)` to `navigator.clipboard`. In Playwright, grant both `clipboard-read` and `clipboard-write` permissions on `http://localhost:5173` and read `navigator.clipboard.readText()` after the click.
- When a new hypothesis plugin is added to `pluginDiscovery.ts`, also verify it is registered in `src/theories/engineInstance.ts` (or wherever the runtime engine is initialized). `HypothesisSelector` reads from `hypothesisEngine.getPluginIds()`, not from the discovery module alone.
- The `Navigation` list in the left panel matches `location.name` against scene-node names; if location names are prefixed (e.g. `Great Pyramid — ...`) and node names are not, the click may not update the camera target.

## Testing Great Pyramid hypothesis overlays

- `GreatPyramidScene.tsx` separates `activeHighlightRules` (`overlay === 'highlight'`) from `activeOverlayRules` (all other supported types). `annotation` overlays must not be excluded from `activeOverlayRules` or they will be silently dropped.
- To activate a hypothesis checkbox from Playwright, use `locator.evaluate((el) => (el as HTMLInputElement).click())` on the checkbox input. The R3F canvas can intercept normal `locator.click()` and `dispatchEvent('change')` does not always update React controlled inputs.
- After activating `THEORY-GP-004` (Internal Ramp Construction Hypothesis), select an affected object from the left Explorer hierarchy (e.g. `Original Entrance` or `Descending Passage (sloped)`) and zoom in with `page.mouse.wheel` so the annotation overlay geometry is visible. Open the **Theory** tab to confirm the predictions list for the active hypothesis.

## Verifying the 3D North compass and GPS-based monument origins (PR #30)

- The red compass arrow and `N` label are rendered by `src/scene/Compass.tsx` at the active monument's origin. The arrow geometry points along `-Z` (north).
- To get a clear view, rotate the camera around the origin with `OrbitControls` and zoom in until the red shaft, cone, and `N` label are legible.
- The Great Pyramid origin is the world origin `{x:0, y:0, z:0}` (WGS-84 29.9792368 N, 31.1342008 E).
- The Osiris Shaft origin is computed from WGS-84 29.9752738 N, 31.1345962 E using `latLonToPlateauMeters` in `src/scene/coordinateSystem.ts`. Expected world origin: `{x:38.084..., y:0, z:440.665...}`.
- Default Osiris camera target (persisted in `giza-session`) is `{x:36.684..., y:-15, z:433.665...}`, i.e. the monument origin plus the local target offset `{-1.4, -15, -7}`.
- If `browser_console` is attached to the wrong Chrome tab, run `window.location.href = 'http://localhost:5173';` in the console to navigate the attached page to GIZA, or use `xdotool` to focus the correct window.
- `cameraPosition` is **not** persisted in `giza-session` (only `cameraTarget` is), so query it from the Three.js scene/camera or compute it from `DEFAULT_CAMERA_POSITION` plus the monument origin.
- `THEORY-GP-003` (Hydraulic-Acoustic System Hypothesis) is activated in the **Simulation** side-panel tab under `Hypotheses`. The `Theory overlays` visibility layer in the **Scene** tab must be on for the amber (`#f59e0b`, opacity 0.25) conduit to render.
- In the Great Pyramid scene the conduit should extend from the south wall of the Subterranean Chamber toward the Osiris Shaft.
- In the Osiris Shaft scene it should leave the far (NW) end of the `Northern Conduit` and head toward the Great Pyramid.
- Toggling `Theory overlays` off removes the conduit; toggling it back on restores it. Deactivating `THEORY-GP-003` also removes it.
- After the coordinate change, object selection and the Evidence panel still work: clicking `Basalt Sarcophagus` in Osiris or `Pyramid Exterior (core masonry)` in the Great Pyramid opens the matching evidence record.

## Screenshot mode feature end-to-end verification

- The **Screenshot** panel only renders in `mode === 'Research'`. Switch the top mode selector to **Research**; the panel appears in the right side panel under the Research section.
- Screenshot options are not persisted, so they reset to defaults on reload:
  - `hideUi: true`, `transparentBg: false`, `highRes: false`, `orthographic: false`, `scaleBar: true`, `northArrow: true`, `citationWatermark: true`, `format: 'png'`.
- Toggle options such as **Format** (PNG / WebP) and **Transparent background**; verify the checkbox / `<select>` state updates in the UI.
- Click **Capture** to trigger `requestScreenshot()`. `ScreenshotTaker.tsx` will:
  1. Add `screenshot-mode` to `document.body.classList`.
  2. Call `composeScreenshot(gl, scene, camera, screenshotOptions, target, citation)`.
  3. Remove `screenshot-mode` after the promise settles.
  4. Create an `<a download="giza-screenshot-<timestamp>.<ext>">` with the generated data URL and call `click()`.
- Verify the class toggle with a `MutationObserver` on `document.body` (or read a persisted logger) and confirm a download anchor with the expected filename is appended.
- The file should land in `~/Downloads` (or the configured Chrome download path) with a non-zero size and the correct extension.
- With `transparentBg: true`, the output is a PNG/WebP with an alpha channel; the area outside the rendered geometry should be transparent.
- In the **Osiris** scene, repeat a capture to confirm `preserveDrawingBuffer: true` on the `<Canvas>` lets `gl.domElement.toDataURL()` read pixels after a monument switch.
- Known environment quirks:
  - Chrome may show a `Download multiple files` permission prompt after the first screenshot. Allow the site, use a fresh incognito profile, or route the data URL to a temporary local receiver during automated runs.
  - `body.screenshot-mode` hides `.app-header`, `.left-panel`, `.side-panel`, `.bottom-toolbar`, `.virtual-controls`, `.viewport-overlay`, and `.compass-label`, so the Drei `<Html>` `N` label is also hidden during capture.
