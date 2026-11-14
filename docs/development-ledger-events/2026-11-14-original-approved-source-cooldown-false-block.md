# 2026-11-14 — Original source-research cooldown false block, same live owner

Fingerprint: `powerhouse|commercial|source-priming-30d-generic-research-false-block|20261114-v1`

The first original protected PR #5759 passed Required/CodeQL and was merged (`7603fc67c85093bcd03328fa1e42f6c128200cbb`) and the actual original Supabase helper was independently read back. Native production then showed 0 additional source-research actions because its `NOT EXISTS ... research_enrichment within 30 days` predicate excluded **all 123** approved contacts. Separate 7-day grouped readback showed only **10** researched in the past seven days. Most 30-day research records were generic `relationship-research:...:mkb-trigger` with null headline/source_ref, not vetted company-specific trigger evidence.

**Correction:** exact existing production helper function, one SQL condition **30d -> 7d**, preserving 90-day email-send cooldown, source-only status, max 5 queries/day, single original cron #116 stage 2, suppression/consent/negative reply protection, service-only EXECUTE and original source→composer→provider contracts. Existing daily source query cap and original action storage remain; no cron, subscriber consent, outbound provider or permission created.

**Production proof:** after protected merge and actual native migration, independently query `pg_get_functiondef`, ACL, original `cron.job` #116, actual helper eligibility, and next natural `relationship-research:approved-source:<date>:...` records. A research candidate is never a sent email; independently verify actual Gmail provider ID/thread and content for any permitted send. If no source discovered or recipient declined, `NO_ELIGIBLE_ACTION` not fake success. The separate newsletter authorization issue remains open. Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. PR prior: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5759.

Status at candidate creation: NOT_LIVE_VERIFIED.
