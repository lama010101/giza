# Coding Standards

## Language & Tooling

- **TypeScript** with `strict` enabled. No `any` except in explicit `unknown` guards.
- **ESLint** with `@typescript-eslint` and `typescript-eslint` strict type-aware rules.
- **Prettier** for formatting.
- **Vitest** for unit/integration tests.
- **Playwright** for end-to-end tests.

## Code Style

- Prefer explicit types on public APIs.
- Prefer `interface` over `type` for object shapes.
- Use functional React components and hooks.
- Never mutate props or state directly.
- Keep components small and focused.
- Co-locate tests next to the source file (`*.test.ts`, `*.test.tsx`).

## Imports

- Use absolute path aliases (`@/app/...`, `@/scene/...`, `@/utils/...`).
- Group imports: React, libraries, internal, types, styles.

## Scientific Code

- Confidence and evidence logic lives in `src/evidence/`.
- Simulation code never modifies archaeological geometry.
- All visible objects carry `extras.giza` metadata with `evidenceIds`, `sourceIds`, and `confidence`.

## Prohibited

- `console.log` in production code (use the logging utility).
- Implicit `any`.
- `TODO`/`FIXME` left in `master`.
- Hardcoded values that should be configurable.
