# ADR-0005: Camera Movement and Input Architecture

**Status:** Accepted  
**Date:** 2026-08-08  
**Deciders:** AI Agent (frontend/camera track)  

## Context

The GIZA application supports multiple camera modes (`orbit`, `walk`, `fly`, `teleport`) and multiple interaction modalities (keyboard/mouse, touch, gamepad). The original `CameraRig.tsx` concentrated movement logic, collision detection, slope rejection, and input handling in a single component, making it hard to test and extend.

## Decision

1. Extract pure camera movement and collision logic into `src/scene/cameraRigLogic.ts`.  
   This module owns: movement-constraint selection, AABB obstacle generation from scene graphs, sphere-vs-AABB collision resolution, acceleration/deceleration helpers, slope rejection, and world-space movement direction.

2. Keep `src/scene/CameraRig.tsx` as the integration component that wires the store, keyboard state, R3F camera, and per-frame updates to the pure logic.

3. Add dedicated input components:  
   - `src/scene/TouchControls.tsx` for touch gestures (pinch FOV/zoom, two-finger pan, single-finger orbit/walk).  
   - `src/scene/GamepadControls.tsx` for gamepad polling (camera movement and mode switching).  

4. Store adjustable camera settings (`cameraFov`, `cameraNear`) and cross-section/layer-isolation state in `useAppStore` so UI controls in `src/ui/` can drive them without touching scene files.

## Consequences

- Camera physics and collision are unit-testable without a WebGL context.
- New input devices can be added by introducing a small component that updates the same movement state.
- Scene geometry and evidence data remain untouched; obstacles are derived from existing blockout/scene graph structures.
- Camera settings are persisted/restored through the existing Zustand persistence layer.

## Alternatives Considered

- Keep all logic inside `CameraRig.tsx`: rejected because it mixed physics, input, and rendering and was not unit-testable.
- Use a physics engine for camera collision: rejected as overkill; AABB sphere sliding is sufficient for the constrained walk/fly spaces in GIZA and keeps dependencies minimal.
