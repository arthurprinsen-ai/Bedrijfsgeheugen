# Social provider-day metrics are not 24/48/72h causal evaluation windows

The existing bounded hourly social evaluator previously chose a snapshot by timestamp alone. That could promote partial-scope LinkedIn company organic analytics (a provider-reporting-date slice) into 24/48/72-hour evaluations if its extract timestamp happened to match the post window. This is not valid evidence of an exact-age intervention effect.

The evaluator now filters to `OBSERVED` or `PROVIDER_OBSERVED` source quality **before** selecting an exact 24/48/72-hour observation. `OBSERVED_PARTIAL_SCOPE`, unlinked and stale data still exist for the daily descriptive content diagnostic, but their evaluation window remains explicitly unverified and produces a source obligation, not a synthetic candidate winner. One existing hourly scheduler and Supabase source owner remain unchanged.

Regression checks the partial-scope rejection and valid provider-window passage. Production success requires Netlify source readback, the actual scheduled invocation and independently observed `social_learning_evaluations`. No fabricated views, revenue, holdout performance or republishing.
