# 2026-11-10 — Portal V2 P0 #4215 same-principal handoff replay candidate

- Fingerprint: portal|brain|partial-ack-pending-handoff-not-revalidated|20261110-v1.
- Existing owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215; design parent https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547.
- Source observation: original domain-state saves customer data before section-specific Brain delivery. Pending map and impact generations survive failed Brain ACK, but existing revalidation previously could not drain them.
- Independent Supabase read-only observation 2026-11-10 around 07:50 UTC: 30 OPEN, 5 READY, 2 RUNNING, 2 BLOCKED Brain obligations; 23 ACTIVE Brain blockers; no canonical-brain portal_state_layers rows. Global growth queue and publication assert errors are separate lineage, never count as individual missing tenant inputs.
- Candidate: retry only same original principal with an already attempted handoff using existing refresh, no parallel scheduler; all registered page guides indicate pending evidence; keep all generations until source ACK; zero assumed customer impact.
- Regression: tests/brain-portal-handoff-replay-20261110.test.mjs, native portal-v2/tests/portal-handoff-recovery.test.mjs and existing all-page lossless coverage.
- Terminal unproven: preflight/CI result, protected merge, production SHA, authenticated two-tenant source→Brain→Heartbeat→all dependent pages→decisions→verified outcomes→measured learning, full server-side durable recovery and daily personalized advice. These remain EVIDENCE_DUE until independently observed.
