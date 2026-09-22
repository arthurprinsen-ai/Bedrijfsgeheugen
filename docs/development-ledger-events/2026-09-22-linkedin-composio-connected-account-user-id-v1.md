# Development ledger — linkedin-composio-connected-account-user-id-v1

- Date: 2026-09-22
- Production diagnosis: Composio request 2168 returned HTTP 400 `ActionExecute_ConnectedAccountEntityIdRequired`.
- Verified correction: request 2169 used the same connected account plus its exact `user_id` and returned HTTP 200 for `LINKEDIN_GET_MY_INFO`.
- Organization boundary: request 2170 reached `LINKEDIN_GET_COMPANY_INFO` but LinkedIn returned that `r_organization_admin` is missing.
- Fix: forward the connected-account `user_id` on every LinkedIn tool execution.
- State: expose granted scope names and explicit `company_scope_required=r_organization_admin`; never expose access/refresh tokens.
- Safety: personal and company capability remain separate; company publishing stays fail-closed.
- Terminal closure: exact-head CI → merge → Edge Function redeploy → provider readback → canonical Brain-state readback.
