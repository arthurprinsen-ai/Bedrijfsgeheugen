# Netlify Identity recovery flow fix

## Incident
A valid `#recovery_token=` or `#invite_token=` on `/klantportaal` could be pre-empted by an existing Netlify Identity session. The legacy `init` handler rendered the portal before the Identity widget completed password recovery or invite activation.

## Root cause
The early Identity `init`/`login` handlers called `toonPortaal()` without checking whether the URL hash represented an Identity token flow.

## Prevention
The production auth build now transforms the legacy handler so token flows take precedence. Recovery opens the recovery UI, invite opens signup, and normal login behavior is preserved when no token flow is active. The transform fails closed if the expected legacy handler changes, and regression tests cover recovery, invite, and ordinary login behavior.
