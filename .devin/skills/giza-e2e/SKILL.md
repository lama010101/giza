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
- The `GrandGalleryMesh` uses a custom corbelled segment group; pointer events on the group may behave differently from `BlockoutMesh`.

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
