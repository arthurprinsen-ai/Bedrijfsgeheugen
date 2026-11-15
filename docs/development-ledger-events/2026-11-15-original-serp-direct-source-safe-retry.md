# Source false-green incident and original producer–consumer retry

- **Fingerprint:** `powerhouse|relationship-research|tracked-google-goto-serp-falsely-done-and-verified|20261115-v1`
- **Owner:** existing original #116 relationship public research Edge / original commercial composer; Reliability + Data Quality learning agents
- **Root cause:** unverified `google.com/goto` SERP tracking URL counted as a completed/VERIFIED source, blocking further source research and causing false BROKEN composer SLA for a correctly held prospect
- **External fact-check:** direct official article exists on YER site, but is an advertisement for an AI training course and does not establish person-specific buying intent or permission to email
- **Safe source correction:** direct HTTPS publisher URL required; search redirect and shorteners filtered before public mailto research and organic trigger; internal SERP event classified `UNVERIFIED_SERP_SNIPPET`
- **Backfill/retry:** exact same original action, same original recipient and revision, bounded 5 original IDs per run, next source-retry after 24 hours; write `SOURCE_REDIRECT_REJECTED_NOT_VERIFIED`, no-send; CAS protects original writer
- **No additional system:** no second scheduler, agent writer, provider query, mailer or parallel outreach lineage
- **Regressions:** `tests/brain-original-serp-tracked-redirect-safe-retry-20261115.test.mjs`
- **Evidence/next:** protected GitHub Required/CodeQL, original Supabase Edge deploy, provider/version + natural #116 exact original action ID readback. Unverified candidates, true legal/approval gates and source backlog remain explicit
- **Release status:** CANDIDATE_PENDING_PROTECTED_CI_AND_NATIVE_PROVIDER_READBACK

- **Protected first CI preflight failure / retained evidence:** PR #5848 initial exact head failed two old regex-only tests (`tests/brain-public-business-email-single-chain-20261114.test.mjs`, `tests/brain-public-work-email-firstparty-source-pages-20261114.test.mjs`), because they expected an unfiltered `organic` SERP array and source health to warn only on unreadable HTML. New policy safely filters tracked redirect URLs and warns on source-redirect recovery too. Both tests were updated to explicitly enforce `directOrganic` and the expanded warning conditions, without relaxing existing first-party source/safety gates. Rerun protected Required/CodeQL and independently verify provider readback before release. First failed commit was not merged.
