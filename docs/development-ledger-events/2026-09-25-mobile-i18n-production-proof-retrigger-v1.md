# 2026-09-25 — mobile NL/EN production proof retrigger v1

- Source authority: protected main `6417fa291ac08345369e1e143abf974fac54f0e4`.
- Reason: its original Production Source Snapshot was cancelled before any job started while an older serialized production snapshot was still active.
- Product behavior change: none.
- Purpose: create exactly one protected-main successor so the current mobile pricing + NL/EN browser verifier is executed by the canonical Production Source Snapshot.
- Terminal proof remains: exact Netlify production commit_ref equals protected main; pricing interactions green; NL → EN `/en/prijzen` → NL `/prijzen` browser roundtrip green.
