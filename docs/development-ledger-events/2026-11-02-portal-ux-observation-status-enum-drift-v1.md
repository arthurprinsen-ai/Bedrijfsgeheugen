# Original Portal V2 UX production-observation enum drift — 2026-11-02

Parent #4547. Obligation `portal-v2-observation-status-source-readback-20261102-v1`. Protected base SHA `b7265b87ad5157d1afd179ee9b271a1ce5a8f3fc`.

## Original failure, diagnosis, actual evidence
The original admin-only UX evidence card reached production as PR #5308, Netlify deploy `6ae8a0213e2f4b45722cd769` READY, commit `e9afb69de49732ebd6398b6f96d03a2876bde015`. Source observation `portal-v2-living-interface-20261102-1451-e9afb69-source-deploy-admin-readback-due` was independently SELECTed from original Supabase `public.brain_observed_states`. Its **latest** release field is `SOURCE_DEPLOYED_AUTHENTICATED_ADMIN_READBACK_DUE`, and its security diagnostic is `PUBLISHED_SOURCE_VERIFIED_BROWSER_READBACK_DUE`.

The original allowlisted server read did not recognize these exact legitimate production-state variants, replacing them with `EVIDENCE_DUE`. The original UI did not distinguish independently source-proven deployment from outstanding fresh **authenticated admin** browser readback. Historical UX 15 PASS/1 SKIP pertains to earlier release coverage only. The original backend run 41463765668 had 4 failures after #5308, remediated by original recovery PRs #5311 and #5312; do not erase or misattribute these separate historical failures.

## Bounded repair and safeguards
- Reuse original server service-role-only, admin+tenant-gated `/api/powerhouse-observability` route and original ONE BRAIN observed state. Exact two statuses added to allowlist, no schema or new store.
- Original Portal V2 System Map compares provider-published SHA; show 'Productiebron bevestigd · beveiligde beheercontrole open' when original latest observation still lacks fresh authenticated readback. Do not turn orange to green because an earlier browser test passed.
- Preserve existing fail-closed treatment of unsupported/expired observations, customer privacy, no-store, noindex and protected delivery.
- Live-operator acceptance still needs real authenticated admin browser readback, WCAG independent audit, two live customer tenants, real entrepreneur task study and p75 metrics; not claimed.
- Regression is extended in `tests/brain-portal-ux-admin-proof-readback-20261102.test.mjs`; original agent skill is updated. This candidate has no production claim until provider deploy readback.

## Exact-head System Map source-hash sync
Original protected preflight job 125350776726 correctly blocked the initial candidate: deterministic generator emitted contentHash `2ad1284c3e87758ed5c58ddf0e77034d5f6f4663fbf0300952dbf901d73ac5d0` after the actual Portal V2 UI change while existing canonical System Map and original `portal-v2/index.html` still retained `282af921d28f2414889f356d44729ebd023d637b9c88919321b981998a9cda86`. Integrated only the two exact generator differences, never bypassed or weakened gate. Next protected Required, browser, CodeQL and Netlify readback are still mandatory. This historical failure remains visible.
