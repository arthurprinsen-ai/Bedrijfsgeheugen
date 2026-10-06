# 2026-10-06 — development critical-path acceleration v2

Current-state-first acceleration after observing queue amplification across GitHub Actions and unnecessary provider work.

Evidence: 124 workflow files; latest sampled 100 Actions runs included 45 queued, 7 in progress, 18 cancelled and 10 successful; inspected Netlify production deploy reported 122 seconds deploy_time and roughly 6m41 creation-to-publication.

Main already contains single-flight cancellation for writer gate dispatch and writer operational verification. This candidate closes the remaining candidate-shadow/canary, CodeQL, Supabase applicability and Netlify build-selection gaps. No truth gate is removed.

Regression authority: `tests/brain-ci-critical-path-acceleration-v2.test.mjs`.
