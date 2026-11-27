# Development ledger — source-aware workflows inside original Portal V2

- Fingerprint: `portal|work-process|source-aware-workflow-templates|20261111-v1`
- Date: 2026-11-11. Original owner: Portal V2 customer work writer; issues #4215/#4198.
- Problem: one-roof work navigation did not yet provide generic business workflow templates with dependencies and planning from existing delivery board.
- Source: `portal-v2/modules/delivery-board.js`, `portal-v2/domain-state.js`; original state slice `portal.deliveryPlan`.
- Implementation: four generic templates; original state persistence; backward step dates; per-step owner; guarded customer intent and approval-request statuses; progressive disclosure and responsive keyboard-accessible UI; regression contracts.
- Security: no tenant/credential bypass, external sends, new scheduler, provider API, SQL migration or checkout change. Every approval is explicitly pending authorised external receipt, never self-approved.
- Evidence: tests + GitHub protected admission/Required/BRAIN/CodeQL; exact Netlify SHA and authenticated two-tenant readback still required. Do not claim release complete until those return.
- Open: real company-wide source→consumer→Powerhouse→Heartbeat→learning chain, notifications, independent approval receipt and Red Dot real user acceptance.
- Extra source lineage: `portal-v2/portal-impact-engine.js` maps `portal.deliveryPlan` explicitly to tasks and review domains (process/people/project/finance), with OBSERVED_NOT_VERIFIED and externalExecutionAuthorized=false. No new BusinessInput type or backend mutation.
