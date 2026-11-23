# Trusted Advisor — customer truth and portal proof (12 November 2026)

**Obligation:** `portal|trusted-advisor-evidence-integrity|20261112-v1`
**Owner:** existing Portal V2 Trusted Advisor assurance and original CMS/website writer.
**Parent incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Observations (source facts)
- Public `/contact` promised two-minute free scan and emailed report. Actual original `/zelfscan` route has 12 questions, approximately 3 minutes, immediate indicative outcome without required email or account.
- `zelfscan.html` contained unused completion markup with an old one-working-day automatic email promise, visible to text extraction.
- `portal-v2/trusted-advisor-assurance.js` counted unknown `healthy` as positive and generic `ok` outcome as verified without independent evidence reference.
- Public `/portal-v2/` presents illustrative-looking scores and results that need an explicit and early demo/live differentiation before numbers are shown; no verified customer outcome can be inferred from these.
- Broad site claims such as universal "In twee weken draaiend" must be reconciled with genuine scope and actual contractual delivery. The separate paid Frisse Blik journey must never be conflated with free anonymous selfscan.

## Root cause
Inconsistency between marketing promises, the actual customer route and the assurance verifier. A self-named Trusted Advisor status is not trust evidence. General transport success was upgraded to evidence of real-world outcomes.

## Bounded correction
The original source code, not a parallel agent, enforces strict source health, per-outcome evidence/receipt, plain source-first wording and consistent scan text. Existing policies, editorial skill and regression tests record the rule.

## Delivery incident / learning
The initial PR admission failed from missing machine metadata; corrected on the original PR. Next admission was ADMITTED but integration closure failed because the same source candidate lacked `activity_ledger` and `brain_learning`. Correct the same PR with this ledger and linked JSON learning artifact. Never erase historical red checks, bypass branch protection or label terminal proof without an independently checked merge and exact live SHA.

## One canonical handoff
Tenant-bound Portal V2 input → BusinessInput revision → ONE BRAIN original obligation → Powerhouse/Heartbeat → sourced advisory decision → provider/runtime readback → customer outcome measurement and learning. Preserve source revision, owner, idempotent key, actual consumer processed acknowledgement and explicit evidence gap for incomplete lineage.

## Proof due
- exact-head test and Required/BRAIN/CodeQL checks; protected PR merge;
- canonical Netlify site exact-SHA production readback for contact/selfscan plus browser-level copy visibility;
- authenticated portal page with real tenant, empty and demo states; no false green assurance;
- mobile/desktop controls and public contact navigation;
- 7/14/28-day actual source-qualified contact/scan-to-lead metrics. No improved customer trust, traffic, sales, revenue or all-green claim without independent results.

**Release classification at source edit:** IMPLEMENTED_CANDIDATE; production release and customer uplift not yet verified.
