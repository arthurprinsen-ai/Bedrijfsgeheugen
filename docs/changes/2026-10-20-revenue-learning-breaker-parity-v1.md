# 2026-10-20 — Revenue learning source parity and fail-closed projection

**Parent:** #4198; database dependency #4215. **Obligation:** `revenue-learning|deployed-source-parity-and-degraded-outcome-truth|20261020`.

## Independently observed
Netlify production `revenue-learning-project` returned HTTP 502 at 2026-10-20 11:01:08 UTC. Its error text was `Revenue learning store READ_BREAKER_MS is not defined (503)`: the Netlify gateway forwarded the failure from Supabase `revenue-learning-store` v10. Direct Supabase source readback exposed both `READ_BREAKER_MS` and `projectionReadDegradedUntil` as **used but not declared**. The deployed Edge function contained bounded sequential reads but GitHub main had an older unbounded source version. Separately the Netlify adapter accepted a 202 `degraded:true` response as a successful empty candidate list.

## Scoped existing-system fix
- Reconcile the existing single-file Supabase Edge runtime source (v10) with GitHub and declare both breaker identifiers, preserving service-token authentication, same tenant, 2.5 s bounded fetches, 30 s circuit breakers and five bounded read stages. No new store, scheduler or API.
- Register the pre-existing `revenue-learning-store` function in `supabase/config.toml` for canonical native preview/release deployment; preserve its existing `verify_jwt=false` plus application-level service-token authentication.
- Harden the existing Netlify adapter: a 202/2xx `degraded:true` payload **throws**, and a genuine empty 200 list remains a valid result.
- Add regression tests for breaker declarations, bounded reads, existing auth guard, 202 degraded, normal 200 empty and 503 provider failure.
- Record the human change, canonical Brain learning and append-only development ledger.

## Native preview evidence

At first submission native Supabase Preview replay failed due to duplicate pre-existing migration ledger version `20260916092402`. An authorized preview-only rebase completed and redeployed the original v10, but readback showed source still unmatched because the function lacked a `supabase/config.toml` declaration. The canonical config now explicitly includes the existing function; independent exact source parity remains a required gate before production.

## Release gates
1. Required CI, CodeQL, Supabase preview (including source parity), exact protected merge on latest main.
2. Deploy **only** `revenue-learning-store` through the authorized Supabase route, retaining `verify_jwt=false` because the pre-existing Edge function performs `x-bg-service-token` validation.
3. Read back full Edge runtime file graph and compare against merged main; Netlify must also deploy the exact corresponding source.
4. Authorized, idempotent production canary: no `READ_BREAKER_MS`/ReferenceError, no `degraded:true` masquerading as projected=0 success, no duplicate evidence writes; separate real provider/database recovery remains #4215.
5. Observe next scheduled revenue learning tick and provider outcome/learning receipts before declaring end-to-end green.

**At PR creation:** candidate only; no production rollout or completed commercial outcome asserted.
