# Superseded terminal lease reopen guard v1

- Date: 2026-09-19
- Obligation-ID: superseded-terminal-lease-reopen-guard-v1
- Incident: PR #2327 was reopened after terminally proven successor #2345 had already superseded it.
- Root cause: close guard ignored canonical supersession lineage.
- Fix: same-obligation + exact Supersedes + successful terminal-closure proof prevents predecessor resurrection; otherwise auto-reopen stays fail-closed.
