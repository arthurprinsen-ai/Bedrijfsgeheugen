# Original BRAIN 0-failure source in admin Portal — no false green

2026-11-02, original parent issue #4439. The original 23-failure BRAIN debt reached **5,392 tests, 5,390 pass, 0 fail, 2 skipped** in original run [41430758451](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41430758451), backend job 125229059857. Merged source and provider-backed production evidence appear in existing `public.brain_failure_registry.evidence.software_recovery_20261102`.

## Root cause
The existing owner-only `Andere data` card kept historical red run evidence (34 then 32 then 23 failures) but did not display the later software-only 0-failure proof. That caused a misleading current interpretation. Historical red failures must remain auditable; software-test recovery is not proof of customers, revenue, 15 healthy loops, future no-recurrence, or a later exact-main terminal.

## Repair and safety
Extend the EXISTING `powerhouse-cro-other-data.mjs` read-only projection and EXISTING `portal-v2/modules/andere-data.js` card. Whitelist the historical original run ID, job ID, protected SHA, Netlify deploy ID, exact integer 5392/5390/0/2 parity, and negative business/no-recurrence flags. Missing or forged evidence remains `SOFTWARE_RECOVERY_SOURCE_UNVERIFIED`. Display the successful run with a fully escaped absolute HTTPS GitHub link *beside*, not instead of, the prior failed runs. Keep `verifiedPassed=false` for independent terminal until directly verified and `ordersIndependentlyProven=false` always. No new SQL, cron, scheduler, publisher, credentials, customer data or second Portal API.

## Tests, agents and closure
`tests/brain-portal-zero-software-proof-20261102.test.mjs` enforces positive/negative historical+shadow+canary cases. Original skill `.agents/skills/powerhouse-post-merge-codeql/SKILL.md` carries the source parity/no-false-green rule. Protected Required, CodeQL, full BRAIN backend, original protected merge, Netlify exact-SHA and admin-only browser readback are required before marking Portal UI production-live. Even after merge, keep commercial return and natural learning recurrence UNKNOWN until independently proven.
