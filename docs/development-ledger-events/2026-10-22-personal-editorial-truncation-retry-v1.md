# 2026-10-22 — source-backed personal LinkedIn revision: bounded incomplete JSON retry

Fingerprint: `powerhouse|personal-editorial-truncation-bounded-retry|20261022-v1`; parent production obligation: P0 #4439 and 22 October LinkedIn personal.
BRAIN had prepared four verified independent sources and selected recommendation `4f6bb3f1...`. Content remained old because the personal editorial hard gate correctly rejected overly technical copy, then the model's second draft was incomplete after hitting `max_output_tokens=2400`. The correction-prompt path lacked the existing structured artifact's bounded truncation retry.

**Fix:** wrap only the PERSONAL editorial draft's AI request with the existing budget-growth policy: 2400 → 4800 only if the thrown error is exactly `AIProviderIncompleteOutputError`. Never retry rejected content, permission or provider errors. A repeated truncation stops after two provider draft attempts, then the existing channel cooldown/Heartbeat continues. Independent source identity, no fabricated personal anecdotes, length/editorial validation, semantic uniqueness, provider OAuth and external publication receipt stay in force.

**Tests/acceptance:** pure simulated retry/rejection/no-spin tests, static hard-gate test, Required/CodeQL, protected merge, exact Supabase Edge source readback, and real 22 October personal LinkedIn provider publication proof. Candidate is NOT a provider publication. No second scheduler, queue or fallback account.
