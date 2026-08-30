# Test prototype page recovery — 2026-08-29

## Incident
Production preserved many legacy HTML files but lost the page-like information architecture that users had accepted in the Netlify test prototype. The V18.6/V18.8 prototype implemented primary website sections as in-document interactive views rather than standalone routes. Production promotion treated the prototype primarily as a homepage/runtime source, so those accepted views were not promoted as equivalent production pages.

## Verified source
- PR #110
- head SHA `5a8cc121691200231f9b7a00eed5fdcff9764678`
- file `prototype-v18-6.html`
- accepted views: Problemen, Oplossingen, Platform, Prijzen, Cases, Kennis, Over ons, Frisse Blik, Inloggen, Aanmelden.

## Root cause
Semantic/UI acceptance was attached to a prototype artifact instead of a route-level website baseline. File-presence and SEO checks therefore stayed green while accepted page experiences disappeared.

## Recovery
The accepted test views Problemen, Oplossingen, Prijzen, Cases and Kennis are restored as real routes. Over ons is restored to the test-prototype semantics (`Ons geloof`, `Ons verhaal`, `Onze missie`, `Van chaos naar grip en controle`). The accepted baseline and navigation catalog now point at the PR #110 test source.

## Failure fingerprints discovered during recovery
These fingerprints are now reusable evidence for future agents. They must be recognized before repeating exploration.

### F1 — Runtime shell race
**Symptom:** browser smoke test reaches `DOMContentLoaded`, but the mobile `Menu openen` button does not exist yet on recovered routes.

**Cause:** canonical header/footer were injected later by `assets/recovered-page-shell.js`. The browser and tests could observe a temporary incomplete DOM.

**Fix:** treat the canonical shell as a first-class page dependency. Source-based checks materialize it before parsing; runtime smoke verifies the real rendered shell. Do not add a second competing mobile-navigation implementation.

**Prevention:** if a critical navigation/control element is required at initial interaction time, tests must assert it at the same lifecycle point users/tests depend on. Runtime-only decoration may not own critical site structure.

### F2 — Runtime DOM green, source SEO red
**Symptom:** browser navigation worked while source-based page/SEO checks reported missing canonical links/navigation.

**Cause:** two validators were observing different representations: Playwright saw the post-JS DOM; the SEO validator intentionally parsed source HTML.

**Fix:** `.github/scripts/sitecustomize.py` materializes the same canonical V18 header/footer in the temporary CI checkout before source-based validation.

**Prevention:** every validator must declare whether it checks source, built artifact or runtime DOM. When the product uses a shared runtime shell, source-based quality checks must materialize the canonical equivalent rather than silently validating a structurally different document.

### F3 — Stale guardian encoded implementation, not outcome
**Symptom:** `V18 Production Promotion` stayed red although browser and SEO gates were green. The guardian required every standalone source file to literally contain every primary `href`.

**Cause:** the regression test protected a former copy-paste implementation instead of the architectural invariant.

**Fix:** the guardian now checks the real contracts separately: standalone routes use the shared shell, the accepted seven-route catalog remains protected, contextual route connectivity remains present, and `assets/js/menu.js` is the single mobile-navigation owner.

**Prevention:** tests must protect user-visible outcomes and ownership boundaries, not an obsolete implementation detail. When architecture changes intentionally, migrate the test to the new invariant in the same change.

### F4 — Orphan route in restored cluster
**Symptom:** `/kennis` existed and was valid, but no recovered content page linked to it contextually.

**Cause:** route restoration focused on existence and primary navigation but missed contextual internal-link connectivity.

**Fix:** add a real content-level path to `/kennis` from `/problemen`.

**Prevention:** restored or newly introduced primary pages must have both global-navigation exposure and at least one meaningful contextual incoming path where appropriate. Page existence alone is not sufficient information architecture.

### F5 — Duplicate mobile menu ownership
**Symptom/risk:** recovered pages originally carried their own mobile drawer behavior while the production V18 shell already had `assets/js/menu.js`.

**Cause:** recovery code duplicated an existing platform responsibility.

**Fix:** `assets/test-prototype-pages.js` is only a compatibility marker; `assets/js/menu.js` is the sole mobile navigation owner.

**Prevention:** before adding JS behavior, identify the existing owner. Do not create a second implementation for the same responsibility unless an explicit migration contract exists.

### F6 — No-op commit triggered expensive full reruns
**Symptom:** an administrative update produced a new commit SHA without changing file content, causing Netlify/CI quality gates to run again.

**Cause:** a write was used where no repository-content change was needed.

**Fix:** avoid content writes for metadata-only communication. Reuse already-green evidence when the artifact/content SHA is unchanged; do not intentionally churn commit SHAs.

**Prevention:** agents must compare desired content with current content before writing. If bytes are identical, do not create a commit. Treat unnecessary CI/deploy reruns as a cost/performance defect.

### F7 — Green must refer to the exact candidate SHA
**Symptom/risk:** repeated fixes moved the branch head while older green runs still existed.

**Cause:** it is easy to accidentally cite green evidence from a superseded candidate.

**Fix:** every final release claim is tied to one exact head SHA and its own workflow/deploy evidence.

**Prevention:** after every write, invalidate prior release evidence for promotion purposes. Re-run or re-bind required gates to the new exact SHA. Never promote based on a predecessor's green run.

## Verified recovery evidence
For candidate `eb27982ecc5f25af06a71333a52a91f7d7a78b30` the recovery loop reached:
- V18 Production Promotion: PASS;
- Live Preview Smoke: PASS;
- Pagina- en SEO-controle: PASS;
- Shared Agent Memory Tests: PASS;
- Netlify preview status: exact candidate accepted;
- V18.8 HTML contract: PASS;
- hero video asset: PASS;
- browser navigation/runtime: PASS;
- desktop and mobile visual capture: PASS.

A later no-op commit changed the branch SHA without changing the guarded content. It must not be interpreted as new product behavior; exact-SHA gates still apply before any promotion decision.

## Permanent invariants
1. A production promotion may not collapse, omit or replace an accepted test/prototype view merely because other HTML files still exist.
2. Accepted information architecture is a first-class release contract. Every accepted primary view must resolve to a real production route or an explicitly accepted equivalent.
3. Unexpected semantic or route drift is RED and restores the last-known-good accepted experience before promotion.
4. Browser/runtime, source/SEO and release-contract gates protect different layers and must all agree on the same candidate.
5. Critical navigation has one canonical owner; recovered pages reuse it rather than fork it.
6. A route is not fully restored until it is reachable, internally connected, semantically correct and tested on desktop/mobile.
7. Tests must encode invariants, not accidental implementation structure.
8. A repository write that produces no content change is waste: avoid it so CI, Netlify and agent tokens are not consumed unnecessarily.
9. Every discovered failure must become a fingerprint + root cause + fix + automated prevention rule before the incident is closed.

## Faster path next time
When a user reports that accepted website pages have disappeared or changed:
1. identify the exact accepted prototype/release SHA first;
2. compare route inventory and semantic anchors before rewriting content;
3. restore only missing/drifted protected views, preserving later security/Brain/infrastructure work;
4. reuse the canonical shell instead of cloning headers/menus;
5. run contract, browser and SEO validation in parallel where independent;
6. inspect only failing evidence, not all logs;
7. after each fix, bind evidence to the new exact SHA;
8. stop writing once the candidate is green; metadata-only updates must not churn the SHA;
9. promote only after exact production/preview evidence and the applicable approval boundary are satisfied.
