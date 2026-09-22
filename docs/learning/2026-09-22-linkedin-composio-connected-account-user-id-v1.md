# LinkedIn Composio connected-account user context

Fingerprint: `linkedin-composio-connected-account-user-id-v1`

## What failed

After moving LinkedIn tool execution to Composio v3.1/latest, `LINKEDIN_GET_MY_INFO` still returned HTTP 400. A direct provider reproduction showed the precise error: Composio requires the connected account's `user_id` together with `connected_account_id`.

## What proved the fix

Using the same active LinkedIn account and the same read-only tool:
- without `user_id`: HTTP 400, `ActionExecute_ConnectedAccountEntityIdRequired`;
- with the exact connected-account `user_id`: HTTP 200 and a valid personal LinkedIn identity.

The provider-connected account already has personal scopes `openid`, `profile`, `email`, and `w_member_social`.

## Company-page boundary

The same corrected user context reached `LINKEDIN_GET_COMPANY_INFO`, but LinkedIn returned HTTP-level success with an application error stating that `r_organization_admin` is required. Therefore:

- personal LinkedIn capability may be ACTIVE;
- company-page capability must remain false/fail-closed;
- no company post may be attempted until the LinkedIn grant is reconnected with the organization-admin scope and provider readback proves it.

## Prevention

Every Composio connected-account execution must carry both account id and user context when required by the provider binding. Dashboard connectivity alone is never enough to infer runtime capability.
