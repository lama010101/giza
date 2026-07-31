# Changelog

All notable changes to GIZA are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added — Tier 7 (Polish & Release Readiness)

- **M12-T01 Accessibility**: keyboard navigation, screen reader, high
  contrast palette, 5 colorblind modes (protanopia, deuteranopia,
  tritanopia, achromatopsia, none), 16 keyboard shortcuts, ARIA live
  regions, focus management, roving tabindex.
- **M12-T02 Localization**: English + French translations (65+ keys),
  parameter interpolation, persisted locale store, `useTranslation` hook.
- **M12-T03 Offline support**: scene packages for Osiris Shaft and Great
  Pyramid, download/remove with progress tracking, online/offline
  detection, cache stats.
- **M12-T04 Security model**: 4 roles (visitor, researcher, reviewer,
  admin), 12 permission types, hierarchical permissions, login/logout,
  default demo user.
- **M12-T05 Performance optimization**: 4 performance tiers, per-tier
  budgets, adaptive LOD, frame budget monitor, optimization
  recommendations.
- **M12-T06 Mobile optimization**: mobile config (reduced textures,
  shadows, shaders), touch gesture detection (6 types), power-efficient
  rendering, responsive UI scaling.
- **M12-T07 Production build + CDN**: build configs for
  development/staging/production, Vite options with vendor chunking, CDN
  config with security headers, deployment steps, env templates.
- **M12-T08 Full E2E test suite**: 32 tests covering all major features.

### Added — Tier 6 (Osiris Shaft Completeness)

- **M09-T02**: Bounding box + survey reference fields in scene graph.
- **M09-T19**: Confidence tagging on all geometry nodes.
- **M09-T17**: 5 chronology layers with confidence toggle.
- **M09-T16**: Fog system.
- **M09-T11**: Geological visualization modes.
- **M09-T12**: Environmental rendering.
- **M09-T21**: Evidence hotspots.
- **M09-T07**: Water rendering integration with Osiris Shaft.
- **M09-T22**: Full E2E Osiris Shaft traversal test.

### Added — Tier 5 (Hydraulic Simulation)

- **M09-T03**: Level 0 Surface nodes and PBR layer.
- **M10-T12**: Dedicated hydraulic solver.
- **M10-T13**: Hydraulic visualization.
- **M10-T14**: Hydraulic validation.
- **M10-T18**: Hydraulic integration with Osiris Shaft Level 3.
- **M10-T19**: Simulation integration tests.

### Added — Tier 4 (Rendering & Benchmark)

- Water rendering with custom shader.
- Material sample blocks for PBR validation.
- Performance baseline and regression tests.
- Layered lighting, shadow strategy.
- glTF extras extraction.

### Added — Tier 3 (UI & Evidence)

- Raycast interaction, camera constraints, bottom toolbar.
- Measurement tool, bookmark system, unified search.
- Color token system, evidence overlay, hotspot scaffolding.
- Dataset manifest and 11-style citation engine.
- Interaction integration tests.

### Added — Tier 2 (Evidence & Content)

- Seed dataset expanded to 103 evidence records and 49 sources.
- M02 lifecycle, review workflow, dependency graph, audit log.
- Full lifecycle integration test.

### Added — Tier 1 (Schema Foundation)

- Complete M01 schema set: evidence, source, location, object,
  hypothesis, simulation, annotation, media, user, bookmark,
  measurement, lifecycle, dependency, conflict, confidence, person.
- `validateEntity()` utility with discriminated union result type.

### Added — Evidence Backend (M02-T07/T12/T13, M03-T06)

- Evidence version diff/compare with breaking change detection.
- Import/export workflows (JSON, CSV, BibTeX, RIS, GraphML,
  CITATION.cff).
- Duplicate source detection (DOI, ISBN, title similarity,
  author-year).

### Infrastructure

- `.env` and `.env.example` files (M00-T08).
- CHANGELOG.md (M-1-T08).

## [0.1.0] — 2026-07-31

### Added

- Vite + React 18 + TypeScript strict project bootstrap.
- React Three Fiber / Drei rendering pipeline.
- Zustand state management with devtools.
- Zod schema validation for all entities.
- ESLint + Prettier + Husky pre-commit hooks.
- Vitest + React Testing Library test infrastructure.
- GitHub Actions CI (lint, typecheck, test, build).
- Conventional Commits enforcement via commitlint.
- Governance smoke test for specification protection.
- Osiris Shaft and Great Pyramid blockout geometry.
- Benchmark scene with material samples.
- 1083 passing tests.
