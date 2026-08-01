# Seed Dataset Manifest

> **Milestone:** M03.5 — Scientific Content Pipeline
> **Related:** `database/seeds/`, `docs/architecture/content-pipeline.md`
> **Status:** Active

## Purpose

The seed dataset is the bootstrap corpus for the GIZA evidence database. It is
loaded by `src/loaders/seed.ts` (`loadAndValidateSeed`) and validated against the
Zod schemas in `src/schemas/`. Every record in the seed is canonical, reviewed
content — the content pipeline never writes back into the seed files.

## Seed Files

| File                                          | Monument           | Evidence | Sources | Locations | Objects |
| --------------------------------------------- | ------------------ | -------- | ------- | --------- | ------- |
| `database/seeds/great-pyramid.ts`             | Great Pyramid (GP) | 30       | 7       | 9         | 26      |
| `database/seeds/osiris-shaft.ts`              | Osiris Shaft (OS)  | 19       | 2       | 6         | 17      |
| `database/seeds/giza-plateau-supplementary.ts`| Plateau (PL)       | 56       | 40      | 15        | 30      |
| **Total**                                     |                    | **105**  | **49**  | **30**    | **73**  |

## Evidence Record Counts

### By evidence class (`primaryClass`)

| Class | Meaning                 | Count |
| ----- | ----------------------- | ----- |
| E1    | Location / spatial      | 8     |
| E2    | Measured                | 66    |
| E3    | Observed / documented   | 24    |
| E4    | Inferred                | 5     |
| E5    | Reconstruction          | 0     |
| E6    | Chronology / dating     | 0     |
| E7    | Comparative             | 0     |
| E8    | Citation / reference    | 0     |

### By category

| Category       | Count |
| -------------- | ----- |
| Measurement    | 30    |
| Observation    | 11    |
| Survey         | 38    |
| Report         | 16    |
| Publication    | 3     |
| Reconstruction | 0     |
| Inference      | 0     |
| Photograph     | 0     |
| Scan           | 0     |

## Target: ≥ 100 Evidence Records

**Status: MET.** The seed dataset currently contains **105** evidence records,
exceeding the M03.5 target of ≥ 100.

| Target | Actual | Margin |
| ------ | ------ | ------ |
| 100    | 105    | +5     |

## Coverage Gaps

Although the count target is met, the *class* and *category* coverage is uneven.
The following gaps should be addressed in future seed expansion (M04+):

### Class gaps (zero records)

- **E5 — Reconstruction:** No reconstruction evidence yet. Required before
  hypothesis-driven reconstruction workflows can be exercised end-to-end.
- **E6 — Chronology / dating:** No radiocarbon or stratigraphic dating
  records. Chronology tagging (`chronologyTags`) is therefore empty across
  the corpus.
- **E7 — Comparative:** No cross-site comparative evidence.
- **E8 — Citation / reference:** No pure citation records. Citations
  currently live only as `sourceIds` on other records.

### Category gaps (zero records)

- **Reconstruction, Inference, Photograph, Scan:** all empty. The content
  pipeline's PDF/text extractor can propose `Reconstruction` and `Inference`
  candidates, but no seed data exists to validate against.

### Monument coverage

- **Khafre (KF), Menkaure (MK):** No seed files. Only GP, OS, and the
  plateau-wide supplementary file are present.
- **Osiris Shaft sources:** Only 2 sources back 19 evidence records —
  thin provenance. Adding a third independent source would strengthen
  consensus scoring.

### Confidence distribution

The corpus skews high-confidence (median ~90). Low-confidence / contested
records are under-represented, which limits testing of the conflict-resolution
and review-revise paths.

## Validation

All seed records are validated at load time by `loadAndValidateSeed()` against:

- `EvidenceSchema` (`src/schemas/evidence.ts`)
- `SourceSchema` (`src/schemas/source.ts`)
- `LocationSchema` (`src/schemas/location.ts`)
- `ObjectSchema` (`src/schemas/object.ts`)

A schema failure aborts startup — the seed is the trust root, so silent
acceptance of invalid records is never permitted.

## Expansion Plan

To close the gaps above, the next seed expansion should add, at minimum:

1. ≥ 10 E5 (Reconstruction) records for the Great Pyramid corbel/king-chamber
   reconstructions.
2. ≥ 10 E6 (Chronology) records covering radiocarbon and historical dating.
3. ≥ 5 E8 (Citation) records to exercise the citation engine on standalone
   references.
4. A Khafre (KF) seed file with ≥ 20 evidence records.
5. ≥ 5 low-confidence / contested records to exercise conflict resolution.

These are tracked as backlog tasks in the implementation roadmap (M04 seed
expansion milestone).
