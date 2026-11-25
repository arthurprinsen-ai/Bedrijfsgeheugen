# Terminal closure run identity — 8 October 2026

## Verified root cause
The canonical `.github/workflows/obligation-terminal-closure.yml` used an unquoted YAML line `run-name: Obligation Terminal Closure PR #${{ ... }}`. In YAML, a whitespace-delimited `#` starts a comment; the effective run title was therefore only `Obligation Terminal Closure PR`, omitting the immutable PR number. GitHub workflow runs #37743054679 and #37743616664 consequently displayed that shortened title.

The scheduled recovery supervisor expects `display_title == "Obligation Terminal Closure PR #<number>"` for single-flight detection. Without the number it may schedule duplicate terminal closure attempts, especially when the previous run is active.

## Change
Quote the existing `run-name` (no additional workflow). Enforce the exact expected YAML form and its supervisor title-matching contract in the existing Brain regression suite. Keep the canonical 5-minute supervisor and terminal authority untouched; never bypass Protected Required, CodeQL, merge or provider readback.

## Truth
The fix prevents **future** GitHub workflow runs losing their PR number. Historical runs keep their original names and remain independently auditable. Terminal LIVE_BEWEZEN requires all existing post-merge gates and durable control-plane evidence. Current state: code candidate; no manufactured production green.

## Additional exact-path correction
The same terminal evidence gate had a stale `require_workflow "powerhouse-codeql.yml"` reference, although the actual workflow is `.github/workflows/codeql.yml` (named `Powerhouse CodeQL`). Its lookup could not succeed. It now resolves `codeql.yml`, and the Brain regression asserts the correct workflow identity. This does not weaken CodeQL; it allows the real CodeQL success to be recognized.

## Current-main successor and regression closure — 2026-10-08

- PR #4113 was retired unmerged after its stale branch lacked the newly required Portal-auth evidence freshness gate present in protected main.
- The same canonical terminal-closure run-name and real `.github/workflows/codeql.yml` lookup have been retained without weakening Required or CodeQL.
- Existing `tests/brain-fast-terminal-delivery-v2.test.mjs` now checks the real CodeQL workflow identity, and the dedicated Brain regression verifies the PR-specific run-name.
- Replay the entire protected delivery from current main; do not claim terminal success from a commit alone.
