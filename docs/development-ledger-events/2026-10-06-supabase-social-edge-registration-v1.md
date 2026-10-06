# Development ledger event — Supabase social Edge registration

Date: 2026-10-06
Obligation-ID: supabase-social-edge-registration-20261006-v1
Delivery-Lane: automation
Candidate-Type: recovery
Base-SHA: c868595e92ba5fa290de1dfb1eed632ec344802f

Observed:
- protected-main Supabase production check was successful;
- `powerhouse-social-publisher` matched production;
- `social-recovery-runner` remained provider v7 and byte-different;
- both functions were absent from `supabase/config.toml`.

Change:
- register both functions explicitly for Supabase Git deployment;
- preserve current provider JWT behavior;
- regression-guard registration;
- strengthen terminal authority contract to require provider-source parity;
- add read-only SUPABASE_ACCESS_TOKEN provider download after the GitHub App check;
- fail closed on file-set or byte drift while permanently forbidding CLI production deploy.

Terminal criteria:
exact-HEAD gates -> protected auto-merge -> Supabase production deploy -> exact source parity for publisher + recovery runner -> canonical social recovery -> provider-side-effect truth.

Readback bootstrap:
- GitHub production environment secret name: `SUPABASE_ACCESS_TOKEN`;
- intended permission: production project, Edge Functions Read only where scoped PATs are available;
- no deploy/write operation is authorized by the authority workflow.
