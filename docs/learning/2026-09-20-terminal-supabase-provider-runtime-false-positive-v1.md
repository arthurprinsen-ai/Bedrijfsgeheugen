# Supabase provider runtime terminal truth

## Incident

PR #2465 reached terminal `LIVE_BEWEZEN` while the active Supabase `powerhouse-social-publisher` still contained the rejected `RuntimeState/runtime_state` schema values.

The GitHub terminal workflow had proven that website production contained a descendant of the merge. That did not prove that the changed Supabase Edge Function had been deployed.

## Root cause

Production truth for different providers was conflated. Netlify/website descendant proof was accepted as sufficient for a Supabase runtime mutation.

## Prevention

For every changed path under `supabase/functions/<slug>/`, terminal closure now requires provider readback evidence for that exact function:

`Terminal-Supabase-Provider-Readback: function=<slug>;version=<positive-int>;runtime_sha256=<64hex>`

Missing evidence keeps the obligation recoverable and prevents a terminal success claim.

The runtime repair for the incident was separately executed: `powerhouse-social-publisher` was deployed from exact main and provider readback confirmed the corrected `CurrentState/current_state` implementation.
