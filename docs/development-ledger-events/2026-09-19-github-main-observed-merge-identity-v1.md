# github_main observed merge identity v1

- Date: 2026-09-19
- Obligation-ID: github-main-observed-merge-identity-v1
- Incident: rerun of PR #2330 proved merge containment in current main but durable evidence rejected it because production_observed_sha used the newer moving main SHA.
- Fix: separate containment witness from production identity. Current main proves ancestry; the obligation merge SHA is persisted as the observed production identity.
