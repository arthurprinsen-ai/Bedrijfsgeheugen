# 2026-11-17 — Original BRAIN terminal gate: recovery and prevention

- Parent original incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Failed original post-merge runs: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44168422800 and https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44169808282
- Failure: 4 BRAIN backend tests, exactly 3 derived from 2 missing static EN text-node cache keys and 1 outdated YAML job capture
- Source: afas-koppeling.html split text node 453 chars; systemen-koppelen.html split text 68 chars
- Correction: new canonical static i18n patch with two reviewed exact Dutch->English strings; no synthetic source, no disabled offline check
- Correction: original intake test extracts through next top-level YAML job; never allows GITHUB_TOKEN inside actual intake job, does not add a scheduler
- Test: tests/brain-original-terminal-cache-and-job-boundary-20261117.test.mjs with source-exact historical replay and canary
- Scope: 6 files only, original test, new test, new canonical i18n config patch, learning, human change doc and this immutable ledger
- Security: no provider tokens, RLS, migrations, scheduled duplicates, network sends, fake terminality or test deletion
- Status before protected merge: SOURCE_CANDIDATE. Original terminal closure requires exact BRAIN pass, production provider proof, named ONE BRAIN PROCESSED and Heartbeat verified effect.
