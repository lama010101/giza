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

## M12-T01 accessibility keyboard shortcuts and persisted settings

Default keyboard navigation is controlled by the `giza-accessibility` localStorage key (Zustand persist, `keyboardNavEnabled` defaults to `true`).

### Keyboard shortcuts wired in `AppLayout`

See `src/app/AppLayout.tsx` and `src/accessibility/keyboardNavigation.ts`:

- `1` → Scene tab
- `2` → Evidence tab
- `3` → Simulation tab
- `e` → toggle side (evidence) panel
- `l` → toggle lighting popover
- `m` → toggle measurement mode
- `h` → Theory/Hypothesis tab
- `Escape` → close panels

### How to verify

1. Open `http://localhost:5173` in a fresh incognito Chrome window to avoid stale `giza-session` state.
2. The side panel should default to the **Scene** tab (`Measurement` and `Layers` sections).
3. Press each shortcut and verify the corresponding tab/panel content appears or disappears.
4. For `3` to render the `Hydraulic Simulation` controls instead of the hypothesis activation prompt, pre-seed `giza-session` with the hydraulic hypothesis active:

```js
localStorage.setItem(
  'giza-session',
  JSON.stringify({
    state: {
      mode: 'Explore',
      activeMonument: 'great-pyramid',
      activeHypothesisIds: ['THEORY-OSIRIS-001'],
      evidencePanelOpen: true,
      sidePanelTab: 'scene',
      cameraMode: 'orbit',
      cameraTarget: { x: 0, y: 70, z: 0 },
      hiddenLayers: [],
      lod: 'LOD0'
    },
    version: 2
  })
);
location.reload();
```

### Testing persisted accessibility settings

The accessibility store (`src/accessibility/accessibility.ts`) persists to `giza-accessibility` with version `1` and the shape `{ state: { highContrast, colorblindType, reducedMotion, fontSizeMultiplier, screenReaderEnabled, keyboardNavEnabled, focusIndicator }, version: 1 }`. To verify `AccessibilityProvider` syncs to the DOM:

```js
localStorage.setItem(
  'giza-accessibility',
  JSON.stringify({
    state: {
      highContrast: true,
      colorblindType: 'protanopia',
      reducedMotion: false,
      fontSizeMultiplier: 1,
      screenReaderEnabled: true,
      keyboardNavEnabled: true,
      focusIndicator: 'default'
    },
    version: 1
  })
);
location.reload();
```

After reload:

- `document.body.classList.contains('a11y-high-contrast')` should be `true`.
- `document.documentElement.style.getPropertyValue('--a11y-filter')` should equal `hue-rotate(0deg) saturate(0.6) brightness(1.1) contrast(1.4)` when both high-contrast and protanopia are active.
- `document.getElementById('root').style.filter` should match the same filter string.
- `AccessibilityProvider` (`src/accessibility/AccessibilityProvider.tsx`) also sets `html` font-size via `--a11y-font-size-multiplier` and focus indicator classes (`a11y-focus-default`, `a11y-focus-enhanced`, `a11y-focus-minimal`) via `src/index.css`.

### Useful diagnostics

- If a key shortcut has no effect, check that focus is not inside an `<input>` (`keyboardNavigation.ts` deliberately ignores typing contexts).
- If `browser_console`/CDP is unavailable, the same `localStorage` values can be seeded by running the snippets above from a `javascript:` URL or a temporary static page served from the same origin.
