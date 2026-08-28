# Development Ledger

This ledger is append-only operational memory for material engineering outcomes. New entries must include date/time, type, fingerprint, symptom/signal, impact, root cause or rationale, evidence, attempted approaches, final fix/experiment, owner, regression gate, verification, production SHA/deploy, rollback/last-known-good and reusable lesson.

Supported material outcome types are `ERROR`, `RECOVERY`, `IMPROVEMENT`, `OPPORTUNITY`, `EXPERIMENT_RESULT`, `PRODUCTION_PROMOTION`, `PRODUCTION_ROLLBACK` and `CONTRACT_CHANGE`.

## 2026-08-28 — ERROR — required-knowledge-files-missing
- **Fingerprint:** `docs-contract|required-files|missing-on-main`
- **Signal:** `AGENTS.md` mandates `docs/development-operating-system.md`, `docs/development-ledger.md` and `docs/superpowers/specs/2026-08-28-shared-agent-memory-design.md`, but these files were absent from `main` after the self-healing/team-memory promotion.
- **Impact:** agents cannot complete the mandatory read/writeback sequence from repository truth; release governance can report green while the knowledge contract is incomplete.
- **Root cause:** the Shared Agent Memory CI validated semantic learning/fingerprint/opportunity tests only and was scoped to the temporary `automation/green-production-gate` branch. It had no required-document contract test.
- **Evidence:** `main` SHA `e1e1dc4804091bbfef76b2bad8a26b4e013ff371`; PR #98 merged green but changed only nine files and did not add the three required docs.
- **Known failed approach:** relying on prose references in `AGENTS.md` without a machine-enforced existence/content gate.
- **Owner:** Knowledge & Governance / QA self-heal.
- **Last-known-good production:** `e1e1dc4804091bbfef76b2bad8a26b4e013ff371` remains protected during candidate repair.

## 2026-08-28 — RECOVERY — docs-contract-gate
- **Fingerprint:** `docs-contract|required-files|guarded`
- **Fix:** add the missing canonical operating-system, ledger and shared-memory design documents; add `tests/development-doc-contract.test.mjs`; broaden Shared Agent Memory CI to `automation/**` pushes and PRs targeting `main`.
- **Regression gate:** test asserts all mandatory files exist and that `AGENTS.md` references them; workflow executes the gate together with existing shared-memory tests.
- **Verification:** initial candidate run `33174931495` failed because `IMPROVEMENT` was absent from the ledger vocabulary; the ledger contract was corrected. A concurrent production-controller promotion moved `main`, so the candidate was rebased rather than force-merged. Rebased candidate `f3d73c777994c84ae8e27fbd009b29748cfb3ed3` passed run `33175126995`.
- **Rollback:** previous production remained available until the exact candidate was green and promoted.
- **Reusable lesson:** every mandatory documentation dependency in an agent contract must be machine-validated by CI; branch-specific temporary gates are not production governance.

## 2026-08-28 — IMPROVEMENT — shared-memory-ci-scope
- **Fingerprint:** `shared-memory|ci-scope|automation-and-main-prs`
- **Baseline:** Shared Agent Memory Tests ran only for `automation/green-production-gate` pushes.
- **Change:** run the bounded shared-memory suite for all `automation/**` pushes and pull requests targeting `main`, including the development-document contract and deterministic production-promotion-controller regression test.
- **Success metric:** future self-heal candidates receive an automatic shared-memory/documentation gate without modifying branch-specific CI.
- **Verification:** workflow run `33175126995` passed on the rebased candidate.
- **Rollback:** restore the prior workflow trigger if the broader trigger causes an unexpected CI regression.

## 2026-08-28 — PRODUCTION_PROMOTION — self-healing-team-memory-contract
- **Fingerprint:** `shared-memory|contract|production-promotion`
- **Evidence:** PR #98 candidate `95f26fa3c7199a35ea9e9cdb4e6c5cbd9fc229d2` was merged to `main` as `e1e1dc4804091bbfef76b2bad8a26b4e013ff371` after green Shared Agent Memory tests.
- **Lesson:** promotion succeeded, but follow-up contract completeness must itself be gated; this ledger entry records the exact production transition for future agents.

## 2026-08-28 — PRODUCTION_PROMOTION — docs-contract-restored
- **Fingerprint:** `docs-contract|required-files|production-green`
- **Candidate:** `f3d73c777994c84ae8e27fbd009b29748cfb3ed3`, verified by Shared Agent Memory Tests run `33175126995`.
- **Promotion:** PR #99 merged exact candidate head to production SHA `80bf408c62f3dcf8ba45618b15bd23c235528d66`.
- **Production deploy:** Netlify deploy `6a918bc0ade51c0008d3f136`, context `production`, state `ready`, exact `commit_ref=80bf408c62f3dcf8ba45618b15bd23c235528d66`, published `2026-08-28T13:23:32.088Z`, deploy time 18 seconds.
- **Protected verification:** 68 redirect rules and 16 header rules processed without errors; 3 functions and 1 edge function deployed; secret scan found 0 matches.
- **Last-known-good before promotion:** `87b65e40051dfcb8736bc9f173261bc0963dbad3`.
- **Rollback:** restore the last-known-good SHA if production smoke/regression or protected metrics regress. No rollback was required.
- **Shared learning:** ERROR, RECOVERY, IMPROVEMENT and PRODUCTION_PROMOTION were written through BG166; BG166 refreshed BG167 after each write. BG168 routed the material production outcome.
- **Reusable lesson:** promote only an exact rebased green SHA, verify the exact production deployment after merge, and make mandatory memory/document contracts executable in CI.

## 2026-08-28 16:10 CEST — ERROR — iPhone hero runtime blank after first frame
- **Fingerprint:** `preview|hero-video|iphone-poster-first-frame-blank`
- **Signal:** physical iPhone preview evidence showed the hero move from the legacy people image to a buildings frame and then blank; playback did not continue.
- **Impact:** PR #96 remained runtime-red even though its Netlify deploy was `ready`; automatic promotion was forbidden because device-specific runtime acceptance was not green.
- **Root cause/hypothesis:** the failing candidate used a Pexels media encode whose device behavior differed from the proven 1920x1080@30fps source class. A concurrent branch change also introduced post-`playing` playback-rate tuning, adding an unnecessary runtime variable during recovery.
- **Evidence:** failed candidate `f6b7081436d17e3c818b46bf05da8eeb5ee4a027`; failed preview deploy `6a9194c9ca34540008af1a38`; user evidence: `person -> buildings -> blank; video does not play`.
- **Known failed approaches:** assuming equal CDN implies equal Safari compatibility; treating Netlify `ready` as proof of video runtime health; adding motion/playback tuning before device playback is proven.
- **Owner:** QA/Regression + Frontend Wiring.
- **Last-known-good production:** `dfd7a19b5520604ce493902fbbe565e54d7e0fc0`, Netlify `6a918da7c229aa00097758b3`, remained `ready` and untouched.

## 2026-08-28 16:10 CEST — RECOVERY — constrained 1080p30 hero candidate
- **Fingerprint:** `preview|hero-video|iphone-1080p30-recovery-candidate`
- **Fix:** on draft PR #96, keep the canonical V18 player/controller unchanged; use official Pexels building-drone endpoint `https://www.pexels.com/download/video/8783011/`, require resolution to `videos.pexels.com/.../8783011-hd_1920_1080_30fps.mp4`, remove all playback-rate tuning, and replace the legacy people fallback everywhere with the drone poster.
- **Regression gate:** `tools/test-v18-preview.mjs` requires the exact official endpoint, exact 1920x1080@30fps resolved suffix, valid MP4 response/status, byte-identical canonical controller, no `playbackRate`/`defaultPlaybackRate` assignment, no legacy people image, 14 views and valid routes.
- **Verification:** candidate `b8e765486f8f7220d044c940602381e8ab838e6d`; Netlify preview `6a9196ce86ab9a00089829d6`; state `ready`; context `deploy-preview`; 68 redirects and 18 headers processed; 4 functions and 1 edge function deployed; 0 secret-scan matches.
- **Current status:** `PREVIEW_GREEN_BUILD_RUNTIME_ACCEPTANCE_PENDING`. This is not production-green because the original defect is device-specific and requires iPhone runtime proof before promotion.
- **Production protection:** production remained `dfd7a19b5520604ce493902fbbe565e54d7e0fc0` / `6a918da7c229aa00097758b3`, state `ready`; no production promotion or rollback was required.
- **Reusable lesson:** for device media regressions, freeze the proven player, constrain the media delivery fingerprint explicitly, remove unrelated runtime tuning, and never equate build/deploy success with device runtime acceptance.

## 2026-08-28 17:18 CEST — ERROR — accepted preview candidate branch drift
- **Fingerprint:** `preview|hero-video|candidate-branch-drift|runtime-evidence-missing`
- **Signal:** PR #96 moved after the accepted build candidate from `b8e765486f8f7220d044c940602381e8ab838e6d` to `c0499ac0780f4ab214331e4d2f232592da22b600` through parallel agent work.
- **Impact:** the mutable PR head can no longer represent the previously tested Pexels candidate and must not be promoted by head-name or PR-number alone.
- **Root cause:** a long-lived prototype branch accumulated parallel changes after candidate acceptance. Compared with production `main` `e8cfdecfb19a22428f146b24f97455d654809947`, the new head is diverged, 114 commits ahead and 29 behind, and contains another hero-source change to OpenArt.
- **Evidence:** immutable Pexels Netlify deploy `6a9196ce86ab9a00089829d6` remains `ready` and exact `commit_ref=b8e765486f8f7220d044c940602381e8ab838e6d`; current `c0499ac0780f4ab214331e4d2f232592da22b600` also has Netlify build success but no iPhone runtime acceptance. PR #96 is not mergeable.
- **Attempted/avoided approaches:** no blind merge, force-ref rewrite, retry or promotion of the changed head; these would mix unaccepted branch history into the release.
- **Recovery:** pin acceptance to immutable candidate SHA/deploy, keep production on last-known-good, and require a clean promotion branch from current `main` after device runtime acceptance.
- **Owner:** QA/Regression + Architect/Integrator.
- **Regression gate:** promotion must reject head movement after acceptance and reject merge-conflicted/diverged candidates.
- **Production protection:** `e8cfdecfb19a22428f146b24f97455d654809947` / Netlify `6a9197b8043dcf00086cbb73` remains `ready`.
- **Reusable lesson:** PR identity is not release identity; the accepted artifact is the exact SHA plus immutable deploy.

## 2026-08-28 17:18 CEST — ERROR — browser evidence CLI page argument missing
- **Fingerprint:** `browser-evidence|chrome-devtools|required-page-argument-missing`
- **Signal:** BG151 Browser Evidence run `e7b7505f87eb4c3fb0a31a26e6447543` produced `chrome-devtools list_console_messages --output-format=json` -> `Error: Not enough non-option arguments: got 0, need at least 1`; `pageUrl` stayed `about:blank`.
- **Impact:** the automated browser release gate cannot currently provide trustworthy console/network/runtime evidence for the device-specific hero-video acceptance step.
- **Root cause:** the monitor wrapper still invokes an older zero-positional-argument CLI contract while the installed `chrome-devtools` CLI requires an explicit selected page/page id for page-scoped commands.
- **Known failed approach:** rerunning the same zero-argument command. The retry limit is exhausted for that hypothesis; future recovery must change the invocation contract.
- **Safe recovery completed:** the faulty evidence was rejected rather than interpreted as a page result; production remained protected; the error fingerprint was written through BG168/BG166 and projected into BG167.
- **Remaining fix:** update the monitor wrapper to select a real page and pass that page/page id into snapshot/console/network calls; add a regression test that rejects zero-argument page-scoped invocations and requires `pageUrl != about:blank` before evidence can satisfy a release gate.
- **Owner:** Telemetry/Self-Healing + QA/Regression.
- **Verification:** BG167 Team Memory refresh at `2026-08-28T15:19:00.276Z` includes both the branch-drift and Browser Evidence CLI errors.
- **Rollback/last-known-good:** no production code changed; production `e8cfdecfb19a22428f146b24f97455d654809947` / `6a9197b8043dcf00086cbb73` remains the protected last-known-good.
- **Reusable lesson:** observability failures are release-gate failures, not product failures; never infer runtime health from an evidence collector that did not attach to the target page.

## PRODUCTION_ROLLBACK event contract
When any production promotion regresses protected smoke/regression or metrics, append a `PRODUCTION_ROLLBACK` entry with failed production SHA/deploy, restored last-known-good SHA/deploy, evidence, rollback verification and the next candidate hypothesis. No rollback was required for the incidents above because production remained on the last-known-good SHA until each promotion was verified.
