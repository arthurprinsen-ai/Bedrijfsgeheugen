# 31 October 2026 — LinkedIn original setup false timeout

## Root cause and evidence
At 12:49 UTC the original `powerhouse-content-loop` ONE BRAIN receipt records `powerhouse-composio-linkedin-setup` as `CHILD_CALL_FAILED`, `timed_out:true`. Existing source `supabase/functions/powerhouse-content-loop/index.ts` only allowed **8,000 ms** for the original setup child. Native Supabase function_edge_logs at 12:48:21.344 UTC prove that the original `powerhouse-composio-linkedin-setup` (v540) returned **HTTP 200 after 21,182 ms**. The parent falsely reported a transport failure before the real child finished.

## Original-authority minimal repair
Set **only** the existing original child setup audit timeout to **30,000 ms**, retaining the same `AbortSignal.timeout` and 240-second lease, original scheduler-token authentication, one canonical publisher and unchanged 110-second orchestrator + 25-second social-publisher budgets. No extra schedule, side-effect API, reroute, direct OAuth writes, duplicate or alternative channel.

An HTTP200 audit is **not** company OAuth readiness: independent ONE BRAIN readback still says original company setup `COMPANY_AUTH_REQUIRED`, original company OAuth fresh proof `RESET_UNVERIFIED`. Keep these red until a current authorized provider connection and independent fresh-readback prove the correct real account. Do not revive rejected historical tokens or replay a previous posted item.

## Evaluation
Protected `tests/brain-linkedin-original-setup-timeout-budget-20261031.test.mjs` measures threshold vs independently observed real latency, token/lease/abort and green-only-by-real-provider evidence; project-wide Required/Backend/CodeQL, protected main merge and exact Supabase Edge runtime readback must pass. Then observe the next *natural original* loop. A real provider post, blog or email remains a separate external proof obligation.

ONE BRAIN fingerprint: `powerhouse|linkedin|setup-child-timeout-below-observed-provider-duration|20261031-v1`, OBSERVED pending full independent runtime outcome. Parent P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.
