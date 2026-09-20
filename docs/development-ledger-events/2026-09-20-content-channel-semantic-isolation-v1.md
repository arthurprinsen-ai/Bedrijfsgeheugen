# Content channel semantic isolation v1

- Obligation: `content-channel-semantic-isolation-v1`
- Incident: personal printer content leaked into the company artifact; personal rewrite became too generic for its truth gate.
- Root cause: recommendation scoring occurred before hard channel eligibility; final personal semantics were only checked downstream.
- Fix: deterministic company/personal recommendation separation, company campaign-link materialization and personal final-copy invariant before artifact persistence.
- Runtime status remains evidence-driven; deployment and today's publication recovery require protected merge and provider/public readback.


## Production readback

- Protected merge: `56618d748a9b0d417b0198086aa097b4ef36b1ef`.
- Supabase Edge Function: `powerhouse-content-orchestrator` v15, ACTIVE.
- Exact-source readback: production source equals current `main` source.
- Semantic-isolation markers present in production: `recommendationEligible`, `personalFinalCopyValid`, `COMPANY_TRACKING_LINK_WRITE_FAILED`.
- Closed-loop readback proves fail-closed behavior: company lane is no longer populated from the prior personal recommendation; personal copy remains blocked if it loses the concrete first-person event.
- Terminal status of this control: `LIVE_PROVEN`. Downstream publish blockers remain separate obligations and are not hidden by this proof.
