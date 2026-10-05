# 2026-10-05 — Supabase Preview applicability ARG_MAX

Observed on #3766 exact-head delivery: the applicability gate failed with `/usr/local/bin/node: Argument list too long` while the provider-owned Supabase Preview itself was green.

Canonical correction: replace environment-variable transport of the complete check-runs JSON with a temporary file under `RUNNER_TEMP`. Provider identity and success semantics remain unchanged.

This is a shared delivery-control-plane repair and must merge independently before #3766 is re-evaluated against current main.
