# 2026-11-10 — Source-rooted native page reaction / draft-safety regression

- Owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215; design issue https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4547.
- Failure fingerprint: portal|runtime|evidence-page-stale-and-ack-draft-discard|20261110-v1.
- On production main, original `page-shell.js` listens to local impact, Brain ACK and server-state refresh but NOT new runtime evidence. Original `runtime-evidence.js` publishes identical readbacks repeatedly. Original ACK handler calls `openPortalPage(current)` without checking unsaved DOM controls or an intervening tenant switch.
- Fix: original native source-only cross-page event/refresh guard with exact subject, current route, per-page confirmation and native form draft preservation. All-pages regression + event dedup test; change in existing portal skill.
- EVIDENCE_DUE: live provider release and real multi-tenant authenticated per-page data chain, browser restart recovery, daily decision/outcome/learning proof. Historical content obligations remain on separate original #5556 lineage.
