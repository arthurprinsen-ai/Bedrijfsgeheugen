# 17 November 2026 — original hourly blog missing optional review proof must preserve candidate
Parent issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5232
Root-cause production run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44076765434
Owner: original hourly Powerhouse blog publisher / original blog quality review helper. No parallel publisher.

## Observed native failure
At 11:45:10 UTC the original workflow with business_date=2026-11-16 preserved original PR #5918, then failed with ENOENT opening `brain/learning/powerhouse-blog-2026-11-16.json`. This optional review proof does not exist on main or the original candidate branch. Blog still APPROVED and original ONE BRAIN handoff OPEN. No new provider publication was proven.

## Fix
The existing `tools/content-growth/reviewed-blog-refresh.mjs` must return just `PRESERVE` to stdout and a typed warning to stderr if the optional review proof does not exist, before trying to parse that proof. The existing original PR/approval and normal protected publishing path remain intact. If proof does exist, the original exact identity, date, URL, rejected body hash, editorial reader readiness and draft-quality repair guards run unchanged. A corrupt proof still fails closed. Do not generate a replacement proof, grant approval, weaken editorial veto or assume a public URL is published.

## Independent release requirement
Run focused proof-missing, genuine-proof and invalid-repair regressions; Required/CodeQL/branch protection; protected merge; then invoke original hourly publication only on an eligible already-approved blog, with its same writer, original PR, proper original provider URL/Netlify source SHA, source state and ONE BRAIN PROCESSED/Heartbeat readback. No claim of LIVE_PROVEN on a PR or passing test alone. Open overdue PR #5934 is a separate original writer lease; this change does not touch it.
