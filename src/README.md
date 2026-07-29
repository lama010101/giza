# `src/` Layout

This layout matches `GIZA - 04 Technical Architecture.txt` §2.

- `app/` — top-level application shell and providers.
- `components/` — reusable React components.
- `ui/` — presentational UI components (panels, buttons, toolbars).
- `scene/` — React Three Fiber scene composition and environment modules.
- `systems/` — gameplay/adventure systems (camera, input, audio, etc.).
- `shaders/` — GLSL shader files.
- `materials/` — PBR material definitions and material library.
- `cameras/` — camera rigs and mode implementations.
- `physics/` — physics integration, collision, and simulation wrappers.
- `audio/` — spatial audio and ambient sound.
- `evidence/` — evidence database, confidence engine, and provenance logic.
- `theories/` — hypothesis framework and plugin integration.
- `loaders/` — asset and data loaders (glTF, evidence, sources).
- `hooks/` — shared custom React hooks.
- `utils/` — domain-agnostic utilities.
- `store/` — Zustand stores.
- `schemas/` — Zod schemas and derived TypeScript types.
