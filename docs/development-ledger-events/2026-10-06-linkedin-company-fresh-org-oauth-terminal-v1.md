# Development ledger — LinkedIn company fresh organization OAuth

Date: 2026-10-06
Obligation-ID: linkedin-company-fresh-org-oauth-terminal-20261006
Delivery-Lane: automation
Candidate-Type: recovery

Observed production state:
- personal LinkedIn has a provider-created share and must never be republished;
- company LinkedIn has no provider side effect and remains the resumable unresolved daily claim;
- a durable fresh organization-OAuth proof exists with required organization scopes and verified admin ACL;
- the setup controller's state selection could still prefer stale candidate-state and report BLOCKED_AMBIGUOUS.

Implemented candidate:
- bind setup selection to the verified durable proof before stale candidate/alias discovery;
- preserve the exact fresh OAuth account through company capability verification and publisher preflight;
- require live organization-admin proof and organization scopes;
- promote to LIVE_PROVEN only after successful provider create plus exact provider readback;
- retain the existing same-claim retry/idempotency boundary.

Terminal sequence:
exact-HEAD gates -> protected merge -> deploy/read back canonical setup -> resume same linkedin_company claim -> provider create -> exact provider readback -> LIVE_PROVEN.
