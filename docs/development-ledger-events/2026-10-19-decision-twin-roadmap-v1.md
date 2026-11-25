# Decision Twin scenario → authorized review proposal — 19 October 2026
Obligation-ID: `decision-twin-roadmap-proposal-20261019`
Fingerprint: `powerhouse|portal-v2|decision-twin-roadmap-proposal|v1`
Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4442

## Before
The tenant-scoped Foresight studio could calculate and label hypotheses but only linked to next-best-actions. It could not create a persistent, reviewable scenario proposal. No one should confuse an analytical simulation with approved execution or realized value.

## Change
`buildScenarioRoadmapProposal` validates the current tenant ID, a proven WHAT_IF_NOT_PREDICTION arithmetic scenario (30/90/180/365 days, bounded nonzero 5%-step sensitivity), three different historical reference IDs, goal identifier, and duplicate sourceFingerprint. It returns a review-only draft containing baseline/simulated assumptions, provenance, null expected/realized value and `providerDispatchAllowed=false`.

The Foresight screen adds a user-clicked save control. At click time, it re-reads the domainState and rebuilds the forecast so a stale UI cannot write against another tenant. It writes only to existing `portal.roadmap.items` and awaits the existing `flush` response before showing confirmed save. There is no new database, cron, connector, AI model enablement or external provider dispatch.

## Prevention
Replay `tests/brain-decision-twin-roadmap-proposal-v1.test.mjs`; retain outcome-proof and financial tenant gates. Production closure requires protected Required CI/CodeQL, exact main merge, Netlify provider-deploy SHA match and authenticated portal browser acceptance. User action is required to create each proposal.
