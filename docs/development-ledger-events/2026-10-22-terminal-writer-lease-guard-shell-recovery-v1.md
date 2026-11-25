# Append-only development event — 2026-10-22

- Event: `GITHUB_TERMINAL_WRITER_LEASE_GUARD_SHELL_RECOVERY_CANDIDATE`
- Obligation-ID: `github|terminal-writer-lease-guard-shell-recovery|20261022-v1`
- Canonical incident: [#4687](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4687)
- Fingerprint: `github|terminal-writer-lease-closure-guard|malformed-shell-duplicate-block|20261022-v1`
- Scope: existing `powerhouse-terminal-writer-lease-closure-guard.yml`, one shell regression, one Brain learning artifact, documentation and append-only ledger.
- Original workflow readback: GitHub ID 361221143, state `disabled_manually`. Prior source blob: `47070252f8e26766bf68ca863508058871d562cf`.
- Source finding: unterminated lease-state `grep -Eq` and duplicated closing branch with stray here-string/then. Disabling motive unproven.
- Deterministic mitigation: remove duplicate body, restore one terminated guard. Preserve existing active lease metadata, successor-proof and safe PR reopening conditions.
- Regression: `tests/brain-terminal-writer-lease-guard-shell-v1.test.mjs` must verify Bash syntax, no-op unrelated PR and strict rejection of both incomplete active leases.
- Safety: no main direct write, no extra scheduler, no bypass of Required/CodeQL; no automatic workflow enable. Avoid running live `pull_request.closed` write side effects before authorization and readback.
- State: `CANDIDATE_NOT_LIVE`. Terminal proof requires protected merge and an independently verified safe reactivation; an active status alone is insufficient.
