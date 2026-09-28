# 2026-09-28 — FALSE_FAILURE — provider side-effect terminal fence

- **Fingerprint:** `provider-side-effect-terminal-fence-v1`
- **Observed:** LinkedIn personal, LinkedIn company and Instagram had provider IDs, yet reconciliation later moved obligations back to blocked states because downstream verification failed.
- **Root cause:** database reconciler/watchdog treated post-provider readback/media proof as if it were still a pre-provider publish gate.
- **Fix:** durable provider ID + create/ack/truth evidence + `republish_forbidden=true` is now a terminal anti-duplicate fence.
- **LinkedIn company evidence:** `urn:li:share:7510281040192602112`.
- **LinkedIn personal evidence:** `urn:li:share:7510280992931188736`.
- **Instagram evidence:** `18193272064401728`.
- **Safety:** provider-created publications remain PUBLISHED; exact-ID reconciliation only; no replacement side effects.
- **Watchdog:** provider-created PUBLISHED social obligations count as terminal success and cannot become `SILENT_PUBLICATION_FAILURE`.
- **Regression:** `tests/brain-provider-side-effect-terminal-fence-v1.test.mjs`.
