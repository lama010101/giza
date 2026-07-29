# AI Agent Guide

This is the quick-start for AI coding agents working on GIZA.

## Stack

- Vite + React 18 + TypeScript strict
- React Three Fiber / Drei / Rapier
- Zustand for state, Zod for schemas
- Vitest + Playwright for testing
- ESLint + Prettier, Conventional Commits, Husky

## Must-Read Spec Order

1. `GIZA - 00 Master Specification.md`
2. `GIZA - 01 Vision & Scientific Foundation.md`
3. `GIZA - 11 Hypothesis Framework.md`
4. `GIZA - 05 Data Architecture.txt`
5. `GIZA - 08 Evidence Database Specification.md`
6. `GIZA - 04 Technical Architecture.txt`
7. `GIZA - 15 Implementation Roadmap.md`
8. `GIZA - 99 Development Playbook.md`

For the current phase, also read `docs/mvp-roadmap.md` and `docs/adr/0003-lean-mvp-split.md`.

## Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run typecheck    # TypeScript strict check
npm run lint         # ESLint
npm run lint:fix     # ESLint fix
npm run format       # Prettier write
npm run format:check # Prettier check
npm run test         # unit + integration tests
npm run test:integration   # Playwright e2e
npm run governance   # spec-modification smoke test
npm run docs         # docs generation
```

## Rules

- **Never modify numbered specs** (`docs/specs/GIZA - 00`–`GIZA - 11`, `GIZA - 16`, `GIZA - 17`) unless explicitly instructed.
- Every PR must pass `typecheck`, `lint`, `test`, and `governance`.
- Every visible/traceable object needs evidence linkage per DoSD.
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- Open short-lived branches: `feat/`, `fix/`, `docs/`, `refactor/`.
- Add ADRs for new architectural decisions and update `docs/adr/README.md`.
