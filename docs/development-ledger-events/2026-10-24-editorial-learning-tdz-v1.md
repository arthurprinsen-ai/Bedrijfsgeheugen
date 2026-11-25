# Content editorial temporal-dead-zone recovery — 24 October 2026

- Source: existing Supabase powerhouse-content-orchestrator, merged brand-learning integration.
- Cause: verifiedBrandLearningGuide is a lexical `const` read during editorialSystem evaluation before its declaration; non-personal channel paths fail before calling AI.
- Fix: declaration moved before use, with one targeted regression test and unchanged source, tenant, security and editorial gates.
- Owner: canonical existing content orchestrator and its scheduler; no new job or writer.
- Proof required: Required + CodeQL, protected merge, Supabase provider source parity, next actual generated artifact and independent publication verification.
