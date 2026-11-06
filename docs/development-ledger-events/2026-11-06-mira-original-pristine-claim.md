# 2026-11-06 — append-only original Mira claim recovery

- Fingerprint: powerhouse|mira|pristine-waiting-asset-original-claim|20261106-v1.
- Root cause: original daily source routes virgin job WAITING_ASSET while original claim RPC handles only QUEUED/RETRY, leaving original producer starved.
- Proof: Nov6 job 2d2a7385-43b9-4a15-a91c-583ce0e7ea69, attempts 0, OpenArt required, winner b5c14d41-35ca-45cf-8cf8-471489b44791 matched across job, obligation and selector.
- Single-owner correction: original claim RPC only, guarded for pristine status, no prior provider effects, row lock and privileged ACL preserved.
- Regression: tests/brain-mira-original-pristine-claim-20261106.test.mjs and provider preview; no Meta/AI generation by this migration.
- Status: CODE_CANDIDATE until protected merge, production readback and actual original producer claim; publication and business outcome remain unproven.
