# Development ledger — instagram-composio-auth-preflight-v1

- Date: 2026-09-20
- Failure: missing Composio auth discovered only after capability consumption.
- Fix: provider-auth preflight before dispatch/capability/provider side effects.
- Recovery state: content_ready + explicit external config blocker.
- Fallback: forbidden unless canonically changed.
