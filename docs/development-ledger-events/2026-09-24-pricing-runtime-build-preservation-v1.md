# 2026-09-24 — pricing runtime build preservation v1

Evidence:
- exact production SHA: `e648f6c8e07bc2185daab6c71b0adff26d020d68`
- Netlify deploy: `6ab5131f10d7810008497634`
- Production Release Readback: `35997359336`
- failure: pricing rescue readiness marker never appeared

Root cause:
pricing build integrity restored only the canonical pricing section, not the interaction scripts outside that section after full-page build transforms.

Repair:
- restore inline pricing controller from captured canonical source;
- restore/normalize external rescue runtime tag;
- make absence of either runtime a build failure;
- retain actual production click proof as terminal gate.
