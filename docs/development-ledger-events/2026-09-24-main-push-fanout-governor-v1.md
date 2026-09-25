# Development ledger — main push fan-out governor v1

- Date: 2026-09-24
- Failure class: GitHub Actions queue amplification
- Symptoms: excessive queued/in-progress workflows, stale PR-head runs, broad post-merge fan-out.
- Root cause: missing per-PR supersession, run-id concurrency keys, and over-broad main push triggers.
- First recovery defect: malformed multi-line YAML branch/path rewrite in `seo-growth-intelligence.yml`.
- Successor fix: restore valid branch list, preserve path scope, add semantic regression, complete required learning/docs/ledger closure.
- Safety: protected branch and exact-head gates remain authoritative.
- Terminal state: pending successor protected merge and queue/readback verification.
