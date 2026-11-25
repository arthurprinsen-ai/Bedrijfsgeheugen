# Supabase Edge declared-function scope v1

Date: 2026-10-06

The production authority previously expanded a `supabase/config.toml` change to every Edge Function directory. That was broader than the Supabase GitHub Integration deployment contract, which deploys functions declared in `config.toml`.

The authority now derives config/shared parity scope from the declared `[functions.<slug>]` sections and fails closed when a directly changed function is not declared. The read-only `SUPABASE_ACCESS_TOKEN` remains provider-readback-only and cannot deploy.

This removes a false-failure path before the human bootstrap secret is added.
