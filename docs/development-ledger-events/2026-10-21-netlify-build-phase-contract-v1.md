# 2026-10-21 — Netlify build phase contract repair

- Obligation: baseline-netlify-phase-contract-20261021-v1, #3742 and #4215.
- Main epoch 8f322681ba46045e5d65746c2b2f0fd5b40ffac1, BRAIN failing job https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39554866582/job/119072398429.
- Replaced one obsolete test source pointer to Netlify TOML inline command with checks on existing canonical runner and actual two Netlify contexts.
- Preserved required phases/order, fail-closed handling; no runtime, DB, provider, customer or policy mutation.
- New draft requires exact-head protected CI; no green or live claim.
