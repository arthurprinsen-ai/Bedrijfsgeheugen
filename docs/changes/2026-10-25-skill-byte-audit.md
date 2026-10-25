# Run-bound SkillOps byte audit

The existing Powerhouse Daily Self Evolution `improve` job now produces `artifacts/quality/skill-byte-audit.json`, hashing actual `SKILL.md` bytes from `.agents/skills` and `brain/skills`. Each observation carries GitHub run/attempt and exact checkout SHA. Missing context, empty skill files or no observed skills fail closed. Unit tests cover success and rejection. The existing upload-artifact step retains the audit; no parallel scheduler or writeback owner is added.

The audit establishes that the GitHub daily job inspected these bytes, **not** that each distinct agent executor loaded or acted on them. Provider evidence, per-agent events, cryptographic provenance and independent verifier integration remain mandatory before any overall agent status can be green.
