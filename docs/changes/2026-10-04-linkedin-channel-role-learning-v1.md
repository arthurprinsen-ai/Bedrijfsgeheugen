# LinkedIn channel-role learning v1 — 2026-10-04

## Root cause
The existing learning loop collapsed weak absolute outcomes into positive advice: 2 reactions across 20,074 impressions became “current question form works”, and 3 clicks across 92 measured posts became “keep this referral form”. It also lacked a durable learning rule comparing explicit `linkedin_personal` and `linkedin_company` identities.

## Fix
`bg_content_lessen()` now normalizes low response before declaring success, treats sparse clicks as insufficient evidence, and writes `linkedin-channel-role-evidence-v1`. Personal LinkedIn remains personal and non-commercial; company LinkedIn is the commercial evidence/value/CTA arm. Identical cross-posting is forbidden.

## Production evidence
Runtime readback on 2026-10-04: 92 measured posts; personal 17 posts / 12,545 impressions / 2 reactions; company 18 posts / 71 impressions / 0 reactions. The new rule is active. Existing daily `bg-content-lessen` cron remains the single scheduler.

## Prevention
Future agents must not label a format a winner from non-zero absolute counts alone and must preserve channel identity before transferring learnings.
