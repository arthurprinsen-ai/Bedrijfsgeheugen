# Development Ledger Event — 2026-08-29 13:23 CEST — isolated seo-status publication

## ERROR — stale-worktree status publication race
- **Fingerprint:** `paginacontrole|seo-status|stale-worktree-rebase`
- **Signal:** initial recovery PR #151 fixed the observed concurrent-main push race, but Shared Agent Memory Tests run `33249583571` and Business OS Migration run `33249583589` went red because three regression tests still encoded the obsolete assumption that both automated publication paths must use the same full-worktree `git pull --rebase origin main` implementation.
- **Impact:** candidate promotion was blocked; repeating the earlier full-worktree rebase strategy would preserve a broader race surface for derived `seo-status.json` publication.
- **Root cause:** the derived-status writeback was coupled to the entire stale workflow worktree. PR #153 had already repaired one concrete dirty-worktree fingerprint by restoring `seo-rapport.md`, proving a separate hypothesis; the remaining architectural weakness was that any other tracked/generated worktree mutation could again interfere with a rebase that is unnecessary for publishing one derived file.
- **Known failed/obsolete approach:** require every automated push path to perform the same full-worktree rebase. That implementation contract was stronger than the actual invariant: preserve concurrent main work.
- **Owner:** QA/Regression + Telemetry/Self-Healing + Architect/Integrator.

## RECOVERY — isolate derived status publication
- **Fingerprint:** `paginacontrole|seo-status|isolated-publication`
- **Fix:** keep the source-repair path on `git pull --rebase origin main`; for `seo-status.json`, copy only the generated status to temporary storage, fetch current `main`, hard-reset the disposable CI worktree to `origin/main`, restore only `seo-status.json`, dedupe with `git diff --quiet`, commit only that file, and push `HEAD:main`.
- **Regression gate:** `tests/paginacontrole-concurrent-push.test.mjs`, `tests/paginacontrole-concurrency.test.mjs` and `tests/production-promotion-controller.test.mjs` now enforce path-appropriate synchronization and explicitly reject a stale full-worktree rebase in the derived-status step.
- **Candidate:** PR #154 head `c20e0c27cd595657e329b51e0d9adfe72633a568`, rebuilt from current-main lineage after the original PR diverged.
- **Verification:** Shared Agent Memory Tests run `33249928998` = success; Business OS Migration run `33249929000` = success; Business OS Live Preview run `33249929009` = success including exact Netlify preview, desktop and mobile interaction checks.

## IMPROVEMENT — behavior-level concurrency contract
- **Fingerprint:** `paginacontrole|concurrency|path-appropriate-sync-contract`
- **Before:** regression tests counted two `git pull --rebase origin main` occurrences, coupling safety to one implementation shape.
- **After:** tests protect the real invariant: source repair rebases before its normal push, while derived-status publication starts from latest `origin/main` and carries forward only the intended generated file.
- **Reliability effect:** the status writer no longer depends on unrelated tracked changes in the old workflow worktree; concurrent main work is preserved with a smaller mutation surface.
- **Cost/performance:** no paid resource increase; no additional external service or AI call was added.
- **Security:** no secret, credential, permission or security-control change.

## PRODUCTION_PROMOTION — isolated seo-status publication
- **Fingerprint:** `paginacontrole|seo-status|production-green-isolated-publication`
- **Promotion:** PR #154 merged exact green head `c20e0c27cd595657e329b51e0d9adfe72633a568` to signed production merge SHA `3a000063537b56aef6f862e036b4cf4a8d2b2f71`.
- **GitHub production gate:** Configuratiewacht run `33249990785` completed successfully on exact production SHA.
- **Netlify production deploy:** `6a92c0ff475a7d0008c3f458`, context `production`, state `ready`, exact `commit_ref=3a000063537b56aef6f862e036b4cf4a8d2b2f71`, published `2026-08-29T11:23:00.952Z`, deploy time 20 seconds.
- **Protected verification:** 68 redirect rules and 16 header rules processed without errors; 3 functions and 1 edge function deployed; 636 files secret-scanned with 0 matches; public HTTPS homepage returned normal Bedrijfsgeheugen content.
- **Previous production / rollback:** previous ready deploy `6a92c06a26635e000884ceaa` on SHA `a818ba45bb1d2b60a5269eee3499b8d6276b118a` remained available as the immediate rollback point during promotion. No rollback was required.
- **Shared-learning routing:** write ERROR/RECOVERY/IMPROVEMENT/PRODUCTION_PROMOTION through BG168/BG166/BG167 with these exact fingerprints and evidence.

## Reusable lesson
A concurrency regression test should protect preservation of concurrent work, not mandate one synchronization primitive for unrelated publication classes. For a single derived file produced in a disposable CI worktree, rebasing the entire stale worktree is unnecessary coupling; reconstruct the write from current main and carry only the intended artifact.