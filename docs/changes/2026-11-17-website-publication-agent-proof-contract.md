# Website publicatiestatus: onafhankelijke bewijzen voor deploy, dagartikel en ONE BRAIN — 17 november 2026

Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232
Original backlog owner PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5934
Fingerprint: powerhouse|daily-blog|old-candidate-behind-main-no-recovery|20261117-v1

## Live readback, 17 november 2026
- Netlify productie website READY, deployment 6afc13fecd16a265ddf6cef4, exact SHA 53a6c99de87e987333cdc49b762119927af8abf1, publicatie 08:46:25 UTC. Homepage readiness does not prove the blog URL.
- Original blog 15 november: LIVE_PROVEN on 17 november 08:49:35 UTC. Two-day delivery lag.
- Original blog 16 november: APPROVED, no published_at/live_proven_at; original PR #5918 open.
- Original blog 17 november: GENERATED, no approved_at, no proven publication.
- Original same-owner backlog repair PR #5934: Required test and Powerhouse CodeQL success on exact head db7c9937aa6fca6b55010caef64b80a8fc060520; protected squash merge rejected GitHub 405 '3 of 3 required status checks are expected'. No unauthorized merge attempted.
- Existing ONE BRAIN observed failure via original public.brain_observe_failure; occurrence production:2026-11-17:powerhouse-blog:pr5934:405-required-contexts. Parent issue #5232 updated.

## Change to inherited agent contract
AGENTS.md and the original Powerhouse continuity SKILL.md now explicitly require three independently read-back dimensions: (1) exact deployed main/Netlify SHA; (2) original day blog approved status, public canonical article GET + content match, published_at/live_proven_at; (3) original ONE BRAIN consumer PROCESSED plus separate measurement and applied learning. Neither approval nor a generic HTTP200 qualifies as a publication. Case-based next actions route GENERATED to original approval; APPROVED-but-not-live to original GitHub hourly blog publisher and original PR; LIVE_PROVEN-but-not-consumed to original #171 consumer. No fabricated ACK, no manually advanced status, no bypass, no new scheduler.

## Release and acceptance
The narrow skill/agent candidate is not a runtime fix. Validate dependency-free regression tests, Required, CodeQL and protected merge. In the original #5934 scope the existing owner must update an obsolete branch via expected_head_sha and await exact-head required checks. Then confirm next natural original publisher run, new Netlify exact SHA and public article GET, original Supabase LIVE_PROVEN, ONE BRAIN PROCESSED and measured outcome before green. Preserve missing evidence as OPEN with owner and next safe action. Do not override writer lease or start a second publisher.
