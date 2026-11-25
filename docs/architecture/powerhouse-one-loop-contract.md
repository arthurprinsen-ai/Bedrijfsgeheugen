# Powerhouse ONE LOOP — canonical integration contract

## Authority
Extend the existing Powerhouse heartbeat, runtime, System Map and Supabase authority. Do not create a competing scheduler, state store, portal or agent brain. EXISTING-STATE-FIRST.

## Canonical cycle
OBSERVE -> NORMALIZE -> CONTEXTUALIZE -> PRIORITIZE -> AUTHORIZE -> EXECUTE -> VERIFY -> LEARN -> IMPROVE -> OBSERVE.

Every signal and action carries tenant_id, correlation_id, causation_id, idempotency_key, source_ref, event_time, policy_version, decision_version and evidence_refs. Apply RLS and deny cross-tenant reads. Keep immutable audit evidence and minimize personal data.

## Event and action contract
- Signal: origin, subject, event_type, payload_schema_version, observed_at, source_fingerprint, confidence.
- Decision: candidates, estimated value, uncertainty, cost, risk, permissions, rationale, evidence.
- Obligation: owner, priority, deadline, action adapter, state, attempt count, next_attempt_at, lease_until.
- Execution receipt: channel, external_id, attempted_at, delivered_at, verification_method, error_category.
- Outcome: observed KPI, baseline, attribution limits, verified_at, feedback and experiment reference.

State machine: PROPOSED -> AUTHORIZED -> QUEUED -> LEASED -> EXECUTED -> VERIFIED -> LEARNED -> CLOSED. Retryable failure -> RETRY_WAIT; permanent failure -> NEEDS_INTERVENTION. Never mark delivery or revenue as verified from a successful API request alone.

## Heartbeat behavior
1. Acquire one bounded lease per tenant/workstream. No global lock for unrelated work.
2. Ingest incremental changes from GitHub, Supabase, Netlify, Notion, portal, website, CRM, permitted social and email channels.
3. Deduplicate on idempotency key and source fingerprint; update dependency graph.
4. Rank by expected verified value, confidence, effort, cost, risk, urgency and policy constraints.
5. Dispatch within budgets and permissions; use transactional outbox for reliable handoff.
6. Read back external receipts, production state and business outcomes.
7. Schedule safe experiments and update calibrated models only with evidence.
8. Checkpoint after every mutation. Retry with bounded exponential backoff and dead-letter classification.
9. Continue independent work when GitHub checks are queued; do not poll the same unchanged HEAD repeatedly.
10. Reconcile unfinished obligations after crash, timeout or credential renewal.

## One loop, multiple adapters
GitHub: source, CI and protected release. Netlify: site, portal and deploy evidence. Supabase: canonical runtime and tenant-safe state. Notion: human-readable knowledge and governance, not competing live authority. Email/social: permission-aware outbound adapters and verified delivery. Portal: recommendations, decisions and outcomes.

## Safety and commercial integrity
Never bypass protected checks, send unsolicited bulk messages, impersonate people, or auto-approve high-risk actions. Observe channel policies, consent, opt-out and rate limits. Tenant isolation and least privilege are mandatory. Missing credentials must degrade only the affected adapter.

## Definition of done
- Inventory current jobs, tables, triggers, agents, functions and ownership before changes.
- Map every existing workflow to this contract and eliminate duplicate authorities.
- Add schema migrations, idempotency and recovery tests without destructive changes.
- Prove signal -> decision -> execution -> external readback -> outcome -> learning in staging.
- Prove crash recovery, duplicate suppression, tenant isolation, auth expiry and rate-limit recovery.
- Pass protected GitHub checks, merge, verify exact-main Netlify production and record receipts.
- Show daily value metrics: verified outbound actions, qualified replies, appointments, conversions, customer outcomes, failed/recovered actions and cost.
- Never claim TERMINAL_GREEN until exact deployed SHA and runtime outcomes are evidenced.

## Implementation priority
P0 inventory + one authority + execution receipts; P1 commercial closed loop; P2 customer outcome loop; P3 experiment-driven optimization and counterfactual scenarios.
