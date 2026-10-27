# Terminal Supabase provider readback

The terminal delivery state machine now treats Supabase Edge Functions as a first-class production runtime instead of falling through to the Netlify-only readback path.

For every changed `supabase/functions/<name>/...` path, terminalization requires explicit provider evidence in the existing format:

`Terminal-Supabase-Provider-Readback: function=<name>;version=<positive-int>;runtime_sha256=<64hex>`

Supabase-only changes use `supabase_edge_provider`. Mixed Netlify and Supabase changes use `netlify_runtime_supabase_provider`. Unknown runtime paths still stop terminalization fail-closed.

This removes the structural gap that caused a protected, production-proven Supabase recovery to merge successfully but remain unable to release its terminal writer lease.
