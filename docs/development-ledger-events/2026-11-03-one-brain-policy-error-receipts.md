# 2026-11-03 — original ONE BRAIN policy promotion failure visibility

- Source inspected directly in production: `public.powerhouse_one_brain_reconcile_v1` swallows policy exceptions with `NULL` in catch branch.
- Original runtime mux job #171 executes this on UTC minutes 13 and 43; generic mux helper discards result and can return success without real policy outcome.
- Proposed minimal replacement of the same two function definitions, with original immutable failure registry, sanitized SQLSTATE, policy hash, error counts, and typed task non-green receipt.
- No new scheduler, provider, queue or privilege expansion. No direct production database hotfix.
- Test: `tests/brain-one-brain-policy-promotion-no-silent-failure-20261103.test.mjs`; producer/provider live parity pending.
- Canonical issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198 .
