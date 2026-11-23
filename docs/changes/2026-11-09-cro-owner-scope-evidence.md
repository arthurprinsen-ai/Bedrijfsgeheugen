# 2026-11-09 — Original CRO experiment owner isolation and evidence correction

This is follow-up to protected PR #5542 and not a parallel growth loop.

## Failure observed from live original Edge v10
Direct original cron-equivalent pg_net request id 25771 yielded HTTP 200 and correctly non-green `PROPOSED_NOT_DEPLOYED`, but included two `PLANNED` experiments and empty IDs. SQL function `intern.bg_salescyclus_cijfers` projects `experimenten[].id` and also includes a blog distribution experiment. Both rows were incorrectly counted because the original CRO owner selected any non-null `onderdeel` and then accessed nonexistent `e.experiment_id`. `bg_bewijs` only accepts canonical `VALIDATION` and other documented error_class codes, so invented strings must remain inside evidence `reason_code`, not be emitted as the technical error_class.

## Repair and acceptance
Reuse original Edge and original pg_cron #23, no new scheduler/queue/learning authority. Scope only owner `bg-experimentcyclus` / `bgx-*` and domain `site|seo|content`; preserve independent unrelated experiment records unchanged. Use actual `id` SQL projection, traceable typed `reason_code` and original supported `VALIDATION` error_class. No claim of a changed /prijzen DOM, controlled treatment, lead, order or learned effect.

Required CI+CodeQL+protected merge, source parity and original Edge deployment; then one production original-HTTP round-trip must show exactly `bgx-20261103-d3a13c` as sole own pending experiment with `improvement_verified=false`. Original human experiment activation remains protected.
