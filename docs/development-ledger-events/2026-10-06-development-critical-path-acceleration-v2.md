# 2026-10-06 — development critical-path acceleration v2

Current-state-first acceleration after observing queue amplification across GitHub Actions.

Evidence: 124 workflow files; latest sampled 100 Actions runs included 45 queued, 7 in progress, 18 cancelled and 10 successful. Main already contained single-flight cancellation for writer gate dispatch and operational verification and already had a fail-open Netlify ignore controller.

This candidate therefore only closes remaining candidate-shadow/canary, CodeQL and Supabase applicability gaps. Its first exact-head run correctly failed on a duplicate Netlify TOML key and an inline YAML comment parsing edge case; both were corrected within the same PR, with the redundant Netlify mechanism removed rather than layered.

Regression authority: `tests/brain-ci-critical-path-acceleration-v2.test.mjs`.
