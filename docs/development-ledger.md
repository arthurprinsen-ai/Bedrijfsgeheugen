# Development Ledger

This ledger is append-only operational memory for material engineering outcomes. New entries must include date/time, type, fingerprint, symptom/signal, impact, root cause or rationale, evidence, attempted approaches, final fix/experiment, owner, regression gate, verification, production SHA/deploy, rollback/last-known-good and reusable lesson.

Supported material outcome types are `ERROR`, `RECOVERY`, `IMPROVEMENT`, `OPPORTUNITY`, `EXPERIMENT_RESULT`, `PRODUCTION_PROMOTION`, `PRODUCTION_ROLLBACK` and `CONTRACT_CHANGE`.


## 2026-09-18 — CONTRACT_CHANGE — GitHub executable delivery state machine proven
- **Fingerprint:** `github|delivery-state-machine|parallel-build-serialized-landing|v1`.
- **Signal:** delivery could be merged while post-merge runtime/readback, outcome and learning/skill closure still depended on branch-specific or later follow-up behavior.
- **Impact:** a PR/merge could be mistaken for completion; multiple chats/agents could create recovery lineages and GitHub could accumulate stale PR state instead of acting as one executable delivery machine.
- **Root cause:** terminal identity and landing had already moved to obligation + exact head + main epoch, but generic post-merge obligation terminalization was not yet enforced for every merged PR.
- **Final fix:** keep cheap machine-readable admission before expensive CI; serialize only the short landing boundary; require exact-head/current-epoch merge conditions; then run generic `Obligation Terminal Closure` after merge using the existing canonical Production Release Readback and applicable Powerhouse Skill Projection before releasing the writer lease and writing a terminal state.
- **Evidence:** PR #2166; candidate `5e7dcd5d118982cc8641d14c88995d4838e2ab4b`; merge/main SHA `c3ecd9a00a37904249ebd3c4f06d3334f96400c4`; Production Release Readback run `35350501725`; terminal closure run `35350499979`; artifact `obligation-terminal-evidence-2166`; PR readback contained `Writer-Lease-State: RELEASED` and `Terminal-State: LIVE_BEWEZEN`.
- **Owner:** Architecture/Integrator + Reliability + Knowledge/Governance.
- **Regression gate:** `tests/brain-github-delivery-state-machine-borging.test.mjs` plus existing `tests/github-delivery-state-machine.test.mjs` and `tests/github-delivery-state-machine-terminal-closure.test.mjs`.
- **Rollback/last-known-good:** retain the pre-existing canonical Production Release Readback and remove only the generic terminal-closure wrapper if it regresses; never weaken merge/readback truth gates.
- **Reusable lesson:** parallelize construction, serialize landing, and keep the obligation alive after merge until production/runtime/outcome/learning/skill evidence is closed.

## 2026-09-16 14:00 CEST — CONTRACT_CHANGE — Completion Supervisor v1 candidate
- **Fingerprint:** `powerhouse-completion-supervisor-v1`
- **Signal:** local green and proven hard-boundary state could end AgentWork as `Resolved` while exact production/readback/writeback obligations remained open.
- **Root cause:** completion, waiting and partial progress shared one readiness result; trusted evidence was not centrally identity-bound, protected artifacts were not ingested into the durable lineage, calendar-day execution windows could split one material change, and no event-driven evaluator/backfill translated durable state into the next safe action.
- **Known failed approach:** treat `localGreen`, merge/deploy acknowledgement or a hard boundary as successful completion and remove the fingerprint from active work.
- **Candidate fix:** pure fail-closed Completion Supervisor policy; `LIVE_VERIFIED` only after seven trusted evidence classes; `WAIT_EXTERNAL` remains active; same-item resume; one coalesced candidate identity across calendar days; append-only Supabase evidence; trusted BRAIN-DELIVERY-v2/BG169/production-readback artifact ingest from main workflow code; event-driven sweep; bounded idempotent partial backfill.
- **Owner:** Architecture/Integrator + Reliability + Knowledge/Governance.
- **Regression gates:** `tests/completion-supervisor.test.mjs`, `tests/completion-supervisor-evidence.test.mjs`, `tests/agent-fabric.test.mjs`, `tests/delivery-preflight-completion.test.mjs`, `tests/brain-outcome-obligation-runtime.test.mjs`, `tests/brain-outcome-obligation-supabase-store.test.mjs`, `tests/completion-supervisor-backfill.test.mjs` and Required test membership.
- **Verification:** RED was observed before implementation for the missing pure policy, legacy hard-boundary completion, absent durable evidence writes, absent protected-artifact ingest, cross-day identity drift and absent backfill/workflow triggers. Fresh synchronized-candidate verification: 659 relevant Brain/backend/security tests passed with 0 failures; 63 delivery/learning/Engineering OS tests passed with 0 failures; Supabase security self-test and unchanged-migration diff contract passed; workflow YAML parsed successfully; Engineering OS returned `ENGINEERING_OS_READY`. Exact-head CI and production evidence remain open until protected promotion.
- **Rollback/last-known-good:** disable Completion Supervisor dispatch/backfill while retaining immutable obligations/evidence; existing Agent Fabric, BRAIN-DELIVERY-v2 and BG169 remain the release authorities.
- **Reusable lesson:** waiting is not success, and local activity is not outcome proof. Completion evidence must be independently produced, exact-identity-bound and consumed by the same durable obligation lineage.

## 2026-08-31 00:02 CEST — CONTRACT_CHANGE — manual connector writes require candidate branch
- **Fingerprint:** `repository|manual-connector-write|default-main-bypass`
- **Signal:** a handmatige GitHub connector-write zonder expliciete `branch` kan naar de default branch schrijven. In deze chat zijn daardoor geheugen-/testwijzigingen rechtstreeks op `main` beland terwijl de bestaande regel `NEVER_TDD_DIRECTLY_ON_MAIN` al gold.
- **Impact:** candidate/PR-gates kunnen worden omzeild, RED-tests kunnen tijdelijk op productiebronwaarheid landen en post-push CI detecteert het probleem pas nadat de ref al is gewijzigd.
- **Root cause:** authorized connector capability werd behandeld als governed delivery. GitHub `main` is live waargenomen als `protected:false` met enforcement off; branch omission valt daardoor terug op de default branch en native platform enforcement voorkomt de write niet.
- **Evidence:** machine-readable lesson `MANUAL_CONNECTOR_WRITES_REQUIRE_CANDIDATE_BRANCH` en prevention rule `REQUIRE_CANDIDATE_BRANCH_FOR_MANUAL_REPO_WRITES` zijn via PR #670 gepromoveerd. Candidate `268170f348df8200e75afe95f81b126946a2b85b` had Shared Agent Memory GREEN en Unified BRAIN GREEN; exact-head merge resulteerde in `main` SHA `85c3e38972a930b06857d55594c478603d6ec5ee`; de post-merge Shared Agent Memory run op die SHA was success.
- **Known failed approach:** connector `create_file`/`update_file` gebruiken met branch omission of `main` als target en vervolgens een succesvolle post-push CI-run als preventiebewijs behandelen. Post-push CI is detectie, geen pre-write prevention.
- **Final fix:** iedere materiële handmatige repositorywrite moet eerst een verse niet-`main` candidate branch vanaf actuele `main` maken; iedere connectorwrite krijgt die branch expliciet; RED en GREEN zijn candidate-SHA evidence; daarna volgt Unified BRAIN, exact-head merge en post-merge readback. `branch omission` is geen governed delivery.
- **Owner:** Knowledge/Governance + Architecture/Integrator + alle repository writers.
- **Regression gate:** `tests/brain-chat-learning-complete.test.mjs` vereist de machine lesson/rule; `tests/development-doc-contract.test.mjs` vereist nu ook dat canonical checkpoint en ledger deze fingerprint, prevention rule en bewijsgrens behouden.
- **Verification:** TDD voor deze auditlaag: RED Shared Agent Memory run `33338009485` op candidate SHA `58f9ad0138399766414ff2557fad8506e2e8c870` faalde voordat checkpoint/ledger de nieuwe auditinformatie bevatten. GREEN Shared Agent Memory run `33338187573` op candidate SHA `037271ea490a55cc295f5f22df5712252428e6a3` slaagde daarna; een latere evidence-only correctie vereist opnieuw exact-head GREEN vóór promotie.
- **Platform enforcement boundary:** native GitHub branch protection/ruleset enforcement is nog niet bewezen en `main` is expliciet als `protected:false` waargenomen. Agent governance reduceert risico, maar volledige prevention is pas bewezen wanneer GitHub zelf een ongeautoriseerde directe main-write vóór ref-mutatie weigert.
- **Rollback/last-known-good:** de machine-readable prevention op `85c3e38972a930b06857d55594c478603d6ec5ee` blijft behouden; audit-documentatie mag bij regressie alleen via een nieuwe candidate worden hersteld, nooit via branchless main-write.
- **Reusable lesson:** onderscheid capability, governed delivery en platform enforcement. Een tool die mág schrijven is niet automatisch een veilige deliveryroute. Gebruik candidate branches als verplichte mutatiegrens en behandel post-push CI uitsluitend als detectie totdat native branch protection onafhankelijk bewezen is.

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

## 2026-09-11 — ERROR + RECOVERY — prijzen-cls-money-hero
- **Fingerprint:** `website|cls|money-hero|stijl.js|prijzen`
- **Signaal:** `website / browser` (UI visual regression) rood op `/prijzen phone initial: cls` en `/prijzen tablet initial: cls` — eerst bij #1379, daarna bij #1386. Productie gemeten: CLS 0,178 (390px) en 0,145 (820px); grens 0,1.
- **Oorzaak:** #1379 bracht `assets/stijl.js` (toestemmingslaag) terug in de build. Hetzelfde bestand bevat de money-page laag, die alleen `.p-hero` als bestaande hero herkent. De V18-schil bouwt de hero als `.held[data-bg-component="hero"]`, dus de laag injecteerde ±0,7 s na laden een `section.bg-money-hero` (463px) onder de ondertitel; payoff en intro schoven uit beeld. Geen lettertype-effect: met Google Fonts geblokkeerd bleef de verschuiving gelijk.
- **Fix:** `GEBOUWDE_HERO` in `assets/stijl.js`; een bestaande V18-hero wordt gehydrateerd (contract-attribuut + tracking op `.heldknoppen a`) in plaats van aangevuld. Lokaal na de fix: CLS 0,006 (390px) en 0,044 (820px); /prijzen heeft geen tweede blok meer, wel het besliskader onderaan.
- **Regressietest:** extra test in `tests/commercial-intent-pages-v1.test.mjs` (required-test).
- **Open:** `/afas-koppeling` heeft geen V18-hero en krijgt het blok nog wel; valt buiten de VR-check. `/assets/*` staat op `immutable` (1 jaar) en `stijl.js` heeft geen versie-query: bezoekers die sinds #1379 de oude versie cachten, houden die. Oplossen via een `_headers`-regel zoals `/assets/kop.css` — vraagt eerst registratie van `_headers` in `config/brain-delivery-system.json`.
- **Rollback:** revert deze commit; `/prijzen` krijgt dan weer het geinjecteerde blok.
- **Herbruikbare les:** een script dat terugkomt in de build brengt al zijn oude taken mee. Bij het weer inschakelen van een bestand eerst nagaan wat het nog meer doet dan waarvoor je het terughaalt.

## 2026-09-10 — OPPORTUNITY_EXPERIMENT — cta-conversiekleur
- **Fingerprint:** `website|cta|conversiekleur|isolatie-effect`
- **Signaal:** vraag van Arthur ("oranje knoppen worden beter geklikt"). Onderzoek: er is geen universeel beste knopkleur; wat meetbaar werkt is contrast met de omgeving (isolatie-effect / Von Restorff). De bekende HubSpot rood-vs-groen-test mat dat, niet de kleur zelf.
- **Diagnose:** de hero is donkerblauw en geel is overal accent (beeldmerk, markeerstift, "Grip", vinkjes, LEK-teller). De gele primaire knop viel daartussen weg. Blauw (#2742D6, knopkleur volgens de Notion-huisstijl) zou op de blauwe hero helemaal verdwijnen.
- **Besluit:** alle primaire actieknoppen oranje #FF4F17 (bestaande huisstijlkleur, komt verder niet voor, complementair aan het blauw), inkt-tekst #14171A (5,5:1), inktrand blijft, hover #FF6A3D (6,5:1). Secundaire knoppen (wit/omlijnd, `.knop.leeg`) en de gekozen filterchip (`.ask-chip.active`) blijven zoals ze zijn. Klantportaal valt erbuiten.
- **Inventaris (lokale build, desktop + 390px):** `.cta` (v17-signup, v17-signup-next, v18-btn-primary, jumbo, stil), `.hero-primary`, `.v18-btn-primary` (ook v18-mobile-cta), `.knop.geel`, `.btn.geel`, `.btn.primary`, `.hk.geel`, `.bg-knop`, `.kaart .knop:not(.leeg)` (de Pro-knop was blauw, nu ook oranje; Pro blijft herkenbaar aan kader en label), `.evidence-calc .primary`, `.scenario-action>a|button`.
- **Uitvoering:** `assets/cta-conversie.css` (specificiteit 0,4,0 via `:root:root :is(...)`, wint van de oudere !important-regels zonder de bevroren v18-kern aan te raken) + `tools/site-shell/cta-conversie.mjs`, aangeroepen in `tools/bouw-release-evidence.mjs` na `isolateStandalonePages()` en vóór `finalizeSiteContracts()`. De link is absoluut, zodat de finale contractlaag op 0 normalisaties blijft (relatief gaf 89 normalisaties).
- **Regressietest:** `tests/site-shell-cta-conversie.test.mjs` (idempotente koppeling, portaal uitgesloten, WCAG AA-contrast normaal en hover, filterchip en omlijnde knop buiten de regel, volgorde in de laatste buildstap), ingeschreven in `lane-website.yml`.
- **Baseline/metric:** er is geen baseline — GA4 staat (na #1379) op 15 pagina's, niet op de homepage. Metric zodra meting sitebreed staat: klikratio primaire knop per pagina en instroom op /zelfscan, /aanmelden en /frisse-blik. Verwacht effect klein (kleur 2–5% in de literatuur; tekst en frictie wegen zwaarder).
- **Rollback:** verwijder de aanroep `await applyConversionCta()` in `tools/bouw-release-evidence.mjs`; de knoppen zijn dan weer geel. Last-known-good: main vóór deze PR.
- **Owner:** website-lane. Bestanden staan onder `tools/site-shell/` en `tests/site-shell-`: nieuwe paden buiten een geregistreerd prefix in `config/brain-delivery-system.json` blokkeren preflight/plan/verify met `unclassified delivery path`.
- **Herbruikbare les:** kies een knopkleur op contrast met de eigen pagina, niet op een algemene kleurregel. Gebruik de knopkleur alleen voor knoppen, anders verdwijnt het effect.

## 2026-09-11 — IMPROVEMENT — asset-cache-stijl-js
- **Fingerprint:** `website|cache|netlify-headers|stijl.js`
- **Correctie op prijzen-cls-money-hero:** daar stond dat `/assets/*` een jaar `immutable` gecachet wordt. Op productie gemeten klopt dat niet: netlify.toml wint van `_headers`. `/assets/*.css` en `/assets/js/*` krijgen `max-age=3600, must-revalidate` uit netlify.toml; `/assets/stijl.js` viel alleen onder `/*.js` uit `_headers`: `max-age=604800` (7 dagen), zonder hercontrole.
- **Gevolg:** bezoekers die vóór #1387 de oude `stijl.js` cachten, zien de verspringing op /prijzen hooguit 7 dagen (tot uiterlijk 18 sept 2026).
- **Fix:** `[[headers]] for = "/assets/*.js"` met `max-age=3600, must-revalidate` in netlify.toml, hetzelfde vangnet als voor CSS. Registratie van `_headers` is niet nodig.
- **Regressietest:** `tests/site-shell-asset-cache.test.mjs` (geen immutable, must-revalidate, max-age ≤ 3600 voor `/assets/*.css`, `/assets/*.js`, `/assets/js/*`), ingeschreven in `lane-website.yml`. Lokaal rood zonder de regel, groen met.
- **Verificatie na deploy:** `curl -I https://www.bedrijfsgeheugen.nl/assets/stijl.js` moet `max-age=3600,must-revalidate` tonen.
- **Rollback:** verwijder het `/assets/*.js`-blok uit netlify.toml.
- **Herbruikbare les:** meet cacheheaders op productie in plaats van ze uit `_headers` af te lezen; netlify.toml en `_headers` stapelen, en de toml wint.

## 2026-09-11 — IMPROVEMENT — analytics-sitebreed
- **Fingerprint:** `website|analytics|ga4|consent|cta-klik`
- **Probleem:** GA4 met toestemming (#1391/#1395) kwam alleen op pagina's waarvan de bron een GA4-tag had. De homepage, /zelfscan, /frisse-blik, /aanmelden en /prijzen maten niets, dus het effect van de oranje knop (#1386) was niet te toetsen.
- **Fix:** laatste buildstap `tools/site-shell/analytics-sitebreed.mjs` zet op elke publieke pagina (klantportaal uitgezonderd): Consent Mode standaard geweigerd, `<meta name="bg-ga4">`, `assets/toestemming.js` en de toestemmingsbanner. Idempotent: pagina's die de schil al voorzag krijgen niets dubbel.
- **Eén bron:** `assets/toestemming.js` wordt bij de build gegenereerd uit het toestemmingsdeel van `assets/stijl.js` (geen tweede kopie). Op pagina's met stijl.js doet dat deel niets, zodat gtag.js nooit twee keer laadt.
- **Knopmeting:** event `primaire_knop_klik` (knop_tekst, link_url, page_path) op klik op een primaire knop, met exact de selectoren uit `assets/cta-conversie.css`, en alleen na toestemming.
- **Verificatie lokaal:** build 90/90 pagina's, finalize op 0 normalisaties (bannerlinks absoluut). Browser (390 en 1366 px) op /, /zelfscan, /prijzen: banner zichtbaar, geen Google-analytics vóór toestemming, na accepteren één gtag.js en het klik-event, CLS 0.
- **Regressietest:** `tests/site-shell-analytics-sitebreed.test.mjs` (7 tests), ingeschreven in `lane-website.yml`.
- **Rollback:** verwijder `await applySitewideAnalytics()` uit `tools/bouw-release-evidence.mjs`.

## 2026-09-11 — IMPROVEMENT — cls-lettertype-en-money-blokken
- **Fingerprint:** `website|cls|font-swap|money-page|prerender`
- **Probleem:** op telefoons verspringen veel pagina's boven de grens van 0,1 (live gemeten: /ai-scan 0,174, /security 0,153, /business-case-ai 0,134, /monitor 0,133, /expertises 0,126, /ai-governance 0,121, /zelfscan 0,109, /hoe-het-werkt 0,102). Twee oorzaken: (1) de wissel van terugvallettertype naar Instrument Sans/Bricolage (font-display: swap) liet tekst een regel korter worden — met Google Fonts geblokkeerd was de verschuiving weg; (2) stijl.js zette op money-pagina's met een .inhoud-kop-hero ±0,4 s na laden een blok van 432 px in de hero.
- **Fix 1 — `tools/site-shell/lettertype-terugval.mjs`:** maatgelijke terugval (@font-face met local Arial/Helvetica/Liberation Sans/Arimo en Roboto, size-adjust + ascent/descent-override, berekend uit de fontbestanden). swap blijft (besluit Notion 25: tekst nooit onzichtbaar). Stapels in inline CSS, style-attributen en assets/*.css krijgen de terugvallers.
- **Fix 2 — `tools/site-shell/money-prerender.mjs`:** draait het money-page deel van assets/stijl.js bij de build in een minimale nagebootste pagina en zet stijlblok, hero-blok en besliskader op dezelfde plek in de HTML (één bron). stijl.js voegt niets dubbel toe en koppelt nu de klikmeting aan vooraf geplaatste knoppen. Alleen pagina's die stijl.js laden; inhoud ongewijzigd.
- **Verificatie lokaal (build 90/90, finalize 0 normalisaties):** telefoon, oud → nieuw: /ai-scan 0,174 → 0,009; /zelfscan 0,109 → 0,002; /security 0,153 → 0,018; /monitor 0,133 → 0,001; /business-case-ai 0,134 → 0,026; alle 30 gemeten pagina's < 0,03. Geen dubbele money-blokken, knoppen hebben klikmeting.
- **Bewust niet:** het money-blok op /afas-koppeling e.a. weghalen — dat is de enige prijs+knop bovenaan die pagina's; het staat nu stil in plaats van dat het inschuift.
- **Regressietests:** `tests/site-shell-lettertype-terugval.test.mjs`, `tests/site-shell-money-prerender.test.mjs`, ingeschreven in `lane-website.yml`.
- **Rollback:** verwijder `await applyMoneyPrerender()` en/of `await applyLettertypeTerugval()` uit `tools/bouw-release-evidence.mjs`.

## 2026-09-18 — CONTRACT_CHANGE — Powerhouse continuity als cross-runtime skill
- **Fingerprint:** `powerhouse|skills|continuity|intrinsic-loop-node|canonical-writeback|v1`
- **Probleem:** continuity was al canoniek vastgelegd in policy, tests en Brain-learning, maar nog niet als discoverable cross-runtime skill. Daardoor kon een nieuwe agent de regel pas vinden via AGENTS/preflight in plaats van via skill discovery.
- **Root cause:** er bestond geen `.agents/skills/powerhouse-continuity/SKILL.md` entrypoint; de capability was bestuurlijk geborgd maar niet in de skill-laag geëxposeerd.
- **RED evidence:** commit `1036956cd74f5fa54801be353b3d761bcf558738` bevat de nieuwe required regression terwijl het skill-pad op diezelfde commit niet bestaat (GitHub readback: NOT_FOUND). De eerste CI-run werd door latere same-lineage commits superseded voordat uitvoering startte; de ontbrekende productiefile is daarom de deterministische baseline-failure.
- **Fix:** cross-runtime skill toegevoegd; `AGENTS.md` laadt hem direct na het agentcontract; continuity-policy registreert skill discovery; bestaande machine-readable learning en menselijke documentatie linken terug naar dezelfde authority.
- **Authority:** de skill is uitsluitend `DISCOVERY_AND_EXECUTION_GUIDANCE`; `brain/policies/powerhouse-agent-continuity-v1.json` blijft canoniek. Geen parallel brain of alternatieve truth.
- **Regressie:** `tests/brain-powerhouse-universal-agent-learning-writeback.test.mjs` vereist skill-frontmatter, kerninvarianten, LIVE & BEWEZEN, canonieke references en opname in `AGENTS.md`.
- **Owner agent:** Powerhouse continuity / shared-agent-memory owner.
- **Obligation:** `powerhouse-skill-continuity-learning-v1`; delivery-lineage PR #2034.
- **Rollback:** verwijder skill-discovery registratie, AGENTS-readorder en skillfile samen; behoud canonieke policy/learning. Geen gedeeltelijke rollback die een dangling skill-reference laat bestaan.
- **Herbruikbare les:** projectbrede gedragsregels die agents actief moeten herkennen horen als discoverable skill bovenop canonieke policy te bestaan én door required CI te worden bewaakt; skills mogen nooit de policy dupliceren als eigen authority.


## 2026-09-18 — CONTRACT_CHANGE — geen pending-status als terminale chat/agent-output
- **Fingerprint:** `delivery|no-pending-final-output|v1`
- **Probleem:** chats en agents konden een nog lopende delivery teruggeven als eindantwoord, bijvoorbeeld “auto-merge staat aan”, “de laatste gate loopt” of “ik claim nog geen LIVE & BEWEZEN”. Daardoor verschoof praktische opvolging terug naar de gebruiker terwijl de Powerhouse-node de delivery zelf kon vervolgen.
- **Root cause:** de continuity-regels verboden wel een onterechte LIVE-claim, maar verboden nog niet expliciet dat recoverable delivery-states als gebruikershandoff werden gebruikt.
- **Fix:** `brain/policies/powerhouse-agent-continuity-v1.json` v1.4 voegt `NO_NON_TERMINAL_DELIVERY_STATUS_AS_FINAL_CHAT_OUTPUT` en een machine-readable `non_terminal_output_rule` toe. De continuity skill en delivery-concurrency skill vereisen nu dat de uitvoerende node ownership houdt door gates → protected merge → deploy/promote → productie/provider-readback → outcome → learning/prevention writeback.
- **Verboden terminale tussenstaten:** `AUTO_MERGE_ARMED`, `GATES_PENDING`, `CI_QUEUED`, `CI_RUNNING`, `MERGE_PENDING`, `DEPLOY_PENDING`, `PRODUCTION_READBACK_PENDING`, `LEARNING_WRITEBACK_PENDING`.
- **Toegestane terminale gebruikersstatus:** uitsluitend `LIVE_BEWEZEN`, `ROLLED_BACK_GREEN` of een aantoonbare `BLOCKED_HARD_BOUNDARY`.
- **Recoveryregel:** een chat/tool/model-stop draagt ownership niet over aan de gebruiker; de volgende capabele node hervat dezelfde canonieke lineage vanaf het laatste geverifieerde checkpoint zonder een “ga door”-prompt nodig te hebben.
- **Regressie:** `tests/brain-powerhouse-universal-agent-learning-writeback.test.mjs` borgt de policy-, skill- en terminal-state-invarianten.
- **Delivery evidence:** PR #2099 is protected gemerged; merge/main SHA `a7d9311e6420258f2d3e476ad9f6bb1cd4927ba4`; main-readback bevestigde policy v1.4, invariant, skillsectie en regressietest.
- **Herbruikbare les:** auto-merge, CI, branch protection en deploy orchestration zijn uitvoeringsmechanismen. Zij mogen nooit als handoff naar de gebruiker fungeren zolang een autonome herstel- of vervolgstap bestaat.

- **PR #2104 complete borging closure:** protected merge/main SHA `971a3f762dd0c63e8abd87f089e5574ec7860527`; main-readback bevestigde learning, ledger, self-healing docs, continuity skill, delivery-concurrency skill en regressie. Borging zelf geldt voortaan als materiële writeback en valt onder dezelfde terminale bewijsregels.

- **Closure-recovery evidence:** tijdens de terminale borging zijn twee extra preventies bewezen: synthetische delivery-SHA's moeten aan hetzelfde hex-contract voldoen als runtime-heads; en de /prijzen-teller mag op mobiel niet tegelijk als fixed inner cell en sticky row functioneren. De mobiele cel wordt daarom binnen <=900px `position:static`, terwijl desktop fixed blijft. Fingerprints: `delivery-test-fixture|valid-head-sha|required-v1` en `website|prijzen|mobile-fixed-sticky-cls|v1`.


## 2026-09-18 — RECOVERY_LEARNING — toolchain-authority productieclosure
- **Fingerprint:** `powerhouse|toolchain-authority|release-learning|v1`
- **Parent authority:** `powerhouse|toolchain-authority|composio-no-make|v1`.
- **Incident:** PR #2134 was protected merged, while Netlify production readback still referenced the immediately preceding main commit. The first recovery candidate then failed admission because canonical delivery metadata was absent; the next revision failed Brain planning because its proof file used the unclassified path `docs/ops/...`.
- **Root causes:** merge→provider promotion is asynchronous; recovery metadata was not preflighted before PR creation; proof-path selection was not checked against Brain membership before write.
- **Fix:** ownership stayed open; recovery PR #2141 received canonical metadata; the proof was moved to the classified `docs/learning/` route; Required + BRAIN both passed and protected merge completed at `fd594b6e3118f089755e27785df8e01123c2e6a6`.
- **Preventieregels:** `PRODUCTION_DESCENDANT_READBACK_REQUIRED`; `RECOVERY_PR_METADATA_PREFLIGHT_BEFORE_CI`; `CLASSIFY_EVIDENCE_PATH_BEFORE_WRITE`.
- **Skill projection:** `.agents/skills/powerhouse-toolchain-authority/SKILL.md` now requires those checks before future recovery/delivery work.
- **Machine learning:** `brain/learning/2026-09-18-toolchain-authority-release-learning-v1.json`.
- **Herbruikbare les:** een fail-closed gate is bruikbare systeemintelligentie. Repareer de oorzaak in dezelfde lineage; omzeil admission, classification of production-readback nooit om sneller live te kunnen claimen.

## 2026-09-18 — LIVE_BEWEZEN — runner-capacity recovery closure
- **Fingerprint:** `delivery|runner-capacity|live-closure|v1`
- **PR:** #2132
- **Candidate:** `6290eebf1a50a39f11f14d095ab7d503fe468cc3`
- **Protected merge/main:** `95ea2a673c8a3f801aea77cf8b3a81ae1232aea9`
- **Gates:** Required success; BRAIN success; CodeQL success; skill projection success.
- **Production:** Netlify deploy `6aad2cc7bfe37a0008c5d325`, state `ready`, context `production`, exact `commit_ref=95ea2a673c8a3f801aea77cf8b3a81ae1232aea9`.
- **Learning:** metadata preflight before CI; full-main-union on reconciliation; preserve previous learning/tests; exact production readback before LIVE_BEWEZEN.
- **Machine-readable:** `brain/learning/2026-09-18-runner-capacity-live-closure-v1.json`.
