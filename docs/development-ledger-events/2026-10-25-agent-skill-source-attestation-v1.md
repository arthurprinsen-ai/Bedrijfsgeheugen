# Development ledger — skill source attestation — 2026-10-25

- Obligation: `brain-agent-skill-source-attestation-20261025`. Existing owner: Brain learning and existing Skill Projection. Related original issues #4681 and #4198.
- Baseline: 35 existing GitHub skill directories; learning projection and chat preflight already exist. Source-file digest and actual readback boundary missing in preflight; at least one legacy skill lacks frontmatter.
- Delta: same existing runtime code and test paths; derive SHA-256 SKILL.md source inventory from Git checked-out repository; select canonical baseline plus bounded task-targeted sources.
- Truth semantics: `SOURCE_DISCOVERED_LOAD_READBACK_REQUIRED` always remains unproven until a canonical activity receipt documents actual load; never infer skill use from a hash, provider HTTP 200, passing tests, scheduled run or documentation.
- Technology scanning: consider standards with official source/version and evidence, security/privacy, regressions, cost and rollback. Do not install external skills on discovery alone.
- No new scheduler, autonomous runtime, competing store, migration, personal data read, public content or side-effect provider call.
- Release: exact-head Required/CodeQL → protected merge → existing main Skill Projection → next-agent preflight digest readback. If blocked, retain same PR with the precise failed gate; no false-green.
