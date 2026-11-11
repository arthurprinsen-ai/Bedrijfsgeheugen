# P0 #4215 — Portal V2 identity-hydration and overlapping-field writeback recovery

Obligation-ID: portal|v2|deep-link-hydration-and-overlapping-source-snapshots|20261111-v1
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Original production source: PR #5596, merged SHA `8220286effffce70d436b58d4ce5f3dbec2907c1`; Netlify deploy `6af404a98712ccea070b9e08`, READY, exact source match.
Actual original independent E2E run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/42969509727 — **12 passed, 4 failed, 1 skipped**. Not full portal acceptance.

## Root causes
1. The app's initial `portalVisualAuthSubject=null` differed from the first anonymous subject `''`. After the router had rendered an initial ?page= deep link, the delayed identity notification could emit a false tenant-switch boundary, close the valid page, and clear its native DOM. The browser saw `aria-hidden=true` or an absent AI-scan workspace. A genuine tenant switch must STILL delete the previous tenant's private DOM.
2. Two related edits such as `portal.strategy.horizon` then `portal.strategy.dna.ambitie` use distinct original Brain model bindings. The parent snapshot captured before the second edit no longer matched the authoritative current child state, triggering `PORTAL_BRAIN_REPLAY_SOURCE_CONFLICT` even though both fields came from the same authorised user before the original flush. The existing fail-closed test for a stale external writer MUST remain valid.
3. The mobile browser run lost its execution context while navigating; this is a separate acceptance symptom, not evidence of successful mobile behaviour.

## Original-code repair
- Initialise the visual identity subject to the anonymous sentinel. Genuine changes of a non-anonymous tenant still clear private mounted DOM as before.
- After original identity hydration, re-open only the current, valid deep-link when the view remains hidden, through the original entitlement/security gate. Refuse if the authenticated principal changed during hydration.
- When a fresh edit overlaps an already-tracked ancestor/descendant BusinessInput section, refresh the related local pre-submit snapshots from the exact same current domain revision. Do NOT replay an already-persisted stale source from another writer: original source-conflict guard stays in place.
- Add focused regression tests in `portal-v2/tests/portal-overlapping-field-handoff.test.mjs` and `tests/brain-portal-identity-overlap-browser-20261111.test.mjs`.
- No new table, duplicate content pipeline, browser storage, polling loop, authentication bypass or customer data copy.

## Acceptance — no fake green
Exact-head Required/BRAIN/CodeQL; protected main merge; exact-source Netlify production publication; independent Portal DOM/browser E2E rerun (original four failures plus green prior checks); authorized two-tenant real write / durable reopen / original Brain/Heartbeat ACK. The full `#4215` cannot close without the broader original field and provider coverage and consumer-outcome proof. A browser test running under public demo credentials does NOT prove authenticated customer persistence.
