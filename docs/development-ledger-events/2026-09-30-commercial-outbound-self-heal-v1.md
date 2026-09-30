# 2026-09-30 — Commercial outbound transport self-heal

Fingerprint: `commercial|outbound-transport-self-heal|gmail-linkedin-dm|v1`

## Outcome
The commercial email obligation was recovered without exceeding its safety gates.

- Five authorized existing-relationship emails received Gmail provider `SENT` evidence.
- The real Gmail message/thread identifiers were written back to the original `powerhouse_sales_actions` and `powerhouse_sales_outcomes` lineage.
- The sixth eligible action was deferred to the next valid run because the daily send cap is five.
- No LinkedIn DM was fabricated; DM remains fail-closed until a true send-DM provider capability exists.

## Root cause
The autonomous server runtime used a Gmail connection identifier from a different Composio/MCP environment than the server-side Composio API project. Direct execution also required top-level user/entity identity. The old adapter additionally lost provider details by serializing the error as `[object Object]`.

## Permanent prevention
Every outbound run must verify provider-project/connection consistency before write, preserve structured provider errors, reconcile external side effects before retry, and use only a controlled same-lineage fallback. Recovery never weakens daily cap, suppression, cooldown, consent/relationship, dedupe or republish guards.

## Canonical writeback
- Brain failure: `commercial-email-composio-cross-project-account-mismatch-v1`
- Brain learning: `commercial-outreach-self-heal-2026-09-30-v1`
- Skill: `skills/powerhouse-commercial-outbound-self-heal.md`
- Agent inheritance: `AGENTS.md`
- System Map: `COMMERCIAL_OUTBOUND_SELF_HEAL_V1`
