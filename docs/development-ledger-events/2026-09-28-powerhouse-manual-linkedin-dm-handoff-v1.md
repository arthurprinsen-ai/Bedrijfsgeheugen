# Development ledger — Powerhouse Manual LinkedIn DM Handoff v1

Date: 2026-09-28
Obligation: `powerhouse-manual-linkedin-dm-handoff-v1`

## Activity
- Extended the production `bg_vandaag` projection with manual-action, relationship, estimated-value, trigger and PDF fields.
- Deployed `bg-dagoverzicht` version 5 with authenticated on-demand PDF generation.
- Added Arthur Actions UI behavior to `/intern/vandaag/`: exact DM, connection context, PDF download, profile link and outcome controls.
- Kept automatically executable actions out of the human queue.
- Added Powerhouse skills, Brain learning, documentation and regression coverage.

## Truth boundary
LinkedIn connection state is only called known when there is matching relationship evidence; otherwise the UI says it is not verified. Potential value remains an estimate.
