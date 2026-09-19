# Stable github_main replay identity v1

- Date: 2026-09-19
- Obligation-ID: github-main-replay-stable-observed-sha-v1
- Incident: replaying #2330 after main advanced returned github_main observed SHA = current main tip instead of #2330 merge SHA.
- Root cause: containment witness and terminal identity were conflated.
- Fix: prove merge SHA is an ancestor of current main, then persist merge SHA as the deterministic observed identity.
