# LinkedIn personal recommendation evidence shape — public engineering event

- Date: 2026-10-29.
- Failure: legacy JSONB recommendation evidence wrapped as JSON string cannot pass direct object-property checks.
- Change: safe plain-object JSON unwrapping in existing canonical content orchestrator, no other source/provider writes.
- Test: `tests/brain-personal-recommendation-evidence-shape-20261029.test.mjs` covers valid objects, malformed strings and unchanged dedupe checks.
- No declined story is re-accepted; no historical reservations cleared or duplicate post issued.
- Status: pending protected CI, production parity and independent provider readback; not live.
- Public safety: no private original events, tokens, unpublished copy or prospect content included.
