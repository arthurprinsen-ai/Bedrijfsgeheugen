# Development Ledger

This ledger is append-only operational memory for material engineering outcomes. New entries must include date/time, type, fingerprint, symptom/signal, impact, root cause or rationale, evidence, attempted approaches, final fix/experiment, owner, regression gate, verification, production SHA/deploy, rollback/last-known-good and reusable lesson.

Supported material outcome types are `ERROR`, `RECOVERY`, `IMPROVEMENT`, `OPPORTUNITY`, `EXPERIMENT_RESULT`, `PRODUCTION_PROMOTION`, `PRODUCTION_ROLLBACK` and `CONTRACT_CHANGE`.

## 2026-08-30 21:33 CEST — CONTRACT_CHANGE — exact AI token budget metering
- **Fingerprint:** `cost|ai-tokens|provider-usage-ledger-v1`
- **Signal:** the shared cost dashboard governed Make credits but could not show exact AI-provider token consumption. The fixed 10.000-token monthly envelope could therefore not be enforced without treating unknown usage as if it were zero.
- **Impact:** optional agents could continue spending beyond the intended token budget, and operators could not distinguish a genuinely zero-usage scenario from a scenario whose provider calls were not measured.
- **Root cause:** the existing Brain AI adapter returned provider answers without retaining the provider's sanitized usage counters; the dashboard projection only joined BG159/Make credit snapshots. Creating another cost governor would have duplicated policy truth, so the missing capability belonged in the existing adapter, budget policy and projection.
- **Evidence/baseline:** before this candidate, `config/brain-cost-policy.json` contained only `monthlyLimitCredits`; `_brain-ai.mjs` discarded `data.usage`; dashboard components exposed no token counters or coverage state.
- **Final fix:** record exact input, output, cache-read and cache-write token counters after governed provider calls in a request-idempotent Netlify Blobs ledger; never store prompts, answer text, API keys or business context; join sanitized totals into the existing cost projection; label every uncovered component `UNMETERED`; add a separate 10.000-token envelope to the existing budget policy; defer only optional work when the strictest verified credit/token state is red or exhausted while preserving protected interrupts and valid user answers.
- **Expected effect:** exact daily/monthly token visibility for connected provider adapters, automatic discovery of newly measured component keys, bounded storage volume, and deterministic prevention of optional AI overspend once verified usage reaches the shared envelope. Make scenarios that do not yet emit provider usage remain visibly unmetered rather than producing false savings claims.
- **Security/privacy:** the internal dashboard remains invite-only and no-store; rendering uses `textContent`; the ledger key is provider request ID and its value is counters plus component/provider metadata only. Telemetry storage failure cannot leak or discard the valid business response.
- **Protected-gate recovery:** PR verification exposed fingerprint `seo-scan|private-noindex-auth|public-page-rules`. The public page/SEO scanners incorrectly evaluated the isolated `noindex,nofollow` customer login and demanded the canonical public header/footer, which would conflict with the proven iOS auth isolation. Both scanners now exclude `klant-login`; the login artifact itself is unchanged. `tests/internal-auth-scan-boundary.test.mjs` fails before and passes after the bounded fix, while the customer-auth regression suite remains green.
- **Owner:** Economics/Cost + Architecture/Integrator + Security/Governance + QA/Regression.
- **Regression gate:** `tests/ai-token-usage.test.mjs`, `tests/ai-usage-store.test.mjs`, `tests/brain-ai-token-metering.test.mjs`, `tests/cost-budget-policy.test.mjs`, `tests/cost-projection-store.test.mjs`, `tests/cost-dashboard-api.test.mjs`, `tests/cost-dashboard-security.test.mjs` and `tests/brain-cost-obligations.test.mjs`.
- **Verification:** focused red/green tests passed; the full Brain/backend lane passed 305 tests after 35 Brain script suites; website/component regression passed 32 tests. Exact candidate SHA, Unified Brain Delivery evidence, production deploy and BG168/BG167 writeback are appended only after promotion.
- **Rollback/last-known-good:** remove the token-ledger join and token fields while retaining the existing Make-credit governor; the last-known-good production remains unchanged until exact-SHA BG169 promotion and smoke verification complete.
- **Reusable lesson:** unknown AI usage is a measurement gap, never zero. Add metering at the narrow provider boundary, reuse the single existing budget governor, keep telemetry metadata-only and idempotent, and block only work whose autonomy class permits budget deferral.

## 2026-08-30 21:13 CEST — RECOVERY — isolated customer auth after legacy inline-login jitter
- **Fingerprint:** `portal|customer-auth|legacy-inline-login-jitter`
- **Signal:** IJsselmonde needed the rich legacy customer portal containing its offerte/sprints. Authentication succeeded at the backend, but the inline login UI in the large legacy portal repeatedly re-rendered/jittered on iOS so fields could not reliably receive input.
- **Impact:** valid customers could be blocked from their existing portal even though credentials, RLS and offer retrieval were healthy; repeated UI symptom patches slowed recovery.
- **Root cause:** authentication ownership was split across mixed Netlify Identity legacy control, Supabase customer auth and legacy portal lifecycle/render code. The legacy document could rebuild the inline auth DOM and lose focus/state. A successful password request therefore did not prove a usable customer login outcome.
- **Evidence:** Supabase password token requests returned 200; organization and offerte REST requests returned 200; IJsselmonde organization/membership/offerte access was valid. The user then confirmed the isolated login flow works. Production evidence: Netlify deploy `6a941a416239ed0008694486`, state `ready`, exact commit `9041bcb1e5cc4d6732cbc3b0d4879976cef3e350` after the architecture contract was deployed.
- **Known failed approaches:** repeatedly patching the inline legacy login; only bypassing the Netlify Identity controller; changing reload/direct-open behavior without removing competing legacy auth ownership; adding persistence alone while editable fields still lived in the re-rendering legacy DOM; treating backend HTTP 200 or Netlify `ready` as sufficient proof of the original device/UI outcome.
- **Final fix:** isolate authentication in lightweight `klant-login.html`; make it the only editable customer login; use Supabase password/magic-link auth and RLS for authorization; persist the session with localStorage plus first-party cookie fallback; pass customer payload/token through sessionStorage; redirect to the same `/klantportaal?klant=<slug>`; transform legacy `toonInlog` into a redirect instead of rendering `bgMail`/`bgWw` inline.
- **Owner:** Product/Portal + QA/Regression + Knowledge/Governance.
- **Regression gate:** `tests/customer-portal-auth-race.test.mjs`, `verifyCustomerLoginContract()` in the production build, and `tests/development-doc-contract.test.mjs` requiring this incident learning to remain present.
- **Verification:** original device symptom was closed by explicit user confirmation “Werkt”; production architecture build/deploy was separately verified on Netlify. These are distinct evidence classes and must not be conflated.
- **Rollback/last-known-good:** retain the isolated-login production architecture; do not restore inline legacy auth. If future customer-auth work regresses, preserve the last proven isolated-login artifact while repairing a candidate.
- **Reusable lesson:** when backend auth/data evidence is green but an editable auth surface inside a large legacy app is unstable, stop stacking symptom patches. Identify competing auth/render owners and isolate authentication behind one small stable boundary. For mobile/iOS focus or jitter defects, only device outcome evidence closes the incident. Known fingerprint match means reuse this architecture before inventing another auth path.

## 2026-08-30 — CONTRACT_CHANGE — unified-brain-delivery-v1
- **Fingerprint:** `delivery|brain-membership|backend-website-portal-v1`
- **Signal:** backend, website and portal had strong individual gates but no single machine-enforced delivery envelope; integration and live promotion therefore waited on serial hand-offs and new workflows could exist outside whole-Brain onboarding.
- **Impact:** slower time-to-live, duplicate verification and risk of isolated agent/scenario truth.
- **Root cause:** component isolation was website-specific while repository-wide membership, lane discovery and release assembly were not one contract.
- **Fix:** add `BRAIN-DELIVERY-v1`, automatic repository membership discovery, fail-closed path classification, concurrent backend/portal/website lane jobs and one integrated exact-SHA candidate governed by BG169/BG168/BG167.
- **Owner:** Architect/Integrator with Reliability, Website/UX, Product/Portal and Integration/Make specialists.
- **Regression gate:** `tests/brain-delivery-system.test.mjs` and `.github/workflows/unified-brain-delivery.yml`.
- **Rollback:** remove only the new unified workflow/policy/tool; existing specialist gates and last-known-good production remain unchanged.
- **Reusable lesson:** parallel work becomes faster only when ownership is disjoint and integration identity is singular; adding workers without one release envelope increases waiting and conflict.

## 2026-08-30 — RECOVERY — unified-gate-caught-customer-portal-auth-race
- **Fingerprint:** `portal|customer-auth|reload-before-open`
- **Signal:** all three delivery lanes passed, but the unified integration gate caught the newly added `customer-portal-auth-race` contract on current `main`.
- **Root cause:** authenticated offer state was stored and then the document reloaded; the accepted portal-open transition was never called in the same verified session.
- **Fix:** after the offer is stored, call `toonPortaal({email:mail})` directly and remove the reload race. Classify `klantportaal.html` permanently as portal-owned delivery scope.
- **Regression gate:** `tests/customer-portal-auth-race.test.mjs` plus the portal-lane classification test in `tests/brain-delivery-system.test.mjs`.
- **Rollback:** previous production remains last-known-good until the combined candidate is green.
- **Reusable lesson:** an integrated gate must include concurrent main changes; otherwise individually green lanes can still promote a broken combined outcome.
- **Second hypothesis/result:** the first direct-open repair exposed that the new regression test asserted adjacency while the canonical transformer also persists `window.__KLANTEN__` before opening. The test now consumes the exported canonical handler. The final integration suite uses `--test-concurrency=1` because legacy build-contract tests mutate and restore the same generated homepage; product lanes remain concurrent.

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

## 2026-08-30 21:25 CEST — CONTRACT_CHANGE — Powerhouse chat learning checkpoint
- **Fingerprint:** `shared-memory|chat-learning|cross-platform-checkpoint-20260830`
- **Signal:** material Powerhouse engineering knowledge accumulated across Make, Notion, GitHub, Netlify, SEO publishing, native social publishing, analytics, security and cost optimization. Without a repository-level checkpoint, future chats/agents could still repeat already diagnosed failures even though portions were present in runtime or Notion memory.
- **Impact:** repeated diagnosis, duplicated publishers, credential regressions, unnecessary AI/Make credits, blind retries and false-green deployments.
- **Root cause/rationale:** runtime learning and Notion state were strong but not every cross-platform lesson had one repository artifact that future code agents could read before work.
- **Evidence:** Notion Engineering Registry and Direct Knowledge Base contain the 2026-08-30 chat checkpoint; Powerhouse Latest Verified State contains the verified Learning Contract and a blocked BG140 resume record; repository branch `automation/chat-learning-checkpoint-20260830` adds the same reusable engineering truth.
- **Known failed approaches recorded:** generic BG22 dispatch; AI rewrite of approved copy; plaintext tokens; unsupported `toJSON`; Notion empty-bundle writes; rich-text >2000 single writes; run storms; 429 retry pressure; duplicate publishers; direct Notion array→URN mapping; blind retry after create/verify ambiguity; treating Make `success` as functional success when error handlers ran; unbounded AI context; restart for configuration errors; legacy Buffer IDs sent to native metrics APIs; repeated expensive Gemini generation while GitHub upload transport remained unproven.
- **Final change:** add `docs/powerhouse-chat-learning-checkpoint-2026-08-30.md` with mandatory preflight, fingerprints, anti-patterns, component contracts, current blocked state and resume instructions; append this ledger record.
- **Owner:** Knowledge/Governance + all agents.
- **Regression gate:** existing shared-memory/document contract must remain green; follow-up should add this checkpoint to the mandatory docs contract before promotion if the candidate gate does not already discover it.
- **Verification:** repository file created on exact candidate branch from main SHA `7ad7a88061422056771a7638ff7d5b7ba6a5d9a1`; Notion copies were already created and marked verified/AI-skill where applicable.
- **Production SHA/deploy:** not yet production at time of this entry; candidate must pass normal PR/BG169 promotion gates. Do not bypass them for documentation-only urgency.
- **Rollback/last-known-good:** main SHA `7ad7a88061422056771a7638ff7d5b7ba6a5d9a1` remains last-known-good until candidate promotion.
- **Reusable lesson:** durable learning requires the same truth to be discoverable by runtime agents, Notion knowledge and repository code agents. A chat summary alone is not an engineering memory system.
