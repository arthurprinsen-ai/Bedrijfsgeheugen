# Append-only delivery ledger — future-dated value guard

Date: 2026-10-23
Canonical obligation: `brain|autonomous-improvement|future-dated-value-evidence-guard|20261023-v1`
Owner: [#4358](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4358)
Candidate: [#4755](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4755)

- **OBSERVED:** Original existing Brain runtime `freshnessWeight` clamps negative age to zero, meaning future evidence is treated as entirely fresh; numeric confidence outside [0,1] can still yield `value_known=true`.
- **PRE-WRITE OBLIGATION:** Canonical parent #4358 comment #6362523231 recorded scope, owner, expected SHA, safety boundaries and regression before branch mutation.
- **SOURCE CANDIDATE:** The same existing `autonomous-runtime.mjs` ranks only possible timestamps and valid confidence, without touching existing Supabase scheduler, security, data storage or customer values.
- **NEGATIVE REGRESSIONS:** Future value, invalid timestamp, out-of-range confidence and invalid reference clock cannot be promoted as known. Positive and negative legitimate observations remain known.
- **INITIAL GATE FAILURE:** Required hygiene failed `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger,brain_learning,human_documentation`; this is addressed by this semantic learning record and human/ledger artifacts, not by disabling the rule.
- **PROTECTED RELEASE:** Exact-head tests, Required, CodeQL, main-readback and actual deployment evidence are required; until then NOT LIVE.
- **BUSINESS EFFECT:** Unknown. No fabricated revenue, ROI, agent superiority, measured runtime acceleration or tenant adoption claimed.

No parallel Brain, new cron, model activation, change to prior applied migrations, public data grant or external public communication.
