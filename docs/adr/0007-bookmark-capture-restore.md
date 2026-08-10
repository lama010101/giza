# ADR-0007: Bookmark Capture and Restore in App Store

**Status:** Accepted
**Date:** 2026-08-08
**Deciders:** Devin AI agent

## Context

M08-T07 requires bookmarks that capture a researcher's current view: camera position/target/mode, visible and hidden scene layers, active hypotheses, selected object/evidence, and notes. The existing `bookmark.ts` schema already described a bookmark, but the app store only stored a list of bookmarked object IDs (`bookmarkedObjectIds`).

We needed a decision on where to keep full bookmark state, how to capture the camera, and how to restore a bookmark back into the running 3D view.

## Decision

1. Extend the `Bookmark` schema with an optional `hiddenVisibilityLayers` field so a bookmark can restore both scene layers and visibility layers.
2. Add a `bookmarks` array and `cameraPosition` to the app store and persist `bookmarks` via Zustand's `persist` middleware.
3. Expose `addBookmark(name, notes)`, `deleteBookmark(id)`, and `restoreBookmark(id)` actions on the store.
4. Use a dedicated `CameraPositionSync` component inside `CameraRig` to read the Three.js camera each frame and update `cameraPosition` in the store using an epsilon threshold.
5. When restoring, update `cameraPosition`, `cameraTarget`, `cameraMode`, `hiddenLayers`, `hiddenVisibilityLayers`, `activeHypothesisIds`, `selectedObjectId`, and `selectedEvidenceId`. `CameraRig` uses `cameraPosition` to position the camera.
6. Render a `BookmarksSection` in the left panel with inputs for name/notes, a save button, a list of saved bookmarks, and restore/delete buttons.

## Consequences

- Bookmarks become a first-class persisted state; users can resume a view across sessions.
- The store is the single source of truth for both capture and restore, keeping UI and 3D controls in sync.
- `CameraPositionSync` runs every frame but only updates store state when the camera moves more than `0.001` units, minimizing re-renders.
- `cameraPosition` is initialized to a sensible orbit position and is restored from bookmarks, so the camera jumps to the bookmarked view immediately.

## Alternatives Considered

- Keep bookmarks as object IDs only: too limited for M08-T07 and does not restore camera or layers.
- Capture the camera directly inside the left panel with a ref: would require threading Three.js context out of `<Canvas>`, complicating architecture.
- Restore bookmarks by dispatching a one-time action from the UI: would not move the camera because the camera is owned by R3F, so the store `cameraPosition` + `CameraPositionSync` approach is cleaner.
