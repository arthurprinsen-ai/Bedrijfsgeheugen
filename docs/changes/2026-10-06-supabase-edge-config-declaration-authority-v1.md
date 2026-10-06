# Supabase Edge config declaration authority v1

Date: 2026-10-06

A successful Supabase production check was not sufficient proof that a changed Edge Function had been deployed. The GitHub integration only deploys Edge Functions declared in `supabase/config.toml`; the canonical social publisher and recovery runner were missing from that file.

The production authority now fails closed when a selected function is not declared. Changes to `supabase/config.toml` or `supabase/functions/_shared/` resolve to the declared function set instead of every function directory. The two canonical social functions are explicitly declared with their production JWT settings and entrypoints.

Terminal proof remains protected-main merge, Supabase production deployment/check, provider source parity, and no newer runtime drift.
