# 2026-11-16 original personal LinkedIn editorial source cleanup
Fingerprint: `personal-linkedin|old-founder-source-producer-conflicts-with-lifestyle-only|20261116-v1`
Original incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5913

- Observed: `powerhouse_channel_decisions` 2026-11-16 linkedin_personal blocked PERSONAL_TRUTH_SOURCE_UNVERIFIED, original obligation PLANNED/no URN; v2 materializer still creates `daily-dream-journey` Bedrijfsgeheugen business source candidate; 12 original `bg_schrijfregels` personal Oct-7 rules still active.
- Root cause: source-producer and editable rules never migrated after newer 15-Nov binding personal-life-only policy; downstream sender was fail-closed but producer generated unusable content every run.
- Correction: original native Supabase migration deprecates the exact 12 October personal business rules, records current personal-life/verified first-person rule, and replaces legacy v2 materializer with original v1 output + quarantine of misrouted current-day business source.
- Prevention: separate corporate/personal source writing, original one-writer owner/lease, authentic user-supplied event only, final SHA reviewer + author and global dedupe, no false-green/forced publication.
- Regression: `tests/brain-personal-life-only-editorial-producer-20261116.test.mjs`; protected provider preview + original native main/source parity mandatory.
- Status: source candidate, not merged/deployed, actual daily personal source still missing until user-fact approval/evidence, no post claim.
