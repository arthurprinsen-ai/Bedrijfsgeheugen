# 2026-11-11 — Portal V2 demo-only causal state must not create Brain handoff

Obligation: portal|v2|demo-ephemeral-does-not-create-brain-pending|20261111-v1
Owner: original Portal V2 P0 #4215 / canonical Brain BusinessInput
Base-SHA: bfdd7fa140ee2bd0a5ce21090f5cf72206b1ab2e
Delivery-Lane: portal
Candidate-Type: recovery
Status: CODE_CANDIDATE; NO browser production closure until protected publication and independent readback.

## Evidence
PR #5597 protected main was deployed to Netlify (deploy 6af40e9c1a5e131bc6856f1c; SHA bfdd7fa). Original exact production browser run 42974453301 improved from 12/4 failed to 15/1 failed. The last failure is the all-capability demo-only save/reopen/restore, whose pending Brain replay check is inappropriate for an unauthenticated ephemeral demonstration. A preview test attempted visitor GET but Netlify nonproduction SSO correctly returned HTTP 401; tracked separately under #4447.

## Cause / repair
The shared portal domain tracked non-durable demo inputs as if they were authenticated real-customer Brain delivery obligations. Even though the downstream provider was skipped, the pending snapshots/impacts could trigger a source conflict during an ordinary demo root-state restore. Preserve local page recalculation events but do NOT create canonical Brain obligations without customer authorization. No special background worker; real customer still requires independent persisted source, consumer ACK and full causal lineage.

## Tests / prevention
Add 25-field demo bulk + root restore and fail-closed real-customer negative tests. Keep original protected Required/BRAIN/CodeQL and production DOM suite. No mock successes in release evidence. The issue stays OPEN for all field and two-tenant end-to-end coverage until readback.
