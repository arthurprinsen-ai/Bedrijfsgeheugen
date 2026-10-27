# Restore Supabase protected production publishing for social-learning-store

The existing canonical social-learning-store Edge Function was already deployed but missing from `supabase/config.toml`. Because the protected `.github/workflows/supabase-edge-production-authority.yml` derives its publish scope from declared functions and fails closed for undeclared functions, the source change in merged PR #4834 did **not** result in an updated live Edge Function. Independent readback at 2026-10-24 15:49 UTC still saw version 12 dated October 7.

This change declares the **existing** function with its **existing** non-JWT deployment mode. Security is enforced by its SHA-256-verified `x-bg-service-token` in the entrypoint; it is not a public read or write endpoint. The next protected-main config change must target `social-learning-store` via the existing `edge-runtime-scope` function, without new schedulers, secrets, data stores, or deployment alternatives.

Regression validates declaration uniqueness, exact entrypoint, existing service authentication and release scope. Terminal readback requires the actual active Supabase function source, then a genuine hourly scheduled social evaluation and new tenant-scoped rows. No claim of improved customer acquisition or causality is earned by deploying a function.
