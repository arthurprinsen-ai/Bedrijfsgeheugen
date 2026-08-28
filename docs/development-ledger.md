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

## 2026-08-28 17:50 CEST — RECOVERY — opt-in iPhone runtime evidence probe
- **Fingerprint:** `preview|hero-video|iphone-runtime-probe-v1`
- **Signal:** build/deploy success and the broken local Chrome evidence wrapper could not prove the original physical-iPhone playback defect.
- **Root cause addressed:** acceptance lacked an observer running in the same Safari execution context as the affected device.
- **TDD evidence:** exact SHA `2cc0cacb2cbbcf2d95f1035d1198752537ccc68e` intentionally went RED in Netlify deploy `6a91ad99168a000008c55709` after the new probe contract test was wired before the probe asset existed; build returned non-zero exit code 2.
- **Fix:** exact Pexels candidate lineage received `assets/runtime-evidence-probe.js`, activated only by `?bg-runtime-probe=1`, plus exactly one deferred build injection. The probe records bounded video events/state, requires at least 5 seconds of `currentTime` advancement, caps history at 80 events, performs no outbound requests and never calls `play()`/`pause()` or mutates source, poster, playback rate or opacity.
- **Regression gate:** `tools/test-runtime-evidence-probe.mjs` forbids network APIs and playback/media mutations; `tools/test-v18-preview.mjs` imports that gate, requires exactly one deferred probe script and preserves the byte-identical canonical V18 controller test.
- **GREEN verification:** exact candidate `ac3fdd66efe7de541c12185de9c36ac3bc004dd8`; Netlify deploy `6a91ae01fbc8c0000846d342`; `state=ready`; `context=deploy-preview`; exact `commit_ref` match; 68 redirects and 18 headers deployed without errors; 4 functions and 1 edge function deployed; 0 secret-scan findings.
- **Current status:** `PREVIEW_GREEN_BUILD_RUNTIME_ACCEPTANCE_PENDING`; physical iPhone must still report probe `PASS` before this candidate can enter a production gate.
- **Rollback:** remove the static probe asset/script injection; production was untouched by this candidate.
- **Reusable lesson:** for a device-only media failure, instrument the failing execution context directly while keeping the player immutable; do not treat build green as runtime green.

## 2026-08-28 17:51 CEST — ERROR — BG168 false production-promotion classification
- **Fingerprint:** `shared-learning|bg168|false-production-promotion-from-negated-text`
- **Signal:** BG168 execution `26e7239fd435412193e6c1d22a5e2be8` classified the preview-only recovery as `PRODUCTION_PROMOTION` even though the result explicitly stated that production promotion had not occurred.
- **Impact:** shared memory could falsely imply a production release.
- **Root cause:** outcome classification matched production-promotion wording without correctly handling negation/context.
- **Recovery:** wrote a corrective ERROR plus the real RECOVERY directly through BG166 and refreshed BG167. Exact deployment evidence remains authoritative: `ac3fdd66...` is deploy-preview only, while production is separate and untouched by this runtime-probe candidate.
- **Regression requirement:** BG168 must not emit `PRODUCTION_PROMOTION` unless exact production SHA/deploy evidence is affirmative; explicit `production_promotion=false`, `NO_PRODUCTION_PROMOTION` or preview-only context must veto that kind.
- **Owner:** Knowledge/Governance + Outcome Router.
- **Reusable lesson:** semantic mention of a release state is not release evidence; deterministic exact-SHA production evidence must dominate free-text classification.

## PRODUCTION_ROLLBACK event contract
When any production promotion regresses protected smoke/regression or metrics, append a `PRODUCTION_ROLLBACK` entry with failed production SHA/deploy, restored last-known-good SHA/deploy, evidence, rollback verification and the next candidate hypothesis. No rollback was required for the incidents above because production remained on the last-known-good SHA until each promotion was verified.

## 2026-08-28 20:25 CEST — ERROR — BG168 rollback classified as promotion
- **Fingerprint:** `shared-learning|bg168|rollback-precedence-over-promotion`
- **Signal:** execution `bc7dcb50e59e4cccbcf5f43904838fd3` received explicit `PRODUCTION_ROLLBACK` evidence but returned `kind=PRODUCTION_PROMOTION`.
- **Impact:** shared memory could falsely record a rollback as a successful production promotion.
- **Root cause:** BG168 module 2 tested promotion keywords such as `production_green` before testing rollback keywords; rollback evidence legitimately contains both the failed prior production state and the restored green state.
- **Known failed approach:** free-text keyword classification where promotion takes precedence over rollback.
- **Owner:** Knowledge/Governance + Outcome Router.

## 2026-08-28 20:25 CEST — RECOVERY — BG168 rollback precedence guard
- **Fingerprint:** `shared-learning|bg168|rollback-precedence-fixed`
- **Fix:** added an explicit `rollbackMention` detector and moved rollback classification ahead of promotion classification in BG168 module 2.
- **Regression verification:** execution `e99193e7b67f4217b06964485fb14df2` classifies mixed rollback + restored-green text as `PRODUCTION_ROLLBACK`; execution `7a1268064e4540d68520654fc267378f` still classifies genuine promotion text as `PRODUCTION_PROMOTION`.
- **Rollback:** restore the prior module mapper if the new precedence guard blocks a confirmed promotion without rollback evidence.
- **Reusable lesson:** terminal rollback semantics must dominate earlier promotion wording in the same narrative.

## 2026-08-28 20:25 CEST — PRODUCTION_ROLLBACK — BG169 canary reverted to exact last-known-good tree
- **Fingerprint:** `production|rollback|980e2e8b-to-lkg-tree-0ba2eb32`
- **Signal:** BG169 controller input at execution `a1738d34b0584e248063928ca7417302` explicitly set `production_status=red` for production SHA `980e2e8b2a42151ffcfb334e1ab1a28e2ac83f41`.
- **Impact:** production could not remain on the canary promotion despite its earlier `PRODUCTION_GREEN` verification.
- **Rollback:** BG169 execution `b5786c46ee6b482b8b6198742d5bc9f5` created history-preserving rollback commit `c95394d4a1e854293a27cb2b7243ca87ea130543`, restoring exact last-known-good tree `0ba2eb32d417cab77385ed40fe5d5a4a1f6a247d` from LKG SHA `9a8038e7654da29c99f5c21dd0b57e8c09144dc7`; no force-push was used.
- **Final production state:** follow-up Netlify trigger commits `4395648cb05556fd0aaa8f3f0382b95560fb6950` and `b692482543f4d36f32360ffcc8d1823c0723ef6e` preserve that same LKG tree. Netlify deploy `6a91c6fabcc0eb000866843f` is `ready`, exact `commit_ref=b692482543f4d36f32360ffcc8d1823c0723ef6e`, with 68 redirects, 16 headers, 3 functions, 1 edge function and zero secret-scan findings.
- **Smoke:** `https://www.bedrijfsgeheugen.nl` returned the live production homepage after rollback.
- **Current terminal state:** `ROLLED_BACK_GREEN`.
- **Owner:** Architect/Integrator + QA/Regression.
- **Reusable lesson:** `PRODUCTION_GREEN` is point-in-time evidence, not a permanent state; any later protected red signal must trigger exact-tree rollback and independent production re-verification.

## 2026-08-28 21:20 CEST — ERROR — BG167 current projection contradicted release truth and specialist routing
- **Fingerprint:** `shared-memory|bg167|contradicted-promotion-and-agent-id-collision`
- **Signal:** current Team Memory still exposed a stale `PRODUCTION_PROMOTION` whose own reason contained `PRODUCTION_ROLLBACK`, and Agents 07/08/09 were mapped to shifted/duplicate scenario IDs.
- **Impact:** a later agent could infer the wrong current release state or dispatch specialist work to the wrong Make scenario.
- **Root cause:** BG167 module 4 only filtered one legacy smoke pattern and used a stale static team table: Agent 07=`7088553`, Agent 08=`7088558`, Agent 09=`7088558`.
- **Evidence:** pre-fix BG167 run `336f452298a54e4a87f20460e38ef1c1`; Make scenario lookup verified Agent 07 Signal Ingest=`7088548`, Agent 08 DM History Backend=`7088553`, Agent 09 Telemetry Self-Healing=`7088558`.
- **Owner:** Knowledge/Governance + Architect/Integrator.
- **Production protection:** production stayed `cdb45925145ff77c47b23b32d3b6471030a1486a`, Netlify `6a91d363fba2440008d9c514`, `ready`.

## 2026-08-28 21:20 CEST — RECOVERY — BG167 projection consistency restored
- **Fingerprint:** `shared-memory|bg167|projection-consistency-restored`
- **Fix:** suppress a CURRENT `PRODUCTION_PROMOTION` projection only when its own evidence explicitly contains rollback semantics; correct Agent 07/08/09 IDs to `7088548`/`7088553`/`7088558`; add a fail-fast uniqueness assertion across all 16 specialist scenario IDs.
- **Regression gate:** BG167 generation throws `TEAM_CONTEXT duplicate agent scenario ids` on collisions.
- **Verification:** BG167 run `87eb64ab8f794b1cb57a9bd6f936a994` returned 16 unique specialist IDs, the verified 07/08/09 mappings and no contradicted rollback-as-promotion record; the genuine promotion regression fixture remained visible.
- **Rollback:** restore the prior module-4 mapper if context generation regresses; source learning history is not deleted.
- **Reusable lesson:** preserve immutable history but keep CURRENT projections contradiction-free; static agent dispatch tables require executable uniqueness guards.

## 2026-08-28 21:23 CEST — ERROR — BG168 diagnostic ERROR overridden by rollback keywords
- **Fingerprint:** `shared-learning|bg168|explicit-error-prefix-overridden-by-rollback-keywords`
- **Signal:** BG168 execution `aab328b8f1a44d22ac6e2c3a27fae10d` received an `ERROR:` event describing rollback evidence and returned `kind=PRODUCTION_ROLLBACK`.
- **Impact:** diagnostic learning could create a false production rollback record merely because the error description contains rollback vocabulary.
- **Root cause:** for non-JSON free text, BG168 applied semantic rollback keyword detection before explicit material event prefixes.
- **Known failed approach:** relying on keyword precedence alone when the caller already supplies an explicit event type.
- **Owner:** Knowledge/Governance + Outcome Router.

## 2026-08-28 21:23 CEST — RECOVERY — BG168 explicit material type precedence
- **Fingerprint:** `shared-learning|bg168|explicit-type-prefix-precedence`
- **Fix:** detect explicit leading `ERROR:`, `RECOVERY:`, `IMPROVEMENT:`, `CONTRACT_CHANGE:`, `PRODUCTION_PROMOTION:` and `PRODUCTION_ROLLBACK:` before semantic fallback; retain the existing production-negation guard.
- **Regression verification:** exact failing message re-run as execution `2d263ce204c64d1395eb284316f90d16` now returns `AGENT_ERROR`; genuine rollback execution `0ef4fe32d6064ffb81c8bd753b38ed1d` still returns `PRODUCTION_ROLLBACK`.
- **Rollback:** restore the previous module-2 mapper if explicit prefix handling suppresses a valid untyped material event.
- **Reusable lesson:** explicit structured intent must outrank incidental vocabulary; semantic classification is a fallback, not an override.

## 2026-08-28 21:23 CEST — IMPROVEMENT — shared-memory routing consistency guards
- **Fingerprint:** `shared-memory|routing-consistency|unique-ids-explicit-type-precedence`
- **Baseline:** three consecutive specialist slots projected only two unique Make IDs, and explicit diagnostic event types could be overridden by incidental release-state words.
- **Change:** Team Memory now enforces 16/16 unique specialist IDs and BG168 honors explicit event prefixes before keyword fallback while retaining rollback-before-promotion semantics for untyped text.
- **After:** Agent 07/08/09 route to verified `7088548`/`7088553`/`7088558`; BG167 run `87eb64ab8f794b1cb57a9bd6f936a994` and BG168 runs `2d263ce204c64d1395eb284316f90d16` / `0ef4fe32d6064ffb81c8bd753b38ed1d` are green.
- **Production:** no website code changed; protected production remains `cdb45925145ff77c47b23b32d3b6471030a1486a` / `6a91d363fba2440008d9c514`, `ready`, with public homepage smoke healthy.
- **Reusable lesson:** make routing identity and event-type precedence executable invariants so shared memory cannot silently corrupt the next agent's decisions.

## 2026-08-28 21:33 CEST — ERROR — BG140 native Instagram insights metric contract mismatch
- **Fingerprint:** `instagram|native-insights|getmediainsights-metric-required`
- **Signal:** BG140 `GetMediaInsights` received media id `17877791463626109` and a metric list, but Meta returned `(#100) For field 'insights': The parameter metric is required` and the incident handler ran.
- **Impact:** native Instagram analytics remained incomplete and the scheduled route consumed operations while repeatedly producing the same external API incident.
- **Root cause:** the Make `instagram-business:GetMediaInsights` module/API contract did not accept the supplied generic metrics payload for this image media path; retrying the same call reproduced the same error.
- **Known failed approach:** repeated production calls to `GetMediaInsights` without a media-type-specific metric canary.
- **Owner:** Signal Ingest / Analytics self-heal.
- **Production protection:** website production remained `1bf419adf0cd955c564f94a1b62b64c4ca71acb9` / Netlify `6a91e114014f8b0008051e02`, `ready`.

## 2026-08-28 21:34 CEST — RECOVERY — BG140 verified public metrics fallback
- **Fingerprint:** `instagram|native-insights|verified-public-metrics-fallback`
- **Fix:** remove `GetMediaInsights` from the active BG140 path; read the exact native post with `instagram-business:GetMedia` and write only fields returned by that call (`like_count`, `comments_count`, plus analytics timestamp). Do not synthesize unavailable reach/views/saved values.
- **Regression verification:** BG140 execution `bc66359641b646ac94050a2253553f23` completed successfully; module 10 returned the exact post, permalink and public counts; module 11 updated the Notion record; the incident handler did not execute.
- **Rollback:** restore the prior route only after a metric-specific canary proves a supported insight contract for the relevant media type.
- **Reusable lesson:** for external analytics APIs, degrade to verified partial truth rather than manufacturing completeness or repeatedly calling a known-failing endpoint.

## 2026-08-28 21:34 CEST — IMPROVEMENT — BG140 known-failing call removed
- **Fingerprint:** `instagram|native-insights|remove-known-failing-call`
- **Baseline:** the active BG140 route invoked an endpoint that had reproduced the same Meta `#100` error.
- **Change:** the failing insight call is no longer in the active route; BG140 now performs a successful native media read and bounded Notion update. BG180 remains separate because it performs all-media discovery and deduped Datahub snapshots rather than the same record enrichment.
- **Verification:** current BG140 scenario `7140387` contains `GetMedia` and no `GetMediaInsights`; latest verified run consumed 3 credits and completed without the incident handler.
- **Rollback:** restore only if a supported insight canary demonstrates equal or better correctness.
- **Reusable lesson:** remove a deterministic failure from the scheduled hot path instead of paying to rediscover it every run.

## 2026-08-28 21:34 CEST — ERROR — BG150 false degraded from early execution poll
- **Fingerprint:** `agent-runtime|stable-runner|false-degraded-early-poll`
- **Signal:** sentinel run `5a08ff9a85624ad297c3da85ec98d0f6` read Agent14 execution `e9d5d9f204f34e1d987585a3cbf07bda` while it was still `RUNNING`, then projected `PH Agent stable runtime sentinel — DEGRADED` even though the target later completed successfully with result `OK`.
- **Impact:** shared memory could unnecessarily suppress PH-agent fan-out and route engineering through degraded-mode fallbacks despite a healthy runtime.
- **Root cause:** the sentinel used a fixed wait shorter than the observed target runtime; the target took 5.928 seconds to complete.
- **Known failed approach:** treating a non-terminal `RUNNING` sample as terminal degradation.
- **Owner:** Telemetry/Self-Healing.

## 2026-08-28 21:38 CEST — RECOVERY — BG150 terminal-success canary restored
- **Fingerprint:** `agent-runtime|stable-runner|false-degraded-early-poll-recovered`
- **Fix/evidence:** a concurrent safe change increased the sentinel wait before the execution read; the next sentinel run `166891a1868449ada5e3c755e3f044e2` read target `11e073ac0af44cd3a603fa49b792b487` as `SUCCESS` with exact result `OK`. The target completed in 5.799 seconds and the sentinel classified `HEALTHY`.
- **Regression gate:** only terminal execution success plus semantic output exactly `OK` may establish health; a prior `RUNNING` sample is inconclusive, not proof of degradation.
- **Attempted/avoided approach:** no further timing rewrite was applied after fresh evidence was green; the next red occurrence must justify a bounded poll rather than another blind fixed-delay increase.
- **Production protection:** website production remained `1bf419adf0cd955c564f94a1b62b64c4ca71acb9` / Netlify `6a91e114014f8b0008051e02`, `ready`.
- **Reusable lesson:** asynchronous healthchecks must distinguish terminal failure from “not finished yet”; do not convert timing uncertainty into a red runtime state.
