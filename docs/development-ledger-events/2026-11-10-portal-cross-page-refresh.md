# 2026-11-10 — Source-rooted native page reaction / draft-safety regression

- Owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215; design issue https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547.
- Failure fingerprint: portal|runtime|evidence-page-stale-and-ack-draft-discard|20261110-v1.
- On production main, original `page-shell.js` listens to local impact, Brain ACK and server-state refresh but NOT new runtime evidence. Original `runtime-evidence.js` publishes identical readbacks repeatedly. Original ACK handler calls `openPortalPage(current)` without checking unsaved DOM controls or an intervening tenant switch.
- Fix: original native source-only cross-page event/refresh guard with exact subject, current route, per-page confirmation and native form draft preservation. All-pages regression + event dedup test; change in existing portal skill.
- EVIDENCE_DUE: live provider release and real multi-tenant authenticated per-page data chain, browser restart recovery, daily decision/outcome/learning proof. Historical content obligations remain on separate original #5556 lineage.

- 2026-11-10: Original protected #5556 introduced the provider-confirmed 821st native migration; its original lock owner has independently reconciled original main 821/821. Integrate this exact main tree without touching SQL/lock. Parallel PR #5568 on the same native page-shell was closed without merge; this one original #4215 candidate includes active-runtime repaint and full identity-boundary private DOM disposal in one governed source path. Source inventory hash must be regenerated on this exact combined tree. No merge/live or tenant canary claim before Required/CodeQL/provider readback.

- 2026-11-10 exact protected CI caught an obsolete string oracle in the original domain-state test expecting old `root.contains(active)` inside page-shell. Updated that original source regression to verify the new one shared tenant/page/draft guard, focused-edit preservation and new runtime refresh event. No check was removed; the executable all-registered-page behavioral regression also remains.
