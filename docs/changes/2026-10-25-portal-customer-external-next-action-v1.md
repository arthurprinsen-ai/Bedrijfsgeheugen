# 2026-10-25 — Customer-visible external intelligence with the next safe step

## Actual production gap
The canonical daily external search/inference architecture already exists: `bg-externe-signalen`, `bg-kansenradar`, daily `bg-opdrachtenradar`, Powerhouse relationship graph and `portal-state-eu?action=entrepreneur_intelligence`. At 2026-10-25 the source store contained 1,169 records (176 `toegestaan`), the signal projection 197 signals, and one tenant had 7 scored impacts and 7 actions. The UI presented generalized market items and a separate actions list but not why a specific item matters to the customer or what to do beside that source. It rendered `data-open-page="actieve-acties"` without binding that click.

## Fix in the existing authenticated portal
The `Omgevingsradar` signal card now shows original source URL (HTTPS validated), public publication date separately from observation time, customer relevance state, tenant impact rationale where legitimately scored, a clear next step, proof freshness and whether an already-materialized tenant action exists. Expired deadlines and stale/undated sources are highlighted and cannot expose an executable CTA. Tenant actions are prioritized over general market suggestions. `Actueel & externe data` additionally surfaces the top assessed company signals, with an explicit context-required message otherwise. Existing active-action navigation is actually wired.

## Safety and lineage
Signal intake -> canonical source observation -> `powerhouse_intelligence_signal_projection_v1` -> tenant-scoped `powerhouse_intelligence_company_impact_v1` -> existing action candidate -> outcomes -> Brain learning. No parallel scheduler, new buyer database, outreach sender or fictitious tenant impact. Consent/anti-spam and provider write confirmation are untouched.

## Acceptance
- Test `tests/brain-portal-external-source-action-20261025.test.mjs` in pre-existing Required test, no additional PR workflow
- CodeQL and protected merge, Netlify READY exact revision
- Authenticated real tenant readback required to claim runtime customer actionability, not merely preview success
- Future external provider signals evaluated daily by existing owners, no implied new sales orders
