# Development ledger — Source Universe learning descendant terminal proof

- Obligation: `source-universe-operational-truth-v1`; successor recovery from merged #4108.
- Failure class: `LEARNING_EVALUATION_TEST_PATH_INVALID` on historical learning projection run `37742411908`.
- Root cause: a scenario description object was stored in `evaluation.historical_replay[]`, not an existing executable test path; Required's earlier semantic gate did not enforce this precise contract.
- Failed terminal readback #37756500341 first proved exact Required, CodeQL, Brain foundation and live Netlify descendant, then correctly rejected historical learning projection failure.
- Fix: canonical learning paths for historical/shadow/canary, executable regression, durable fail-closed descendant proof in existing Obligation Terminal Closure.
- Prevention: a green projection is accepted only for an actual successful protected-main workflow, with original-merge ancestry and exact learning blob parity to current main. A failed historical run is never rewritten.
- No production/business outcome claim is made in this commit; protected tests, protected merge, projection and replay remain required.
