# Supabase Edge production source anchors v1

Date: 2026-10-06

A protected merge changed `social-recovery-runner`, but Supabase emitted only the preview-branch check and kept production on the previous function version. The last proven production deployment had changed `supabase/config.toml`.

The two authority-critical social Edge Functions now carry `production_source_git_blob` markers in `supabase/config.toml`. Required CI recomputes each entrypoint with `git hash-object` and fails closed when the marker is stale.

This creates a deterministic invariant: changing publisher or recovery source also requires changing `config.toml`, so Supabase GitHub Integration's production deployment DAG is admitted. Supabase GitHub Integration remains the only production writer; the PAT remains read-only attestation.
