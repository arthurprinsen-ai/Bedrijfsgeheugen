# Trusted Advisor original site-shell copy drift — 2026-11-12

- **Original owner**: original website/site-shell/CMS, within ONE BRAIN governance, no second writer/scheduler
- **Existing P0 issue**: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5284
- **Incident fingerprint**: `powerhouse|trust|global-site-shell-unsupported-sla|20261112-v2`
- **Original obligation**: `website|trusted-advisor-canonical-shell-customer-truth|20261112-v2`
- **Canonical learning**: `brain/learning/2026-11-12-trusted-advisor-site-shell-claim-drift-v2.json`
- **Source evidence**: exact main merge `6f0497afb07051cf06f62f38efdea59cf7507bf2`, Netlify READY `6af6201a2077ebe5d94f7d20` and independent public HTTP readback on contact and Frisse Blik where generic `In twee weken draaiend` remained after previous page-only repair
- **Root cause**: global canonical website chrome in `over-ons.html`, fallback `TRUST_BAR_HTML` and the sitewide verifier `TRUST` embedded the old promise and overwrote corrected per-page labels during the existing generator build
- **Applied candidate fix**: original canonical `over-ons.html`, `tools/site-shell/components.mjs`, `tools/controleer-site-ui.mjs`, `assets/js/i18n.js` and original trustbar regression; no clone, alternate CMS, runtime DOM patch or direct provider bypass
- **Next independent proof**: protected checks and full generated sitewide route tests, exact SHA Netlify ready, independent readback on public site desktop/mobile and i18n; if any fails, retain OPEN and trace exact cause to same fingerprint
- **Customer / tenant handshake**: this is a static website copy fix, not an accepted original `consumer_processed_ack`. Real Portal V2 → tenant BusinessInput → ONE BRAIN → Powerhouse/Heartbeat outcome still requires independent runtime evidence before a completed-customer-loop claim

**Status: SOURCE_CANDIDATE_NOT_LIVE_VERIFIED**. Do not assert measured trust, qualified lead, conversion lift or all-site consistency before real readback.
