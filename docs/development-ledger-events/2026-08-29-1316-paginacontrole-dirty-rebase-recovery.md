# Development Ledger Event — 2026-08-29 — paginacontrole dirty rebase recovery

## ERROR — generated tracked output blocks guarded rebase
- **Fingerprint:** `paginacontrole|git-rebase|dirty-generated-seo-report`
- **Signal:** GitHub Actions `Pagina- en SEO-controle` run `33248526384` on production SHA `033c6f83c296d23816fedfd0d1bf36f8f4e6f12d` failed only at step `seo-status.json terugzetten als hij is veranderd`; page control and SEO control themselves both succeeded.
- **Root cause:** `.github/scripts/seocontrole.py` rewrites tracked `seo-rapport.md` and `seo-status.json`. The writeback step stages and commits only `seo-status.json`, leaving `seo-rapport.md` modified. The guarded `git pull --rebase origin main` introduced by the earlier concurrent-push recovery therefore runs with unstaged tracked changes and exits 128.
- **Executable reproduction:** isolated local Git simulation produced `cannot pull with rebase: You have unstaged changes` before cleanup and succeeded after restoring the generated report.
- **Known failed approach:** retrying the same rebase without first cleaning/stashing the generated tracked output.

## RECOVERY — restore non-published generated report before rebase
- **Fix:** add `git restore --worktree seo-rapport.md` immediately before the `git pull --rebase origin main` in the `seo-status.json` writeback path.
- **Regression:** `tests/paginacontrole-concurrent-push.test.mjs` now protects both the existing rebase-before-push invariant and the clean-worktree invariant.
- **TDD red:** Shared Agent Memory Tests run `33249617172` failed on test-only SHA `a4963bacf5faba0d7f55a972234276ffcbbabf4c`.
- **TDD green:** run `33249660369` succeeded on exact candidate SHA `2c08ccb43f602b665de9c80c1b4c4bf1427b8427`.
- **Promotion:** PR #153 merged exact head `2c08ccb43f602b665de9c80c1b4c4bf1427b8427` to production merge SHA `92c0526a06e78c62db3fd7286b89f4d2734ed525`.

## PRODUCTION_PROMOTION — CI reliability recovery
- GitHub production moved to verified signed merge SHA `92c0526a06e78c62db3fd7286b89f4d2734ed525`.
- Public HTTPS homepage smoke succeeded after promotion.
- Netlify retained last-known-good web deploy `6a92b81fc4131c00089ad555`, state `ready`, `commit_ref=033c6f83c296d23816fedfd0d1bf36f8f4e6f12d`, because the promoted diff is CI/test-only and does not alter the served site artifact. Protected web invariants remain 68 redirects, 16 headers, 3 functions, 1 edge function, and 0 secret-scan matches.
- No paid resources, credentials, permissions, or security controls were changed.

## Reusable lesson
A rebase-before-push guard is insufficient when a preceding generator mutates tracked files that are deliberately excluded from the commit. Before rebase, every automated writeback path must either commit the intended generated files or explicitly restore/stash non-published tracked output. The preferred minimum reversible fix here is explicit restore of `seo-rapport.md`.
