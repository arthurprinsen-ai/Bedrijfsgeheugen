# Daily social publication channel fence

Date: 22 September 2026  
Fingerprint: `social-publication-daily-channel-fence-v1`

A duplicate-publication incident exposed a gap in the social publication authority: capability tokens were individually valid, but the database did not guarantee that only one active capability could exist for the same business date and channel.

The fix adds a database-level serialized fence around `run_date + channel`. It uses an advisory transaction lock plus a partial unique index over non-revoked capabilities. Recovery may reclaim an expired capability only when it has never been consumed. A consumed or still-live capability remains the single owner for that day and channel, so retries cannot create a second provider side effect.

Historical duplicate active capabilities are contained before the unique index is created. Audit evidence is retained through revocation metadata.

This repository change mirrors an already-applied production hotfix. Completion requires protected merge and exact main readback; the production migration itself was separately verified with zero remaining active duplicate groups.