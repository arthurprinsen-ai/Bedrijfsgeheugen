# Chat-learning preflight budget contract alignment — 2026-10-06

## Problem
PR #3927 correctly moved the preflight source-count ceiling into `config/brain-chat-learning-contract.json` and raised it to 128 while retaining the 256 KB packet limit. One older regression script still hard-coded `<= 96`, so the first current-main consumer failed even though runtime behavior was correct.

## Structural fix
`scripts/brain/test-chat-learning-preflight-compiler.mjs` now reads both `maxSources` and `maxBytes` from the canonical contract. The test therefore checks the same authority used by the compiler instead of maintaining a second numeric truth.

Explicit stricter caller overrides remain fail-closed.

## Regression
The preflight compiler contract itself is the regression surface and must pass before Chat learning preflight can become green.
