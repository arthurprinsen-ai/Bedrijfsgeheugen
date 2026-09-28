# Auxiliary workflow trigger fan-out prevention — activity ledger

Date: 2026-09-28
Obligation: auxiliary-workflow-trigger-fanout-v1
Trigger evidence: PR #3252 started SEO growth intelligence, Fresh Device Canary and Powerhouse Assurance solely from generic delivery-control-plane roots.

Implemented:
- removed three generic trigger roots;
- explicit lane ownership for SEO workflow definition and Fresh Device workflow definition;
- trigger-scope regression;
- delivery-lane regression;
- domain-specific trigger inputs preserved.

Expected effect:
- fewer independent GitHub Actions runs per control-plane SHA;
- lower queue/fan-out pressure;
- no loss of domain validation when SEO/assurance/device surfaces actually change.
