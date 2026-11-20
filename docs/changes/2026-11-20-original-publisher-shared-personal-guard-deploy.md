# 20 Nov — original personal social-publisher shared gate must deploy as well

## Production-readback evidence
Original protected PR #6072 merged and native Supabase deployed the personal claim-source-scoped module into `powerhouse-content-orchestrator` **version 1129** and independent `bg-pre-publish-review` **version 1081**, both independently inspected via `get_edge_function` with `personalFounderDecisionSourceScopeViolations` and the two explicit veto codes.

But the original `powerhouse-social-publisher` deployed version **1347** from an older build and its live source files did NOT include `personalFounderDecisionSourceScopeViolations`. The publisher continued to contain prior `personalLastMilePublicationViolations`, but because the shared module is bundled per deployed edge function its old version cannot enforce the new exact source-scope code. Thus initial #6072 is *not* proof of end-to-end last-mile source guard in the real publisher. This is a separate missing-deployment-surface incident, not a 403 member-auth problem.

## Fix and acceptance
Change the already-original provider writer to explicitly import and invoke `personalFounderDecisionSourceScopeViolations` against exact outgoing commentary and the verified original source evidence BEFORE any LinkedIn provider create. Keep all existing source, member, independent review, content digest, one-time publication authority, idempotency and provider-readback gates, no new executor. Existing `personalLastMilePublicationViolations` still applies. Regression checks the source guard's exact code, source-only claims vs achieved effects, and explicit pre-provider ordering. Update original personal skill and ONE BRAIN.

Protected Required, CodeQL and native deployment must pass. Independently read back **three** original Supabase function bundles and confirm the new shared gate is present in all relevant importers (especially `powerhouse-social-publisher`), not just a GitHub merge or reviewer. Post urn `urn:li:share:7529541605742018561` is already consumed and must never be reissued; prior independent LinkedIn GET remained 403, so public copy still unverified and correction is a separate action.

Reference: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/6072
