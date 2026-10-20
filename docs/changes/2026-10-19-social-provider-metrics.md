# Daily Social Metrics — existing canonical learning spine

## Why
On 19 October 2026, `social_metric_snapshots` had no new actual provider observations since 8 October. Provider verification established that the Instagram business profile `bedrijfsgeheugen.nl` could return real per-reel views, reach, likes, comments, saves, and shares. Personal LinkedIn post reactions are readable, while organization share statistics are blocked by missing `r_organization_social` permission.

## Scope
`bg-social-metrics-sync` is a **read-only, scheduler-token-protected transport adapter**. It reuses the existing `social_posts` and `social_metric_snapshots` authorities and their existing source-observation triggers. When a business Instagram media object is already known by exact provider ID or a unique publication timestamp, the original record is reused. Otherwise the adapter registers only an independently verified business-owned provider post. Ambiguous identities are rejected.

The reader does not call a publishing endpoint, use retired Buffer write paths, invent impressions/conversions, or persist personal profiles of reacting users. LinkedIn is intentionally restricted to measured reactions on personally published canonical posts; organization insights remain **blocked pending actual permission evidence**. Instagram business identity must match `bedrijfsgeheugen.nl` exactly. A Mira/personal account is not a fallback.

## Operation
The existing authorized Supabase scheduler invokes the Edge reader every six hours, with a bounded batch of up to twelve Instagram media and eight personal LinkedIn shares. Each provider is isolated, outcomes are committed to the existing `powerhouse_runtime_events` source, and a new cron run can retry without duplicate daily snapshot identities.

## Remaining acceptance
Required CI, CodeQL, exact-head Supabase Preview, protected merge, Edge deployment with scheduler-token configuration and provider readback must pass. Fresh snapshots must exist after the previous 2026-10-08 high-water mark. Existing social-learning evaluations must resume from actual data before any daily 'improving' claim. LinkedIn company scope and actual revenue book-to-cash remain separate unverified dependencies.
