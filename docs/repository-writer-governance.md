# Repository Writer Governance

## Status

This document records the current repository-writer boundary discovered while preparing GitHub-native protection for `main`.

`main` is intentionally not protected yet because several deterministic production workflows currently write directly to it. Native protection must not be enabled until those writers are migrated or safely represented in the ruleset.

## Writer classes

### Direct-main deterministic writers

The following workflows currently hold `contents: write` and push the checked-out/default ref or `HEAD:main` directly to `main`:

- `.github/workflows/approved-central-blog.yml`
- `.github/workflows/blog-bijwerken.yml`
- `.github/workflows/menu-balk-fix.yml`
- `.github/workflows/paginacontrole.yml`
- `.github/workflows/regelgeving-bijwerken.yml`
- `.github/workflows/seo-controle.yml`
- `.github/workflows/weekblog.yml`

Every direct-main writer must use the same non-cancelling concurrency group:

```yaml
concurrency:
  group: repo-schrijven
  cancel-in-progress: false
```

The automated contract is `tests/repo-writer-governance.test.mjs`. Adding another direct-main writer without explicitly updating this governance inventory must fail CI.

### PR-only branch writer

`.github/workflows/klanten-uit-broncode.yml` has `contents: write`, but it pushes a named feature branch and opens a pull request. It is intentionally not classified as a direct-main writer.

## Target state

The desired end-state is GitHub-native protected `main` with no unrestricted direct pushes. Deterministic content/update workflows should prepare candidate branches and PRs, while a governed promotion path merges only verified changes. Exact-SHA application promotion and last-known-good rollback remain separate governed authorities.

## Hard boundary

Do not enable or change branch protection/rulesets until all direct-main writers are inventoried, migrated/tested, and the resulting PR/promotion/rollback paths are proven green. A generic `require pull request` rule applied before migration can break legitimate production publishing.

## Migration gates

1. Keep writer inventory complete and CI-enforced.
2. Serialize current direct-main writers through `repo-schrijven` until migration is complete.
3. Introduce candidate-branch/PR mode behind reversible workflow changes.
4. Prove output parity, idempotency, concurrency, negative blocking, and rollback.
5. Verify Shared Agent Memory, Business OS, SEO/content and production-promotion gates.
6. Only then apply GitHub-native protection and remove legacy direct-main write paths.

Issue #175 is the governing migration record.
