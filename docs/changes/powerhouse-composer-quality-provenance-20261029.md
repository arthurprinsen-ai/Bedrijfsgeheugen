# Source-native commercial composer attribution / real quality before-after

Date: 2026-10-29. Parent obligation: powerhouse-lean-agent-loop-runtime-coverage-20261029.

**Source candidate — not live until the protected exact-head release and Supabase Edge Function provider readback.**

The existing message composer computes a numeric draft-quality score and stores it in `public.powerhouse_message_quality_v1`. It previously discarded an error returned by the evidence upsert, then updated the sales action and reported success. Its source action evidence also omitted the real writer identity, CONTRACT version and actual before/after score evidence. The existing action record now carries `commercial_intelligence.composer.agent_id` (this composer only), `skill_version`, `actor_scope=message_composition`, numeric `before_metric` if an earlier measured numeric score exists, new `after_metric` from the computed quality score, and its authoritative message-quality row reference. Failed quality evidence writes halt the action update.

**Boundary:** draft quality != dispatch, LinkedIn delivery, conversion or paid revenue. Other agents and existing immutable `powerhouse_cycle_events` remain uninstrumented. No additional schedule, writer, DB table, automated send or provider consent. Client data stays in the existing protected action scope. The next separate canonical database writer change must forward only stage-authored, independently supported actor/measurement evidence into the canonical cycle log; UNKNOWN is not zero.

## Added after audited commercial loop

Verified Supabase baseline: 1,021 quality evaluations of 22 distinct actions in 14 days, 0 accepted. All 1,021 failed the already enforced `source_specific_evidence_ok` gate; only 15 of 22 actions had parseable runtime-event source refs, 11 corresponding runtime events contained concrete headline/summary evidence. The composer previously generated and evaluated drafts before discovering this inevitable failure. A shared pure preflight now checks the existing human-readable-context, relevance, HTTPS source and specific text threshold **before** persuasion model or LLM calls. Missing context returns `SOURCE_SPECIFIC_EVIDENCE_REQUIRED` without an AI call, rather than generating more rejected drafts. It does not synthesize source text or loosen existing gates. Source-resolution remains open; this is a cost/quality safety fix, not proven conversions.
