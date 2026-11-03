# P0 incident: daily publication/outreach incomplete — 1 November 2026
**Status:** OPEN / Critical / provider-output unproven. **Authoritative incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232. **Parent:** #4439; commercial closure #4198.

## Actual production evidence
- At 09:05 CET 1 November the existing Publisher automation had completed with no external send. Its own read of the original publication table failed twice; this is an executor-context credential/read fault, not evidence that the original database is empty. An independent authorized admin SQL connection read the original rows.
- Original content_publication_obligations: 1 November blog, instagram, LinkedIn personal/company all PLANNED with no provider IDs; 31 October the same four FAILED.
- Original gpt-5-mini provider HTTP429 insufficient_quota in three text lanes (15 observed generation failures 31 October), governed fallback SUSPENDED. No unapproved model or automatic billing.
- Mira winner absent due to independent new eligible source constraints; old video identity 0.900 < 0.940 never reusable.
- Original channel decision email_newsletter hold/blocked NO_AUTHORIZED_CANONICAL_EMAIL_EXECUTOR. Gmail connection does not imply consent or newsletter authority.
- daily-commercial-provider-proof-v1 current local day OPEN with provider_proof empty, zero proven social/publication/email.
- Prior classifier PR #5224 was merged; early hard-block detection is partial mitigation, not actual successful delivery.

## Canonical incident and permanent error signature
- ONE BRAIN brain_failure_registry fingerprint: powerhouse|publication|multi-channel-missed-output-after-preflight|v1 (VALIDATED cause, proven_fix NULL).
- Append-only occurrence: production:2026-11-01:powerhouse-daily-publisher:multi-channel-no-delivery:0905-CET.
- brain_blockers CRITICAL ACTIVE. AI governance incident INC-2026-11-01-PROVIDER-QUOTA-DAY-PUBLISH OPEN.
- GitHub issue #5232 OPEN; resolved only after real provider confirmations, end-to-end natural-run and 7-day regression.

## Restore order: original lanes, original writer only
1. Confirm original scheduled executor can READ the real publication/decision rows with production least privilege, before it publishes. Auth failure must alert immediately; do not treat it as zero obligations. Recheck within executor context, not only admin SQL.
2. Check actual approved generator quota/capability before publishing window, bounded retry on rate limit. On exhausted account, obtain legitimate account funding/authorization or independent governance-approved active existing fallback. Never auto-charge, switch to SUSPENDED provider, fabricate a generation.
3. Generate truly distinct, source-backed content after unique-topic check; preserve historical provider-ID claims and avoid re-sends of uncertain side effects.
4. Mira: independent source date and reuse gates, one unique winner, final media asset proof + start/mid/end identity>=0.940; then original Meta publisher readback.
5. Blog: approved source freshness/editorial review → protected PR/Required+CodeQL → merge → original Netlify deploy → exact public URL readback, otherwise OPEN.
6. Email: restore original authorized canonical executor, eligible opted-in recipients, suppression/contact pressure, immutable provider message ID and readback. Newsletter and one-to-one outreach are distinct authorizations.
7. Existing Powerhouse/ONE BRAIN/Heartbeat must reconcile all due prior dates until independently fulfilled, with per-lane retry and incident, no second scheduler or Make/Buffer.
8. Existing Portal V2 must show RED/RECOVERY_DUE; copy only source status/evidence. No manually forced GREEN. Assign an owner/next eligible action for each cause.

## Regression contract
Exercise scheduled-reader access denied, provider 429 before slot and after slot, suspended fallback, unique Mira source depletion, exact-media identity, newsletter executor absent, no eligible consented recipient, duplicate LinkedIn claim, remote ACK without readback, missed-date backlog, 7-day natural run stability. Validate original Required/BRAIN/CodeQL and protected deployment. Evidence is external provider-ID, blog public URL, actual sent recipient message ID, and subsequent metrics/learning. A passing test alone is **not** real publication.

### Acceptance
Never mark incident RESOLVED while any targeted channel lacks independently proven authorized external effect; never claim perpetual outage immunity. Updates to agents/skills/human docs and original Portal must be released and read back through the existing protected delivery lane.
