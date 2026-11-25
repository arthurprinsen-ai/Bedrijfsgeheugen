# Development ledger · Agent Intelligence quality report · 2026-10-23

**Owner / existing lineage:** [Portal Next #4547](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547) and [Agent Intelligence #4747](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4747). No second scheduler, incident store, token store or writing agent.

**OBSERVATION:** The protected Agent Intelligence cockpit showed daily event counts, source activity, failure signals and proven learning records but lacked an explicit cross-domain evidence rubric. Activity is not customer value, passing CI is not necessarily a published release and a trace ID is not a trace-grade.

**ROOT CAUSE:** No single read-only quality classification view grouped the distinct proof requirements for CI, incidents, traces, learning, provenance, customer outcomes and privacy. Absence of evidence must not be converted into zero-error or 100% compliance assertions.

**SOURCE FIX:** Add a seven-domain Quality Report to the existing authenticated learning tab. Reuse current runtime data and strict allowed HTTPS proof URLs. Never introduce a new scoring database or release writer.

**PROTECTION:** Missing source/cohort remains UNKNOWN or NOT VERIFIED; deduplicate events and customer outcomes; tenant/product/learning evidence is required for a verified outcome; escape untrusted text; require current-main CI and protected deployment.

**HISTORICAL REGRESSION:** `node --test tests/brain-agent-intelligence-analytics.test.mjs`, including missing dataset, duplicate events, exact tenant proof and XSS evidence, through protected Required CI. First attempt correctly blocked on missing learning canonicalization fields; second exposed case-sensitive heading assertion; subsequent admission surfaced missing activity ledger. These were corrected without bypassing safety gates.

**RELEASE:** candidate until exact SHA Required, CodeQL, protected merge, Netlify commit equality, authenticated portal production readback and independent customer evidence. Declaring an actually better model or incremental revenue remains prohibited until proved.

**PREVENTION:** Deliver semantic learning evidence + activity ledger + human change docs in the same canonical PR; never paint scorecards green from activity-only signals.
