# Netlify social-learning: isolate heavy FFmpeg binary to original video extractor

Parent incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4445

## Verified production evidence
At 2026-10-23 14:37 UTC, Netlify deploy 6adb708cf76ddcef00357a6b included the original social-learning-evaluate and revenue-learning-evaluate functions at ~32.5 MB each. Actual scheduler POST requests to social-learning-evaluate returned 499 after ~14.98 seconds, with no usable function invocation logs. Observed production social-learning evaluations in the last 30 days: zero.

## Candidate repair, narrow and reversible
The global Netlify [functions] config previously included ffmpeg-static/executable for all deployed functions. Only original netlify/functions/instagram-video-frames.mjs requires this dependency, so both external_node_modules and included_files are scoped to [functions."instagram-video-frames"]. Existing identity/temporal proof, original authorized media router, social learning schedule/store, provider permissions and deduplication are unchanged.

## Independent acceptance
Exact-head Required CI/CodeQL, a measured deploy-preview comparison of evaluator package size, and a functioning original Mira frame extractor are mandatory before protected merge. Then verify production Netlify Scheduler actually invokes the learning evaluator (rather than only observing gateway status), and store genuinely comparable provider metrics in the original 24/48/72-hour evaluation pathway. Do not backfill unverifiable data, create a second scheduler, or claim that reducing a function bundle by itself fixes all 499 requests. Commercial revenue and today's Instagram publication remain unproven until their external provider readbacks.
