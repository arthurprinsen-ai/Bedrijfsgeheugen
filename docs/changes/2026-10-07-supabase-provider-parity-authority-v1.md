# Supabase provider parity authority v1

This recovery removes a false post-merge failure mode from the Supabase production authority.

The GitHub Supabase check is now observability only. Production truth is byte-for-byte provider source parity read through the Supabase Management API/CLI with bounded convergence. A provider that has not converged still fails closed after the bounded window; a skipped, delayed, or differently-linked GitHub check no longer creates a false negative.

Successor recovery is also explicit. A merged controller PR carrying `Terminal-Replay-PR` may replay the original merged runtime PR only when the target Supabase runtime is unchanged on current main. The authority derives the original function scope, proves provider parity, and writes version/runtime-hash evidence back to the original PR.

The runtime backpressure JSON contract is classified as exact verifier-only control-plane state. The classification does not broaden all `config/` paths.
