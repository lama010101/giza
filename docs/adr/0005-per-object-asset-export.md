# ADR-0005: Per-Object Asset Export with Embedded DoSD Metadata

**Status:** Accepted
**Date:** 2026-08-06
**Deciders:** AI agent (asset pipeline)

## Context

The GIZA asset pipeline originally generated only aggregate LOD scenes (e.g., `OS_LOD0.glb`, `GP_LOD0.glb`) and a small set of reusable material samples. The `AssetDefinition` registry described each logical object, but there was no published per-object production file. This made runtime loading, inspection, and hypothesis-specific object replacement unnecessarily coarse: the only way to show or hide a single object was to filter an aggregate scene.

The Definition of Scientific Done requires every produced/visible asset to link to `EV-` and `SRC-` records and carry a confidence value. Aggregate scenes can contain metadata per mesh, but a per-object file is the cleanest unit of traceability and the easiest artifact for third-party validation or external tooling.

## Decision

Generate a dedicated `.glb` file for every `AssetDefinition` in the `objects/` export directory. Each file is produced deterministically from the surveyed blockout nodes that match the asset and embeds a `giza` object in glTF `extras` containing:

- `assetId`
- `monument`
- `location`
- `objectClass`
- `materialId`
- `evidenceIds`
- `sourceIds`
- `confidence`
- `lods`
- `generator` and `generatedAt`

The `AssetDefinition` registry gains a `filePath` field pointing to the generated GLB. The `asset-manifest.json` `objects` category lists every published per-object file. A manual GLB JSON parser validates that `filePath` exists and that embedded metadata matches the definition, so the DoSD guarantee is tested in CI.

## Consequences

- Runtime code can load a single object by `assetId` without parsing an aggregate scene.
- Every object-level asset is independently verifiable (file, metadata, evidence, source).
- The export directory grows with one GLB per asset; the generated files are small and deterministic.
- Asset generation is reproducible via `npm run generate-assets` and verifiable via `npm run verify-assets`.

## Alternatives Considered

- **Keep metadata only in aggregate scenes:** rejected because aggregate metadata is harder to validate and reuse.
- **Store metadata in a sidecar JSON file per GLB:** rejected because glTF `extras` keeps metadata with the asset and survives unmodified file copies.
- **Generate a single monolithic GLB with all objects and per-node extras:** rejected because it couples unrelated objects and complicates lazy loading and hypothesis-specific replacement.
