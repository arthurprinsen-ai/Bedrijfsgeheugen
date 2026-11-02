# Portal UX incident validation writeback — 2 november 2026
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547
Original issue evidence: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547#issuecomment-6580746007

## Direct observed fact
Original `public.brain_failure_registry` fingerprint `portal|living-interface|newer-source-deployed-status-falls-through-allowlist|20261102-v1` was `OBSERVED`, version 1 with missing root cause, prevention, regression fields even after the protected source fix. Its append-only earlier observation is preserved.

The existing `public.brain_promote_failure` version-checked RPC confirmed `VALIDATED` version 2 and independently returned root cause, regression, prevention rule and real original PR #5313 evidence. Verified current Netlify READY deploy `6ae8a7815bd4f6fcd2757d0c` on exact `d6bc2d9f9f2cec38b47c480c406495b0dccf07f5`. Full BRAIN delivery #41468808818 and CodeQL succeeded. **This establishes a validated source/contract fix only.**

## Permanent source-owned prevention
The existing `.agents/skills/portal-living-interface/SKILL.md` now explicitly requires:
- version-checked `OBSERVED → VALIDATED` after protected code, regression and original provider readback, without clearing historical evidence;
- `VALIDATED → PROVEN` only after independent authorized administrator session, actual status card rendered, current release identity and next natural owner skill application;
- readback verification, CAS conflict hold, no fabricated customer evidence, no separate scheduler, no bypass of auth/WAF or no-store policy.

Original automated regression: `tests/brain-portal-ux-incident-maturity-lifecycle-20261102.test.mjs`. Existing admin status panel remains amber while authenticated browser, 2-tenant, WCAG, real user/SUS and p75 web-vitals evidence is due. This change does not claim new runtime UI; deploy proof of the original source already exists. New source and skill protection requires original Required, CodeQL, BRAIN, protected merge and natural agent skill readback before terminal closure.
