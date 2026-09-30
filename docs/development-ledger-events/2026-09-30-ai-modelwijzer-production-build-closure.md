# 2026-09-30 — AI Modelwijzer production build closure

Fingerprint: `powerhouse|ai-modelwijzer|production-build-closure|2026-09-30-v1`

Observed: canonical main contains the 103-model/10-provider Modelwijzer, but production Netlify remained on an older commit.

Root cause: interactive builder classification missing; static-English cache missing; committed Modelwijzer regression not wired into CI.

Repair: preserve interactive page, add deterministic translation cache, wire regressions into Website release lane.

Truth boundary: terminal LIVE requires exact-main Netlify ready + route/catalog readback.
