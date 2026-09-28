# Provider side-effect terminal fence

Date: 2026-09-28  
Fingerprint: `provider-side-effect-terminal-fence-v1`

## Why this exists

On 2026-09-28, LinkedIn personal, LinkedIn company and Instagram all had durable provider IDs. The LinkedIn posts were visibly live. Despite that, later verification logic could still move obligations back to `BLOCKED` because read/admin permissions or media-proof checks failed.

That is incorrect: pre-publish validation and post-publish verification are different phases.

## Permanent rule

For social channels, a durable provider external ID combined with provider-create acknowledgement and `republish_forbidden=true` is terminal evidence that the side effect exists.

After that point:
- the obligation remains `PUBLISHED`;
- readback/admin/media-proof failures are verification limitations only;
- no later reconciler may downgrade the publication to `BLOCKED` or `FAILED`;
- no watchdog may classify it as `SILENT_PUBLICATION_FAILURE`;
- all recovery is exact-ID reconciliation;
- replacement/duplicate publication is forbidden.

The Instagram exact-final-media/Mira gate remains mandatory before provider write. It may not invalidate a provider-created post afterwards.

## Daily guarantee

The daily watchdog and assertion now recognize provider-created `PUBLISHED` social obligations as terminal success. The five-minute self-healing loop may continue enriching readback evidence, but cannot reopen the side effect.

## Regression

`tests/brain-provider-side-effect-terminal-fence-v1.test.mjs`
