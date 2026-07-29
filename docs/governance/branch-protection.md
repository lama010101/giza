# Branch Protection & Release Process

## Branches

- `master` — the main integration branch. Always deployable.
- `feat/*` — short-lived feature branches.
- `fix/*` — bug fixes.
- `docs/*` — documentation and ADRs.
- `refactor/*` — non-functional code changes.

## Protection Rules for `master`

- Require linear history (no merge commits).
- Require at least one review before merging.
- Require the CI check (`ci.yml`) to pass.
- Require the governance smoke test to pass (no modifications to specs 00–11, 16, 17).
- Allow force-push only by administrators.

## Release Process

1. Releases are tagged `vX.Y.Z` per `GIZA - 15 Implementation Roadmap` §9.
2. The changelog is generated from Conventional Commits.
3. A GitHub Release is created from the tag.
4. Spec versions are tracked independently with `spec-vX.Y` tags.
