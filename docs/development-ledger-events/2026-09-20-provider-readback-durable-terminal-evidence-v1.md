# Development ledger — durable provider runtime evidence

- Date: 2026-09-20
- Obligation: `provider-readback-durable-terminal-evidence-v1`
- Prior gap: provider version/hash existed in PR metadata but was not part of immutable canonical terminal evidence.
- Change: structured provider readbacks are parsed, OIDC-forwarded, payload-hashed, validated, stored in `brain_delivery_evidence`, and read back before terminal completion.
- Authority: existing `growth-datahub-ingest:control_plane_terminal`; no parallel evidence store introduced.
- Regression: `tests/brain-terminal-provider-durable-evidence.test.mjs`
