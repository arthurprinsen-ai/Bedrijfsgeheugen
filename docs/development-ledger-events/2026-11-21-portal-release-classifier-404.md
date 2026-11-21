# 2026-11-21 — Original Portal V2 release-status classifier 404

- **Incident/lineage:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198, originele Portal Living Interface / ONE BRAIN Engineering.
- **Original signed production identity:** main `9e0f5a0c64782ce319779e1a723b01e34bc661d4`; Netlify READY `6b0196081d286bc840e104e8`.
- **Failure:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44906714441, app boot 390+1440 px timeout; native Netlify logs 7 first-party HTTP404 requests at `/tools/netlify/release-status.mjs` during 13:08–13:11 UTC.
- **Cause:** existing original pure release classifier was imported from private `/tools/*` browser route. Public browser pack from #6093 whitelisted only seven Brain/Platform modules; no client release module.
- **Protected correction:** original portal-safe-runtime build now exact whitelists eighth pure module and points original single import directly to dedicated portal-runtime bytes and classifies builder as hosted runtime. All other `/tools/*` imports fail and private 404 rules stay enforced.
- **Replay/shadow/canary:** `tests/brain-portal-safe-browser-module-vendor-20261121.test.mjs`, original build parity, exact deploy readback 8 SHA256 files, mounted app, no visible fail-safe.
- **Original gates:** existing Production Release Readback must not ignore tools/ci builder; existing Canonical Brand Shell must run for portal-v2 and builder changes, both preserving provider-backed live checks.
- **Safety:** no new agent, scheduler, alternate source of truth, token, false tenant proof, business outcome claim or approval bypass. Rollback by protected revert.
- **Existing recovery:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44909907123 succeeded same original 14 source-bound cases; zero independently measured outcomes.
- **Status:** CANDIDATE not yet protected merged nor independently live verified.
