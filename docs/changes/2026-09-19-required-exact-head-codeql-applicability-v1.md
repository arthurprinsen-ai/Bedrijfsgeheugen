# Path-aware exact-head CodeQL gate

The native required `test` context still requires exact-head BRAIN evidence for every pull request. Powerhouse CodeQL is now required only when the pull request changes files that actually trigger `.github/workflows/powerhouse-codeql.yml`: JavaScript/TypeScript-family files, `package.json`, `package-lock.json`, or the CodeQL workflow itself.

For data-only or documentation-only candidates where CodeQL is intentionally not scheduled, Required emits an explicit `CRITICAL_EXACT_HEAD_GATE_NOT_APPLICABLE:Powerhouse-CodeQL` proof instead of waiting for a run that can never exist.

This preserves fail-closed merge governance without blocking valid low-risk candidates or duplicating CI.
