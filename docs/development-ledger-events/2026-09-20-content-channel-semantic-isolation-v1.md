# Content channel semantic isolation v1

- Obligation: `content-channel-semantic-isolation-v1`
- Incident: personal printer content leaked into the company artifact; personal rewrite became too generic for its truth gate.
- Root cause: recommendation scoring occurred before hard channel eligibility; final personal semantics were only checked downstream.
- Fix: deterministic company/personal recommendation separation, company campaign-link materialization and personal final-copy invariant before artifact persistence.
- Runtime status remains evidence-driven; deployment and today's publication recovery require protected merge and provider/public readback.
