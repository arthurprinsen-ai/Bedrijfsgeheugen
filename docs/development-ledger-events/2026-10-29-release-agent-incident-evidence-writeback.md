# Development ledger — release-agent incident evidence writeback
Date: 2026-10-29. Obligation: `powerhouse|release-agent-incident-evidence|20261029`. Owner: canonical ONE BRAIN/Powerhouse continuity and release assurance. Writer scope: this single protected candidate.

## Observation and baseline
Production #5118/Portal #4215 readbacks showed a previously SKIPPED authenticated tenant gate, checkout `#trialSwitch` null error, malformed PR machine metadata and BRAIN evaluation test-mode mismatch. Supabase `brain_failure_registry` did not contain the four exact fingerprints at preflight. Existing Tavily 432 issue was already registered, not duplicated.

## Actions actually executed
- Called existing `public.brain_observe_failure` once for each of four real GitHub-run occurrences, with stable IDs, SHA-256 data, non-sensitive evidence, source URLs and tenant-independent scope.
- Called existing `public.brain_promote_failure` using expected version 1 to record root cause, prevention, regression and `OBSERVED` status. Readback returned `occurrence_count=1`, `version=2` for all four; no fabricated business result.
- Updated canonical `AGENTS.md` and `powerhouse-continuity/SKILL.md` with incident lookup, exact proof-stage separation, dedupe, safe recovery and cross-agent handoff. Added one BRAIN learning JSON, one new node regression and a human change explanation.
- No parallel database register, AI scheduler, provider sender, secrets, new outbound customer activity, extra Supabase branch or paid preview.

## Verification and outstanding proof
The persisted Supabase registry rows are actually verified; the GitHub candidate skills/test are not considered live until exact-head Required/CodeQL plus protected merge and skill projection readback. #5126 merged; tenant production readback remained pending at the earlier checkpoint. #5125 checkout candidate remains separate. #5127/#5129 Supabase registration/config rollout has ACTIVE version 21 provider evidence, not external signal/outcome evidence.

Evidence: GitHub incidents [#5118](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5118), [#4215](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215), [#4577](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4577). Last readback: 2026-10-29 UTC. Next agent must refresh exact PR/main/deploy state before updating any verdict.
