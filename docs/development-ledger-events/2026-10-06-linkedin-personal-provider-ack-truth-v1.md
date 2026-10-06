# Development ledger event — LinkedIn personal provider-ack truth

Date: 2026-10-06
Obligation-ID: linkedin-personal-provider-ack-truth-20261006-v1
Delivery-Lane: automation
Candidate-Type: recovery
Base-SHA: 51e26c9893ef84e58359848267f9665d0daf70d0

Observed production evidence:
- LinkedIn personal has a durable provider post ID.
- Provider create acknowledgement is verified.
- Later exact post-content readback is permission-limited.
- Republish is explicitly forbidden for that already-created side effect.

Change:
- add a narrowly scoped provider-side-effect truth predicate for `linkedin_personal`;
- keep exact provider readback mandatory for LinkedIn company and Instagram;
- retain fail-closed behavior when any required acknowledgement, permission-boundary flag, no-republish flag, or external ID is missing.

Evidence:
- `supabase/functions/social-recovery-runner/index.ts`
- `tests/brain-central-social-publication-authority-v1.test.mjs`
- `brain/learning/2026-10-06-linkedin-personal-provider-ack-truth-v1.json`

Terminal criteria:
exact-HEAD gates green -> protected auto-merge -> Supabase production attestation -> source parity -> canonical social recovery -> provider-side-effect truth healthy.
