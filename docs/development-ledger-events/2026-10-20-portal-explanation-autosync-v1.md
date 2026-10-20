# Portal explanation freshness

Fingerprint: `portal-explanation-autosync-20261020-v1`
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215#issuecomment-6296551772

Baseline: source snapshot 08a6af19, architecture observedAt October 7; inventory drift and obsolete default-tab assertion reproduced. Live public JS SHA256 a1f8589d9218319cf63c9c62b8f3bb6a66e05306708c61d108a498462108c811 matched audited source. Root cause: manually maintained inventory and no current required/daily freshness check.

Fix: deterministic same-source inventory refresh/check; existing Netlify build, Required test and daily self-evolution integration; source-versus-runtime wording and legacy Buffer correction. Existing assurance automation updated in place, schedule retained, successful provider response.

Validation: 16 focused tests pass including temp-repository add/delete/content drift and idempotent write; full Portal V2 suite 586/586 passed after final copy updates. No provider database counts fabricated.

Release status: candidate, protected promotion and exact live readback still required; no production success claimed here.

Additional audit: two legacy suites have seven failures reproduced unchanged on an isolated HEAD baseline: brain-powerhouse-observability-command-center-v1 (obsolete hubs/copy assertions, 2 failures); brain-powerhouse-observability-outcome-contract (5 references to a migration moved out of supabase/migrations). These pre-existing suite failures do not constitute new regressions and are not hidden or counted as passed.
