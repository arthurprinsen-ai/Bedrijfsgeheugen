# Portal explanation freshness

Fingerprint: `portal-explanation-autosync-20261020-v1`
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215#issuecomment-6296551772

Baseline: source snapshot 08a6af19, architecture observedAt October 7; inventory drift and obsolete default-tab assertion reproduced. Live public JS SHA256 a1f8589d9218319cf63c9c62b8f3bb6a66e05306708c61d108a498462108c811 matched audited source. Root cause: manually maintained inventory and no current required/daily freshness check.

Fix: deterministic same-source inventory refresh/check; existing Netlify build, Required test and daily self-evolution integration; source-versus-runtime wording and legacy Buffer correction. Existing assurance automation updated in place, schedule retained, successful provider response.

Validation: 16 focused tests pass including temp-repository add/delete/content drift and idempotent write; full Portal V2 suite 586/586 passed after final copy updates. No provider database counts fabricated.

Release status: candidate, protected promotion and exact live readback still required; no production success claimed here.

Additional audit: two legacy suites have seven failures reproduced unchanged on an isolated HEAD baseline: brain-powerhouse-observability-command-center-v1 (obsolete hubs/copy assertions, 2 failures); brain-powerhouse-observability-outcome-contract (5 references to a migration moved out of supabase/migrations). These pre-existing suite failures do not constitute new regressions and are not hidden or counted as passed.

Candidate admission found missing learning compiler metadata (LEARNING_FAILURE_CLASS_REQUIRED). Corrected the existing record with METADATA_DRIFT/CI and real historical-replay test paths; canonicalization evaluation passes before retry. No gate relaxed.

Browser freshness: the live portal served unversioned module imports with Cache-Control max-age=604800. The existing build now versions the entry and local JS import graph (plus styles) using a normalized source-content fingerprint. Real portal source changes invalidate entry/import URLs; repeated builds keep the same fingerprint. This operates only on the built artifact, not a second runtime/store/scheduler. Source checks normalize the generated query marker. Preview/production readback must confirm the fingerprint in entry and imported modules.

Built-artifact cache probe: 141 Portal V2 production JS modules parsed before/after versioning; zero new syntax failures. Existing unused parity-certificate.js syntax failure reproduced in unmodified source and recorded separately. Asset stamp and source-check are idempotent, and a formula-source change changes entry/import cache keys.
