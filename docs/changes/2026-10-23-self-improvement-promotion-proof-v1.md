# Autonomous Powerhouse promotion: independent evidence before any change

Canonical parent [#2750](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/2750), customer-outcome go/no-go [#4358](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4358). Existing Brain, Powerhouse and Heartbeat remain the only scheduler, memory, agent orchestration and change authority.

## Observed production gap — 2026-10-23 11:13 UTC
Supabase production shows 32/32 Brain layers connected, nine optimization candidates, zero independently measured candidates and nine candidates in `REVIEW_REQUIRED`; zero have passed independent review, delivery or verified learning. The separate `powerhouse_realized_values` table holds zero records and `brain_value_evaluations` has zero verified evaluations. Aggregate systemwide outcomes or `READY_FOR_CONTROLLED_PROMOTION` **do not** prove candidate lift or verified customer value.

## Existing pure evaluator issue
`evaluatePromotionCandidate` could return `PROMOTE` from two arbitrary strings (`evidenceRefs:['a','b']`), self-declared boolean gates, and claimed numerical improvement. Optional `requiredGates:[]` and `minEvidence:0` could weaken the intended minimum. No actual provider proof was required.

## Reuse, harden, preserve independent authority
Keep the **same** pure evaluator, existing Brain learning compiler, original daily Heartbeat, Supabase closure view and guarded GitHub/Netlify release pipeline. An *injectable trusted verifier*, owned by the authorised caller, must attest each distinct evidence reference to exact candidate SHA, independent source, verified time (not future) and allowed provider/evaluation/CI authority. No function supplied, failure, mismatch, duplicate or self-authored string => `GATHER_MORE_EVIDENCE`. The mandatory quality/security/regression trio and minimum two receipts cannot be downgraded. The `PROMOTE` return value is a candidate-evaluation verdict only: `releaseAuthorized=false`, `protectedReleaseRequired=true` always. The evaluator does **not** fetch live provider data, cryptographically verify attestations, approve human consent or deploy.

External method alignment: OpenAI agent [traces and evaluations](https://developers.openai.com/api/docs/guides/agent-evals) require repeatable graded behavior; [DORA](https://dora.dev/guides/dora-metrics/) assesses measured throughput and instability instead of celebrating green job counts. Neither gives permission to promote a candidate without provider evidence.

## Acceptance
Historical, shadow and canary regression: `node --test tests/brain-self-improvement-layer-v1.test.mjs`. Negative fixtures cover missing verifier, returned `true` instead of independent receipt, wrong SHA, future evidence, duplicate refs, arbitrary authority, provider exception and caller attempts to remove mandatory gates. Positive fixture proves that independently attested evaluation packets can pass scoring but **never** authorize production release. GitHub protected exact-head Required, CodeQL, canonical Brain skill projection and main/readback required. No changes to Supabase migrations, production data, RLS, tenant access, paid models, provider authorization or existing daily cron.
