# 17 November 2026 — Original hourly blog backlog prevention event
Fingerprint: powerhouse|daily-blog|old-candidate-behind-main-no-recovery|20261117-v1
Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232
Owner: existing Powerhouse GitHub hourly blog publisher.

Observed: 15/16 November canonical blog APPROVED without LIVE_PROVEN; original PRs #5833/#5918 open and behind main despite existing GitHub auto-merge. Old exact-head 16 November Required also failed on legal review expiries subsequently fixed by original legal owner on main.
Change: within the original hourly workflow only, one exact native expected_head_sha branch update at most per natural run. No new executor, parallel sender, force-push or bypass. Normal protected gates and exact public delivery proof remain mandatory.
Regression: tests/brain-blog-stale-branch-recovery-20261117.test.mjs.
Proof state: CANDIDATE until protected merge, production rollout, natural original workflow/GitHub readback and original consumer closure are independently verified.

Preflight failure on previous exact candidate c1eaa196a71cde4e8141515df8127e0d745b69c5: PR event still compared against old base 8411f99eb44bb105f744a905eebf07c775c66635 after canonical main moved to d77ebe462a9bc98549bda031d5703bdac61e2829. The preflight correctly blocked 10 changed files against 6 scope-budget, counting unrelated original Mira edits in the baseline. This is a moving-base admission defect, not an excuse to increase Scope-Budget or bypass Required. The PR was rebased only via existing native GitHub merge ancestry (no force), metadata Base-SHA was moved to current main, and this evidence-only ledger edit intentionally retriggers exact-head Required for the intended six-file diff.

Corrective retry after investigating actual protected Required logs: GitHub's existing pull request base SHA remained 8411f99e even after the branch incorporated main d77ebe46, causing comparison against unrelated Mira source files. The existing PR base was refreshed natively using the GitHub PR base update, which returned current main 53a6c99de87e987333cdc49b762119927af8abf1. This append-only evidence commit creates a fresh exact PR-head event so the original verified merge-base/scope guard can evaluate six original files without weakening Scope-Budget, Required, CodeQL, or the reviewer restrictions.
