# Provider-created social side effects are terminal

Date: 2026-09-28  
Fingerprint: `provider-write-terminal-all-social-v1`

## Contract

For LinkedIn personal, LinkedIn company and Instagram company, publication truth becomes terminal once the provider has created a durable external object or provider truth for that object is already verified.

Later events may affect verification enrichment or future generation policy, but never the existence of the already-created side effect.

### Terminal evidence

Any of the following is sufficient to preserve `PUBLISHED`:
- successful provider create plus durable LinkedIn post URN;
- successful Instagram publish plus durable media ID;
- existing Instagram media with provider truth already verified.

### Non-retroactive failures

The following may not downgrade an already-created post:
- OAuth revocation after create;
- 401/403 readback;
- organization ACL read failure;
- analytics permission failure;
- stricter future media/identity policy;
- media-proof drift discovered after publication.

### Recovery

Recovery is exact-ID only. Persist `republish_forbidden=true`, reconcile the existing external object and never create a replacement for the same daily claim.

### Daily guarantee

The closed loop and watchdog must distinguish *publication truth* from *verification truth*. A later verification failure can be logged, but cannot reopen an already-completed provider write.

Regression proof: `tests/brain-linkedin-composio-authority.test.mjs`.
